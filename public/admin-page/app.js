import { API_BASE } from './config.js';
import { COLLECTIONS, buildSlug, byName } from './fields.js';

const state = { token: null, collection: null, slug: null, sha: null, relations: {} };

const $ = (selector) => document.querySelector(selector);
const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  for (const child of [].concat(children)) {
    if (child) node.append(child.nodeType ? child : document.createTextNode(child));
  }
  return node;
};

function status(message, tone = 'info') {
  const bar = $('#status');
  bar.textContent = message ?? '';
  bar.className = message ? `status status-${tone}` : 'status';
}

// ---------------------------------------------------------------- transport

async function api(path, options = {}) {
  if (!API_BASE) throw new Error('setup');
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 && state.token) {
    signOut('Your session expired. Sign in again.');
    throw new Error('expired');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status})`);
  return payload;
}

function signOut(message) {
  state.token = null;
  try {
    sessionStorage.removeItem('admin-token');
  } catch {
    // Storage can be blocked; signing out still works.
  }
  $('#app').hidden = true;
  $('#login').hidden = false;
  if (message) $('#login-error').textContent = message;
}

// ------------------------------------------------------------------ fields

function fieldControl(field, value) {
  const id = `f-${field.name}`;
  const common = { id, name: field.name };

  switch (field.type) {
    case 'textarea':
    case 'markdown':
      return el('textarea', { ...common, rows: field.type === 'markdown' ? 14 : 3, value: value ?? '' });

    case 'boolean':
      return el('input', { ...common, type: 'checkbox', checked: Boolean(value) });

    case 'number':
      return el('input', { ...common, type: 'number', value: value ?? '' });

    case 'date': {
      const text = value ? String(value).slice(0, 10) : '';
      return el('input', { ...common, type: 'date', value: text });
    }

    case 'select': {
      const select = el('select', common);
      select.append(el('option', { value: '' }, '(none)'));
      for (const [optionValue, label] of field.options) {
        select.append(el('option', { value: optionValue, selected: value === optionValue }, label));
      }
      return select;
    }

    case 'relation': {
      const select = el('select', common);
      select.append(el('option', { value: '' }, '(none)'));
      for (const slug of state.relations[field.collection] ?? []) {
        select.append(el('option', { value: slug, selected: value === slug }, slug));
      }
      return select;
    }

    case 'list': {
      const wrap = el('div', { className: 'list', dataset: { field: field.name } });
      const addRow = (text = '') => {
        const row = el('div', { className: 'list-row' });
        row.append(
          el('input', { type: 'text', value: text, className: 'list-item' }),
          el('button', { type: 'button', className: 'ghost', onclick: () => row.remove() }, 'Remove'),
        );
        wrap.insertBefore(row, wrap.lastElementChild);
      };
      wrap.append(el('button', { type: 'button', className: 'ghost', onclick: () => addRow() }, 'Add'));
      for (const item of Array.isArray(value) ? value : []) addRow(item);
      return wrap;
    }

    case 'object': {
      const group = el('fieldset', { className: 'object', dataset: { field: field.name } });
      group.append(el('legend', {}, field.label));
      for (const sub of field.fields) {
        group.append(
          el('label', { className: 'row' }, [
            el('span', {}, sub.label),
            el('input', {
              type: 'url',
              dataset: { sub: sub.name },
              value: (value ?? {})[sub.name] ?? '',
              placeholder: 'https://',
            }),
          ]),
        );
      }
      return group;
    }

    case 'image': {
      const wrap = el('div', { className: 'image-field', dataset: { field: field.name } });
      const current = el('input', { type: 'text', className: 'image-value', value: value ?? '', readOnly: true, placeholder: 'No image' });
      const picker = el('input', { type: 'file', accept: 'image/*' });
      picker.addEventListener('change', async () => {
        const file = picker.files?.[0];
        if (!file) return;
        status(`Uploading ${file.name}...`);
        try {
          const reference = await uploadImage(file);
          current.value = reference;
          status('Image uploaded.', 'ok');
        } catch (error) {
          status(error.message, 'bad');
        } finally {
          picker.value = '';
        }
      });
      wrap.append(current, picker,
        el('button', { type: 'button', className: 'ghost', onclick: () => { current.value = ''; } }, 'Clear'));
      return wrap;
    }

    case 'email':
      return el('input', { ...common, type: 'email', value: value ?? '' });

    case 'url':
      return el('input', { ...common, type: 'url', value: value ?? '', placeholder: 'https://' });

    default: {
      const input = el('input', { ...common, type: 'text', value: value ?? '' });
      if (field.pattern) input.pattern = field.pattern;
      return input;
    }
  }
}

async function uploadImage(file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  const { reference } = await api('/media', {
    method: 'POST',
    body: JSON.stringify({ collection: state.collection, filename: safeName, contentBase64: base64 }),
  });
  return reference;
}

/** Reads the form back into frontmatter data plus a body string. */
function collectForm(collection) {
  const data = {};
  let body = '';

  for (const field of collection.fields) {
    if (field.type === 'list') {
      const items = [...document.querySelectorAll(`[data-field="${field.name}"] .list-item`)]
        .map((input) => input.value.trim())
        .filter(Boolean);
      if (items.length) data[field.name] = items;
      continue;
    }
    if (field.type === 'object') {
      const values = {};
      for (const input of document.querySelectorAll(`[data-field="${field.name}"] [data-sub]`)) {
        if (input.value.trim()) values[input.dataset.sub] = input.value.trim();
      }
      if (Object.keys(values).length) data[field.name] = values;
      continue;
    }
    if (field.type === 'image') {
      const value = $(`[data-field="${field.name}"] .image-value`)?.value.trim();
      if (value) data[field.name] = value;
      continue;
    }

    const control = document.getElementById(`f-${field.name}`);
    if (!control) continue;

    if (field.name === 'body') {
      body = control.value;
      continue;
    }
    if (field.type === 'boolean') {
      if (control.checked) data[field.name] = true;
      continue;
    }
    if (field.type === 'number') {
      if (control.value !== '') data[field.name] = Number(control.value);
      continue;
    }
    if (control.value.trim()) data[field.name] = control.value.trim();
  }

  return { data, body };
}

// ------------------------------------------------------------------- views

async function showList(name) {
  state.collection = name;
  state.slug = null;
  state.sha = null;
  const collection = byName(name);

  for (const button of document.querySelectorAll('#nav button')) {
    button.setAttribute('aria-current', button.dataset.collection === name ? 'true' : 'false');
  }

  const main = $('#main');
  main.replaceChildren(
    el('div', { className: 'head' }, [
      el('h2', {}, collection.label),
      el('button', { className: 'primary', onclick: () => showForm(collection, null) }, `New ${collection.singular.toLowerCase()}`),
    ]),
    el('p', { className: 'muted' }, 'Loading...'),
  );

  try {
    const { entries } = await api(`/entries?collection=${name}`);
    const list = el('ul', { className: 'entries' });
    if (entries.length === 0) {
      list.append(el('li', { className: 'muted' }, `No ${collection.label.toLowerCase()} yet.`));
    }
    for (const entry of entries.sort((a, b) => a.slug.localeCompare(b.slug))) {
      list.append(
        el('li', {}, [
          el('button', { className: 'link', onclick: () => showForm(collection, entry) }, entry.slug),
          el('button', {
            className: 'ghost danger',
            onclick: () => removeEntry(collection, entry),
          }, 'Delete'),
        ]),
      );
    }
    main.lastElementChild.replaceWith(list);
  } catch (error) {
    main.lastElementChild.replaceWith(el('p', { className: 'status status-bad' }, error.message));
  }
}

async function showForm(collection, entry) {
  state.collection = collection.name;
  state.slug = entry?.slug ?? null;
  state.sha = entry?.sha ?? null;

  // A relation field needs the list of possible targets before it renders.
  for (const field of collection.fields) {
    if (field.type === 'relation' && !state.relations[field.collection]) {
      const { entries } = await api(`/entries?collection=${field.collection}`);
      state.relations[field.collection] = entries.map((e) => e.slug);
    }
  }

  let values = {};
  let body = '';
  if (entry) {
    status('Loading entry...');
    const loaded = await api(`/entry?collection=${collection.name}&slug=${entry.slug}`);
    values = loaded.data ?? {};
    body = loaded.body ?? '';
    state.sha = loaded.sha;
    status('');
  }

  const form = el('form', { id: 'entry-form', noValidate: false });
  for (const field of collection.fields) {
    const value = field.name === 'body' ? body : values[field.name];
    const control = fieldControl(field, value);
    if (field.required && 'required' in control) control.required = true;

    form.append(
      el('div', { className: `field field-${field.type}` }, [
        field.type === 'object'
          ? null
          : el('label', { htmlFor: `f-${field.name}` }, [
              field.label,
              field.required ? el('span', { className: 'req' }, ' (required)') : null,
            ]),
        control,
        field.hint ? el('p', { className: 'hint' }, field.hint) : null,
      ]),
    );
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await saveEntry(collection);
  });

  $('#main').replaceChildren(
    el('div', { className: 'head' }, [
      el('h2', {}, entry ? `Edit: ${entry.slug}` : `New ${collection.singular.toLowerCase()}`),
      el('button', { className: 'ghost', onclick: () => showList(collection.name) }, 'Back'),
    ]),
    form,
    el('div', { className: 'actions' }, [
      el('button', { className: 'primary', onclick: () => $('#entry-form').requestSubmit() }, 'Save'),
    ]),
  );
}

async function saveEntry(collection) {
  const { data, body } = collectForm(collection);

  for (const field of collection.fields.filter((f) => f.required)) {
    const present = field.name === 'body' ? body.trim() : data[field.name];
    if (!present || (Array.isArray(present) && present.length === 0)) {
      status(`${field.label} is required.`, 'bad');
      return;
    }
  }

  const slug = state.slug ?? buildSlug(collection, data);
  if (!slug) {
    status('Could not work out a filename from that. Check the title.', 'bad');
    return;
  }

  status('Saving...');
  try {
    const result = await api('/entry', {
      method: 'PUT',
      body: JSON.stringify({
        collection: collection.name,
        slug,
        data,
        body,
        ...(state.sha ? { sha: state.sha } : {}),
      }),
    });
    state.slug = result.slug;
    state.sha = result.sha;
    status('Saved. The site republishes in about a minute.', 'ok');
  } catch (error) {
    status(error.message, 'bad');
  }
}

async function removeEntry(collection, entry) {
  if (!confirm(`Delete ${entry.slug}? This cannot be undone from here.`)) return;
  status('Deleting...');
  try {
    await api(`/entry?collection=${collection.name}&slug=${entry.slug}&sha=${entry.sha}`, {
      method: 'DELETE',
    });
    status('Deleted.', 'ok');
    showList(collection.name);
  } catch (error) {
    status(error.message, 'bad');
  }
}

function startApp() {
  $('#login').hidden = true;
  $('#app').hidden = false;

  const nav = $('#nav');
  nav.replaceChildren(
    ...COLLECTIONS.map((collection) =>
      el('button', {
        dataset: { collection: collection.name },
        onclick: () => showList(collection.name),
      }, collection.label),
    ),
  );
  showList(COLLECTIONS[0].name);
}

// ------------------------------------------------------------------- start

$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const error = $('#login-error');
  error.textContent = '';

  if (!API_BASE) {
    error.textContent =
      'This page is not connected to its Worker yet. Set API_BASE in public/admin-page/config.js.';
    return;
  }

  const button = $('#login-button');
  button.disabled = true;
  try {
    const { token } = await api('/login', {
      method: 'POST',
      body: JSON.stringify({
        username: $('#login-user').value.trim(),
        password: $('#login-pass').value,
      }),
    });
    state.token = token;
    try {
      sessionStorage.setItem('admin-token', token);
    } catch {
      // Storage can be blocked; the session just will not survive a reload.
    }
    startApp();
  } catch (caught) {
    error.textContent =
      caught.message === 'setup' ? 'Worker address is not set.' : caught.message;
    $('#login-pass').value = '';
  } finally {
    button.disabled = false;
  }
});

$('#sign-out').addEventListener('click', () => signOut());

// Resume an existing session. Reads storage defensively so a blocked store
// cannot stop the login form above from working.
try {
  const saved = sessionStorage.getItem('admin-token');
  if (saved) {
    state.token = saved;
    startApp();
  }
} catch {
  // Nothing to resume.
}
