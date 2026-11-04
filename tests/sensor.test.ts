import {test} from 'node:test';import assert from 'node:assert/strict';
import {Lines,parseSample} from '../src/observatory/sensor.ts';
test('JSONL accepts fragmented USB reads, rejects failed, oversized and nonnumeric records',()=>{
 const record='{"type":"dht11","valid":true,"temperature":25,"humidity":55}';
 const lines=new Lines(),values:unknown[]=[];lines.feed(record.slice(0,10),v=>values.push(v));
 lines.feed(record.slice(10)+'\r\n'+ 'x'.repeat(513)+'\n'+record+'\n',v=>values.push(v));
 assert.deepEqual(values,[{temperature:25,humidity:55},null,{temperature:25,humidity:55}]);
 for(const text of [record.replace('true','false'),record.replace('55','101'),record.replace('25','"25"'),record.replace('dht11','mock'),'{}'])assert.equal(parseSample(text),null);
});

test('USB stream abort releases the port before reconnect; debug lines do not interrupt samples',async()=>{
 const {readSerial}=await import('../src/observatory/sensor.ts');
 let closed=0,opened=0;

 const original=Object.getOwnPropertyDescriptor(navigator,'serial');
 Object.defineProperty(navigator,'serial',{configurable:true,value:{requestPort:async()=>({
   readable:new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('# ready\n{"type":"dht11","temperature":24,"humidity":51,"valid":true}\n'))}}),
   open:async()=>{opened++},close:async()=>{closed++}
 })}});
 try{
   for(let i=0;i<2;i++){
     const controller=new AbortController(),received:unknown[]=[];
     await readSerial(controller.signal,()=>{},v=>{received.push(v);controller.abort()});
     assert.deepEqual(received,[{temperature:24,humidity:51}]);assert.equal(closed,i+1);
   }
   assert.equal(opened,2);
 }finally{if(original)Object.defineProperty(navigator,'serial',original);else Reflect.deleteProperty(navigator,'serial')}
});
