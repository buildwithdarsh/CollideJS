import { Emitter } from '../events/events';
import type { Engine, Tickable } from '../engine/engine';
import { aabbFromRect, circleFromRect } from '../shapes/shape';
import type { Shape, ShapeKind } from '../shapes/shape';
import { collide } from '../shapes/collide';
import type { CollisionMetrics } from '../shapes/shape';

export interface AllOptions {
  near?: number;
  shape?: ShapeKind;
}

/**
 * Many-to-many observer — every element is tested against every other.
 * O(n²) per frame. Fine up to a few hundred pairs; use spatial hashing
 * for larger sets (future work).
 */
export class All {
  private _ev = new Emitter();
  private _stop: () => void;
  private _pairState = new Map<string, { near: boolean; collide: boolean }>();

  constructor(
    private _els: Element[],
    private _opts: Required<AllOptions>,
    engine: Engine,
  ) {
    const tick: Tickable = () => this._tick();
    this._stop = engine.add(tick);
  }

  on(
    event: 'near' | 'collide' | 'separate' | 'leave',
    fn: (a: Element, b: Element, metrics: CollisionMetrics) => void,
  ): () => void {
    return this._ev.on(event, fn);
  }

  destroy(): void {
    this._stop();
    this._ev.off('near');
    this._ev.off('collide');
    this._ev.off('separate');
    this._ev.off('leave');
  }

  private _shapeOf(el: Element): Shape {
    const r = el.getBoundingClientRect();
    return this._opts.shape === 'circle' ? circleFromRect(r) : aabbFromRect(r);
  }

  private _tick(): void {
    const shapes: Shape[] = this._els.map((el) => this._shapeOf(el));
    for (let i = 0; i < this._els.length; i++) {
      for (let j = i + 1; j < this._els.length; j++) {
        const a = this._els[i]!;
        const b = this._els[j]!;
        const shapeA = shapes[i]!;
        const shapeB = shapes[j]!;
        const m = collide(shapeA, shapeB);
        const key = i + ':' + j;
        let state = this._pairState.get(key);
        if (!state) { state = { near: false, collide: false }; this._pairState.set(key, state); }

        if (m.colliding && !state.collide) this._ev.emit('collide', a, b, m);
        if (!m.colliding && state.collide) this._ev.emit('separate', a, b, m);
        state.collide = m.colliding;

        const near = !m.colliding && m.distance <= this._opts.near;
        if (near && !state.near) this._ev.emit('near', a, b, m);
        if (!near && state.near && !m.colliding) this._ev.emit('leave', a, b, m);
        state.near = near;
      }
    }
  }
}
