/* Runs synchronously in <head> (external file, no inline JS) to apply saved
   theme + direction before first paint and prevent a flash. */
(function () {
  var root = document.documentElement;
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var theme = get('apex:theme');
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  var dir = get('apex:dir') === 'rtl' ? 'rtl' : 'ltr';
  root.setAttribute('data-theme', theme);
  root.setAttribute('dir', dir);
  root.classList.add('js');
})();
