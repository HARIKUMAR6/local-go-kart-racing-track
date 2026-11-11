/* Declarative form validation.
   <form data-validate> … <div class="field"><input class="field-input" name="x" required>
   <p class="field-error" data-error></p></div>
   Emits `form:valid` (CustomEvent, detail = FormData) – the page decides what happens next. */
function messageFor(input) {
  const v = input.validity;
  if (v.valid) return '';
  if (input.dataset.error) return input.dataset.error;
  if (v.valueMissing) return input.dataset.errorRequired || 'This field is required.';
  if (v.typeMismatch && input.dataset.errorType) return input.dataset.errorType;
  if (v.patternMismatch && input.dataset.errorPattern) return input.dataset.errorPattern;
  if (v.typeMismatch) return input.type === 'email' ? 'Enter a valid email address.' : 'Please enter a valid value.';
  if (v.tooShort && input.dataset.errorShort) return input.dataset.errorShort;
  if (v.tooShort) return `Use at least ${input.minLength} characters.`;
  return 'Please match the requested format.';
}

function validateField(input) {
  const out = input.closest('.field')?.querySelector('[data-error]');
  const msg = messageFor(input);
  input.setAttribute('aria-invalid', String(Boolean(msg)));
  if (out) {
    out.textContent = msg;
    if (!out.id) out.id = `err-${input.name || input.id}`;
    input.setAttribute('aria-describedby', out.id);
  }
  return !msg;
}

export function initForms() {
  document.querySelectorAll('form[data-validate]').forEach((form) => {
    form.setAttribute('novalidate', '');
    form.addEventListener('focusout', (e) => { if (e.target.matches('.field-input')) validateField(e.target); });
    form.addEventListener('input', (e) => {
      if (e.target.matches('.field-input[aria-invalid="true"]')) validateField(e.target);
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const bad = [...form.querySelectorAll('.field-input')].filter((i) => !validateField(i));
      if (bad.length) { bad[0].focus(); return; }
      form.dispatchEvent(new CustomEvent('form:valid', { bubbles: true, detail: new FormData(form) }));
    });
  });
}
