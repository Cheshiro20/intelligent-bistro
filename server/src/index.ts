import { config as loadEnv } from 'dotenv';
loadEnv({ override: true });

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { streamSSE } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { MENU } from './menu.js';
import { applyUpdates } from './lib/cart.js';
import { runChat } from './lib/anthropic.js';
import { streamChat } from './lib/streamChat.js';
import { transcribe, voiceAvailable } from './lib/whisper.js';
import type { ChatResponse } from './types.js';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) =>
  c.json({
    ok: true,
    service: 'intelligent-bistro-server',
    capabilities: {
      voice: voiceAvailable(),
      ordering: Boolean(process.env.ANTHROPIC_API_KEY),
    },
  })
);

app.get('/menu', (c) => c.json({ items: MENU }));

app.post('/transcribe', async (c) => {
  if (!voiceAvailable()) {
    return c.json({ error: 'Voice transcription not configured' }, 503);
  }
  try {
    const body = await c.req.parseBody();
    const audio = body['audio'];
    if (!(audio instanceof File)) {
      return c.json({ error: 'Missing audio file' }, 400);
    }
    const text = await transcribe(audio);
    return c.json({ text });
  } catch (err) {
    console.error('[transcribe] error:', err);
    return c.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      500
    );
  }
});

const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  cart: z.array(
    z.object({
      id: z.string(),
      itemId: z.string(),
      quantity: z.number().int().positive(),
      notes: z.string().optional(),
    })
  ),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
});

app.post('/chat', zValidator('json', chatRequestSchema), async (c) => {
  const { message, cart, history } = c.req.valid('json');

  try {
    const { reply, updates, suggestions } = await runChat(message, cart, history ?? []);
    const updatedCart = applyUpdates(cart, updates);

    const response: ChatResponse = {
      reply,
      cartUpdates: updates,
      updatedCart,
      suggestions,
    };
    return c.json(response);
  } catch (err) {
    console.error('[chat] error:', err);
    return c.json(
      {
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      500
    );
  }
});

app.post('/chat/stream', zValidator('json', chatRequestSchema), (c) => {
  const { message, cart, history } = c.req.valid('json');

  return streamSSE(c, async (stream) => {
    for await (const event of streamChat(message, cart, history ?? [])) {
      await stream.writeSSE({
        event: event.type,
        data: JSON.stringify(event),
      });
      if (event.type === 'done' || event.type === 'error') break;
    }
  });
});

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`🍽️  Intelligent Bistro server running on http://localhost:${info.port}`);
  console.log(`[diagnostic] env loaded:`);
  console.log(`  - ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? `set (${process.env.ANTHROPIC_API_KEY.length} chars)` : 'MISSING'}`);
  console.log(`  - WHISPER_API_KEY:   ${process.env.WHISPER_API_KEY ? `set (${process.env.WHISPER_API_KEY.length} chars)` : 'MISSING'}`);
  console.log(`  - WHISPER_BASE_URL:  ${process.env.WHISPER_BASE_URL ?? '(default)'}`);
  console.log(`  - WHISPER_MODEL:     ${process.env.WHISPER_MODEL ?? '(default)'}`);
});
