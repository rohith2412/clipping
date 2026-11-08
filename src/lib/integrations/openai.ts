interface PeakMoment {
  startTime: number;
  endTime: number;
  score: number;
  reason: string;
  transcript: string;
  category: string;
}

interface ClipMetadata {
  title: string;
  description: string;
  hashtags: string[];
}

export async function detectPeakMoments(
  transcript: string,
  segments: { start: number; end: number; text: string }[],
  config: {
    maxClips: number;
    minClipDuration: number;
    maxClipDuration: number;
  }
): Promise<PeakMoment[]> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert video editor who identifies the most engaging, viral-worthy moments from video transcripts.

You will be given a transcript with timestamps. Identify the ${config.maxClips} most engaging segments for short-form video clips.

Each segment should be ${config.minClipDuration}-${config.maxClipDuration} seconds long.

For each segment, provide:
- startTime (seconds)
- endTime (seconds)
- score (0-100, engagement potential)
- reason (why this is engaging)
- transcript (the text for this segment)
- category (one of: emotional, informational, controversial, funny, actionable, quotable)

Prefer segments that:
- Start with a hook (question, bold statement, surprising fact)
- Have self-contained narratives (don't end mid-thought)
- Would work without additional context
- Have high emotional or informational value

Return JSON: { "moments": [...] }`,
        },
        {
          role: "user",
          content: `Here is the transcript with timestamps:\n\n${segments
            .map((s) => `[${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s] ${s.text}`)
            .join("\n")}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  const parsed = JSON.parse(content);

  return (parsed.moments || []).map((m: PeakMoment) => ({
    ...m,
    selected: true,
  }));
}

export async function generateClipMetadata(
  clipTranscript: string,
  videoTitle: string,
  platform: string
): Promise<ClipMetadata> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Generate metadata for a short-form video clip for ${platform}. Given the clip transcript and original video title, create:
- title: Attention-grabbing title (max 100 chars)
- description: Engaging description with CTA (max 300 chars)
- hashtags: 5-10 relevant trending hashtags (without #)

Return JSON: { "title": "...", "description": "...", "hashtags": [...] }`,
        },
        {
          role: "user",
          content: `Original video: "${videoTitle}"\n\nClip transcript: "${clipTranscript}"`,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0]?.message?.content);
}

export async function generateVoiceoverScript(
  transcript: string
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Clean up the following transcript into a professional voiceover script. Remove filler words, fix grammar, make it concise and engaging. Keep the same meaning and length. Return only the script text.",
        },
        { role: "user", content: transcript },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? transcript;
}
