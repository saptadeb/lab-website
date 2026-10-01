/**
 * The configured base path, without a trailing slash. Read per call rather
 * than captured at module load so tests can vary it.
 */
function base(): string {
  return (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
}

/** True for anything that should be left exactly as written. */
function isExternal(path: string): boolean {
  return /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(path);
}

/**
 * Prefixes an internal path with the configured base path.
 * Astro does not do this automatically for hand-written hrefs.
 */
export function url(path: string): string {
  if (isExternal(path) || path.startsWith('#')) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base()}${clean}`;
}

/** True when `href` is the current page, or a section containing it. */
export function isActive(currentPath: string, href: string): boolean {
  const prefix = base();
  const target = url(href);
  const current = currentPath.replace(/\/$/, '') || '/';

  // The home link must not match every page beneath the base path.
  if (target === `${prefix}/`) return current === prefix || current === `${prefix}/`;

  return current === target || current.startsWith(`${target}/`);
}
