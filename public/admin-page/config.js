/**
 * The address of the admin Worker, which is the only thing that can write to the
 * repository. Set this once after deploying it, then commit the change.
 *
 *   cd worker && npx wrangler deploy
 *
 * Wrangler prints the url. It looks like
 * https://lab-website-admin.<your-subdomain>.workers.dev
 *
 * See docs/editing-the-site.md for the full walkthrough.
 */
export const API_BASE = '';
