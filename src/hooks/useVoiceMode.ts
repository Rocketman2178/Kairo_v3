import { useState, useRef, useCallback, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VoiceSessionState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface VoiceTranscriptEntry {
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export interface VoiceModeOptions {
  voiceName?: string;
  assistantName?: string;
  systemPrompt?: string;
}

export interface UseVoiceModeReturn {
  state: VoiceSessionState;
  transcript: VoiceTranscriptEntry[];
  errorMessage: string | null;
  isMuted: boolean;
  autoMuted: boolean;
  startSession: () => Promise<void>;
  endSession: () => void;
  toggleMute: () => void;
  audioLevel: number;
  getFullTranscript: () => VoiceTranscriptEntry[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROXY_URL = `wss://${import.meta.env.VITE_SUPABASE_URL?.replace('https://', '')}/functions/v1/gemini-voice-proxy`;
const GEMINI_MODEL = 'models/gemini-3.1-flash-live-preview';
const CONNECTION_TIMEOUT_MS = 10_000;
const SETUP_TIMEOUT_MS = 15_000;

const DEFAULT_SYSTEM_PROMPT = `You are Kai, a friendly youth sports registration assistant. You're having a live voice conversation with a parent.

Keep responses SHORT — 1-2 sentences max. Parents are talking, not reading.

Your goal is to help them find and register their child for youth sports programs. Collect:
- Child's name and age
- What sport they want (soccer, basketball, swimming, creative arts, tennis, gymnastics, dance, martial arts, baseball)
- Preferred days and times
- Their city

When you have enough info, use the query_assistant tool to search for sessions. Summarize results verbally — for example: "I found 2 soccer sessions on Saturdays in Irvine — one at 9 AM at Beacon Park for 299 dollars, and one at 10:30 at Oakwood for 224 dollars. Which sounds better?"

Be warm, concise, and conversational. No markdown, no bullet points — you're SPEAKING.
Say numbers as words for prices under 20, and use digits for larger amounts.
If you don't understand something, ask the parent to repeat — don't guess.`;

// ---------------------------------------------------------------------------
// Audio encoding/decoding utilities
// ---------------------------------------------------------------------------

function float32ToPcm16Base64(float32: Float32Array): string {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function pcm16Base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const pcm16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
  }
  return float32;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVoiceMode(options: VoiceModeOptions = {}): UseVoiceModeReturn {
  const {
    voiceName = 'Puck',
    assistantName = 'Kai',
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
  } = options;

  // React state (triggers re-renders)
  const [state, setState] = useState<VoiceSessionState>('idle');
  const [transcript, setTranscript] = useState<VoiceTranscriptEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [autoMuted, setAutoMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs (no re-renders)
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const isMutedRef = useRef(false);
  const pendingAgentTextRef = useRef('');
  const wasManuallyMutedRef = useRef(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);
  const voiceNameRef = useRef(voiceName);
  const systemPromptRef = useRef(systemPrompt);

  // Keep refs in sync with props
  useEffect(() => { voiceNameRef.current = voiceName; }, [voiceName]);
  useEffect(() => { systemPromptRef.current = systemPrompt; }, [systemPrompt]);

  // Sync isMuted ref
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // -------------------------------------------------------------------------
  // Auto-mute during thinking/speaking
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (state === 'thinking' || state === 'speaking') {
      wasManuallyMutedRef.current = isMutedRef.current;
      if (!isMutedRef.current) {
        setIsMuted(true);
        setAutoMuted(true);
      }
    } else if (state === 'listening') {
      if (!wasManuallyMutedRef.current) {
        setIsMuted(false);
      }
      setAutoMuted(false);
    }
  }, [state]);

  // -------------------------------------------------------------------------
  // Transcript helpers
  // -------------------------------------------------------------------------

  const addTranscriptEntry = useCallback((role: 'user' | 'agent', text: string) => {
    if (!text.trim()) return;
    setTranscript(prev => {
      const last = prev[prev.length - 1];
      // Merge into existing entry if same role and recent (<3s)
      if (last && last.role === role && (Date.now() - last.timestamp.getTime()) < 3000) {
        const updated = [...prev];
        updated[updated.length - 1] = { ...last, text: last.text + ' ' + text.trim() };
        return updated;
      }
      return [...prev, { role, text: text.trim(), timestamp: new Date() }];
    });
  }, []);

  // -------------------------------------------------------------------------
  // Gapless audio playback
  // -------------------------------------------------------------------------

  const playNextChunk = useCallback(() => {
    const ctx = playbackContextRef.current;
    if (!ctx || playbackQueueRef.current.length === 0) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const sampleRate = 24000;

    while (playbackQueueRef.current.length > 0) {
      const chunk = playbackQueueRef.current.shift()!;
      const buffer = ctx.createBuffer(1, chunk.length, sampleRate);
      buffer.getChannelData(0).set(chunk);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      const startAt = Math.max(now, nextPlayTimeRef.current);
      source.start(startAt);
      nextPlayTimeRef.current = startAt + buffer.duration;

      source.onended = () => {
        if (playbackQueueRef.current.length === 0 &&
            ctx.currentTime >= nextPlayTimeRef.current - 0.05) {
          isPlayingRef.current = false;
          setState(prev => prev === 'speaking' ? 'listening' : prev);
        }
      };
    }
    isPlayingRef.current = true;
  }, []);

  // -------------------------------------------------------------------------
  // Audio level monitoring
  // -------------------------------------------------------------------------

  const startAudioLevelMonitoring = useCallback(() => {
    const monitor = () => {
      if (!analyserRef.current) return;
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
      setAudioLevel(avg / 255);
      animFrameRef.current = requestAnimationFrame(monitor);
    };
    monitor();
  }, []);

  // -------------------------------------------------------------------------
  // Handle tool calls from Gemini
  // -------------------------------------------------------------------------

  const handleToolCall = useCallback(async (toolCall: { functionCalls?: Array<{ id: string; name: string; args: Record<string, unknown> }> }) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    setState('thinking');
    addTranscriptEntry('agent', 'Looking that up for you...');

    const functionResponses = await Promise.all(
      (toolCall.functionCalls || []).map(async (fc) => {
        if (fc.name === 'query_assistant') {
          try {
            const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
            if (!webhookUrl) {
              return { id: fc.id, name: fc.name, response: { output: { result: 'Search service not available.' } } };
            }
            const resp = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: fc.args.query as string,
                conversation_id: `voice-${Date.now()}`,
              }),
              signal: AbortSignal.timeout(30000),
            });
            const data = await resp.json();
            const message = data?.response?.message || data?.output || 'No results found.';
            // Strip markdown for voice
            const cleaned = message
              .replace(/\*\*([^*]+)\*\*/g, '$1')
              .replace(/\*([^*]+)\*/g, '$1')
              .replace(/#{1,6}\s+/g, '')
              .replace(/[📅📍💰👥🎯⚡]/g, '')
              .replace(/\n{2,}/g, '. ')
              .replace(/\n/g, ', ')
              .trim();
            return { id: fc.id, name: fc.name, response: { output: { result: cleaned } } };
          } catch (err) {
            console.error('[voice] Tool call error:', err);
            return { id: fc.id, name: fc.name, response: { output: { result: 'I had trouble looking that up. Can you try asking again?' } } };
          }
        }
        return { id: fc.id, name: fc.name, response: { output: { result: 'Unknown function.' } } };
      })
    );

    ws.send(JSON.stringify({ toolResponse: { functionResponses } }));
  }, [addTranscriptEntry]);

  // -------------------------------------------------------------------------
  // startSession
  // -------------------------------------------------------------------------

  const startSession = useCallback(async () => {
    if (state !== 'idle' && state !== 'error') return;

    setState('connecting');
    setErrorMessage(null);
    setTranscript([]);
    pendingAgentTextRef.current = '';
    endingRef.current = false;

    try {
      // Step 1: Request microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      mediaStreamRef.current = stream;

      // Step 2: Audio capture context (16kHz)
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(audioCtx.destination);
      processorRef.current = processor;

      // Step 3: Playback context (default sample rate for 24kHz output)
      const playbackCtx = new AudioContext();
      if (playbackCtx.state === 'suspended') await playbackCtx.resume();
      playbackContextRef.current = playbackCtx;

      // Step 4: Connect to proxy via WebSocket
      const ws = new WebSocket(PROXY_URL);
      wsRef.current = ws;

      connectionTimeoutRef.current = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          setErrorMessage('Connection timed out. Please try again.');
          setState('error');
        }
      }, CONNECTION_TIMEOUT_MS);

      ws.onopen = () => {
        clearTimeout(connectionTimeoutRef.current!);
        console.log('[voice] Connected to proxy');
        // Wait for proxyReady message before sending setup
      };

      ws.onmessage = async (event) => {
        if (endingRef.current) return;

        let messageText: string;
        if (typeof event.data === 'string') {
          messageText = event.data;
        } else if (event.data instanceof Blob) {
          messageText = await event.data.text();
        } else if (event.data instanceof ArrayBuffer) {
          messageText = new TextDecoder().decode(event.data);
        } else return;

        let data: Record<string, unknown>;
        try {
          data = JSON.parse(messageText);
        } catch {
          return;
        }

        // Proxy ready — send setup to Gemini
        if (data.proxyReady) {
          setupTimeoutRef.current = setTimeout(() => {
            setErrorMessage('Voice service setup timed out.');
            setState('error');
            ws.close();
          }, SETUP_TIMEOUT_MS);

          const setupMsg = {
            setup: {
              model: GEMINI_MODEL,
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceNameRef.current },
                  },
                },
              },
              systemInstruction: {
                parts: [{ text: systemPromptRef.current }],
              },
              tools: [{
                functionDeclarations: [{
                  name: 'query_assistant',
                  description: 'Search for youth sports sessions, check availability, or get program info. Use when the parent asks about sessions, pricing, availability, or wants to register.',
                  parameters: {
                    type: 'OBJECT',
                    properties: {
                      query: {
                        type: 'STRING',
                        description: 'The user question rephrased as a clear search query, e.g. "soccer sessions on Saturdays in Irvine for a 7 year old"',
                      },
                    },
                    required: ['query'],
                  },
                }],
              }],
              inputAudioTranscription: {},
              outputAudioTranscription: {},
            },
          };
          ws.send(JSON.stringify(setupMsg));
          return;
        }

        // Error from Gemini
        if (data.error) {
          const errMsg = (data.error as Record<string, unknown>).message as string || 'Voice service error';
          setErrorMessage(errMsg);
          setState('error');
          ws.close();
          return;
        }

        // Setup complete — start streaming audio
        if (data.setupComplete) {
          clearTimeout(setupTimeoutRef.current!);
          setState('listening');
          startAudioLevelMonitoring();

          processor.onaudioprocess = (e) => {
            if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const base64Audio = float32ToPcm16Base64(inputData);
            ws.send(JSON.stringify({
              realtimeInput: {
                audio: { data: base64Audio, mimeType: 'audio/pcm;rate=16000' },
              },
            }));
          };
          return;
        }

        // Server content (audio + transcriptions)
        if (data.serverContent) {
          const sc = data.serverContent as Record<string, unknown>;
          const modelTurn = sc.modelTurn as Record<string, unknown> | undefined;
          const parts = (modelTurn?.parts as Array<Record<string, unknown>>) || [];

          for (const part of parts) {
            if (part.inlineData) {
              const inlineData = part.inlineData as Record<string, unknown>;
              if (inlineData.data) {
                setState('speaking');
                const float32 = pcm16Base64ToFloat32(inlineData.data as string);
                playbackQueueRef.current.push(float32);
                playNextChunk();
              }
            }
            if (part.text) {
              pendingAgentTextRef.current += part.text as string;
            }
          }

          // Output transcription (agent captions)
          if (sc.outputTranscription) {
            const ot = sc.outputTranscription as Record<string, unknown>;
            if (ot.text) {
              pendingAgentTextRef.current += ot.text as string;
              addTranscriptEntry('agent', ot.text as string);
            }
          }

          // Turn complete
          if (sc.turnComplete) {
            pendingAgentTextRef.current = '';
          }

          // Input transcription (user captions)
          if (sc.inputTranscription) {
            const it = sc.inputTranscription as Record<string, unknown>;
            if (it.text) {
              addTranscriptEntry('user', it.text as string);
            }
          }
        }

        // Tool call
        if (data.toolCall) {
          handleToolCall(data.toolCall as { functionCalls?: Array<{ id: string; name: string; args: Record<string, unknown> }> });
        }
      };

      ws.onerror = () => {
        if (!endingRef.current) {
          setErrorMessage('Voice connection error. Please try again.');
          setState('error');
        }
      };

      ws.onclose = (event) => {
        if (!endingRef.current && state !== 'idle') {
          if (event.code !== 1000) {
            setErrorMessage('Voice session ended unexpectedly.');
            setState('error');
          }
        }
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start voice session';
      if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
        setErrorMessage('Microphone access denied. Please allow microphone access in your browser settings.');
      } else {
        setErrorMessage(msg);
      }
      setState('error');
    }
  }, [state, startAudioLevelMonitoring, playNextChunk, addTranscriptEntry, handleToolCall]);

  // -------------------------------------------------------------------------
  // endSession
  // -------------------------------------------------------------------------

  const endSession = useCallback(() => {
    endingRef.current = true;

    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    if (setupTimeoutRef.current) clearTimeout(setupTimeoutRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    if (wsRef.current) {
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current.close(1000);
      wsRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (playbackContextRef.current) {
      playbackContextRef.current.close().catch(() => {});
      playbackContextRef.current = null;
    }

    processorRef.current = null;
    analyserRef.current = null;
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;
    pendingAgentTextRef.current = '';
    setAudioLevel(0);
    setIsMuted(false);
    setAutoMuted(false);
    wasManuallyMutedRef.current = false;
    setState('idle');
    setErrorMessage(null);
    endingRef.current = false;
  }, []);

  // -------------------------------------------------------------------------
  // toggleMute
  // -------------------------------------------------------------------------

  const toggleMute = useCallback(() => {
    if (autoMuted) return;
    setIsMuted(prev => {
      wasManuallyMutedRef.current = !prev;
      return !prev;
    });
  }, [autoMuted]);

  // -------------------------------------------------------------------------
  // getFullTranscript
  // -------------------------------------------------------------------------

  const getFullTranscript = useCallback((): VoiceTranscriptEntry[] => {
    const current = [...transcript];
    if (pendingAgentTextRef.current.trim()) {
      const last = current[current.length - 1];
      if (last && last.role === 'agent') {
        current[current.length - 1] = { ...last, text: last.text + ' ' + pendingAgentTextRef.current.trim() };
      } else {
        current.push({ role: 'agent', text: pendingAgentTextRef.current.trim(), timestamp: new Date() });
      }
    }
    return current;
  }, [transcript]);

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      if (setupTimeoutRef.current) clearTimeout(setupTimeoutRef.current);
      if (wsRef.current) wsRef.current.close(1000);
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (playbackContextRef.current) playbackContextRef.current.close().catch(() => {});
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return {
    state,
    transcript,
    errorMessage,
    isMuted,
    autoMuted,
    startSession,
    endSession,
    toggleMute,
    audioLevel,
    getFullTranscript,
  };
}
