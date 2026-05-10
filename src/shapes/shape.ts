import type { Vec2 } from '../utils/vector';

export type ShapeKind = 'aabb' | 'circle';

export interface AABB {
  kind: 'aabb';
  x: number;       // top-left x
  y: number;       // top-left y
  w: number;
  h: number;
}

export interface Circle {
  kind: 'circle';
  cx: number;
  cy: number;
  r: number;
}

export type Shape = AABB | Circle;

export interface Overlap {
  x: number;
  y: number;
}

export interface CollisionMetrics {
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

export function centerOf(s: Shape): Vec2 {
  if (s.kind === 'aabb') return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
  return { x: s.cx, y: s.cy };
}

/** Build an AABB from a DOMRect-like object. */
export function aabbFromRect(r: { left: number; top: number; width: number; height: number }): AABB {
  return { kind: 'aabb', x: r.left, y: r.top, w: r.width, h: r.height };
}

/** Build a Circle from a DOMRect-like object (inscribed-ish: uses min dimension / 2). */
export function circleFromRect(r: { left: number; top: number; width: number; height: number }): Circle {
  return {
    kind: 'circle',
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
    r: Math.min(r.width, r.height) / 2,
  };
}
