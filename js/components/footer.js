import { brand, nav, experiences, contact, social } from '../data/site.js';
import { icon } from './icons.js';
import { logo } from './logo.js';

const link = (i) => `<li><a class="footer-link" href="${i.href}">${i.label}</a></li>`;
const info = (name, body) => `<li class="footer-info"><span class="footer-info-icon">${icon(name, 'size-5')}</span><span>${body}</span></li>`;

export function renderFooter() {
  const quick = [...nav.home.children, ...nav.links];
  const socials = social
    .map((s) => `<li>${s.href
      ? `<a class="social-link" href="${s.href}" target="_blank" rel="noopener noreferrer" aria-label="${s.name} (opens in a new tab)">${icon(s.icon, 'size-5')}</a>`
      : `<span class="social-link" role="img" aria-label="${s.name}">${icon(s.icon, 'size-5')}</span>`}</li>`).join('');
  const hours = contact.hours.map((h) => `<span class="block">${h.days}: <strong class="font-bold text-text">${h.time}</strong></span>`).join('');

  return `<footer class="site-footer">
  <div class="h-2 bg-checker" aria-hidden="true"></div>
  <div class="container-wide footer-grid">
    <div class="footer-brand">
      ${logo()}
      <p class="footer-tagline">${brand.tagline}</p>
      <p class="footer-blurb">${brand.blurb}</p>
      <ul class="flex gap-2" aria-label="Social media">${socials}</ul>
    </div>
    <nav aria-label="Footer quick navigation">
      <h2 class="footer-title">Quick Links</h2>
      <ul>${quick.map(link).join('')}</ul>
    </nav>
    <nav aria-label="Racing experiences">
      <h2 class="footer-title">Racing Experiences</h2>
      <ul>${experiences.map(link).join('')}</ul>
    </nav>
    <div>
      <h2 class="footer-title">Visit the Paddock</h2>
      <ul class="footer-info-list">
        ${info('map-pin', `<address class="not-italic">${contact.addressLines.join('<br>')}</address>`)}
        ${info('phone', `<a class="footer-link-inline" dir="ltr" href="${contact.phoneHref}">${contact.phone}</a>`)}
        ${info('mail', `<a class="footer-link-inline" dir="ltr" href="mailto:${contact.email}">${contact.email}</a>`)}
        ${info('clock', hours)}
      </ul>
    </div>
  </div>
  <div class="border-t border-line">
    <p class="container-wide footer-copy">© ${new Date().getFullYear()} ${brand.fullName}. All rights reserved.</p>
  </div>
</footer>`;
}
