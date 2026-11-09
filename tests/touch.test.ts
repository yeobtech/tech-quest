import test from 'node:test';
import assert from 'node:assert/strict';
import {TouchState} from '../src/ui/TouchState.ts';
test('two fingers move and jump independently; quick taps survive until the game reads them',()=>{
  const t=new TouchState();t.press(1,'RIGHT');t.press(2,'SPACE');t.release(2);
  assert.equal(t.down('RIGHT'),true);assert.equal(t.down('SPACE'),false);
  assert.equal(t.consume('SPACE'),true);assert.equal(t.consume('SPACE'),false);
  t.release(1);assert.equal(t.down('RIGHT'),false);
});
test('canceling one finger keeps the other; pause clears held keys and pending actions',()=>{
  const t=new TouchState();t.press(1,'Z');t.press(2,'Z');t.release(1);assert.equal(t.down('Z'),true);
  t.press(3,'E');t.reset();assert.equal(t.down('Z'),false);assert.equal(t.consume('E'),false);
  t.press(4,'I');t.endFrame();assert.equal(t.consume('I'),false);
});
