type Tickable = (dt: number, now: number) => void;
/**
 * Shared RAF loop. All observers register into a single loop so we batch
 * `getBoundingClientRect` reads per frame and never trigger layout thrash.
 */
declare class Engine {
    private _cbs;
    private _rafId;
    private _last;
    private _running;
    add(cb: Tickable): () => void;
    remove(cb: Tickable): void;
    private _start;
    private _stop;
    private _tick;
}

interface Vec2 {
    x: number;
    y: number;
}

type ShapeKind = 'aabb' | 'circle';
interface AABB {
    kind: 'aabb';
    x: number;
    y: number;
    w: number;
    h: number;
}
interface Circle {
    kind: 'circle';
    cx: number;
    cy: number;
    r: number;
}
type Shape = AABB | Circle;
interface Overlap {
    x: number;
    y: number;
}
interface CollisionMetrics {
    colliding: boolean;
    /** Minimum distance between the two shapes. 0 when colliding. */
    distance: number;
    /** Overlap width/height (only meaningful when colliding, AABB only). */
    overlap: Overlap;
    /** Center of A. */
    centerA: Vec2;
    /** Center of B. */
    centerB: Vec2;
    /** Unit vector from A-center to B-center. */
    direction: Vec2;
    /** Angle in radians from A to B. */
    angle: number;
}

interface PairOptions {
    /** Fire 'near' event when distance drops to ≤ this many px. Default 60. */
    near?: number;
    /** Shape primitive to use. Default 'aabb'. */
    shape?: ShapeKind;
    /** Track velocity to estimate time-to-collision. Default true. */
    trackVelocity?: boolean;
}
interface PairMetrics extends CollisionMetrics {
    /** Velocity of B relative to A, in px/second. Only if trackVelocity. */
    velocity: Vec2;
    /** Time-to-collision in seconds (positive = approaching). */
    ttc: number | null;
    /** Relative closing speed in px/sec (positive = approaching). */
    closingSpeed: number;
}
declare class Pair {
    private _a;
    private _b;
    private _opts;
    private _ev;
    private _stop;
    private _lastRelPos;
    private _lastDist;
    private _wasColliding;
    private _wasNear;
    constructor(_a: Element, _b: Element, _opts: Required<PairOptions>, engine: Engine);
    on(event: 'near' | 'collide' | 'separate' | 'leave' | 'tick', fn: (metrics: PairMetrics) => void): () => void;
    off(event: string, fn?: (...args: any[]) => void): void;
    /** Snapshot the current collision state without waiting for a tick. */
    metrics(): PairMetrics;
    destroy(): void;
    private _tick;
    private _compute;
}

interface GroupOptions {
    near?: number;
    shape?: ShapeKind;
}
/**
 * One-to-many observer — watch a single `source` element against a set of
 * `targets`. Emits per-target events with metrics.
 */
declare class Group {
    private _source;
    private _targets;
    private _opts;
    private _ev;
    private _stop;
    private _state;
    constructor(_source: Element, _targets: Element[], _opts: Required<GroupOptions>, engine: Engine);
    on(event: 'near' | 'collide' | 'separate' | 'leave' | 'tick', fn: (target: Element, metrics: CollisionMetrics) => void): () => void;
    /** Get closest target and its metrics. */
    closest(): {
        target: Element;
        metrics: CollisionMetrics;
    } | null;
    destroy(): void;
    private _shapeOf;
    private _tick;
}

interface AllOptions {
    near?: number;
    shape?: ShapeKind;
}
/**
 * Many-to-many observer — every element is tested against every other.
 * O(n²) per frame. Fine up to a few hundred pairs; use spatial hashing
 * for larger sets (future work).
 */
declare class All {
    private _els;
    private _opts;
    private _ev;
    private _stop;
    private _pairState;
    constructor(_els: Element[], _opts: Required<AllOptions>, engine: Engine);
    on(event: 'near' | 'collide' | 'separate' | 'leave', fn: (a: Element, b: Element, metrics: CollisionMetrics) => void): () => void;
    destroy(): void;
    private _shapeOf;
    private _tick;
}

declare class Collide {
    private _engine;
    /** Watch two elements. Returns a Pair observer. */
    watch(a: Element, b: Element, opts?: PairOptions): Pair;
    /** Watch one source element against many targets. */
    group(source: Element, targets: Element[] | NodeListOf<Element>, opts?: GroupOptions): Group;
    /** Watch every pair within a set of elements. */
    all(elements: Element[] | NodeListOf<Element>, opts?: AllOptions): All;
    /**
     * One-shot collision check between two elements. Useful for discrete
     * hit-tests (click landed on target?). No observer, no RAF.
     */
    check(a: Element, b: Element, opts?: {
        shape?: ShapeKind;
    }): CollisionMetrics;
    /** Low-level: collide two shapes directly. Framework-agnostic. */
    shapes(a: Shape, b: Shape): CollisionMetrics;
}
declare const collide: Collide;

export { All, Group, Pair, collide as default };
export type { AllOptions, CollisionMetrics, GroupOptions, PairOptions, Shape, ShapeKind };
