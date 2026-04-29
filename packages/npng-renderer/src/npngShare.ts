const SHARE_PREFIX = "n1.";

function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  return base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
}

export function encodeNpngShare(yamlText: string): string {
  const bytes = new TextEncoder().encode(yamlText);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `${SHARE_PREFIX}${toBase64Url(btoa(binary))}`;
}

export function decodeNpngShare(payload: string): string {
  const rawPayload = payload.startsWith(SHARE_PREFIX) ? payload.slice(SHARE_PREFIX.length) : payload;
  const binary = atob(fromBase64Url(rawPayload));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function readNpngSharePayload(search: string, hash: string): string | null {
  const searchParams = new URLSearchParams(search);
  const queryPayload = searchParams.get("npng") ?? searchParams.get("data");
  if (queryPayload) return queryPayload;

  const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!normalizedHash) return null;

  const hashParams = new URLSearchParams(normalizedHash);
  return hashParams.get("npng") ?? hashParams.get("data") ?? normalizedHash;
}
