> This project is made with the help of Claude (1M context).

<div align="center">

<br />

<img src="https://img.shields.io/badge/collidejs-v1.0.0-ff375f?style=for-the-badge&labelColor=000000" alt="version" />
<img src="https://img.shields.io/badge/gzip-~2.1KB-30d158?style=for-the-badge&labelColor=000000" alt="gzip" />
<img src="https://img.shields.io/badge/dependencies-0-bf5af2?style=for-the-badge&labelColor=000000" alt="deps" />
<img src="https://img.shields.io/badge/license-MIT-ff9f0a?style=for-the-badge&labelColor=000000" alt="license" />

<br /><br />

# CollideJS

**IntersectionObserver for any two elements.**

Proximity, collision, and time-to-collision detection for the DOM. Tiny, shape-agnostic, TypeScript-first.

</div>

---

## Why CollideJS?

The browser gives you `IntersectionObserver` — but only against the viewport (or one ancestor). There's nothing built-in for "is this element near, or hitting, *that other element*?"

`CollideJS` fills that gap. It's ~2KB, has zero deps, and uses a single shared RAF loop to batch all observer reads.

---

## Quick Start

```html
<script src="https://cdn.jsdelivr.net/npm/@buildwithdarsh/collidejs"></script>
<script>
  const pair = Collide.watch(cardA, cardB, { near: 80 });
  pair.on('near',     (m) => console.log('near:', m.distance, 'px'));
  pair.on('collide',  (m) => console.log('hit:', m.overlap));
  pair.on('separate', ()  => console.log('clear'));
</script>
```

Or with a bundler:

```bash
npm install @buildwithdarsh/collidejs
```

```ts
import Collide from '@buildwithdarsh/collidejs';
```

---

## API

### `Collide.watch(a, b, opts?) → Pair`
Watch two elements. Emits `near`, `collide`, `separate`, `leave`, `tick`.

```js
const pair = Collide.watch(el1, el2, {
  near: 60,           // px threshold for 'near' event (default 60)
  shape: 'aabb',      // 'aabb' | 'circle' (default aabb)
  trackVelocity: true,// compute velocity + TTC (default true)
});
pair.on('near',    (m) => ...);
pair.on('collide', (m) => ...);
pair.metrics();      // one-off snapshot
pair.destroy();
```

**Metrics shape:**
```ts
{
  colliding: boolean;
  distance: number;       // min distance between shapes
  overlap: { x, y };      // overlap dimensions when colliding
  centerA, centerB: Vec2;
  direction: Vec2;        // unit vector A → B
  angle: number;          // radians
  velocity: Vec2;         // B relative to A, px/sec
  closingSpeed: number;   // positive = approaching, px/sec
  ttc: number | null;     // time-to-collision in seconds
}
```

### `Collide.group(source, targets, opts?) → Group`
Watch one element against many targets (drag-to-drop zones).

```js
const g = Collide.group(drag, dropZones, { near: 80 });
g.on('near',    (zone, m) => zone.classList.add('highlight'));
g.on('collide', (zone, m) => commitDrop(zone));
g.closest();  // { target, metrics }
```

### `Collide.all(elements, opts?) → All`
N×N observer — every pair tested every frame. Great for crowd avoidance, packing.

```js
const a = Collide.all(nodes);
a.on('collide', (a, b, m) => separate(a, b, m.direction));
```

### `Collide.check(a, b, opts?) → CollisionMetrics`
One-shot check. No observer, no RAF — use for discrete hit-tests.

```js
if (Collide.check(bullet, target).colliding) score();
```

### `Collide.shapes(a, b) → CollisionMetrics`
Low-level geometry: collide two `Shape` objects directly. Framework-agnostic.

```js
Collide.shapes(
  { kind: 'aabb', x: 0, y: 0, w: 10, h: 10 },
  { kind: 'circle', cx: 5, cy: 20, r: 4 },
);
```

---

## Performance

- **Single shared RAF** — every observer registers into the same loop. Runtime cost scales with the number of observed pairs, not the number of observer instances.
- **Batched `getBoundingClientRect`** — one read per element per frame, never during event handlers.
- **Auto-stops when idle** — the loop pauses when the last observer is destroyed.

---

## License

MIT © Darsh Gupta
