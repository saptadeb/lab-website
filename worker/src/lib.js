import { parse, stringify } from 'yaml';

/** The collections the admin page may touch, and where they live. */
export const COLLECTIONS = {
  news: 'src/content/news',
  people: 'src/content/people',
  projects: 'src/content/projects',
  publications: 'src/content/publications',
};

const encoder = new TextEncoder();

function base64url(bytes) {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64url(text) {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compares two strings without leaking where they first differ. */
export function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

/**
 * Issues a session token. The signature is what makes it trustworthy: the
 * browser can read the payload but cannot forge one without the secret.
 */
export async function signToken(payload, secret) {
  const body = base64url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(body));
  return `${body}.${base64url(signature)}`;
}

/** Returns the payload for a valid unexpired token, or null. */
export async function verifyToken(token, secret, now = Date.now()) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = base64url(
    await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(body)),
  );
  if (!constantTimeEqual(signature, expected)) return null;

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromBase64url(body)));
  } catch {
    return null;
  }
  if (typeof payload?.exp !== 'number' || payload.exp <= now) return null;
  return payload;
}

/** Turns a title into a filename that is safe as a page address. */
export function slugify(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Builds a content file. Values go through a YAML serializer rather than string
 * concatenation, because a title containing a colon or an apostrophe is the most
 * common way hand-written frontmatter breaks a build.
 */
export function buildFile(data, body = '') {
  const clean = {};
  for (const [key, value] of Object.entries(data ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
      continue;
    }
    clean[key] = value;
  }
  const frontmatter = stringify(clean, { lineWidth: 0 }).trimEnd();
  const text = body.trim();
  return `---\n${frontmatter}\n---\n${text ? `\n${text}\n` : ''}`;
}

/** Splits a content file back into its frontmatter and body. */
export function splitFile(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text ?? '');
  if (!match) return { data: {}, body: String(text ?? '').trim() };
  return { data: parse(match[1]) ?? {}, body: match[2].trim() };
}

/**
 * Resolves a collection and slug to a repository path, refusing anything that
 * could escape the content directory.
 */
export function entryPath(collection, slug) {
  const folder = COLLECTIONS[collection];
  if (!folder) throw new Error(`Unknown collection: ${collection}`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(slug ?? ''))) {
    throw new Error(`Unsafe slug: ${slug}`);
  }
  return `${folder}/${slug}.md`;
}

/** Media sits beside the entries that use it, which is how the schema resolves it. */
export function mediaPath(collection, filename) {
  const folder = COLLECTIONS[collection];
  if (!folder) throw new Error(`Unknown collection: ${collection}`);
  const subfolder = collection === 'people' ? 'photos' : 'images';
  const name = String(filename ?? '');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || name.includes('..')) {
    throw new Error(`Unsafe filename: ${filename}`);
  }
  return {
    path: `${folder}/${subfolder}/${name}`,
    reference: `./${subfolder}/${name}`,
  };
}
