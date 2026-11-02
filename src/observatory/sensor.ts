export interface Sample {temperature:number;humidity:number}
export function parseSample(line:string):Sample|null {
  try {const s=JSON.parse(line);
    if(s?.type==='dht11' && s.valid===true && Number.isFinite(s.temperature) && s.temperature>=0 && s.temperature<=50 &&
      Number.isFinite(s.humidity) && s.humidity>=0 && s.humidity<=100)return {temperature:s.temperature,humidity:s.humidity};
  } catch { /* Ignore malformed measurements, including boot messages. */ }
  return null;
}
// Bound incomplete records; discard an oversized line through its next newline.
export class Lines {
  private tail=''; private overflow=false;
  feed(chunk:string,emit:(v:Sample|null)=>void) {
    const parts=chunk.split('\n');
    for(let i=0;i<parts.length;i++){
      if(!this.overflow){if(this.tail.length+parts[i].length>512){this.tail='';this.overflow=true}else this.tail+=parts[i]}
      if(i<parts.length-1){emit(this.overflow?null:parseSample(this.tail));this.tail='';this.overflow=false}
    }
  }
}
export async function readSerial(signal:AbortSignal,onOpen:()=>void,onSample:(v:Sample|null)=>void) {
  // Called directly from the Connect button, never on scene load.
  if(!navigator.serial)throw Error('Web Serial 미지원 · 데스크톱 Chrome의 localhost 또는 HTTPS에서 여세요.');
  const port=await navigator.serial.requestPort();
  if(signal.aborted)return;
  await port.open({baudRate:115200});
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
  const cancel=()=>{void reader?.cancel().catch(()=>{})};
  try {
    if(signal.aborted)return;
    if(!port.readable)throw Error('읽을 수 없는 포트입니다.');
    reader=port.readable.getReader();signal.addEventListener('abort',cancel,{once:true});
    onOpen();const decoder=new TextDecoder(),lines=new Lines();
    while(!signal.aborted){const {value,done}=await reader.read();if(done)break;
      if(value&&!signal.aborted)lines.feed(decoder.decode(value,{stream:true}),onSample)}
  } finally {signal.removeEventListener('abort',cancel);reader?.releaseLock();await port.close()}
}
