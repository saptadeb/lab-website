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
} from './lib.js';

const SESSION_HOURS = 8;

/*
 * This Worker is the only thing that holds a credential able to write to the
 * repository. The admin page never sees it: the page proves who it is with a
 * short-lived signed session token, and the Worker does the committing.
 *
 * Required secrets:  GITHUB_TOKEN, ADMIN_PASSWORD_HASH, SESSION_SECRET
 * Required vars:     GITHUB_REPO, ALLOWED_ORIGIN
 * Optional vars:     GITHUB_BRANCH (defaults to main), ADMIN_USERNAME
 */

function corsHeaders(env, request) {
  const allowed = (env.ALLOWED_ORIGIN ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  const origin = request.headers.get('Origin') ?? '';
  const ok = allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0] ?? '',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, { status = 200, env, request } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...(env && request ? corsHeaders(env, request) : {}),
    },
  });
}

async function gh(env, path, init = {}) {
  const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'lab-website-admin',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  return response;
}

function branch(env) {
  return env.GITHUB_BRANCH || 'main';
}

/** Reads the session token and returns its payload, or null. */
async function session(request, env) {
  const header = request.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !env.SESSION_SECRET) return null;
  return verifyToken(token, env.SESSION_SECRET);
}

async function handleLogin(request, env) {
  const { username = '', password = '' } = await request.json().catch(() => ({}));
  const expectedUser = env.ADMIN_USERNAME || 'root';

  // The hash covers both halves, so the username is checked by the same compare.
  const given = await sha256Hex(`${username}:${password}`);
  const ok =
    constantTimeEqual(given, (env.ADMIN_PASSWORD_HASH ?? '').toLowerCase()) &&
    username === expectedUser;

  if (!ok) {
    // A uniform delay keeps the response time from hinting at which half failed.
    await new Promise((resolve) => setTimeout(resolve, 250));
    return json({ error: 'Those details are not right.' }, { status: 401, env, request });
  }

  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  return json(
    { token: await signToken({ sub: username, exp }, env.SESSION_SECRET), expiresAt: exp },
    { env, request },
  );
}

async function handleList(url, env, request) {
  const collection = url.searchParams.get('collection');
  const folder = COLLECTIONS[collection];
  if (!folder) return json({ error: 'Unknown collection' }, { status: 400, env, request });

  const response = await gh(env, `/contents/${folder}?ref=${branch(env)}`);
  if (response.status === 404) return json({ entries: [] }, { env, request });
  if (!response.ok) {
    return json({ error: `GitHub said ${response.status}` }, { status: 502, env, request });
  }

  const files = await response.json();
  const entries = [];
  for (const file of files) {
    if (file.type !== 'file' || !/\.mdx?$/.test(file.name)) continue;
    entries.push({ slug: file.name.replace(/\.mdx?$/, ''), sha: file.sha, path: file.path });
  }
  return json({ entries }, { env, request });
}

async function handleRead(url, env, request) {
  const collection = url.searchParams.get('collection');
  const slug = url.searchParams.get('slug');
  let path;
  try {
    path = entryPath(collection, slug);
  } catch (error) {
    return json({ error: error.message }, { status: 400, env, request });
  }

  const response = await gh(env, `/contents/${path}?ref=${branch(env)}`);
  if (response.status === 404) return json({ error: 'Not found' }, { status: 404, env, request });
  if (!response.ok) {
    return json({ error: `GitHub said ${response.status}` }, { status: 502, env, request });
  }

  const file = await response.json();
  const text = new TextDecoder().decode(
    Uint8Array.from(atob(file.content.replace(/\n/g, '')), (c) => c.charCodeAt(0)),
  );
  const { data, body } = splitFile(text);
  return json({ slug, sha: file.sha, data, body }, { env, request });
}

