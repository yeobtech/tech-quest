export type ToolKind = 'scissors' | 'nippers' | 'stripper' | 'hammer' | 'saw' | 'cutter' | 'glueGun' | 'sandpaper';
interface Tool {
  id:ToolKind; name:string; description:string; attackType:string; animation:string;
  mission:string|null; lesson:string; reach:number; damageBonus:number;
}
export const tools = {
  scissors:{id:'scissors',name:'안전가위',description:'두 날이 엇갈리며 종이 등 얇은 재료를 자릅니다.',attackType:'휘두르기',animation:'swing',mission:null,lesson:'손가락은 날에서 멀리 두세요.',reach:38,damageBonus:0},
  nippers:{id:'nippers',name:'니퍼',description:'짧은 두 턱을 맞물려 공구 규격에 맞는 전선을 절단합니다.',attackType:'집어 절단',animation:'pinch',mission:'nippers-basics',lesson:'전원을 차단하고 무전압을 확인하세요. 보안경을 쓰고 잘린 끝이 사람을 향하지 않게 하세요.',reach:28,damageBonus:2}
} as const satisfies Partial<Record<ToolKind,Tool>>;
export type ActiveTool = keyof typeof tools;
export function canUse(id:ActiveTool, missions:readonly string[]) {
  const required=tools[id].mission;
  return required===null || missions.includes(required);
}
export function restoreTool(id:unknown,missions:readonly string[]):ActiveTool {
  return id==='nippers' && canUse(id,missions)?id:'scissors';
}
export const nipperLesson=[
 {question:'니퍼로 자르기에 알맞은 재료는?',answers:['공구 규격에 맞는 전선','두꺼운 강철판'],correct:0},
 {question:'안전가위와 니퍼가 자르는 방식은?',answers:['둘 다 긴 날을 엇갈려 자른다','가위는 날이 엇갈리고 니퍼는 짧은 턱이 맞물린다'],correct:1},
 {question:'전선을 자르기 전에 할 일은?',answers:['손잡이 색만 확인한다','전원을 차단하고 무전압 확인 후 보안경을 쓴다'],correct:1}
];
