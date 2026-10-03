import { translate, localePath } from './i18n.js';
import { authErrorKey, getSupabaseClient } from './supabase-client.js';
import { legalPath } from './legal-page.js';
import './auth.css';

export function mountAuthUI({ locale, beforeOpen = () => {}, onSession = () => {}, onSync = null, onProfile = null }) {
  const t = (key) => translate(locale, `auth.${key}`);
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const button = (text, action, className = 'auth-link') => {
    const node = element('button', className, text);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  };
  let mode = 'signin';
  let session = null;
  let client = null;
  let busy = false;
  let recovery = false;
  const trigger = button(t('open'), () => open(), 'account-trigger');
  trigger.id = 'open-account';
  document.querySelector('.top-actions').prepend(trigger);
  const dialog = element('dialog', 'auth-dialog');
  dialog.id = 'account-dialog';
  dialog.setAttribute('aria-labelledby', 'auth-title');
  const close = button('×', () => dialog.close(), 'auth-close');
  close.setAttribute('aria-label', t('close'));
  const kicker = element('p', 'auth-kicker', t('kicker'));
  const title = element('h2');
  title.id = 'auth-title';
  const description = element('p', 'auth-description', t('guestNote'));
  const status = element('p', 'auth-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const content = element('div', 'auth-content');
  const legal = element('nav', 'auth-legal');
  for (const kind of ['privacy', 'terms']) {
    const link = element('a', '', translate(locale, `legal.${kind}`));
    link.href = legalPath(locale, kind);
    link.target = '_blank';
    link.rel = 'noopener';
    legal.append(link);
  }
  dialog.append(close, kicker, title, description, content, status, legal);
  document.body.append(dialog);

  function render() {
    content.replaceChildren();
    status.textContent = '';
    if (onProfile && !recovery)
      content.append(
        button(
          translate(locale, 'profile.open'),
          () => {
            dialog.close();
            onProfile();
          },
          'auth-submit',
        ),
      );
    const signedIn = session && !recovery;
    title.textContent = t(signedIn ? 'accountTitle' : mode);
    description.textContent = t(signedIn ? 'syncPending' : 'guestNote');
    if (signedIn) {
      content.append(element('p', 'auth-email', session.user.email || ''));
      if (onSync)
        content.append(
          button(
            t('syncOpen'),
            () => {
              dialog.close();
              onSync();
            },
            'auth-submit',
          ),
        );
      content.append(
        button(
          t('signout'),
          () =>
            run(async () => {
              const { error } = await client.auth.signOut({ scope: 'local' });
              if (error) throw error;
              session = null;
              mode = 'signin';
              render();
              status.textContent = t('signedOut');
            }),
          'auth-submit',
        ),
      );
      content.append(button(t('backToUniverse'), () => dialog.close()));
      return;
    }
    const form = element('form', 'auth-form');
    const field = (name, type, label, autocomplete) => {
      const wrapper = element('label', 'auth-field', label);
      const input = element('input');
      input.name = name;
      input.type = type;
      input.required = true;
      input.autocomplete = autocomplete;
      if (type === 'password') input.minLength = mode === 'signin' ? 1 : 8;
      wrapper.append(input);
      form.append(wrapper);
      return input;
    };
    if (mode !== 'update') field('email', 'email', t('email'), 'email');
    if (mode !== 'reset')
      field(
        'password',
        'password',
        t(mode === 'update' ? 'newPassword' : 'password'),
        mode === 'signin' ? 'current-password' : 'new-password',
      );
    if (mode === 'signup' || mode === 'update') form.append(element('small', 'auth-hint', t('passwordHint')));
    const submit = element('button', 'auth-submit', t(mode));
    submit.type = 'submit';
    form.append(submit);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      run(async () => {
        const email = String(data.get('email') || '').trim();
        const password = String(data.get('password') || '');
        const redirectTo = new URL(`${localePath(locale)}?auth=callback`, location.origin).href;
        let result;
        if (mode === 'signin') result = await client.auth.signInWithPassword({ email, password });
        else if (mode === 'signup')
          result = await client.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: redirectTo, data: { ui_locale: locale } },
          });
        else if (mode === 'reset') result = await client.auth.resetPasswordForEmail(email, { redirectTo });
        else result = await client.auth.updateUser({ password });
        if (result.error) throw result.error;
        form.reset();
        if (mode === 'update') {
          recovery = false;
          render();
          status.textContent = t('passwordUpdated');
        } else {
          const successKey = mode === 'signup' ? 'checkEmail' : mode === 'reset' ? 'resetSent' : 'signedIn';
          if (result.data?.session) {
            session = result.data.session;
            render();
          }
          status.textContent = t(successKey);
        }
      });
    });
    content.append(form);
    if (mode === 'signin') {
      content.append(button(t('forgot'), () => setMode('reset')));
      content.append(button(t('signup'), () => setMode('signup')));
      const google = button(
        t('google'),
        () =>
          run(async () => {
            if (import.meta.env.VITE_GOOGLE_AUTH_ENABLED !== 'true') {
              status.textContent = t('googlePending');
              return;
            }
            const { error } = await client.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: new URL(`${localePath(locale)}?auth=callback`, location.origin).href },
            });
            if (error) throw error;
          }),
        'auth-google',
      );
      content.append(google);
    } else if (mode !== 'update') content.append(button(t('back'), () => setMode('signin')));
    content.append(button(t('guest'), () => dialog.close()));
  }

  function setMode(next) {
    if (busy) return;
    mode = next;
    render();
    content.querySelector('input')?.focus();
  }
  async function run(action) {
    if (busy) return;
    busy = true;
    status.textContent = t('pending');
    dialog.setAttribute('aria-busy', 'true');
    content.querySelectorAll('button').forEach((node) => {
      node.disabled = true;
    });
    try {
      client ||= await getSupabaseClient();
      if (!client) status.textContent = t('noConfig');
      else await action();
    } catch (error) {
      status.textContent = t(authErrorKey(error));
    } finally {
      busy = false;
      dialog.removeAttribute('aria-busy');
      content.querySelectorAll('button').forEach((node) => {
        node.disabled = false;
      });
    }
  }
  function open() {
    beforeOpen();
    render();
    dialog.showModal();
    content.querySelector('input')?.focus();
  }
  dialog.addEventListener('close', () => {
    dialog.querySelectorAll('input[type=password]').forEach((input) => {
      input.value = '';
    });
  });
  // Keep the auth callback synchronous to avoid Supabase's auth lock deadlock.
  getSupabaseClient()
    .then((connection) => {
      client = connection;
      client?.auth.onAuthStateChange((event, nextSession) => {
        const accountChanged = session?.user?.id !== nextSession?.user?.id;
        session = nextSession;
        trigger.textContent = t(session ? 'accountTitle' : 'open');
        if (event === 'PASSWORD_RECOVERY') {
          recovery = true;
          mode = 'update';
          open();
        } else if (accountChanged && dialog.open && !busy) render();
        setTimeout(() => onSession(nextSession, event), 0);
      });
    })
    .catch(() => {
      status.textContent = t('network');
    });
  return { open, dialog };
}
