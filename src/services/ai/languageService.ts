/**
 * Kairo Language Service
 *
 * Handles language detection, preference storage, and UI string translations
 * for the registration flow. Currently supports English (en) and Spanish (es).
 *
 * Stage 2B.2 — Multi-Language Support
 */

export type LanguageCode = 'en' | 'es';

const STORAGE_KEY = 'kairo_language';

// ─── Translation Strings ─────────────────────────────────────────────────────

export interface LanguageStrings {
  // Chat UI
  chatPlaceholder: string;
  sendButton: string;
  startNew: string;
  tryChat: string;
  poweredBy: string;
  stopRecording: string;
  speakMessage: string;
  speakResponses: string;
  stopSpeaking: string;

  // Kai greeting
  greeting: string;

  // Fallback form
  fallbackTitle: string;
  fallbackSubtitle: string;
  fallbackDescription: string;
  fallbackChildName: string;
  fallbackChildNamePlaceholder: string;
  fallbackChildAge: string;
  fallbackProgram: string;
  fallbackProgramPlaceholder: string;
  fallbackCity: string;
  fallbackSchedule: string;
  fallbackSchedulePlaceholder: string;
  fallbackParentContact: string;
  fallbackParentName: string;
  fallbackEmail: string;
  fallbackPhone: string;
  fallbackSubmit: string;
  fallbackSubmitting: string;
  fallbackSuccessTitle: string;
  fallbackSuccessMessage: string;
  fallbackUnavailableNote: string;

  // Conversation
  sessionEndedMessage: string;
  signUpAnotherChild: string;
  noThanks: string;

  // Errors
  errorGeneric: string;
  voiceErrorNotAllowed: string;
  voiceErrorNoSpeech: string;
  voiceErrorNetwork: string;
  voiceErrorNotSupported: string;

  // Registration page
  registerStep1: string;
  registerStep2: string;
  registerStep3: string;
  registerStep4: string;
  registerBack: string;
  registerContinue: string;
  registerSessionExpired: string;
  registerSessionExpiredDescription: string;
  registerLoadingError: string;

  // Payment failure
  paymentFailedTitle: string;
  paymentFailedSubtitle: string;
  paymentFailedRetry: string;
  paymentFailedContactSupport: string;
  paymentFailedAlternative: string;
  paymentDeclined: string;
  paymentInsufficientFunds: string;
  paymentCardExpired: string;
  paymentGenericError: string;
  paymentRetrying: string;
}

