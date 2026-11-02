import {test} from 'node:test';import assert from 'node:assert/strict';
import {Lines,parseSample} from '../src/observatory/sensor.ts';
test('JSONL accepts fragmented USB reads, rejects failed, oversized and nonnumeric records',()=>{
 const record='{"type":"dht11","valid":true,"temperature":25,"humidity":55}';
 const lines=new Lines(),values:unknown[]=[];lines.feed(record.slice(0,10),v=>values.push(v));
 lines.feed(record.slice(10)+'\r\n'+ 'x'.repeat(513)+'\n'+record+'\n',v=>values.push(v));
 assert.deepEqual(values,[{temperature:25,humidity:55},null,{temperature:25,humidity:55}]);
 for(const text of [record.replace('true','false'),record.replace('55','101'),record.replace('25','"25"'),record.replace('dht11','mock'),'{}'])assert.equal(parseSample(text),null);
});
