export const outputs=['3V3','GPIO4','GND','5V'] as const;
export const inputs=['VCC','DATA','GND'] as const;
export type BoardPin=typeof outputs[number];
export type SensorPin=typeof inputs[number];
export type Wires=Partial<Record<SensorPin,BoardPin>>;
export type Profile='unknown'|'3v3'|'5v';
export function wiringError(w:Wires,p:Profile):string|null {
  if(Object.values(w).includes('5V') || p==='5v')return '위험: 5V 전원 또는 5V DATA 풀업을 GPIO에 직접 연결할 수 없습니다.';
  if(p!=='3v3')return '모듈 전원·DATA 풀업 전압이 미확인입니다.';
  if(w.VCC!=='3V3'||w.DATA!=='GPIO4'||w.GND!=='GND')return 'VCC–3V3, DATA–GPIO4, GND–GND 세 연결을 확인하세요.';
  return null;
}
