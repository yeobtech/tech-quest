import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newProgress, ProgressionSystem } from '../src/systems/ProgressionSystem.ts';
import { SaveSystem } from '../src/systems/SaveSystem.ts';
test('rewards preserve overflow and wait for an exam without changing stats', () => { const p = new ProgressionSystem(newProgress()); p.reward(290, 24); assert.deepEqual([p.state.level, p.state.exp, p.state.gold, p.state.kills, p.maxHp, p.attack], [1, 290, 24, 1, 100, 18]); assert.deepEqual(p.state.exam,{level:1,solved:[]}); });
test('exact threshold creates an exam instead of automatic level up', () => { const p = new ProgressionSystem(newProgress()); p.reward(100, 8); assert.equal(p.state.level, 1); assert.equal(p.state.exp, 100); assert.equal(p.state.exam?.level,1); });

test('save round trip and corrupted data recovery', () => { let value: string | null = null; const save = new SaveSystem({ getItem: () => value, setItem: (_k, v) => { value = v; } }); const p = newProgress(); p.gold = 42; assert.equal(save.save(p), true); assert.equal(save.load().gold, 42); value = '{broken'; assert.equal(save.load().level, 1); value = JSON.stringify({ version: 1, progress: { level: -1 } }); assert.equal(save.load().level, 1); });
test('storage access errors do not crash play', () => { const save = new SaveSystem({ getItem: () => { throw Error(); }, setItem: () => { throw Error(); } }); assert.equal(save.load().level, 1); assert.equal(save.save(newProgress()), false); });
