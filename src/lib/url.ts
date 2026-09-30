const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * Prefixes an internal path with the configured base path.
 * Astro does not do this automatically for hand-written hrefs.
 */
export function url(path: string): string {
  if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith('mailto:')) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${clean}` || '/';
}

/** True when `path` is the current page (or a section containing it). */
export function isActive(currentPath: string, href: string): boolean {
  const target = url(href);
  const current = currentPath.replace(/\/$/, '') || '/';
  if (target === `${BASE}/`) return current === BASE || current === `${BASE}/`;
  return current === target || current.startsWith(`${target}/`);
}
