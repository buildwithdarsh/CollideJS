import { Engine } from './engine/engine';
import { Pair } from './observer/pair';
import type { PairOptions } from './observer/pair';
import { Group } from './observer/group';
import type { GroupOptions } from './observer/group';
import { All } from './observer/all';
import type { AllOptions } from './observer/all';
import { aabbFromRect, circleFromRect } from './shapes/shape';
import { collide as collideShapes } from './shapes/collide';
import type { Shape, ShapeKind, CollisionMetrics } from './shapes/shape';

const DEFAULT_PAIR: Required<PairOptions> = {
  near: 60,
  shape: 'aabb',
  trackVelocity: true,
};

const DEFAULT_GROUP: Required<GroupOptions> = {
  near: 60,
  shape: 'aabb',
};

class Collide {
  private _engine = new Engine();

  /** Watch two elements. Returns a Pair observer. */
  watch(a: Element, b: Element, opts?: PairOptions): Pair {
    return new Pair(a, b, { ...DEFAULT_PAIR, ...opts }, this._engine);
  }

  /** Watch one source element against many targets. */
  group(source: Element, targets: Element[] | NodeListOf<Element>, opts?: GroupOptions): Group {
    const arr = Array.from(targets);
    return new Group(source, arr, { ...DEFAULT_GROUP, ...opts }, this._engine);
  }

  /** Watch every pair within a set of elements. */
  all(elements: Element[] | NodeListOf<Element>, opts?: AllOptions): All {
    const arr = Array.from(elements);
    return new All(arr, { ...DEFAULT_GROUP, ...opts }, this._engine);
  }

  /**
   * One-shot collision check between two elements. Useful for discrete
   * hit-tests (click landed on target?). No observer, no RAF.
   */
  check(a: Element, b: Element, opts?: { shape?: ShapeKind }): CollisionMetrics {
    const shape: ShapeKind = opts?.shape ?? 'aabb';
    const rA = a.getBoundingClientRect();
    const rB = b.getBoundingClientRect();
    const sA: Shape = shape === 'circle' ? circleFromRect(rA) : aabbFromRect(rA);
    const sB: Shape = shape === 'circle' ? circleFromRect(rB) : aabbFromRect(rB);
    return collideShapes(sA, sB);
  }

  /** Low-level: collide two shapes directly. Framework-agnostic. */
  shapes(a: Shape, b: Shape): CollisionMetrics {
    return collideShapes(a, b);
  }
}

const collide = new Collide();
export default collide;

export type {
  PairOptions, GroupOptions, AllOptions,
  Shape, ShapeKind, CollisionMetrics,
  Pair, Group, All,
};
