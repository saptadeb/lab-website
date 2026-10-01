import { afterEach, describe, expect, it, vi } from 'vitest';
import { isActive, url } from '../url';

afterEach(() => {
  vi.unstubAllEnvs();
});

/** The site is served from a subpath on GitHub Pages and from / on a domain. */
const withBase = (value: string) => vi.stubEnv('BASE_URL', value);

describe('url', () => {
  it('prefixes internal paths with the base path', () => {
    withBase('/lab-website/');
    expect(url('/research')).toBe('/lab-website/research');
  });

  it('adds a missing leading slash', () => {
    withBase('/lab-website/');
    expect(url('research')).toBe('/lab-website/research');
  });

  it('keeps the root path addressable', () => {
    withBase('/lab-website/');
    expect(url('/')).toBe('/lab-website/');
  });

  it('leaves paths alone when served from the domain root', () => {
    withBase('/');
    expect(url('/research')).toBe('/research');
    expect(url('/')).toBe('/');
  });

  it('never double-prefixes a trailing slash in the base', () => {
    withBase('/lab-website');
    expect(url('/news')).toBe('/lab-website/news');
  });

  it.each([
    'https://example.org/paper',
    'http://example.org',
    '//cdn.example.org/x.png',
    'mailto:lab@example.edu',
    'tel:+15550100',
    '#main',
  ])('leaves %s untouched', (href) => {
    withBase('/lab-website/');
    expect(url(href)).toBe(href);
  });
});

describe('isActive', () => {
  it('marks the current page', () => {
    withBase('/lab-website/');
    expect(isActive('/lab-website/research', '/research')).toBe(true);
  });

  it('marks the section parent of a nested page', () => {
    withBase('/lab-website/');
    expect(isActive('/lab-website/research/folding', '/research')).toBe(true);
  });

  it('ignores a trailing slash on the current path', () => {
    withBase('/lab-website/');
    expect(isActive('/lab-website/research/', '/research')).toBe(true);
  });

  it('does not mark an unrelated section', () => {
    withBase('/lab-website/');
    expect(isActive('/lab-website/people', '/research')).toBe(false);
  });

  // The home link is the easy one to get wrong: '/' prefixes everything.
  it('marks home only on the home page', () => {
    withBase('/lab-website/');
    expect(isActive('/lab-website/', '/')).toBe(true);
    expect(isActive('/lab-website', '/')).toBe(true);
    expect(isActive('/lab-website/research', '/')).toBe(false);
  });

  it('marks home only on the home page at the domain root', () => {
    withBase('/');
    expect(isActive('/', '/')).toBe(true);
    expect(isActive('/research', '/')).toBe(false);
  });

  // '/newsletter' must not light up the '/news' tab.
  it('does not match a sibling sharing a name prefix', () => {
    withBase('/lab-website/');
    expect(isActive('/lab-website/newsletter', '/news')).toBe(false);
  });
});
