/**
 * Real WebCrypto Cryptographic SHA-256 Ledger Digest Generator
 * Uses standard W3C Web Cryptography API subtle.digest('SHA-256') directly.
 */
export async function computeSha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuf = encoder.encode(data);
  const hashBuf = await crypto.subtle.digest('SHA-256', dataBuf);
  const hashArray = Array.from(new Uint8Array(hashBuf));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Logs a cryptographic ledger checksum entry to console and returns metadata.
 * Only invoke when a real transaction or operation has been successfully processed.
 */
export async function logLedgerChecksum(kind: string, payload: any): Promise<{ sha: string; seq: number; logMsg: string }> {
  const jsonStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const sha = await computeSha256(jsonStr);
  const seq = Math.floor(Date.now() / 1000);
  const logMsg = `[INTRA LEDGER CHECKSUM] sha256:${sha} | seq:${seq} | kind:${kind} | ts:${new Date().toISOString()}`;
  console.log(logMsg);
  return { sha, seq, logMsg };
}
