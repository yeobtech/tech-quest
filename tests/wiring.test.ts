import {test} from 'node:test';import assert from 'node:assert/strict';
import {wiringError,type Wires} from '../src/observatory/wiring.ts';
test('three correct links on the modeled 3.3V supply only',()=>{
 const good:Wires={VCC:'3V3',DATA:'GPIO21',GND:'GND'};
 for(const DATA of ['GPIO21','GPIO4','GPIO12','GPIO40'])assert.equal(wiringError({...good,DATA},'3v3'),null);
 for(const DATA of ['GPIO19','GPIO20','3V3','GPIO99'])assert.ok(wiringError({...good,DATA},'3v3'));
 for(const w of [{},{...good,DATA:'GND'},{...good,VCC:'5V'},{...good,DATA:'5V'}] as Wires[])assert.ok(wiringError(w,'3v3'));
 for(const p of ['unknown','5v'] as const)assert.ok(wiringError(good,p));
});
