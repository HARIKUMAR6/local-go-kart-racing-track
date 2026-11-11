/* Contact enquiry hand-off (no backend). Runs after forms.js has validated the form:
   builds a mailto: message addressed to the configured business email and opens the visitor's email app.
   The page never claims the enquiry was delivered – the visitor completes sending in their own mail client. */
import { contact } from '../data/site.js';

export function initContactForm() {
  const form = document.querySelector('form[data-contact-form]');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');
  const select = form.querySelector('select[name="type"]');

  /* Deep links from the pricing page: /contact?type=sprint#enquiry pre-selects the enquiry type */
  const wanted = new URLSearchParams(location.search).get('type');
  if (wanted && select) {
    const opt = [...select.options].find((o) => o.dataset.key === wanted);
    if (opt) opt.selected = true;
  }

  form.addEventListener('form:valid', (e) => {
    const d = e.detail;
    const get = (k) => String(d.get(k) || '').trim();
    const type = get('type');
    const subject = `${type} – ${get('name')}`;
    const body = [
      `Name: ${get('name')}`,
      `Email: ${get('email')}`,
      `Phone: ${get('phone') || 'Not provided'}`,
      `Enquiry type: ${type}`,
      '',
      get('message'),
    ].join('\r\n');
    const href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (status) {
      status.hidden = false;
      status.innerHTML = '';
      const strong = document.createElement('strong');
      strong.textContent = 'One more step: send it from your email app.';
      const p = document.createElement('span');
      p.textContent = ` We've opened a message to ${contact.email} with your details filled in. Press send there to finish. Nothing is sent until you do.`;
      const a = document.createElement('a');
      a.href = href; a.className = 'underline underline-offset-4 font-bold'; a.textContent = 'Email app didn’t open? Try again.';
      status.append(strong, p, document.createElement('br'), a);
      status.focus();
    }
    window.location.href = href;
  });
}
