export type Tickable = (dt: number, now: number) => void;

/**
 * Shared RAF loop. All observers register into a single loop so we batch
 * `getBoundingClientRect` reads per frame and never trigger layout thrash.
 */
export class Engine {
  private _cbs = new Set<Tickable>();
  private _rafId = 0;
  private _last = 0;
  private _running = false;

  add(cb: Tickable): () => void {
    this._cbs.add(cb);
    this._start();
    return () => this.remove(cb);
  }

  remove(cb: Tickable): void {
    this._cbs.delete(cb);
    if (this._cbs.size === 0) this._stop();
  }

  private _start(): void {
    if (this._running) return;
    this._running = true;
    this._last = performance.now();
    this._rafId = requestAnimationFrame(this._tick);
  }

  private _stop(): void {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  private _tick = (now: number): void => {
    if (!this._running) return;
    const dt = now - this._last;
    this._last = now;
    for (const cb of this._cbs) cb(dt, now);
    this._rafId = requestAnimationFrame(this._tick);
  };
}
