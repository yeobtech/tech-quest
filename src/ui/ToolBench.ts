import {openPractical2} from './Practical2';
import {openCertification} from './Certification';
import {openLearning} from './Learning';
import {openStage2Practice} from './Stage2Practice';
import {teacherQuests,type TeacherQuest} from '../education/questMenu';
import type {MissionLevel} from '../education/practical2';
import {bossReady} from '../education/stage1';
import {canUse,nipperLesson,tools,type ActiveTool} from '../data/tools';
import type {Progress} from '../systems/ProgressionSystem';
import './learning.css';

export function openToolBench(state:Progress,_greeting:string,save:()=>boolean,apply:()=>void,done:()=>void,studySave?:(p:Progress)=>boolean,boss?:()=>void){
 const panel=document.createElement('dialog');panel.className='workshop learning teacher-quests';panel.setAttribute('aria-label','기술 교관 퀘스트');
 panel.innerHTML='<small>기술 교관</small><h2>어떤 퀘스트를 해 볼까요?</h2><p data-level></p><nav aria-label="퀘스트 분류"></nav><section data-quests></section><details data-extra><summary>자유 연습 · 도구</summary><div></div></details><p role="status" aria-live="polite"></p><button data-close>대화 마치기</button>';
 const area=panel.querySelector<HTMLElement>('[data-quests]')!,status=panel.querySelector<HTMLElement>('[role=status]')!;
 const persist=studySave??(()=>false);let category='now',step=0,selected:TeacherQuest|undefined;
 const button=(host:Element,label:string,fn:()=>void)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;host.append(b);return b};
 const text=(host:Element,value:string)=>{const p=document.createElement('p');p.textContent=value;host.append(p)};
 const resume=()=>{panel.style.visibility='';render();panel.querySelector<HTMLButtonElement>('[data-close]')!.focus()};
 function launch(q:TeacherQuest){
  if(!teacherQuests(state).find(item=>item.id===q.id)?.available)return;
  status.textContent='';
  if(q.kind==='tool'){selected=q;step=0;render();return}
  panel.style.visibility='hidden';
  if(q.kind==='study')openLearning(state,persist,resume,boss?()=>{panel.addEventListener('close',boss,{once:true});panel.close()}:undefined,q.level);
  else openPractical2(state,persist,q.level as MissionLevel,resume);
 }
 function switchTo(id:ActiveTool){
  if(!canUse(id,state.learning.completedMissionIds))return;
  const old=state.tool;state.tool=id;
  if(!save()){state.tool=old;status.textContent='저장하지 못했어요. 다시 눌러 주세요.';return}
  apply();render();status.textContent=tools[id].name+'를 장착했어요.';
 }
 function render(){
  area.replaceChildren();const nav=panel.querySelector('nav')!;nav.replaceChildren();
  panel.querySelector('[data-level]')!.textContent=`게임 Lv.${state.level} · 하고 싶은 퀘스트를 하나 골라 주세요.`;
  panel.querySelector<HTMLElement>('[data-extra]')!.hidden=!!selected;
  if(selected){
   panel.querySelector('h2')!.textContent=selected.title;
   button(nav,'← 퀘스트 목록',()=>{selected=undefined;status.textContent='';render()});
   if(canUse('nippers',state.learning.completedMissionIds)){
    text(area,'니퍼 사용법을 배웠어요. 사용할 도구를 골라 주세요.');
    for(const id of ['scissors','nippers'] as const)button(area,tools[id].name+(state.tool===id?' · 사용 중':' 장착'),()=>switchTo(id)).disabled=state.tool===id;
   }else{
    text(area,['니퍼는 전선을 자르는 도구예요. 자를 수 있는 전선의 굵기는 공구마다 달라요.','가위는 두 날이 엇갈려 잘라요. 니퍼는 짧은 두 날을 맞물려 잘라요.','전원을 끄고 전기가 흐르지 않는지 확인해요. 보안경을 쓰고 잘린 끝이 사람을 향하지 않게 해요.'][step]);
    const q=nipperLesson[step],field=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=`${step+1}/3 · ${q.question}`;field.append(legend);area.append(field);
    q.answers.forEach((answer,i)=>button(field,answer,()=>{
     if(i!==q.correct){status.textContent='위의 설명을 읽고 다시 골라 보세요.';return}
     if(step<nipperLesson.length-1){step++;render();status.textContent='맞았어요!';return}
     state.learning.completedMissionIds.push(tools.nippers.mission);
     if(!save()){state.learning.completedMissionIds.pop();status.textContent='저장하지 못했어요. 다시 눌러 주세요.';return}
     render();status.textContent='퀘스트 완료! 이제 니퍼를 쓸 수 있어요.';
    }));
   }
   return;
  }
  panel.querySelector('h2')!.textContent='어떤 퀘스트를 해 볼까요?';
  for(const [id,label] of [['now','지금 할 퀘스트'],['past','지난 퀘스트'],['next','다음 퀘스트']]){
   const b=button(nav,label,()=>{category=id;status.textContent='';render()});b.setAttribute('aria-pressed',String(category===id));
  }
  const quests=teacherQuests(state).filter(q=>category==='now'?q.available&&!q.recorded:category==='past'?q.recorded:!q.available).sort((a,b)=>category==='next'?a.level-b.level:b.level-a.level);
  for(const q of quests){
   const card=document.createElement('article');card.className='teacher-quest';
   const h=document.createElement('h3');h.textContent=`Lv.${q.level} · ${q.title}`;card.append(h);text(card,q.available?q.description:q.reason);
   button(card,q.available?(q.recorded?'다시 보기':'퀘스트 시작'):`Lv.${q.level} · 아직 잠김`,()=>launch(q)).disabled=!q.available;area.append(card);
  }
  if(!quests.length)text(area,category==='past'?'아직 남긴 퀘스트 기록이 없어요.':'이 목록에는 퀘스트가 없어요. 다른 목록을 골라 주세요.');
  if(category==='now'&&bossReady(state.stage1)&&boss)button(area,state.stage1.bossCleared?'오류 바이러스 다시 도전':'오류 바이러스에 도전',()=>{panel.addEventListener('close',boss,{once:true});panel.close()});
 }
 const extra=panel.querySelector('[data-extra] div')!;
 button(extra,'도구 바꾸기',()=>{selected=teacherQuests(state)[0];render()});
 button(extra,'센서 배선 자유 연습',async()=>{try{
  const {openStation}=await import('../observatory/station');if(!panel.open)return;
  panel.style.visibility='hidden';openStation(state.learning.completedMissionIds,save,resume);
 }catch{resume();status.textContent='실습을 열지 못했어요. 다시 눌러 주세요.'}});
 button(extra,'전자 부품 개념 연습',openStage2Practice);
 if(state.stage1.bossCleared)button(extra,'교사에게 보여 줄 실습 기록',()=>openCertification(state,persist,()=>{}));
 panel.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>panel.close();
 panel.addEventListener('close',()=>{panel.remove();done()},{once:true});
 document.body.append(panel);render();panel.showModal();
}
