import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FOREST, TRAINING } from '../src/data/maps.ts';
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

for (const map of [FOREST, TRAINING]) test(map.id + ' permits standing jumps with takeoff and landing margin', () => {
  const [ground, ...tiles] = map.platforms;
  const step = 1 / 60;
  let from = ground;
  for (const to of tiles) {
    const gap = Math.max(0, to.x - to.w / 2 - (from.x + from.w / 2));
    let x = 0, y = from.y, vx = 0, vy = -PLAYER.jump;
    let landed = false;
    for (let frame = 0; frame < 120; frame++) {
      const previous = y;
      vx = Math.min(PLAYER.speed, vx + PLAYER.acceleration * step);
      vy += WORLD_GRAVITY * step;
      x += vx * step;
      y += vy * step;
      if (vy > 0 && previous <= to.y && y >= to.y) {
        landed = x >= gap + 24;
        break;
      }
    }
    assert.ok(landed, `not enough landing margin on platform at x=${to.x}`);
    from = to;
  }
});
