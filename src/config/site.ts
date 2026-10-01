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
   * Analytics. Leave provider as 'none' until the owner picks one;
   * this also determines what the privacy statement needs to say.
   */
  analytics: {
    provider: 'none' as 'none' | 'plausible' | 'goatcounter' | 'ga4',
    id: '',
  },

  /**
   * Contact form endpoint (Formspree / Netlify Forms / etc.).
   * Empty string renders a plain mailto: link instead of a form.
   */
  formEndpoint: '',
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
  { label: 'Research', href: '/research', show: PAGES.research },
  { label: 'Publications', href: '/publications', show: PAGES.publications },
  { label: 'People', href: '/people', show: PAGES.people },
  { label: 'News', href: '/news', show: PAGES.news },
  { label: 'Join Us', href: '/join', show: PAGES.join },
  { label: 'About', href: '/about', show: PAGES.about },
  { label: 'Contact', href: '/contact', show: PAGES.contact },
];

export const VISIBLE_NAV = NAV.filter((item) => item.show);
