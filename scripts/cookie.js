// Тънък слой за съвместимост: ако този файл бъде включен отделно,
// той просто активира глобалния CookieConsent, дефиниран в layout.njk.
document.addEventListener('DOMContentLoaded', function() {
  if (!window.CookieConsent) return;

  // Ако няма запазени предпочитания, покажи банера.
  if (!localStorage.getItem('cookie-consent')) {
    window.CookieConsent.showPreferences();
  }
});
