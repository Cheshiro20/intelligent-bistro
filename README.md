# 🍽️ The Intelligent Bistro

**Voice-first restaurant ordering, built with Claude Code.**

A React Native app where the cart updates from both your taps AND your voice.
You can say *"I'll have two spicy chicken sandwiches and a large water"* — and
watch each item appear in your cart in real time as the AI thinks. There's also
a proactive AI assistant that suggests pairings, multi-model orchestration
(Whisper for transcription + Claude for reasoning), and a polished
hand-rolled design system.

> Built as a take-home for the Viridien AI Full-Stack Engineering internship.

---

## What makes this stand out

1. **🎤 Voice input via multi-model orchestration**
   Microphone tap → records audio → server uploads to a Whisper-compatible API
   (Groq's free Whisper, or OpenAI) → transcript flows into Claude with tool use
   → cart updates. Two models, each picked for what it does best. Falls back
   gracefully to text-only if no Whisper key.

2. **🌊 Agentic streaming — watch the AI think**
   The `/chat/stream` endpoint emits Server-Sent Events as Claude calls each
   tool. The cart updates **incrementally** — item by item — instead of waiting
   for the full response. A live cart preview strip on the chat screen makes the
   AI's reasoning visible without switching tabs.

3. **🧠 Proactive pairing suggestions**
   A dedicated `suggest_pairing` tool fires when the cart has a main but no
   side or drink. The UI renders a tappable suggestion card under the assistant
   message — a one-tap upsell that feels like a barista, not a popup ad.

Plus the table stakes done well: hand-rolled design system, haptics on every
interaction, typed end-to-end with Zod-validated requests, Zustand state, and
gracefully-degrading capability detection.

---

## Architecture

```
                ┌────────────────────────┐
                │     Expo (mobile)      │
                │  ────────────────────  │
                │  Menu  Chat  Cart      │
                │  Zustand single store  │
                │  for cart + messages   │
                └──────┬─────────────────┘
                       │ POST /chat/stream (SSE)
                       │ POST /transcribe   (multipart audio)
                       ▼
                ┌────────────────────────┐
                │    Hono (Node.js)      │
                │  ────────────────────  │
                │  /chat/stream  ────────┼──► Anthropic Claude  (tool use, 5 tools)
                │  /transcribe   ────────┼──► OpenAI Whisper    (speech → text)
                │  /menu         ────────┼──► (static)
                └────────────────────────┘
```

The server is intentionally **stateless** — the client sends the current cart
on every request, the model returns tool calls, the server emits them as
streaming events, and the client applies them locally. No session storage, no
"AI thinks the cart says X but UI shows Y" bugs.

### The 5 tools the AI can call

| Tool             | Trigger                                                  |
| ---------------- | -------------------------------------------------------- |
| `add_item`       | Customer asks for something — by item or description.    |
| `update_quantity`| Change "two" to "three" on an existing line.             |
| `remove_item`    | "Drop the salad", "no fries", etc.                       |
| `clear_cart`     | "Start over", "cancel my order".                         |
| `suggest_pairing`| Proactive — when cart needs balancing (main w/o drink).  |

---

## Tech stack

**Mobile** — Expo SDK 54, React 19, expo-router (file routing), Zustand
(state), `react-native-sse` (streaming), `expo-av` (audio recording),
`@expo/vector-icons`, Reanimated, expo-haptics. TypeScript strict.

**Server** — Node 22+, Hono (Express alternative, TS-first, native SSE),
Zod for request validation, `@anthropic-ai/sdk` for Claude, raw fetch for
the Whisper endpoint. TypeScript strict, ESM.

**AI** — Claude Sonnet 4.6 (tool use + streaming) + OpenAI Whisper (transcription).
The full menu and current cart are injected into the system prompt on every
call, so the model literally cannot invent item IDs.

---

## Getting started

### Prerequisites

- Node 20+ (tested on 24.10)
- macOS with Xcode Command Line Tools (for iOS Simulator) **or** an iPhone with
  the [Expo Go](https://apps.apple.com/app/expo-go/id982107779) app
- An **Anthropic** API key — required, get one at <https://console.anthropic.com/settings/keys>
- A **Whisper-compatible** API key — optional, for voice input. **Free option:** sign up
  for [Groq](https://console.groq.com) (no credit card required). Paid option: OpenAI.

### Setup

```bash
# 1. Install
cd server && npm install
cd ../mobile && npm install

# 2. Configure the server
cd ../server
cp .env.example .env
# Edit .env and paste ANTHROPIC_API_KEY (required) + WHISPER_API_KEY (optional, for voice)
# See .env.example for the Groq config (free Whisper).

# 3. Start the server (terminal 1)
npm run dev
# → 🍽️  Intelligent Bistro server running on http://localhost:3000

# 4. Start the mobile app (terminal 2)
cd ../mobile
npm run ios       # iOS Simulator
# or: npm start    (then scan QR with Expo Go on your iPhone)
```

### Voice on a real iPhone

Voice input works great in Expo Go on a real iPhone:

1. Open the Expo Go app on iPhone
2. Run `npm start` in `mobile/`
3. Scan the QR code with iPhone camera
4. Grant microphone permission when prompted
5. Tap the mic button in the Assistant tab and speak

For best demo results, use a real iPhone, not the Simulator — the Simulator
routes audio through the Mac's mic and adds noticeable latency.

### Try these

In the **Assistant** tab:

- *"I'll have a spicy chicken sandwich and a fresh lemonade"* — multi-item parse
- *"Add two truffle fries"* — quantity parse
- *"What's vegetarian on the menu?"* — Q&A, no cart change
- *"Actually make that three lemonades"* — quantity update on existing line
- *"Just the burger"* — should trigger a pairing suggestion
- *"Clear my order"* — clear

---

## Project structure

```
intelligent-bistro/
├── mobile/                          # Expo React Native app
│   ├── app/
│   │   ├── _layout.tsx              # Root layout + theme
│   │   └── (tabs)/
│   │       ├── _layout.tsx          # Tabs (Menu / Assistant / Cart + badge)
│   │       ├── index.tsx            # Menu screen
│   │       ├── chat.tsx             # AI assistant + voice + live cart strip
│   │       └── cart.tsx             # Cart + checkout
│   ├── components/bistro/           # Custom design-system components
│   │   ├── Button.tsx
│   │   ├── CartLine.tsx
│   │   ├── ChatBubble.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LiveCartStrip.tsx        # ★ Animated cart preview on chat screen
│   │   ├── MenuItemCard.tsx
│   │   ├── SuggestionCard.tsx       # ★ Tappable pairing-suggestion card
│   │   └── VoiceButton.tsx          # ★ Mic button: idle / recording / transcribing
│   ├── lib/
│   │   ├── api.ts                   # Base URL resolution (sim / Android / device)
│   │   ├── menu.ts                  # Menu data (mirrors server)
│   │   ├── recording.ts             # ★ Audio capture + upload to /transcribe
│   │   ├── store.ts                 # Zustand + SSE streaming
│   │   └── types.ts                 # Mirrors server types
│   └── constants/theme.ts           # Palette • Spacing • Radius • Typography
│
└── server/                          # Node.js + Hono
    └── src/
        ├── index.ts                 # Hono app: /menu /chat /chat/stream /transcribe
        ├── menu.ts                  # Source of truth for menu items
        ├── types.ts
        └── lib/
            ├── anthropic.ts         # Tool defs, system prompt, non-streaming chat
            ├── streamChat.ts        # ★ Streaming generator yielding tool/text events
            ├── whisper.ts           # ★ OpenAI Whisper transcription
            └── cart.ts              # Pure cart reducer
```

★ = unique to the standout features described above.

---

e) · Powered by
Claude Sonnet 4.6 (reasoning) + Groq Whisper (transcription) · Submitted by Yixiang for Viridien
