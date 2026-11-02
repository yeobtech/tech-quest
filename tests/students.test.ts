import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { characterArt, equipStudent } from '../src/data/characterArt.ts';

test('both student presets supply three transparent strips matching their Phaser grids', () => {
  for (const id of ['boy', 'girl'] as const) {
    equipStudent(id);
    for (const action of ['idle', 'run', 'attack'] as const) {
      const clip = characterArt[action];
      const png = readFileSync(new URL('../public/' + clip.layers[0], import.meta.url));
      assert.equal(png.toString('ascii', 12, 16), 'IHDR');
      assert.equal(png.readUInt32BE(16), characterArt.width * clip.count);
      assert.equal(png.readUInt32BE(20), characterArt.height);
      assert.equal(png[25], 6, 'requires RGBA pixels');
    }
  }
});
