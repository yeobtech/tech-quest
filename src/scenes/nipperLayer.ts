// Pixel-art tool layer, anchored at the grip rather than the sprite origin.
// Attack body sequence keeps the hand in front instead of winding up behind the head.
export const pinchPoses = [0,5,4,3,4,5] as const;
export function drawNippers(c:CanvasRenderingContext2D, x:number,y:number,tx:number,ty:number,
  exposed:boolean, attack:boolean, frame:number) {
  const dx=tx-x,dy=ty-y,len=Math.hypot(dx,dy)||1, u=dx/len,v=dy/len;
  // Exposed scissors and their arc have empty space beyond the hand.
  // Holstered tools overlap clothing: restrict the mask to their registered footprint.
  if(exposed) {
    c.clearRect(x-2,Math.min(y,ty)-4,80-x+2,Math.abs(dy)+9);
    if(attack&&frame===3)c.clearRect(64,22,16,22);
    if(attack&&(frame===2||frame===4))c.clearRect(Math.max(64,x+9),25,16,18);
  } else {
    const bounds=c.getImageData(0,0,80,64),pixels=bounds.data;
    for(let yy=Math.min(y,ty)-3;yy<=Math.max(y,ty)+3;yy++)for(let xx=Math.min(x,tx)-3;xx<=Math.max(x,tx)+3;xx++){
      const t=Math.max(0,Math.min(len,(xx-x)*u+(yy-y)*v));
      if(Math.hypot(xx-x-t*u,yy-y-t*v)>3)continue;
      const p=(yy*80+xx)*4;
      if(pixels[p]>pixels[p+1]*1.12 && pixels[p+1]>95 && pixels[p+1]>pixels[p+2]*1.25)continue;
      // A dark leather holster backs the replacement instead of punching holes through the coat.
      if(pixels[p+3]) { pixels[p]=53;pixels[p+1]=44;pixels[p+2]=48; }
    }
    c.putImageData(bounds,0,0);
  }
  function line(a:number,b:number,end:number,side:number,color:string,width:number) {
    c.fillStyle=color;const steps=Math.ceil(Math.hypot(end-a,side-b)*2);
    for(let j=0;j<=steps;j++){const t=j/(steps||1),s=a+(end-a)*t,n=b+(side-b)*t;
      c.fillRect(Math.round(x+s*u-n*v),Math.round(y+s*v+n*u),width,width);}
  }
  const gap=attack?[1,2,3,0,0,1][frame]:1;
  for(const sign of [-1,1]){
    line(-4,sign*(1+gap/2),3,0,'#432f29',3);
    line(-4,sign*(1+gap/2),2,0,'#dd782e',2);
    line(-4,sign*(1+gap/2),0,sign,'#ffc579',1);
    line(2,0,5,sign*(1+gap),'#394650',3);
    line(4,sign,6,sign*(1+gap),'#849aa0',2);
    line(6,sign*(1+gap),8,sign*gap,'#d9eeea',2);
  }
  line(3,0,3,0,'#e5dcb6',2);
}
