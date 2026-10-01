/**
 * Single source of truth for everything lab-specific.
 * Change values here rather than hunting through templates.
 */

export const SITE = {
  /** Lab name as it appears in the header and page titles. */
  name: 'Arabi Lab',
  /** Short line under the name in the header / on the home hero. */
  tagline: 'Placeholder tagline, one sentence on what the lab studies.',
  /** Used for SEO descriptions where a page does not supply its own. */
  description:
    'Placeholder description of the lab, its research focus, and its institution.',
  institution: 'Placeholder University',
  department: 'Department of Placeholder',

  pi: {
    name: 'Dr. Placeholder Arabi',
    title: 'Principal Investigator',
    email: 'pi@example.edu',
  },

  contact: {
    email: 'lab@example.edu',
    phone: '',
    address: ['Placeholder Building, Room 000', '123 Campus Drive', 'City, ST 00000'],
    /** OpenStreetMap embed bbox/marker. Replace with the real coordinates. */
    map: {
      lat: 42.2808,
      lon: -83.743,
      zoom: 16,
    },
  },

  /** Empty string hides the link. */
  social: {
    x: '',
    bluesky: '',
    linkedin: '',
    github: '',
    scholar: '',
    youtube: '',
  },

  /**
   * Analytics. Nothing loads until `id` is filled in, so the site ships
   * tracker-free by default.
   *
   * goatcounter  free, cookieless. `id` is the site code you pick at signup,
   *              i.e. the <code> in https://<code>.goatcounter.com
   * cloudflare   free, cookieless. `id` is the beacon token.
   * plausible    paid. `id` is the bare domain, e.g. arabilab.com
   * ga4          free but sets cookies, so it needs a privacy notice.
   *
   * See docs/free-services.md before changing this.
   */
  analytics: {
    provider: 'goatcounter' as 'none' | 'goatcounter' | 'cloudflare' | 'plausible' | 'ga4',
    id: '',
  },

  /**
   * Contact form. Static hosting cannot send mail, so submissions go through
   * a third-party relay that forwards them to `contact.email`.
   *
   * web3forms  free, 250 submissions/month. `key` is the access key emailed
   *            to you at https://web3forms.com (no account needed).
   * formspree  free, 50 submissions/month. `key` is the form ID from the
   *            endpoint URL, i.e. the XXXX in https://formspree.io/f/XXXX
   *
   * While `key` is empty the page shows a plain mailto: link instead.
   */
  form: {
    provider: 'web3forms' as 'none' | 'web3forms' | 'formspree',
    key: '',
  },
} as const;

/**
 * Tier A pages are on. Flip a flag to true once the content for that
 * section exists, and it appears in the nav automatically.
 */
export const PAGES = {
  // Tier A: built now
  home: true,
  about: true,
  research: true,
  publications: true,
  people: true,
  news: true,
  join: true,
  contact: true,

  // Tier B: scaffolded when confirmed
  projects: false,
  alumni: false,
  datasets: false,
  software: false,
  protocols: false,
  funding: false,
  events: false,
  teaching: false,
  gallery: false,
  facilities: false,
  location: false,
  prospectiveFaq: false,
  collaborators: false,
  press: false,

  // Tier C
  faq: false,
  privacy: false,
  culture: false,
  mentoring: false,
  safety: false,
  sponsors: false,
} as const;

type NavItem = { label: string; href: string; show: boolean };

export const NAV: NavItem[] = [
  { label: 'Home', href: '/', show: PAGES.home },
  { label: 'Research', href: '/research', show: PAGES.research },
  { label: 'Publications', href: '/publications', show: PAGES.publications },
  { label: 'People', href: '/people', show: PAGES.people },
  { label: 'News', href: '/news', show: PAGES.news },
  { label: 'Join Us', href: '/join', show: PAGES.join },
  { label: 'About', href: '/about', show: PAGES.about },
  { label: 'Contact', href: '/contact', show: PAGES.contact },
];

export const VISIBLE_NAV = NAV.filter((item) => item.show);
