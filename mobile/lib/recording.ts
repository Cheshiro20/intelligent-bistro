import { Audio } from 'expo-av';
import { BASE_URL } from './api';

export async function ensureMicPermission(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}

export async function startRecording(): Promise<Audio.Recording> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await recording.startAsync();
  return recording;
}

export async function stopAndTranscribe(recording: Audio.Recording): Promise<string> {
  await recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  const uri = recording.getURI();
  if (!uri) throw new Error('No audio recorded.');

  const formData = new FormData();
  // React Native's FormData accepts this shape for files.
  formData.append('audio', {
    uri,
    name: 'voice.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  const res = await fetch(`${BASE_URL}/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Transcription failed: ${text}`);
  }
  const { text } = (await res.json()) as { text: string };
  return text;
}

export async function fetchCapabilities(): Promise<{ voice: boolean }> {
  try {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) return { voice: false };
    const data = (await res.json()) as { capabilities?: { voice?: boolean } };
    return { voice: Boolean(data.capabilities?.voice) };
  } catch {
    return { voice: false };
  }
}
