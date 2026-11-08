import { createReadStream } from "fs";

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
  speaker?: string;
}

export interface TranscriptionResult {
  fullText: string;
  segments: TranscriptSegment[];
  language: string;
}

export async function transcribeAudio(
  audioPath: string
): Promise<TranscriptionResult> {
  const audioStream = createReadStream(audioPath);
  const chunks: Buffer[] = [];

  for await (const chunk of audioStream) {
    chunks.push(chunk as Buffer);
  }
  const audioBuffer = Buffer.concat(chunks);

  const response = await fetch(
    "https://api.deepgram.com/v1/listen?" +
      new URLSearchParams({
        model: "nova-3",
        punctuate: "true",
        diarize: "true",
        paragraphs: "true",
        smart_format: "true",
        utterances: "true",
        detect_language: "true",
      }),
    {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": "audio/wav",
      },
      body: audioBuffer,
    }
  );

  if (!response.ok) {
    throw new Error(
      `Deepgram API error: ${response.status} ${await response.text()}`
    );
  }

  const result = await response.json();
  const channel = result.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];

  const segments: TranscriptSegment[] = [];
  if (alternative?.words) {
    let currentSegment: TranscriptSegment | null = null;

    for (const word of alternative.words) {
      if (
        !currentSegment ||
        word.start - currentSegment.end > 1.5 ||
        word.speaker !== currentSegment.speaker
      ) {
        if (currentSegment) segments.push(currentSegment);
        currentSegment = {
          start: word.start,
          end: word.end,
          text: word.punctuated_word ?? word.word,
          confidence: word.confidence,
          speaker: word.speaker?.toString(),
        };
      } else {
        currentSegment.end = word.end;
        currentSegment.text += " " + (word.punctuated_word ?? word.word);
        currentSegment.confidence =
          (currentSegment.confidence + word.confidence) / 2;
      }
    }
    if (currentSegment) segments.push(currentSegment);
  }

  return {
    fullText: alternative?.transcript ?? "",
    segments,
    language: result.results?.channels?.[0]?.detected_language ?? "en",
  };
}
