import { Emitter } from '../events/events';
import type { Engine, Tickable } from '../engine/engine';
import { aabbFromRect, circleFromRect } from '../shapes/shape';
import type { Shape, ShapeKind } from '../shapes/shape';
import { collide } from '../shapes/collide';
import type { CollisionMetrics } from '../shapes/shape';

export interface GroupOptions {
  near?: number;
  shape?: ShapeKind;
}

type State = { near: boolean; collide: boolean };

/**
 * One-to-many observer — watch a single `source` element against a set of
 * `targets`. Emits per-target events with metrics.
 */
export class Group {
  private _ev = new Emitter();
  private _stop: () => void;
  private _state = new Map<Element, State>();

  constructor(
    private _source: Element,
    private _targets: Element[],
    private _opts: Required<GroupOptions>,
    engine: Engine,
  ) {
    for (const t of _targets) this._state.set(t, { near: false, collide: false });
    const tick: Tickable = () => this._tick();
    this._stop = engine.add(tick);
  }

  on(
    event: 'near' | 'collide' | 'separate' | 'leave' | 'tick',
    fn: (target: Element, metrics: CollisionMetrics) => void,
  ): () => void {
    return this._ev.on(event, fn);
  }

  /** Get closest target and its metrics. */
  closest(): { target: Element; metrics: CollisionMetrics } | null {
    let best: { target: Element; metrics: CollisionMetrics } | null = null;
    const sourceShape = this._shapeOf(this._source);
    for (const t of this._targets) {
      const m = collide(sourceShape, this._shapeOf(t));
      if (!best || m.distance < best.metrics.distance) best = { target: t, metrics: m };
    }
    return best;
  }

  destroy(): void {
    this._stop();
    this._ev.off('near');
    this._ev.off('collide');
    this._ev.off('separate');
    this._ev.off('leave');
    this._ev.off('tick');
  }

  private _shapeOf(el: Element): Shape {
    const r = el.getBoundingClientRect();
    return this._opts.shape === 'circle' ? circleFromRect(r) : aabbFromRect(r);
  }

  private _tick(): void {
    const src = this._shapeOf(this._source);
    for (const t of this._targets) {
      const m = collide(src, this._shapeOf(t));
      const state = this._state.get(t);
      if (!state) continue;

      this._ev.emit('tick', t, m);

      if (m.colliding && !state.collide) this._ev.emit('collide', t, m);
      if (!m.colliding && state.collide) this._ev.emit('separate', t, m);
      state.collide = m.colliding;

      const near = !m.colliding && m.distance <= this._opts.near;
      if (near && !state.near) this._ev.emit('near', t, m);
      if (!near && state.near && !m.colliding) this._ev.emit('leave', t, m);
      state.near = near;
    }
  }
}
