import { currentStudent, type StudentAction } from '../data/characterArt';
import type { Wardrobe } from '../data/shop';

// Landmarks on the original 80x64 drawings: goggles, bag, scissors hinge and tip.
// An absent tip means the scissors are holstered or hidden on this pose.
type Pose = [number,number,number,number,number?,number?,number?,number?];
type Atlas = Record<StudentAction,Pose[]>;
const boy:Atlas={
 idle:Array.from({length:4},()=>[40,11,30,35,52,31,59,22] as Pose),
 run:[[45,13,31,35,54,34,61,25],[46,15,31,35,54,37,62,30],[46,14,31,35,54,36,61,27],[45,14,31,35,54,36,62,27],[46,15,30,36,54,37,62,29],[46,20,30,41,52,41,60,34],[46,14,31,35,53,37,60,27],[46,15,31,35,53,36,60,27]],
 attack:[[42,14,29,37,53,40,61,32],[44,14,31,37,25,32,32,28],[44,14,32,38,23,26,32,19],[47,16,32,36,60,35,69,31],[46,15,32,38,52,40,62,37],[44,15,30,37,51,41,58,34]],
 jump:[[42,12,31,33,32,40,37,35],[43,18,29,40,31,51,35,44]],
 fall:[[42,14,32,38,33,43,36,37],[42,23,29,43,26,46,32,41]],
 climb:[[40,11,39,35],[39,16,39,37],[40,12,40,35],[40,15,41,36]],
 hurt:[[38,14,30,38,36,44,39,38],[47,21,30,41,27,46,32,41]],
 death:[[48,23,31,45,28,49,34,44],[48,26,30,45,25,51,29,45],[31,21,23,44],[51,30,33,45,27,47,32,43],[58,36,33,44,28,47,32,44],[58,44,38,46]]
};
const girl:Atlas={
 idle:Array.from({length:4},()=>[43,12,31,37,53,34,60,25] as Pose),
 run:[[47,15,32,39,56,36,63,27],[47,14,32,37,55,36,63,26],[47,14,32,38,56,35,63,26],[47,15,33,40,56,36,64,29],[46,16,32,40,56,37,63,28],[47,13,33,37,55,35,62,25],[47,14,33,37,55,35,61,27],[47,15,34,38,55,37,60,29]],
 attack:[[44,16,31,40,53,41,61,34],[44,16,31,39,30,32,34,27],[43,13,31,37,31,23,23,13],[46,16,32,40,59,35,69,32],[46,14,34,40,58,39,68,41],[44,15,31,40,52,41,59,34]],
 jump:[[43,15,32,34,55,23,59,15],[45,23,35,40,51,43,57,37]],
 fall:[[43,16,32,35,55,35,61,27],[44,23,32,42,51,43,58,35]],
 climb:[[40,9,38,34,48,29,48,25],[39,14,40,36,48,36,49,30],[40,11,40,35,30,33,30,28],[40,14,40,36,32,37,32,32]],
 hurt:[[42,15,33,38],[47,23,32,42,30,45,35,41]],
 death:[[47,26,32,45],[49,28,32,46],[36,24,28,45,46,44,50,39],[50,29,32,46,31,48,36,44],[33,40,25,49],[58,42,40,47]]
};
const palettes:Record<string,string[]> = {
 reinforced:['#172539','#345378','#60a6d2','#c4dfeb','#f2f8ff'],
 starlight:['#4a284b','#a25b69','#f6b25c','#fff2b4','#fffbea'],
 future:['#152b41','#176072','#23bbb9','#91ffee','#f5ffff']
};
function stamp(ctx:CanvasRenderingContext2D,x:number,y:number,rows:string[],colors:string[]) {
 rows.forEach((row,j)=>[...row].forEach((s,i)=>{if(s!=='.'){ctx.fillStyle=colors[Number(s)];ctx.fillRect(x+i,y+j,1,1)}}));
}
export function decorate(ctx:CanvasRenderingContext2D,action:StudentAction,i:number,w:Wardrobe['equipped']) {
 const [hx,hy,bx,by,x,y,tipX,tipY]=(currentStudent==='boy'?boy:girl)[action][i];
 const pal=palettes[w.WeaponSkin??''];
 if(pal && x!==undefined && y!==undefined && tipX!==undefined && tipY!==undefined){
   // Remap existing handle/blade pixels along the drawn tool segment, never paste a second blade.
   const pixels=ctx.getImageData(0,0,80,64), a=pixels.data;
   const dx=tipX-x,dy=tipY-y, length=dx*dx+dy*dy;
   for(let yy=Math.min(y,tipY)-3;yy<=Math.max(y,tipY)+3;yy++)for(let xx=Math.min(x,tipX)-3;xx<=Math.max(x,tipX)+3;xx++){
     const pos=4*(yy*80+xx); if(!a[pos+3])continue;
     const t=Math.max(0,Math.min(1,((xx-x)*dx+(yy-y)*dy)/length));
     if(Math.hypot(xx-x-t*dx,yy-y-t*dy)>3)continue;
     const [r,g,b]=a.subarray(pos,pos+3);
     if(r>g*1.12 && g>b*1.25 && g>95)continue; // exposed fingers
     const color=pal[Math.min(4,Math.floor((r+g+b)/155))];
     const rgb=parseInt(color.slice(1),16);a[pos]=rgb>>16;a[pos+1]=rgb>>8&255;a[pos+2]=rgb&255;
   }
   ctx.putImageData(pixels,0,0);
   const mark=w.WeaponSkin==='future'?['010','232','010']:w.WeaponSkin==='starlight'?['.3.','343','.3.']:['12','34'];
   stamp(ctx,x-1,y-1,mark,pal);
 }
 if(pal && action==='attack' && (i===3||i===4)){
   // Only the impact arc lies beyond the blade at frame 4; the trailing boy arc is detached at frame 5.
   if(i===3){
     // First effect pixel per scanline (y=23 onward), traced on each source PNG.
     // The blade and arc share rows, so clearing a rectangle would also cut the tip.
     const edge=currentStudent==='boy'?[67,69,71,71,72,73,73,74,74,74,74,74,73,73,73,72,71,70]:[64,67,69,70,70,71,72,72,72,72,72,72,72,71,70,70,69,67,66,64];
     edge.forEach((start,row)=>ctx.clearRect(start,23+row,80-start,1));
   }
   if(i===4 && currentStudent==='boy')ctx.clearRect(64,24,16,18);
   const shift=i===4?-4:0;
   const trail=w.WeaponSkin==='future'?['12....','..32..','...32.','....32','....32','...32.','..32..','12....']:
     w.WeaponSkin==='starlight'?['.3.....','343..2.','.3..232','.....2.','...3...','..343..','...3...']:
     ['23....','.23...','..23..','...23.','....23','....23','...23.','..23..','.23...','23....'];
   stamp(ctx,70+shift,27+(i===4?5:0),trail,pal);
 }
 if(w.Back==='pack') stamp(ctx,bx-4,by-5,['..01110..','.0133310.','013333310','122222221','123333221','111441111','122442221','123332211','012222210','.0111110.'],['#1f2630','#265055','#387b78','#68aca0','#e7ab55']);
 if(w.Head==='pin')stamp(ctx,hx-6,hy-2,['..2..','11211','.232.','.1.1.'],['','#bd7a42','#ffe074','#fff5c4']);
 if(w.Head==='goggles')stamp(ctx,hx-6,hy-2,['.1111.1111.','12332123321','12222122221','.1111.1111.'],['','#92603a','#288792','#b9f0df']);
}
