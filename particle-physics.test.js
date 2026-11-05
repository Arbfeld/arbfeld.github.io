import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeRepulsionForce,
  computeShockwaveImpulse,
  computeConstellationAlpha,
  computeMagneticOffset,
} from './particle-physics.js';

test('computeRepulsionForce pushes particle away from cursor within radius', () => {
  const res = computeRepulsionForce(150, 100, 100, 100, 140, 1.0);
  assert.equal(res.engaged, true);
  assert.ok(res.fx > 0);
  assert.equal(res.fy, 0);

  const far = computeRepulsionForce(300, 300, 100, 100, 140, 1.0);
  assert.equal(far.engaged, false);
  assert.equal(far.fx, 0);
  assert.equal(far.fy, 0);
});

test('computeShockwaveImpulse imparts radial velocity on wave ring', () => {
  const hit = computeShockwaveImpulse(200, 100, 100, 100, 100, 50, 3.0);
  assert.ok(hit.ix > 2.5);
  assert.equal(hit.iy, 0);

  const miss = computeShockwaveImpulse(300, 100, 100, 100, 100, 50, 3.0);
  assert.equal(miss.ix, 0);
  assert.equal(miss.iy, 0);
});

test('computeConstellationAlpha interpolates opacity smoothly', () => {
  assert.equal(computeConstellationAlpha(0, 130, 0.28), 0.28);
  assert.equal(computeConstellationAlpha(130 * 130, 130, 0.28), 0);
  const mid = computeConstellationAlpha(65 * 65, 130, 0.28);
  assert.ok(mid > 0.13 && mid < 0.15);
});

test('computeMagneticOffset activates within 40px proximity and resets outside', () => {
  const inside = computeMagneticOffset(200, 100, 50, 20, 230, 110, 40, 0.3);
  assert.equal(inside.active, true);
  assert.ok(inside.tx > 0);
  assert.ok(inside.ty > 0);

  const outside = computeMagneticOffset(200, 100, 50, 20, 400, 300, 40, 0.3);
  assert.equal(outside.active, false);
  assert.equal(outside.tx, 0);
  assert.equal(outside.ty, 0);
});
