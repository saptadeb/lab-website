import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

/*
 * The deploy workflow is the only thing standing between a bad edit and a
 * silently stale site, and it cannot be exercised locally. These tests pin the
 * parts that would fail quietly if someone rearranged them.
 */

const workflow = parse(readFileSync('.github/workflows/deploy.yml', 'utf8'));
const jobs = workflow.jobs;

describe('deploy workflow', () => {
  it('runs type checks and tests before building', () => {
    const steps = jobs.verify.steps.map((s: any) => s.run).filter(Boolean);
    expect(steps).toContain('npm run check');
    expect(steps).toContain('npm run test');
    expect(jobs.build.needs).toBe('verify');
  });

  it('only publishes after a successful build', () => {
    expect(jobs.deploy.needs).toBe('build');
  });

  it('never publishes from a pull request', () => {
    expect(jobs.deploy.if).toContain("github.event_name != 'pull_request'");
  });

  it('takes the node version from .nvmrc rather than repeating it', () => {
    for (const name of ['verify', 'build']) {
      const setup = jobs[name].steps.find((s: any) =>
        String(s.uses ?? '').startsWith('actions/setup-node'),
      );
      expect(setup.with['node-version-file'], `${name} should read .nvmrc`).toBe('.nvmrc');
    }
  });
});

describe('failure notification', () => {
  const notify = jobs['notify-failure'];

  it('reports a failure at any stage, including publishing', () => {
    expect(notify.needs).toEqual(['verify', 'build', 'deploy']);
    expect(notify.if).toContain('failure()');
  });

  it('does not nag about pull request failures, which are already visible', () => {
    expect(notify.if).toContain("github.event_name == 'push'");
  });

  it('can write issues, since that is the route that needs no secrets', () => {
    expect(notify.permissions.issues).toBe('write');
  });

  // Without this the workflow would need a secret before it did anything useful.
  it('opens an issue without depending on any secret', () => {
    const step = notify.steps[0];
    expect(String(step.uses)).toContain('actions/github-script');
    expect(step.if).toBeUndefined();
  });

  it('skips the mail step when no smtp secret is configured', () => {
    const mail = notify.steps.find((s: any) => s.name === 'Send mail');
    // The secrets context is unavailable in `if`, so it is lifted to env first.
    expect(mail.env.SMTP_PASSWORD).toContain('secrets.SMTP_PASSWORD');
    expect(mail.if).toBe("env.SMTP_PASSWORD != ''");
  });

  it('has a default recipient so it works before anything is configured', () => {
    const mail = notify.steps.find((s: any) => s.name === 'Send mail');
    expect(mail.with.to).toContain('saptadeep.deb@gmail.com');
  });

  it('closes the issue once the site publishes again', () => {
    const clear = jobs['clear-failure'];
    expect(clear.needs).toBe('deploy');
    expect(clear.if).toContain('success()');
    expect(clear.permissions.issues).toBe('write');
  });
});
