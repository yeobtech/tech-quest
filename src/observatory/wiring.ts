const signalPins=[2,4,5,6,7,8,9,10,11,12,13,14,15,16,21,38,40,41,42,47,48].map(n=>'GPIO'+n);
export const outputs=['3V3',...signalPins,'GND','5V'];
export const inputs=['VCC','DATA','GND'] as const;
export type BoardPin=typeof outputs[number];
export type SensorPin=typeof inputs[number];
export type Wires=Partial<Record<SensorPin,string>>;
export type Profile='unknown'|'3v3'|'5v';
export function wiringError(w:Wires,p:Profile):string|null {
  if(Object.values(w).includes('5V') || p==='5v')return '위험: 5V 전원 또는 5V DATA 풀업을 GPIO에 직접 연결할 수 없습니다.';
  if(p!=='3v3')return '모듈 전원·DATA 풀업 전압이 미확인입니다.';
  if(w.VCC!=='3V3')return 'VCC를 3.3 V 전원에 연결하세요.';
  if(w.GND!=='GND')return 'GND를 보드 접지에 연결하세요.';
  if(!signalPins.includes(w.DATA??''))return 'DATA를 이 실습에서 사용할 수 있는 디지털 신호 GPIO에 연결하세요.';
  return null;
}
