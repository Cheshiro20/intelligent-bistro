const DEFAULT_URL = 'https://api.openai.com/v1/audio/transcriptions';
const DEFAULT_MODEL = 'whisper-1';

function transcriptionUrl(): string {
  return process.env.WHISPER_BASE_URL || DEFAULT_URL;
}

function transcriptionModel(): string {
  return process.env.WHISPER_MODEL || DEFAULT_MODEL;
}

export function voiceAvailable(): boolean {
  return Boolean(process.env.WHISPER_API_KEY);
}

export async function transcribe(audio: File): Promise<string> {
  const key = process.env.WHISPER_API_KEY;
  if (!key) {
    throw new Error('WHISPER_API_KEY not set — voice transcription unavailable.');
  }

  const form = new FormData();
  form.append('file', audio);
  form.append('model', transcriptionModel());
  form.append('response_format', 'text');
  form.append(
    'prompt',
    "Restaurant ordering context. Items include: burger, chicken sandwich, wrap, salad, salmon, fries, onion rings, iced tea, lemonade, sparkling water."
  );

  const res = await fetch(transcriptionUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Whisper API error (${res.status}): ${text}`);
  }

  const transcript = await res.text();
  return transcript.trim();
}
