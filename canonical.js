// Keep earlier invitation links working after the move to the public address.
(() => {
  const home = new URL('https://nirpeksh.github.io/nirpeksh-shweta-wedding/');
  if (['localhost', '127.0.0.1'].includes(location.hostname) || location.origin === home.origin) return;
  const page = location.pathname.split('/').filter(Boolean).pop() || '';
  const files = { personalize: 'personalize.html', 'personalize.html': 'personalize.html', 'audio-credits': 'audio-credits.html', 'audio-credits.html': 'audio-credits.html' };
  const destination = new URL(files[page] || './', home);
  destination.search = location.search;
  destination.hash = location.hash;
  location.replace(destination.href);
})();
