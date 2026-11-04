import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FACTORY,factoryLadders,floorY,ferry} from '../src/data/factory.ts';
import {PLAYER,WORLD_GRAVITY} from '../src/data/config.ts';

test('factory ladders are supported at both ends and alternate sides',()=>{
  const supports=(x:number,y:number)=>FACTORY.platforms.some(p=>p.y===y && Math.abs(p.x-x)+16<p.w/2);
  for(const [i,l] of factoryLadders.entries()){
    assert.ok(supports(l.x,l.top)&&supports(l.x,l.bottom));
    assert.equal(l.bottom,floorY(i));assert.equal(l.top,floorY(i+1));
    if(i)assert.ok(Math.abs(l.x-factoryLadders[i-1].x)>600);
  }
});
test('pipe gap has jump margin and the ferry overlaps both docks',()=>{
  const gap=(i:number)=>{
    const [a,b]=FACTORY.platforms.filter(p=>p.y===floorY(i));
    return [a.x+a.w/2,b.x-b.w/2];
  };
  const [a,b]=gap(2);
  assert.ok(b-a+32 < PLAYER.speed*2*PLAYER.jump/WORLD_GRAVITY);
  const [left,right]=gap(3);
  assert.ok(ferry.left-ferry.width/2<left && ferry.right+ferry.width/2>right);
  assert.equal(ferry.y,floorY(3));
  assert.ok(FACTORY.platforms.some(p=>p.y===floorY(0)&&p.w===FACTORY.width));
});
import {newProgress,ProgressionSystem} from '../src/systems/ProgressionSystem.ts';
import {SaveSystem} from '../src/systems/SaveSystem.ts';
test('factory award is atomic on save failure and cannot repeat after reload',()=>{
  const p=new ProgressionSystem(newProgress());
  assert.equal(p.clearFactory(()=>false),'failed');
  assert.deepEqual([p.state.exp,p.state.gold,p.state.factoryCleared],[0,0,false]);
  let data='';
  const save=new SaveSystem({getItem:()=>data,setItem:(_,v)=>{data=v}});
  assert.equal(p.clearFactory(n=>save.save(n)),'first');
  const restored=new ProgressionSystem(save.load());
  assert.equal(restored.clearFactory(()=>assert.fail()),'repeat');
  assert.deepEqual([restored.state.exp,restored.state.gold,restored.state.kills],[50,30,0]);
});
