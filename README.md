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

## How I used Claude Code

This entire project was built with **Claude Code** as a pair-programmer. The
single highest-leverage thing I did was **starting with the schema, not the UI**:

1. I first designed the `CartUpdate` discriminated union and the tool-use
   schemas on the server, before writing any UI. This made the contract
   explicit and let me iterate on the AI behavior in isolation (curl against
   `/chat` — no app needed).
2. I asked Claude Code to **enforce the menu via the system prompt** — listing
   every item id in plain text — instead of constraining the model with JSON
   schema `enum`s. The model is much better at "use these IDs literally" from
   prose, and the failure mode is friendlier (clarification request vs schema
   crash).
3. I kept the server **stateless** — easier to reason about, easier to test, no
   session storage. Cart history lives on the client.
4. For UI work I had Claude Code generate the design system first (`theme.ts`)
   and then build screens against those tokens. Visual iteration stayed fast
   and consistent.
5. When I decided to add streaming, I structured the streaming logic as an
   **async generator** in `streamChat.ts` and let the route handler simply
   pipe it through `streamSSE`. Claude Code suggested this — it neatly
   separates "what events to emit" from "how to ship them over the wire".

---

## Design decisions worth calling out

**Why two models?** Whisper is genuinely state-of-the-art for speech
recognition; Claude Sonnet is state-of-the-art for tool use and reasoning.
Picking the best model for each subproblem is what real production AI looks
like. I made the transcription endpoint a configurable Whisper-compatible URL
so it can run against Groq (free, fast), OpenAI, or any other vendor that
ships the same API shape — that flexibility is itself a production-thinking
move. Voice is purely additive: the app works fully with just Anthropic.

**Why streaming for an action-heavy app?** With most ordering apps, *text*
streaming adds little — the assistant's text is a one-liner. The win is
streaming **tool calls** so the cart updates incrementally. The user sees
the AI "doing" each step, not waiting for one big atomic response. That
turns out to be the most visceral demo moment.

**Why no NativeWind?** Viridien's brief suggested NativeWind or Tamagui. I
evaluated both and shipped a hand-rolled token system instead:
- NativeWind v4 with Expo SDK 54 works, but adds metro/babel config, type
  augmentation for `className`, and a Tailwind version pin. For a 1-week
  project, that's risk without much upside.
- A 60-line `theme.ts` with `Palette`, `Spacing`, `Radius`, `Typography`,
  `Shadow` delivers the same consistency. `StyleSheet.create` is the React
  Native idiom.
- The "premium look" the brief asks for comes from spacing, hierarchy,
  animation, and haptics — not utility classes.

**Why Hono over Express?** TS-first, smaller surface, native SSE via
`streamSSE`. Express + an SSE middleware would've been ~30% more boilerplate.

**Why duplicate types between `mobile/` and `server/`?** Considered a shared
workspace package — overkill for a 30-line type file and adds tooling
complexity. The types stay in sync via discipline. In a production codebase
I'd extract to a `shared/` workspace once the type surface grows past ~100
lines.

**Why Zustand?** Three tabs all need cart state; the AI flow mutates cart
state. Redux would be ceremony, Context would re-render the world. Zustand
is one hook, no provider.

---


---

Built with [Claude Code](https://claude.com/claude-code) · Powered by
Claude Sonnet 4.6 (reasoning) + Groq Whisper (transcription) · Submitted by Yixiang for Viridien
