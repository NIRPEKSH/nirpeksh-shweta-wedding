import { WeddingAudio } from './audio-player.js';
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => document.querySelectorAll(selector);
  const opening = $('#opening');
  const blessing = $('#blessing');
  const site = $('#site');
  const music = $('#music');
  const effects = $('#reveal-effects');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let state = 'cover';
  let coverSound = true;
  let transitionTimer;
  site.inert = true;
  document.body.classList.add('gated');
  opening.focus({ preventScroll: true });

  // One prepared file guarantees shankh first, then spoken blessings.
  // The complete shankh + recitation is followed by a separate, voice-free track.
  const CHANT_START = 6.75;
  const meanings = [
    ['A prayer for an auspicious beginning.', 'मंगलमय जीवन की प्रार्थना'],
    ['May Hari, with Lakshmi, bless this new beginning.', 'श्री हरि और लक्ष्मी की मंगलकामना'],
    ['May the divine bring auspiciousness to every day.', 'हर दिन मंगलमय हो'],
    ['May this new beginning be filled with harmony.', 'यह नया आरम्भ प्रेम और सद्भाव से परिपूर्ण हो']
  ];
  let shownMeaning = -1;
  function updateMeaning() {
    const index = player.phase === 'background' ? 3 : music.currentTime < CHANT_START ? 0 : music.currentTime < 31.816 ? 1 : 2;
    if (index === shownMeaning) return;
    shownMeaning = index;
    $('#blessing-meaning').textContent = meanings[index][0];
    $('#blessing-meaning-hindi').textContent = meanings[index][1];
  }
  music.addEventListener('timeupdate', updateMeaning);
  const player = new WeddingAudio(music, 'assets/calm-background.m4a', {
    onChange: updateMusic,
    onComplete: updateMeaning,
    isVisible: () => !document.hidden,
    onError: phase => { $('#music-status').textContent = phase === 'chant' ? 'Tap Play audio to begin the blessings. You can still enjoy the invitation.' : 'Tap Play music to resume the quiet background music.'; updateMusic(); }
  });
  updateMeaning();
  function updateMusic() {
    const playing = player.playing;
    document.body.classList.toggle('playing', playing);
    $$('[data-music]').forEach(button => button.setAttribute('aria-pressed', String(state === 'cover' ? coverSound : playing)));
    $$('[data-music-label]').forEach(label => { label.textContent = state === 'cover' ? (coverSound ? 'Sound on' : 'Sound off') : (playing ? 'Pause audio' : player.phase === 'background' ? 'Play music' : 'Play audio'); });
    if (playing) $('#music-status').textContent = '';
  }
  $$('[data-music]').forEach(button => button.addEventListener('click', () => {
    if (state === 'cover') { coverSound = !coverSound; updateMusic(); return; }
    if (player.playing) player.pause();
    else void player.play();
  }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) player.pause(); });

  function showerPetals() {
    if (reducedMotion.matches) return;
    effects.replaceChildren();
    const rect = $('#shankh-open .shankh-symbol').getBoundingClientRect();
    effects.style.setProperty('--bell-x', `${rect.left + rect.width / 2}px`);
    effects.style.setProperty('--bell-y', `${rect.top + rect.height / 2}px`);
    for (let i = 0; i < 3; i++) {
      const ripple = document.createElement('span');
      ripple.className = 'blessing-ripple'; ripple.style.setProperty('--delay', `${i * 0.19}s`);
      effects.append(ripple);
    }
    for (let i = 0; i < 32; i++) {
      const petal = document.createElement('span');
      petal.className = `blessing-petal petal-${i % 4}`;
      petal.style.setProperty('--x', `${(i * 31 + 7) % 100}vw`);
      petal.style.setProperty('--drift', `${(i % 2 ? 1 : -1) * (25 + i % 6 * 17)}px`);
      petal.style.setProperty('--delay', `${i % 9 * 0.13}s`);
      petal.style.setProperty('--duration', `${3.1 + i % 7 * 0.18}s`);
      petal.style.setProperty('--spin', `${120 + i * 37}deg`);
      effects.append(petal);
    }
    effects.classList.add('active');
    setTimeout(() => { effects.classList.remove('active'); effects.replaceChildren(); }, 6000);
  }

  function showBlessing(withMusic) {
    if (state !== 'cover') return;
    state = 'revealing';
    if (withMusic) { if (coverSound) void player.play(true); }
    else { coverSound = false; player.pause(); }
    $('#shankh-open').classList.add('ringing');
    opening.classList.add('is-ringing');
    showerPetals();
    transitionTimer = setTimeout(() => {
      if (state !== 'revealing') return;
      state = 'blessing';
      blessing.hidden = false;
      blessing.classList.add('is-visible');
      opening.inert = true;
      opening.classList.add('dismissed');
      blessing.focus({ preventScroll: true });
      updateMusic();
      setTimeout(() => { opening.hidden = true; }, reducedMotion.matches ? 0 : 700);
    }, reducedMotion.matches ? 0 : 1050);
  }

  function showInvitation() {
    if (state === 'invitation') return;
    clearTimeout(transitionTimer);
    state = 'invitation';
    updateMusic();
    opening.hidden = true; opening.inert = true;
    blessing.classList.add('dismissed'); blessing.inert = true;
    effects.classList.remove('active');
    site.inert = false;
    document.body.classList.remove('gated');
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('#invitation').focus({ preventScroll: true });
    setTimeout(() => { blessing.hidden = true; }, reducedMotion.matches ? 0 : 700);
  }
  $('#shankh-open').addEventListener('click', () => showBlessing(true));
  $('#quiet').addEventListener('click', () => showBlessing(false));
  $('#continue-invitation').addEventListener('click', showInvitation);
  document.querySelector('.skip-link').addEventListener('click', showInvitation);

  // A single active modal at each stage; no keyboard access to the obscured page.
  function trapFocus(dialog, onEscape) {
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); onEscape(); return; }
      if (event.key !== 'Tab') return;
      const buttons = [...dialog.querySelectorAll('button:not(:disabled), summary, a[href], [tabindex="0"]')].filter(button => button.getClientRects().length && !button.closest('[inert]'));
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    });
  }
  trapFocus(opening, () => { player.pause(); showInvitation(); });
  trapFocus(blessing, showInvitation);
  // Sound is enabled by default. The shankh tap starts the sequence from
  // the guest gesture, never a timer or a browser autoplay workaround.
  updateMusic();
})();
