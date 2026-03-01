# 🎙️ Voice Scheduler — AI Meeting Assistant

A real-time voice assistant that helps you schedule meetings through natural conversation. Speak to the assistant, provide your details, and it automatically creates Google Calendar events.

**[🔗 Live Demo](https://voice-bot-your-deployment.vercel.app)** *(Update with your deployed URL)*

---

## ✨ Features

- **Real-time voice conversations** powered by VAPI with natural turn-taking
- **AI scheduling agent** using GPT-4o-mini for intelligent conversation flow
- **Google Calendar integration** — real events created on your calendar
- **Beautiful dark UI** with animated voice orb, glassmorphism effects, and live transcript
- **Tool calling** — the LLM decides when to create the event based on conversation context

---

## 🏗️ Architecture

```
User Browser ──WebRTC──▶ VAPI Cloud (STT + LLM + TTS)
                              │
                              │ Tool Call: createCalendarEvent
                              ▼
                     Next.js API Route (/api/vapi/webhook)
                              │
                              │ googleapis
                              ▼
                      Google Calendar API
                              │
                              ▼
                     Event Created ✅ → Confirmation spoken to user
```

**Tech Stack:**
- **Frontend**: Next.js 16 (App Router), React, TypeScript, Vanilla CSS
- **Voice AI**: VAPI Web SDK (`@vapi-ai/web`) with Deepgram STT + ElevenLabs TTS
- **LLM**: OpenAI GPT-4o-mini (via VAPI)
- **Calendar**: Google Calendar API via `googleapis` (service account auth)
- **Deployment**: Vercel

---

## 🚀 How to Test

1. Visit the deployed URL
2. Click the **microphone button** to start the conversation
3. The assistant will greet you and ask for:
   - Your **name**
   - Preferred **date & time**
   - An optional **meeting title**
   - Optional **duration** (defaults to 30 min)
4. Confirm the details when asked
5. The assistant creates the event on Google Calendar and confirms
6. Check the **event card** on-screen and your Google Calendar

---

## 🛠️ Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- A [VAPI](https://vapi.ai) account (free tier available)
- A Google Cloud project with Calendar API enabled

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/voice-bot.git
cd voice-bot
npm install
```

### 2. Configure VAPI

1. Sign up at [vapi.ai](https://vapi.ai)
2. Go to **Dashboard → API Keys**
3. Copy your **Public Key** and **Private Key**

### 3. Configure Google Calendar

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable the **Google Calendar API**
4. Go to **APIs & Services → Credentials → Create Credentials → Service Account**
5. Download the JSON key file
6. From the JSON file, copy `client_email` and `private_key`
7. Go to your Google Calendar **Settings → Share with specific people**
8. Add the service account email with **"Make changes to events"** permission
9. Copy your **Calendar ID** from calendar settings (usually your email for primary calendar)

### 4. Set Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
VAPI_PRIVATE_KEY=your_vapi_private_key
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=your_calendar_id@gmail.com
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** For local development, VAPI tool calls need to reach your server. You may need to use a tunneling tool like [ngrok](https://ngrok.com) to expose your local server, or deploy to Vercel first.

---

## 📅 Calendar Integration Explained

The calendar integration uses **Google Calendar API v3** with a **service account** for server-to-server authentication:

1. **Authentication**: The service account authenticates using a JWT (JSON Web Token) with the private key. No OAuth user consent flow is needed.

2. **Flow**:
   - User speaks to the voice assistant
   - VAPI's LLM (GPT-4o-mini) processes the conversation
   - When the user confirms meeting details, the LLM triggers a **tool call** (`createCalendarEvent`)
   - VAPI sends the tool call to our **webhook endpoint** (`/api/vapi/webhook`)
   - The webhook extracts parameters (name, dateTime, duration, title)
   - It calls `googleapis` to insert the event into Google Calendar
   - The result is returned to VAPI, which speaks the confirmation

3. **Service Account Permissions**: The service account must be explicitly shared on the target Google Calendar with "Make changes to events" permission. This is a one-time setup.

4. **Why Service Account?** Unlike OAuth, service accounts don't require user interaction or token refresh. They work silently on the server, which is perfect for an automated voice assistant.

---

## 🚢 Deployment (Vercel)

1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add all environment variables in Vercel Dashboard → Settings → Environment Variables
4. Deploy!

The webhook URL for VAPI tool calls will automatically be `https://your-domain.vercel.app/api/vapi/webhook`.

---

## 📁 Project Structure

```
voice-bot/
├── src/
│   ├── app/
│   │   ├── api/vapi/webhook/route.ts   # VAPI webhook for tool calls
│   │   ├── globals.css                  # Global styles & design system
│   │   ├── layout.tsx                   # Root layout with metadata
│   │   └── page.tsx                     # Main page
│   ├── components/
│   │   └── VoiceAssistant.tsx           # Voice UI component (VAPI SDK)
│   └── lib/
│       ├── assistant-config.ts          # VAPI assistant configuration
│       └── google-calendar.ts           # Google Calendar API module
├── .env.example                         # Environment variable template
├── README.md
└── package.json
```

---

## 📝 License

MIT
