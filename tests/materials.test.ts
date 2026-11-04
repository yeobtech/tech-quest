import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollDrops, readInventory } from '../src/data/materials.ts';
test('material and badge rolls use independent monster-specific thresholds',()=>{
  const roll=(kind:'slime'|'bot',a:number,b:number)=>{const seq=[a,b];return rollDrops(kind,()=>seq.shift()!)};
  assert.deepEqual(roll('slime',.299,.029),['jelly','badge']);
  assert.deepEqual(roll('slime',.30,.03),[]);
  assert.deepEqual(roll('bot',.249,.03),['gear']);
  assert.deepEqual(roll('bot',.25,.029),['badge']);
});
test('legacy and invalid inventory entries do not erase valid materials',()=>{
  assert.deepEqual(readInventory(),{});
  assert.deepEqual(readInventory({jelly:5,gear:-1,badge:2.5,hat:3}),{jelly:5});
});
