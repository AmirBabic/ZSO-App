function updateOnlineState() {
  const isOnline = navigator.onLine;
  const banner = document.querySelector('[data-offline-banner]');

  document.documentElement.classList.toggle('is-offline', !isOnline);
  if (banner) {
    banner.hidden = isOnline;
  }

  for (const link of document.querySelectorAll('[data-online-only]')) {
    link.setAttribute('aria-disabled', String(!isOnline));
  }
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-online-only]');
  if (!link || navigator.onLine) {
    return;
  }

  event.preventDefault();
  window.alert('Diese Funktion ist nur mit einer Internetverbindung verfügbar.');
});

window.addEventListener('online', updateOnlineState);
window.addEventListener('offline', updateOnlineState);
updateOnlineState();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.error('Service Worker konnte nicht registriert werden.', error);
    });
  });
}
