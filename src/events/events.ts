type Listener = (...args: any[]) => void;

export class Emitter {
  private _map = new Map<string, Set<Listener>>();

  on(event: string, fn: Listener): () => void {
    let set = this._map.get(event);
    if (!set) { set = new Set(); this._map.set(event, set); }
    set.add(fn);
    return () => this.off(event, fn);
  }

  off(event: string, fn?: Listener): void {
    if (!fn) { this._map.delete(event); return; }
    this._map.get(event)?.delete(fn);
  }

  emit(event: string, ...args: any[]): void {
    const set = this._map.get(event);
    if (!set) return;
    for (const fn of set) {
      try { fn(...args); } catch (e) { console.error('[CollideJS]', e); }
    }
  }
}
