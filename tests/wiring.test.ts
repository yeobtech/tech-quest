import {test} from 'node:test';import assert from 'node:assert/strict';
import {wiringError,type Wires} from '../src/observatory/wiring.ts';
test('three correct links on the modeled 3.3V supply only',()=>{
 const good:Wires={VCC:'3V3',DATA:'GPIO4',GND:'GND'};
 assert.equal(wiringError(good,'3v3'),null);
 for(const w of [{},{...good,DATA:'GND'},{...good,VCC:'5V'},{...good,DATA:'5V'}] as Wires[])assert.ok(wiringError(w,'3v3'));
 for(const p of ['unknown','5v'] as const)assert.ok(wiringError(good,p));
});
