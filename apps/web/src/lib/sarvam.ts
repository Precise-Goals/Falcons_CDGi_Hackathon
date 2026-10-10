import { ENV } from './config';
import { computeSha256 } from './crypto';

export interface SarvamResponse {
  text: string;
  checksum: string;
  model: string;
  latencyMs: number;
}

export async function askSarvamAI(
  prompt: string,
  language = 'en',
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  options?: { maxTokens?: number; temperature?: number }
): Promise<SarvamResponse> {
  const startTime = Date.now();
  const url = `${ENV.SARVAM_BASE_URL}/v1/chat/completions`;

  const systemInstructions = `You are Intra Autonomous Remediation Assistant, an intelligent AI engine specialized in API drift detection, behavioral contracts, and automated repair. Language mode: ${language}. Provide direct, highly technical, and concise guidance.`;

  const messages = [
    { role: 'system', content: systemInstructions },
    ...history.slice(-4),
    { role: 'user', content: prompt },
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': ENV.SARVAM_API_KEY,
    },
    body: JSON.stringify({
      model: ENV.SARVAM_MODEL || 'sarvam-105b',
      messages,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.3,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Sarvam AI API failed with status ${res.status}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const rawText: string | undefined = choice?.message?.content;
  if (!rawText || !rawText.trim()) {
    throw new Error(
      `Sarvam AI 105B returned empty completion (finish_reason: ${choice?.finish_reason || 'unknown'})`
    );
  }
  const latencyMs = Date.now() - startTime;

  // Compute genuine SHA-256 Checksum for ledger console audit
  const checksum = await computeSha256(rawText);

  console.log(
    `[INTRA LEDGER CHECKSUM] sha256:${checksum} (model: ${ENV.SARVAM_MODEL}, latency: ${latencyMs}ms, length: ${rawText.length})`
  );

  return {
    text: rawText,
    checksum,
    model: ENV.SARVAM_MODEL,
    latencyMs,
  };
}
