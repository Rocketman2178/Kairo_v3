# Kairo

AI-powered youth sports registration platform that transforms 18-20 minute enrollment processes into a seamless 3-minute conversational experience.

## Overview

Kairo uses a conversational AI agent named "Kai" to guide parents through registering their children for youth sports programs. Instead of filling out lengthy forms, parents simply chat with Kai who extracts the necessary information and recommends suitable classes.

**Core Value Proposition:** "Registration in 3 Minutes, Not 20"

## Features

- Conversational AI registration with Kai
- Smart class recommendations based on child age, schedule preferences, and location
- Real-time availability checking
- Waitlist prevention with intelligent alternatives
- Mobile-first design optimized for one-handed operation
- Voice registration support (coming soon)

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **AI Orchestration:** N8N Workflows
- **AI Model:** Google Gemini Flash

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- N8N instance
- Gemini API key

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_N8N_WEBHOOK_URL=your-n8n-webhook-url
```

### Installation

```bash
npm install
npm run dev
```

### Building

```bash
npm run build
```

## Architecture

```
Frontend (React) --> N8N Webhook --> Gemini AI
                         |
                    Supabase DB
                    (Sessions, Families, Registrations)
```

## Documentation

- `KAIRO_BUILD_PLAN.md` - Strategic development roadmap
- `N8N_INTEGRATION.md` - AI workflow architecture
- `N8N_WORKFLOW_STARTER.md` - Step-by-step n8n setup guide

## Current Status

**Stage 2 In Progress:** Kai Intelligence & Voice Registration

- AI conversation flow (complete)
- Smart recommendations (complete)
- Waitlist prevention (complete)
- Voice registration (pending)

## License

Private - All rights reserved
