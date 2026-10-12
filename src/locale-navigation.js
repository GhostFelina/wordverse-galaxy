import { localePath } from './i18n.js';

// This small entry has no storage/database/GPU await. Its listener is installed
// before the main application's asynchronous universe initialization completes.
document.querySelector('#ui-language')?.addEventListener('change', (event) => {
  location.assign(localePath(event.target.value));
});
