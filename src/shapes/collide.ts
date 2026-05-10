import type { AABB, Circle, CollisionMetrics, Shape } from './shape';
import { centerOf } from './shape';
import { normalize, sub } from '../utils/vector';

/**
 * Core collision math. Given two shapes, returns distance, overlap,
 * direction, and whether they collide.
 */
export function collide(a: Shape, b: Shape): CollisionMetrics {
  if (a.kind === 'aabb' && b.kind === 'aabb') return aabbVsAabb(a, b);
  if (a.kind === 'circle' && b.kind === 'circle') return circleVsCircle(a, b);
  if (a.kind === 'aabb' && b.kind === 'circle') return aabbVsCircle(a, b);
  if (a.kind === 'circle' && b.kind === 'aabb') {
    const m = aabbVsCircle(b, a);
    // swap direction/angle
    return {
      ...m,
      centerA: m.centerB,
      centerB: m.centerA,
      direction: { x: -m.direction.x, y: -m.direction.y },
      angle: m.angle + Math.PI,
    };
  }
  return aabbVsAabb(a as AABB, b as AABB);
}

function aabbVsAabb(a: AABB, b: AABB): CollisionMetrics {
  const cA = centerOf(a);
  const cB = centerOf(b);

  // Horizontal & vertical gaps. Negative = overlap on that axis.
  const gapX = Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w);
  const gapY = Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h);

  let distance: number;
  let colliding: boolean;
  let overlap = { x: 0, y: 0 };

  if (gapX < 0 && gapY < 0) {
    // Overlapping on both axes → collision
    colliding = true;
    distance = 0;
    overlap = { x: -gapX, y: -gapY };
  } else if (gapX < 0) {
    colliding = false;
    distance = gapY;
  } else if (gapY < 0) {
    colliding = false;
    distance = gapX;
  } else {
    // Diagonal gap — closest corner distance
    colliding = false;
    distance = Math.hypot(gapX, gapY);
  }

  const diff = sub(cB, cA);
  return {
    colliding,
    distance,
    overlap,
    centerA: cA,
    centerB: cB,
    direction: normalize(diff),
    angle: Math.atan2(diff.y, diff.x),
  };
}

function circleVsCircle(a: Circle, b: Circle): CollisionMetrics {
  const cA = { x: a.cx, y: a.cy };
  const cB = { x: b.cx, y: b.cy };
  const diff = sub(cB, cA);
  const centerDist = Math.hypot(diff.x, diff.y);
  const distance = Math.max(0, centerDist - a.r - b.r);
  const colliding = centerDist < a.r + b.r;
  const overlapAmount = colliding ? a.r + b.r - centerDist : 0;
  return {
    colliding,
    distance,
    overlap: { x: overlapAmount, y: overlapAmount },
    centerA: cA,
    centerB: cB,
    direction: normalize(diff),
    angle: Math.atan2(diff.y, diff.x),
  };
}

function aabbVsCircle(box: AABB, circ: Circle): CollisionMetrics {
  // Closest point on the box to the circle center.
  const closestX = Math.max(box.x, Math.min(circ.cx, box.x + box.w));
  const closestY = Math.max(box.y, Math.min(circ.cy, box.y + box.h));
  const dx = circ.cx - closestX;
  const dy = circ.cy - closestY;
  const centerDist = Math.hypot(dx, dy);
  const distance = Math.max(0, centerDist - circ.r);
  const colliding = centerDist < circ.r;

  const cA = centerOf(box);
  const cB = { x: circ.cx, y: circ.cy };
  const diff = sub(cB, cA);
  return {
    colliding,
    distance,
    overlap: colliding ? { x: circ.r - centerDist, y: circ.r - centerDist } : { x: 0, y: 0 },
    centerA: cA,
    centerB: cB,
    direction: normalize(diff),
    angle: Math.atan2(diff.y, diff.x),
  };
}
