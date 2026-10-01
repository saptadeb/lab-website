import { describe, expect, it } from 'vitest';
import {
  COLLECTIONS,
  buildFile,
  constantTimeEqual,
  entryPath,
  mediaPath,
  sha256Hex,
  signToken,
  slugify,
  splitFile,
  verifyToken,
} from '../worker/src/lib.js';

/*
 * The Worker holds the only credential that can write to the repository, so its
 * auth and path handling are the parts worth testing hardest.
 */

const SECRET = 'test-secret-value';

describe('session tokens', () => {
  it('accepts a token it just issued', async () => {
    const token = await signToken({ sub: 'root', exp: Date.now() + 60_000 }, SECRET);
    const payload = await verifyToken(token, SECRET);
    expect(payload?.sub).toBe('root');
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await signToken({ exp: Date.now() + 60_000 }, SECRET);
    expect(await verifyToken(token, 'another-secret')).toBeNull();
  });

  it('rejects an expired token', async () => {
    const token = await signToken({ exp: Date.now() - 1 }, SECRET);
    expect(await verifyToken(token, SECRET)).toBeNull();
  });

  // Without this check, anyone could mint a session by editing the payload.
  it('rejects a token whose payload was tampered with', async () => {
    const token = await signToken({ sub: 'root', exp: Date.now() + 60_000 }, SECRET);
    const [, signature] = token.split('.');
    const forged = Buffer.from(
      JSON.stringify({ sub: 'intruder', exp: Date.now() + 60_000 }),
    ).toString('base64url');
    expect(await verifyToken(`${forged}.${signature}`, SECRET)).toBeNull();
  });

  it('rejects a token with no payload expiry', async () => {
    const token = await signToken({ sub: 'root' }, SECRET);
    expect(await verifyToken(token, SECRET)).toBeNull();
  });

  it.each(['', 'nonsense', 'a.b.c', '.', 'onlybody.'])('rejects %o', async (token) => {
    expect(await verifyToken(token, SECRET)).toBeNull();
  });
});

describe('constantTimeEqual', () => {
  it('matches identical strings', () => {
    expect(constantTimeEqual('abc123', 'abc123')).toBe(true);
  });

  it('rejects different strings of equal length', () => {
    expect(constantTimeEqual('abc123', 'abc124')).toBe(false);
  });

  it('rejects different lengths without throwing', () => {
    expect(constantTimeEqual('abc', 'abcdef')).toBe(false);
  });

  it('rejects anything that is not a string', () => {
    expect(constantTimeEqual(undefined as any, 'abc')).toBe(false);
    expect(constantTimeEqual(null as any, null as any)).toBe(false);
  });
});

describe('password hashing', () => {
  it('derives the documented hash for the configured credentials', async () => {
    expect(await sha256Hex('root:admin')).toBe(
      '7edb9e78935ace77c356e45624e058b1ffb0c2e3ed7b445754b1c3806be38efb',
    );
  });

  it('covers the username as well as the password', async () => {
    expect(await sha256Hex('root:admin')).not.toBe(await sha256Hex('admin:admin'));
  });
});

describe('entryPath', () => {
  it('resolves a collection and slug to a content path', () => {
    expect(entryPath('news', 'hello-world')).toBe('src/content/news/hello-world.md');
  });

  it('refuses an unknown collection', () => {
    expect(() => entryPath('secrets', 'x')).toThrow(/Unknown collection/);
  });

  // The slug arrives from a request, so it is the obvious traversal vector.
  it.each([
    '../../../etc/passwd',
    '..',
    'a/b',
    'Upper',
    'trailing-',
    'has_underscore',
    '',
    'spaces here',
  ])('refuses the unsafe slug %o', (slug) => {
    expect(() => entryPath('news', slug)).toThrow(/Unsafe slug/);
  });

  it('only exposes the four content collections', () => {
    expect(Object.keys(COLLECTIONS).sort()).toEqual([
      'news',
      'people',
      'projects',
      'publications',
    ]);
    for (const folder of Object.values(COLLECTIONS)) {
      expect(folder.startsWith('src/content/')).toBe(true);
    }
  });
});

describe('mediaPath', () => {
  it('puts people photos where the schema resolves them', () => {
    expect(mediaPath('people', 'jane.jpg')).toEqual({
      path: 'src/content/people/photos/jane.jpg',
      reference: './photos/jane.jpg',
    });
  });

  it('puts other media in an images folder beside the entry', () => {
    expect(mediaPath('news', 'photo.png').path).toBe('src/content/news/images/photo.png');
  });

  it.each(['../evil.png', 'a/b.png', '.hidden', 'no..dots.png', ''])(
    'refuses the unsafe filename %o',
    (filename) => {
      expect(() => mediaPath('news', filename)).toThrow(/Unsafe filename/);
    },
  );
});

describe('buildFile', () => {
  // Hand-written frontmatter breaks on exactly these characters.
  it('quotes a value containing a colon', () => {
    expect(buildFile({ title: 'Edge: case' })).toContain('title: "Edge: case"');
  });

  it('survives an apostrophe and a quote', () => {
    const file = buildFile({ title: `Jane's "big" result` });
    expect(splitFile(file).data.title).toBe(`Jane's "big" result`);
  });

  it('keeps a numeric year numeric, since the schema demands a number', () => {
    expect(splitFile(buildFile({ year: 2026 })).data.year).toBe(2026);
  });

  it('drops empty values rather than writing blanks the schema rejects', () => {
    const data = splitFile(buildFile({ title: 'Kept', summary: '', tags: [], links: {} })).data;
    expect(data).toEqual({ title: 'Kept' });
  });

  it('keeps false, which is meaningful, unlike an empty string', () => {
    expect(splitFile(buildFile({ draft: false })).data.draft).toBe(false);
  });

  it('round-trips a full entry including its body', () => {
    const data = { title: 'A paper', authors: ['**Jane Doe**', 'Other'], year: 2026 };
    const file = buildFile(data, 'The body.\n\nSecond paragraph.');
    const parsed = splitFile(file);
    expect(parsed.data).toEqual(data);
    expect(parsed.body).toBe('The body.\n\nSecond paragraph.');
  });

  it('writes a file that starts with a frontmatter fence', () => {
    expect(buildFile({ title: 'x' }).startsWith('---\n')).toBe(true);
  });

  it('does not wrap long values, which would corrupt them', () => {
    const long = 'A '.repeat(120).trim();
    expect(splitFile(buildFile({ venue: long })).data.venue).toBe(long);
  });
});

describe('splitFile', () => {
  it('treats a file with no frontmatter as all body', () => {
    expect(splitFile('Just text')).toEqual({ data: {}, body: 'Just text' });
  });

  it('handles windows line endings', () => {
    expect(splitFile('---\r\ntitle: x\r\n---\r\nBody').data.title).toBe('x');
  });
});

describe('slugify', () => {
  it('agrees with the browser-side implementation', () => {
    expect(slugify('A Title: With Punctuation!')).toBe('a-title-with-punctuation');
  });

  it('always produces something entryPath will accept', () => {
    for (const title of ['Hello World', 'A: B', '  padded  ', 'Café Übung']) {
      expect(() => entryPath('news', slugify(title))).not.toThrow();
    }
  });
});
