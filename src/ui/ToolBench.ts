import {openLearning} from './Learning';
import {canUse, nipperLesson, tools, type ActiveTool} from '../data/tools';
import type {Progress} from '../systems/ProgressionSystem';

export function openToolBench(state:Progress, greeting:string, save:()=>boolean, apply:()=>void, done:()=>void, studySave?:(p:Progress)=>boolean, boss?:()=>void) {
  const panel=document.createElement('dialog');panel.className='workshop';panel.setAttribute('aria-label','기술 교관 공구 실습');
  panel.innerHTML='<small>기술 교관 · 공구 실습</small><h2>전선 절단 연습</h2><p data-greeting></p><p data-lesson></p><section></section><p role="status"></p><button data-close>대화 마치기</button>';
  panel.querySelector('[data-greeting]')!.textContent=greeting;
  panel.querySelector('[data-lesson]')!.textContent=tools.scissors.description+' '+tools.nippers.description+' '+tools.nippers.lesson;
  const area=panel.querySelector('section')!, status=panel.querySelector('[role=status]')!;
  let step=0;
  function button(label:string,click:()=>void){const b=document.createElement('button');b.textContent=label;b.onclick=click;area.append(b);return b}
  function render(){
    area.replaceChildren();const title=document.createElement('p');area.append(title);
    if(canUse('nippers',state.learning.completedMissionIds)){
      title.textContent='공구함 · 현재 장착: '+tools[state.tool].name;
      for(const id of ['scissors','nippers'] as const)button(tools[id].name+' 장착',()=>switchTo(id)).disabled=state.tool===id;
    }else{
      const q=nipperLesson[step];title.textContent=(step+1)+' / '+nipperLesson.length+' · '+q.question;
      q.answers.forEach((a,i)=>button(a,()=>{
        if(i!==q.correct){status.textContent='설명을 읽고 다시 골라 보세요.';return}
        if(step<nipperLesson.length-1){step++;status.textContent='맞았습니다.';render();return}
        state.learning.completedMissionIds.push(tools.nippers.mission);
        if(!save()){state.learning.completedMissionIds.pop();status.textContent='저장 실패 · 다시 시도하세요.';return}
        status.textContent='학습 완료! 니퍼가 해금되었습니다. 사용할 공구를 선택하세요.';render();
      }));
    }
  }
  function switchTo(id:ActiveTool){
    if(!canUse(id,state.learning.completedMissionIds))return;
    const old=state.tool;state.tool=id;
    if(!save()){state.tool=old;status.textContent='공구 변경을 저장하지 못했습니다.';return}
    apply();status.textContent=tools[id].name+' 장착 완료';render();
  }
    const studyButton=document.createElement('button');studyButton.textContent='스테이지 1 · 디지털 기술자 훈련소';
  panel.querySelector('[data-close]')!.before(studyButton);
  studyButton.onclick=()=>openLearning(state,studySave??(()=>false),()=>{},boss?()=>{panel.addEventListener('close',boss,{once:true});panel.close()}:undefined);
  const mission=document.createElement('button');mission.textContent='교관 의뢰 · 고장 난 온습도 관측소';
  panel.querySelector('[data-close]')!.before(mission);
  mission.onclick=async()=>{mission.disabled=true;try{
    const {openStation}=await import('../observatory/station');
    if(panel.open)openStation(state.learning.completedMissionIds,save,()=>panel.close());
  }catch{status.textContent='관측소를 열지 못했습니다. 다시 시도하세요.'}finally{mission.disabled=false}};
  panel.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>panel.close();
  panel.addEventListener('close',()=>{panel.remove();done()},{once:true});
  document.body.append(panel);render();panel.showModal();
}
