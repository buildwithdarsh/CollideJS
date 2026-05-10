import { Emitter } from '../events/events';
import type { Engine, Tickable } from '../engine/engine';
import { aabbFromRect, circleFromRect } from '../shapes/shape';
import type { Shape, ShapeKind, CollisionMetrics } from '../shapes/shape';
import { collide } from '../shapes/collide';
import type { Vec2 } from '../utils/vector';

export interface PairOptions {
  /** Fire 'near' event when distance drops to ≤ this many px. Default 60. */
  near?: number;
  /** Shape primitive to use. Default 'aabb'. */
  shape?: ShapeKind;
  /** Track velocity to estimate time-to-collision. Default true. */
  trackVelocity?: boolean;
}

export interface PairMetrics extends CollisionMetrics {
  /** Velocity of B relative to A, in px/second. Only if trackVelocity. */
  velocity: Vec2;
  /** Time-to-collision in seconds (positive = approaching). */
  ttc: number | null;
  /** Relative closing speed in px/sec (positive = approaching). */
  closingSpeed: number;
}

export class Pair {
  private _ev = new Emitter();
  private _stop: () => void;
  private _lastRelPos: Vec2 | null = null;
  private _lastDist: number | null = null;
  private _wasColliding = false;
  private _wasNear = false;

  constructor(
    private _a: Element,
    private _b: Element,
    private _opts: Required<PairOptions>,
    engine: Engine,
  ) {
    const tick: Tickable = (dt) => this._tick(dt);
    this._stop = engine.add(tick);
  }

  on(event: 'near' | 'collide' | 'separate' | 'leave' | 'tick', fn: (metrics: PairMetrics) => void): () => void {
    return this._ev.on(event, fn);
  }

  off(event: string, fn?: (...args: any[]) => void): void {
    this._ev.off(event, fn);
  }

  /** Snapshot the current collision state without waiting for a tick. */
  metrics(): PairMetrics {
    return this._compute(0);
  }

  destroy(): void {
    this._stop();
    this._ev.off('near');
    this._ev.off('collide');
    this._ev.off('separate');
    this._ev.off('leave');
    this._ev.off('tick');
  }

  private _tick(dt: number): void {
    const m = this._compute(dt);
    this._ev.emit('tick', m);

    if (m.colliding && !this._wasColliding) this._ev.emit('collide', m);
    if (!m.colliding && this._wasColliding) this._ev.emit('separate', m);
    this._wasColliding = m.colliding;

    const near = !m.colliding && m.distance <= this._opts.near;
    if (near && !this._wasNear) this._ev.emit('near', m);
    if (!near && this._wasNear && !m.colliding) this._ev.emit('leave', m);
    this._wasNear = near;
  }

  private _compute(dt: number): PairMetrics {
    const rectA = this._a.getBoundingClientRect();
    const rectB = this._b.getBoundingClientRect();
    const a: Shape = this._opts.shape === 'circle' ? circleFromRect(rectA) : aabbFromRect(rectA);
    const b: Shape = this._opts.shape === 'circle' ? circleFromRect(rectB) : aabbFromRect(rectB);
    const base = collide(a, b);

    let velocity: Vec2 = { x: 0, y: 0 };
    let closingSpeed = 0;
    let ttc: number | null = null;

    if (this._opts.trackVelocity && dt > 0) {
      const rel = { x: base.centerB.x - base.centerA.x, y: base.centerB.y - base.centerA.y };
      if (this._lastRelPos) {
        const dtSec = dt / 1000;
        velocity = {
          x: (rel.x - this._lastRelPos.x) / dtSec,
          y: (rel.y - this._lastRelPos.y) / dtSec,
        };
        // Closing speed: component of velocity along the A→B axis, negated
        // (if B is moving toward A, the unit vector from A to B is fixed but
        // the relative distance is shrinking — velocity along direction is negative)
        const velAlong = velocity.x * base.direction.x + velocity.y * base.direction.y;
        closingSpeed = -velAlong;
        if (closingSpeed > 0 && this._lastDist !== null && base.distance > 0) {
          ttc = base.distance / closingSpeed;
        }
      }
      this._lastRelPos = rel;
      this._lastDist = base.distance;
    }

    return { ...base, velocity, closingSpeed, ttc };
  }
}
