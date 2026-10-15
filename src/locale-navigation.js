import { localePath } from './i18n.js';
import { getHomeLocale } from './home-i18n.js';
import { mountLanguagePicker } from './language-picker.js';
import './language-picker.css';

mountLanguagePicker(getHomeLocale());

// This small entry has no storage/database/GPU await. Its listener is installed
// before the main application's asynchronous universe initialization completes.
document.querySelector('#ui-language')?.addEventListener('change', (event) => {
  location.assign(localePath(event.target.value));
});
