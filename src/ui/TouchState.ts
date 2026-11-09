export class TouchState {
  private pointers=new Map<number,string>();
  private taps=new Set<string>();
  press(pointer:number,key:string){
    if(!this.down(key))this.taps.add(key);
    this.pointers.set(pointer,key);
  }
  release(pointer:number){this.pointers.delete(pointer)}
  down(key:string){return [...this.pointers.values()].includes(key)}
  consume(key:string){const pressed=this.taps.has(key);this.taps.delete(key);return pressed}
  endFrame(){this.taps.clear()}
  reset(){this.pointers.clear();this.taps.clear()}
}