const en: LanguageStrings = {
  // Chat UI
  chatPlaceholder: 'Type your message...',
  sendButton: 'Send',
  startNew: 'New',
  tryChat: 'Try Chat',
  poweredBy: 'Powered by Kairo',
  stopRecording: 'Stop recording',
  speakMessage: 'Speak your message',
  speakResponses: 'Read responses aloud',
  stopSpeaking: 'Stop speaking',

  // Kai greeting
  greeting:
    "Hi there! I'm Kai, your registration assistant for Soccer Stars. I can help you find the perfect soccer program for your child and get them signed up in just a few minutes. What would you like help with today?",

  // Fallback form
  fallbackTitle: 'Complete Registration',
  fallbackSubtitle: 'Just a few more details',
  fallbackDescription:
    "Our chat assistant is temporarily unavailable. Complete this form and we'll get back to you.",
  fallbackChildName: "Child's Name *",
  fallbackChildNamePlaceholder: 'First name',
  fallbackChildAge: "Child's Age",
  fallbackProgram: 'Preferred Program',
  fallbackProgramPlaceholder: 'e.g., Soccer Stars, Mini Stars',
  fallbackCity: 'City',
  fallbackSchedule: 'Schedule Preference',
  fallbackSchedulePlaceholder: 'e.g., Saturdays morning',
  fallbackParentContact: 'Parent Contact Info',
  fallbackParentName: 'Your Name',
  fallbackEmail: 'Email *',
  fallbackPhone: 'Phone',
  fallbackSubmit: 'Submit Registration',
  fallbackSubmitting: 'Submitting...',
  fallbackSuccessTitle: 'Registration Received!',
  fallbackSuccessMessage: "We'll follow up with program details at",
  fallbackUnavailableNote: "Our chat assistant is temporarily unavailable. Complete this form and we'll get back to you.",

  // Conversation
  sessionEndedMessage: "Thanks for registering {childName}! If you need anything else in the future, I'm always here to help. Have a great day!",
  signUpAnotherChild: 'Sign up another child',
  noThanks: "No, that's all",

  // Errors
  errorGeneric: 'Something went wrong. Please try again.',
  voiceErrorNotAllowed: 'Microphone access denied. Please allow microphone access in your browser settings.',
  voiceErrorNoSpeech: 'No speech detected. Please try again.',
  voiceErrorNetwork: 'Network error. Please check your connection and try again.',
  voiceErrorNotSupported: 'Voice input is not supported in your browser.',

  // Registration page
  registerStep1: 'Session',
  registerStep2: 'Your Info',
  registerStep3: 'Payment',
  registerStep4: 'Done',
  registerBack: 'Back',
  registerContinue: 'Continue',
  registerSessionExpired: 'Registration Expired',
  registerSessionExpiredDescription: 'This registration link has expired. Please start a new registration through our chat.',
  registerLoadingError: 'Failed to load registration. Please try again.',

  // Payment failure
  paymentFailedTitle: 'Payment Unsuccessful',
  paymentFailedSubtitle: 'Your payment could not be processed. Please try again or use a different payment method.',
  paymentFailedRetry: 'Try Again',
  paymentFailedContactSupport: 'Contact Support',
  paymentFailedAlternative: 'Use a Different Card',
  paymentDeclined: 'Your card was declined. Please check your card details or try a different card.',
  paymentInsufficientFunds: 'Your card has insufficient funds. Please use a different payment method.',
  paymentCardExpired: 'Your card has expired. Please use a different card.',
  paymentGenericError: 'Payment failed. Please check your card details and try again.',
  paymentRetrying: 'Processing payment...',
};

