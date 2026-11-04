import type {MapData} from './maps';

export const floors=['공장 입구','조립 라인','배관 / 정비 구역','드론 순찰 구역','전력 위험 구역','제어실'];
export const floorY=(i:number)=>1420-240*i;
const deck=(a:number,b:number,i:number)=>({x:(a+b)/2,y:floorY(i),w:b-a});
export const factoryLadders=floors.slice(1).map((_,i)=>({x:i%2===0?1040:240,top:floorY(i+1),bottom:floorY(i)}));
export const traps=[{x:600,y:floorY(0)},{x:550,y:floorY(4)},{x:830,y:floorY(4)}];
export const ferry={left:530,right:850,width:100,speed:86,y:floorY(3)};
export const FACTORY:MapData={
  id:'abandoned-factory',name:'버려진 기계공장',width:1280,height:1520,spawn:{x:230,y:1375},
  platforms:[deck(0,1280,0),deck(170,1110,1),deck(170,460,2),deck(540,1110,2),
    deck(170,530,3),deck(850,1110,3),deck(170,1110,4),deck(170,1110,5)],
  enemies:[{kind:'motor',x:740,y:floorY(0)-28,min:690,max:870},{kind:'motor',x:600,y:floorY(1)-28,min:425,max:720},
    {kind:'drill',x:850,y:floorY(1)-28,min:790,max:950},
    {kind:'drill',x:745,y:floorY(2)-28,min:635,max:920},
    {kind:'drill',x:685,y:floorY(4)-28,min:610,max:770},
    {kind:'drone',x:960,y:floorY(3)-72,min:865,max:1040},{kind:'drone',x:390,y:floorY(3)-82,min:285,max:490}]
};
export const factoryGate=1650, switchX=320, exitX=260;

export const checkpoint={x:240,y:floorY(2)};
export const factoryReward={exp:50,gold:30};
