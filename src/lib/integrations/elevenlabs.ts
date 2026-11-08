export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  preview_url?: string;
}

export async function listVoices(): Promise<Voice[]> {
  const response = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const data = await response.json();
  return data.voices.map((v: any) => ({
    voice_id: v.voice_id,
    name: v.name,
    category: v.category,
    preview_url: v.preview_url,
  }));
}

export async function generateSpeech(
  text: string,
  voiceId: string,
  model = "eleven_multilingual_v2"
): Promise<Buffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function generatePreview(
  text: string,
  voiceId: string
): Promise<Buffer> {
  const previewText = text.length > 200 ? text.slice(0, 200) + "..." : text;
  return generateSpeech(previewText, voiceId, "eleven_turbo_v2_5");
}
