import { weddingCountdown } from './countdown.js';
import { readGuestToken } from './invite-token.js';
(() => {
  'use strict';
  const config = window.WEDDING;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  function updateDays() {
    const countdown = weddingCountdown(config.date);
    $('#days').textContent = countdown.value;
    $('#countdown-label').textContent = countdown.label;
  }
  updateDays();
  setInterval(updateDays, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateDays(); });
  $$('[data-venue-name]').forEach(el => { el.textContent = config.venue || 'Venue name to be added'; });
  $$('[data-venue-short]').forEach(el => { el.textContent = `${config.venue || 'Venue to be confirmed'} · ${config.city || ''}`; });
  $$('[data-venue-address]').forEach(el => { el.textContent = config.address || 'Address to be added'; });
  $$('[data-map]').forEach(el => { el.href = config.mapsUrl; });
  $('[data-time="ghurchari"]').textContent = config.ghurchariTime;
  $('[data-time="baraat"]').textContent = config.baraatDepartureTime;
  $('[data-wedding-muhurat]').textContent = config.weddingTime ? `Wedding ceremony: ${config.weddingTime} (muhurat).` : config.muhuratNote;

  async function loadGuest() {
    const hash = new URLSearchParams(location.hash.slice(1));
    if (!hash.has('invite')) {
      $$('[data-guest]').forEach(el => { el.textContent = 'To our dear family & friends'; });
      $('#guest-status').hidden = true;
      return;
    }
    const token = hash.get('invite');
    $$('[data-guest]').forEach(el => { el.textContent = 'To our dear family & friends'; });
    try {
      let greeting;
      if (/^p[12]_/.test(token)) greeting = await readGuestToken(token);
      else {
        // Keep earlier random-token invitations working.
        if (!/^[A-Za-z0-9_-]{32}$/.test(token)) throw new Error('Invalid link');
        const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
        const digest = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
        const response = await fetch(`guests/${digest}.json`, { cache: 'no-store', referrerPolicy: 'no-referrer' });
        if (!response.ok) throw new Error('Unknown link');
        const guest = await response.json();
        if (typeof guest.greeting !== 'string' || !guest.greeting.trim() || guest.greeting.length > 160) throw new Error('Invalid greeting');
        greeting = guest.greeting;
      }
      $$('[data-guest]').forEach(el => { el.textContent = greeting; });
      $('#guest-status').hidden = true;
    } catch (_) {
      const status = $('#guest-status');
      status.hidden = false;
      status.textContent = 'This personal link could not be loaded. Our general invitation is here for you; please ask the family for a fresh link.';
    }
  }
  void loadGuest();
  window.addEventListener('hashchange', () => { if (new URLSearchParams(location.hash.slice(1)).has('invite')) void loadGuest(); });

  const escapeICS = value => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  $('#calendar').addEventListener('click', () => {
    const date = config.date.replace(/-/g, '');
    const end = new Date(`${config.date}T00:00:00Z`); end.setUTCDate(end.getUTCDate() + 1);
    const endDate = end.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nirpeksh and Shweta//Wedding Invitation//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:nirpeksh-shweta-${date}@wedding.local`, `DTSTAMP:${timestamp}`, `DTSTART;VALUE=DATE:${date}`, `DTEND;VALUE=DATE:${endDate}`, 'SUMMARY:Nirpeksh & Shweta - Wedding Celebration', `LOCATION:${escapeICS(`${config.venue}, ${config.address}`)}`, `DESCRIPTION:${escapeICS(`All times in India Standard Time.\nGhurchari: ${config.ghurchariTime}.\nDeparture of Baraat: ${config.baraatDepartureTime}.\n${config.weddingTime ? `Wedding ceremony: ${config.weddingTime} (muhurat).` : config.muhuratNote}\nFood and refreshments will be served at the same venue.\nWedding celebration venue: ${config.venue}, ${config.address}.\nDirections: ${config.mapsUrl}`)}`, 'STATUS:CONFIRMED', 'TRANSP:TRANSPARENT', 'END:VEVENT', 'END:VCALENDAR'];
    // RFC 5545 folding at 70 Unicode code points; content here is English ASCII.
    const folded = lines.map(line => line.match(/.{1,70}/gu).join('\r\n ')).join('\r\n') + '\r\n';
    const blob = new Blob([folded], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'Nirpeksh-and-Shweta-25-Jan-2027.ics'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });

  $('#copy-address').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(`${config.venue}, ${config.address}`); $('#copy-status').textContent = 'Address copied. See you there!'; }
    catch (_) { $('#copy-status').textContent = `${config.venue}, ${config.address}`; }
  });
  $('#share').addEventListener('click', async () => {
    // Share the public invitation. Personal tokens are deliberately excluded.
    const url = new URL(location.href); url.hash = ''; url.search = '';
    const data = { title: 'Nirpeksh & Shweta · You’re invited', text: 'Join us for our wedding celebration on 25 January 2027.', url: url.href };
    try {
      if (navigator.share) { await navigator.share(data); $('#share-status').textContent = 'Thank you for sharing our joy.'; }
      else { await navigator.clipboard.writeText(url.href); $('#share-status').textContent = 'Invitation link copied.'; }
    } catch (error) { if (error.name !== 'AbortError') $('#share-status').textContent = `Share this link: ${url.href}`; }
  });
})();
