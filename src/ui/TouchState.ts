export class TouchState {
  private pointers=new Map<number,string>();
  private taps=new Set<string>();
  press(pointer:number,key:string){
    if(!this.down(key))this.taps.add(key);
    this.pointers.set(pointer,key);
  }
  release(pointer:number){this.pointers.delete(pointer)}
  moveHorizontal(pointer:number,offset:number){
    if(Math.abs(offset)<=10)this.release(pointer);
    else this.press(pointer,offset<0?'LEFT':'RIGHT');
  }
  down(key:string){return [...this.pointers.values()].includes(key)}
  consume(key:string){const pressed=this.taps.has(key);this.taps.delete(key);return pressed}
  endFrame(){this.taps.clear()}
  reset(){this.pointers.clear();this.taps.clear()}
}
