import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FOREST } from '../src/data/maps.ts';
import { PLAYER, WORLD_GRAVITY } from '../src/data/config.ts';

test('jump height is approximately half of the previous version', () => {
  const oldRise = 680 ** 2 / (2 * WORLD_GRAVITY);
  const rise = PLAYER.jump ** 2 / (2 * WORLD_GRAVITY);
  assert.ok(Math.abs(rise / oldRise - 0.5) < 0.01);
});

test('forest has a reachable sequence of platforms using the configured jump', () => {
  const [ground, ...platforms] = FOREST.platforms;
  const maximumRise = PLAYER.jump ** 2 / (2 * WORLD_GRAVITY);
  assert.ok(ground.y - platforms[0].y < maximumRise * 0.9, 'first platform needs margin for jumping from the ground');
  for (let i = 1; i < platforms.length; i++) {
    const from = platforms[i - 1], to = platforms[i];
    const rise = from.y - to.y;
    const discriminant = PLAYER.jump ** 2 - 2 * WORLD_GRAVITY * rise;
    assert.ok(discriminant > 0, `platform ${i + 1} is too high`);
    const landingTime = (PLAYER.jump + Math.sqrt(discriminant)) / WORLD_GRAVITY;
    const gap = (to.x - to.w / 2) - (from.x + from.w / 2);
    assert.ok(gap < PLAYER.speed * landingTime * 0.9, `platform ${i + 1} is too far away`);
  }
});