const es: LanguageStrings = {
  // Chat UI
  chatPlaceholder: 'Escribe tu mensaje...',
  sendButton: 'Enviar',
  startNew: 'Nuevo',
  tryChat: 'Probar Chat',
  poweredBy: 'Desarrollado por Kairo',
  stopRecording: 'Detener grabación',
  speakMessage: 'Habla tu mensaje',
  speakResponses: 'Leer respuestas en voz alta',
  stopSpeaking: 'Dejar de hablar',

  // Kai greeting
  greeting:
    '¡Hola! Soy Kai, tu asistente de registro para Soccer Stars. Puedo ayudarte a encontrar el programa de fútbol perfecto para tu hijo y registrarlo en solo unos minutos. ¿En qué te puedo ayudar hoy?',

  // Fallback form
  fallbackTitle: 'Completar Registro',
  fallbackSubtitle: 'Solo algunos detalles más',
  fallbackDescription: 'Nuestro asistente de chat no está disponible temporalmente. Completa este formulario y nos pondremos en contacto contigo.',
  fallbackChildName: 'Nombre del Niño *',
  fallbackChildNamePlaceholder: 'Primer nombre',
  fallbackChildAge: 'Edad del Niño',
  fallbackProgram: 'Programa Preferido',
  fallbackProgramPlaceholder: 'p.ej., Soccer Stars, Mini Stars',
  fallbackCity: 'Ciudad',
  fallbackSchedule: 'Preferencia de Horario',
  fallbackSchedulePlaceholder: 'p.ej., Sábados por la mañana',
  fallbackParentContact: 'Información de Contacto del Padre/Madre',
  fallbackParentName: 'Tu Nombre',
  fallbackEmail: 'Correo Electrónico *',
  fallbackPhone: 'Teléfono',
  fallbackSubmit: 'Enviar Registro',
  fallbackSubmitting: 'Enviando...',
  fallbackSuccessTitle: '¡Registro Recibido!',
  fallbackSuccessMessage: 'Nos comunicaremos con los detalles del programa a',
  fallbackUnavailableNote: 'Nuestro asistente de chat no está disponible temporalmente. Completa este formulario y nos pondremos en contacto contigo.',

  // Conversation
  sessionEndedMessage: '¡Gracias por registrar a {childName}! Si necesitas algo más en el futuro, siempre estaré aquí para ayudarte. ¡Que tengas un excelente día!',
  signUpAnotherChild: 'Registrar otro niño',
  noThanks: 'No, eso es todo',

  // Errors
  errorGeneric: 'Algo salió mal. Por favor intenta de nuevo.',
  voiceErrorNotAllowed: 'Acceso al micrófono denegado. Por favor permite el acceso al micrófono en la configuración de tu navegador.',
  voiceErrorNoSpeech: 'No se detectó voz. Por favor intenta de nuevo.',
  voiceErrorNetwork: 'Error de red. Por favor verifica tu conexión e intenta de nuevo.',
  voiceErrorNotSupported: 'La entrada de voz no es compatible con tu navegador.',

  // Registration page
  registerStep1: 'Sesión',
  registerStep2: 'Tu Info',
  registerStep3: 'Pago',
  registerStep4: 'Listo',
  registerBack: 'Atrás',
  registerContinue: 'Continuar',
  registerSessionExpired: 'Registro Vencido',
  registerSessionExpiredDescription: 'Este enlace de registro ha vencido. Por favor inicia un nuevo registro a través de nuestro chat.',
  registerLoadingError: 'Error al cargar el registro. Por favor intenta de nuevo.',

  // Payment failure
  paymentFailedTitle: 'Pago No Exitoso',
  paymentFailedSubtitle: 'No se pudo procesar tu pago. Por favor intenta de nuevo o usa un método de pago diferente.',
  paymentFailedRetry: 'Intentar de Nuevo',
  paymentFailedContactSupport: 'Contactar Soporte',
  paymentFailedAlternative: 'Usar una Tarjeta Diferente',
  paymentDeclined: 'Tu tarjeta fue rechazada. Por favor verifica los datos de tu tarjeta o intenta con una tarjeta diferente.',
  paymentInsufficientFunds: 'Tu tarjeta no tiene fondos suficientes. Por favor usa un método de pago diferente.',
  paymentCardExpired: 'Tu tarjeta ha vencido. Por favor usa una tarjeta diferente.',
  paymentGenericError: 'Pago fallido. Por favor verifica los datos de tu tarjeta e intenta de nuevo.',
  paymentRetrying: 'Procesando pago...',
};

const TRANSLATIONS: Record<LanguageCode, LanguageStrings> = { en, es };

// ─── Language Detection ───────────────────────────────────────────────────────

/** Detect the user's preferred language from the browser */
function detectBrowserLanguage(): LanguageCode {
  const lang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en';
  const base = lang.split('-')[0].toLowerCase();
  if (base === 'es') return 'es';
  return 'en';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Get the persisted language preference, falling back to browser detection */
export function getStoredLanguage(): LanguageCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch {
    // localStorage unavailable
  }
  return detectBrowserLanguage();
}

/** Persist the user's language selection */
export function setStoredLanguage(lang: LanguageCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // localStorage unavailable
  }
}

/** Return the translation strings for the given language */
export function getStrings(lang: LanguageCode): LanguageStrings {
  return TRANSLATIONS[lang];
}

/** Utility: fill template variables in a translation string */
export function t(template: string, vars: Record<string, string> = {}): string {
  return Object.entries(vars).reduce(
    (str, [key, value]) => str.replace(`{${key}}`, value),
    template
  );
}

/** Language display labels */
export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'EN',
  es: 'ES',
};

/** All supported languages */
export const SUPPORTED_LANGUAGES: LanguageCode[] = ['en', 'es'];

/** BCP-47 locale tags for TTS / SpeechRecognition */
export const LANGUAGE_LOCALE: Record<LanguageCode, string> = {
  en: 'en-US',
  es: 'es-US',
};
