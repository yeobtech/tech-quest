import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dhtHintSocket} from '../lab/wiringHints.js';

test('DHT11 hints use the GPIO21 S/V/G column at 3.3V',()=>{
  assert.deepEqual(['DATA','VCC','GND'].map(pin=>dhtHintSocket(pin,'3V3')),
    ['GPIO21','3V3@DIGITAL21','GND@DIGITAL21']);
});
test('DHT11 power hint never targets a DIGITAL rail set to 5V or unknown',()=>{
  for(const voltage of ['5V','unknown'])assert.equal(dhtHintSocket('VCC',voltage),'3V3');
  assert.equal(dhtHintSocket('ECHO','3V3'),null);
});