async function handleWrite(request, env, payload) {
  const { collection, slug: rawSlug, data = {}, body = '', sha, title } = await request
    .json()
    .catch(() => ({}));

  const slug = rawSlug || slugify(title ?? data.title ?? data.name ?? '');
  let path;
  try {
    path = entryPath(collection, slug);
  } catch (error) {
    return json({ error: error.message }, { status: 400, env, request });
  }

  const content = buildFile(data, body);
  const message = `${sha ? 'Update' : 'Add'} ${collection}: ${slug}`;

  const response = await gh(env, `/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      branch: branch(env),
      content: btoa(String.fromCharCode(...new TextEncoder().encode(content))),
      ...(sha ? { sha } : {}),
      committer: { name: 'Lab website admin', email: 'admin@users.noreply.github.com' },
      author: {
        name: `${payload.sub} via admin page`,
        email: 'admin@users.noreply.github.com',
      },
    }),
  });

  if (response.status === 409 || response.status === 422) {
    return json(
      { error: 'Someone else changed this entry. Reload and try again.' },
      { status: 409, env, request },
    );
  }
  if (!response.ok) {
    const detail = await response.text();
    return json({ error: `GitHub said ${response.status}`, detail }, { status: 502, env, request });
  }

  const result = await response.json();
  return json({ slug, sha: result.content.sha }, { env, request });
}

async function handleDelete(url, env, request) {
  const collection = url.searchParams.get('collection');
  const slug = url.searchParams.get('slug');
  const sha = url.searchParams.get('sha');
  let path;
  try {
    path = entryPath(collection, slug);
  } catch (error) {
    return json({ error: error.message }, { status: 400, env, request });
  }
  if (!sha) return json({ error: 'Missing sha' }, { status: 400, env, request });

  const response = await gh(env, `/contents/${path}`, {
    method: 'DELETE',
    body: JSON.stringify({ message: `Delete ${collection}: ${slug}`, sha, branch: branch(env) }),
  });
  if (!response.ok) {
    return json({ error: `GitHub said ${response.status}` }, { status: 502, env, request });
  }
  return json({ deleted: slug }, { env, request });
}

async function handleMedia(request, env) {
  const { collection, filename, contentBase64 } = await request.json().catch(() => ({}));
  let target;
  try {
    target = mediaPath(collection, filename);
  } catch (error) {
    return json({ error: error.message }, { status: 400, env, request });
  }
  if (typeof contentBase64 !== 'string' || contentBase64.length === 0) {
    return json({ error: 'Missing file' }, { status: 400, env, request });
  }
  // GitHub's contents API caps a single write well below this, and a lab photo
  // has no business being larger.
  if (contentBase64.length > 8 * 1024 * 1024) {
    return json({ error: 'That file is too large. Keep images under 5 MB.' }, { status: 413, env, request });
  }

  const existing = await gh(env, `/contents/${target.path}?ref=${branch(env)}`);
  const sha = existing.ok ? (await existing.json()).sha : undefined;

  const response = await gh(env, `/contents/${target.path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Upload ${collection} media: ${filename}`,
      branch: branch(env),
      content: contentBase64,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!response.ok) {
    return json({ error: `GitHub said ${response.status}` }, { status: 502, env, request });
  }
  return json({ reference: target.reference }, { env, request });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    }

    for (const required of ['GITHUB_TOKEN', 'GITHUB_REPO', 'SESSION_SECRET', 'ADMIN_PASSWORD_HASH']) {
      if (!env[required]) {
        return json({ error: `The Worker is missing ${required}.` }, { status: 500, env, request });
      }
    }

    if (url.pathname === '/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }

    const payload = await session(request, env);
    if (!payload) {
      return json({ error: 'Session expired. Sign in again.' }, { status: 401, env, request });
    }

    if (url.pathname === '/entries' && request.method === 'GET') return handleList(url, env, request);
    if (url.pathname === '/entry' && request.method === 'GET') return handleRead(url, env, request);
    if (url.pathname === '/entry' && request.method === 'PUT') {
      return handleWrite(request, env, payload);
    }
    if (url.pathname === '/entry' && request.method === 'DELETE') {
      return handleDelete(url, env, request);
    }
    if (url.pathname === '/media' && request.method === 'POST') return handleMedia(request, env);

    return json({ error: 'Not found' }, { status: 404, env, request });
  },
};
