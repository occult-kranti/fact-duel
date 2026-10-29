import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTACT_MS, DELIVERY_MS, GRAVITY, shotForTiming, sampleFlight } from '../lib/stadium-physics.mjs';

test('timing affects shot energy and reaches an analytical ballistic ground point', () => {
  const sweet = shotForTiming(CONTACT_MS);
  const early = shotForTiming(200);
  assert.equal(sweet.runs, 6);
  assert.equal(early.runs, 0);
  assert.ok(sweet.distance > early.distance);
  assert.equal(sampleFlight(sweet, 0).height, 0);
  const apex = sampleFlight(sweet, sweet.vy / GRAVITY);
  assert.ok(apex.height > sampleFlight(sweet, .1).height);
  const landed = sampleFlight(sweet, sweet.flight + 100);
  assert.ok(Math.abs(landed.height) < .000001);
  assert.equal(landed.x, sweet.distance);
  assert.equal(landed.done, true);
});

test('invalid and extreme timings cannot escape bounded finite physics', () => {
  for (const elapsed of [-Infinity, Infinity, NaN, -99, 0, CONTACT_MS, DELIVERY_MS, 1e12]) {
    const shot = shotForTiming(elapsed);
    assert.ok(shot.accuracy >= 0 && shot.accuracy <= 1);
    assert.ok([0,1,4,6].includes(shot.runs));
    for (const seconds of [-50,0,1,Infinity,NaN,1e12]) {
      const point = sampleFlight(shot, seconds);
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.height));
      assert.ok(point.height >= 0 && point.x >= 0 && point.x <= shot.distance);
    }
  }
});
