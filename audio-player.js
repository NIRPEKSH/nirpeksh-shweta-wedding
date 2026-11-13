// Reuse the same gesture-activated media element for both phases on phones.
export class WeddingAudio {
  constructor(track, backgroundSrc, { onChange = () => {}, onError = () => {}, onComplete = () => {}, isVisible = () => true } = {}) {
    this.track = track;
    this.phase = 'chant';
    this.started = false;
    this.enabled = true;
    this.onChange = onChange;
    this.onError = onError;
    this.onComplete = onComplete;
    this.isVisible = isVisible;
    track.loop = false;
    track.volume = .72;
    for (const event of ['play', 'pause']) track.addEventListener(event, () => this.onChange());
    track.addEventListener('error', () => this.onError(this.phase));
    track.addEventListener('ended', () => {
      if (this.phase !== 'chant') return;
      // Move forward permanently. The completed shlokas are never replayed.
      this.phase = 'background';
      track.src = backgroundSrc;
      track.loop = true;
      track.volume = .55;
      track.load();
      this.onComplete();
      this.onChange();
      if (this.enabled && this.isVisible()) void this.play();
    });
  }
  get playing() { return !this.track.paused && !this.track.ended; }
  async play(withShankh = false) {
    this.enabled = true;
    if (this.phase === 'chant' && !this.started) {
      this.track.currentTime = withShankh ? 0 : 6.75;
      this.started = true;
    }
    try { await this.track.play(); }
    catch (error) { if (error.name !== 'AbortError') this.onError(this.phase); }
    this.onChange();
  }
  pause() { this.enabled = false; this.track.pause(); this.onChange(); }
}
