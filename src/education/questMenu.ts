import type {Progress} from '../systems/ProgressionSystem';
import {learningLevel,lessonDone} from './stage1';
import {lessons} from './stage1Data';
import {missionLevels,type MissionLevel} from './practical2';
export const practicalTitles:Record<MissionLevel,string>={11:'보드의 단자 찾기',12:'알맞은 연결선 고르기',13:'센서에 선 3개 연결하기',14:'보드와 컴퓨터 연결하기',15:'실제 온도와 습도 읽기'};
export type TeacherQuest={id:string;kind:'tool'|'study'|'practical';level:number;title:string;description:string;available:boolean;recorded:boolean;reason:string};
export function teacherQuests(p:Progress):TeacherQuest[]{
 const next=learningLevel(p.stage1);
 const list:TeacherQuest[]=[{id:'nippers',kind:'tool',level:1,title:'니퍼 사용법 배우기',description:'문제 3개를 풀고 니퍼를 받아요.',available:true,recorded:p.learning.completedMissionIds.includes('nippers-basics'),reason:''}];
 for(const lesson of lessons){
  const recorded=lessonDone(p.stage1,lesson.level);
  // Keep previously unlocked study progress accessible after migration.
  const available=recorded || lesson.level<=next&&(p.level>=lesson.level||next>1);
  list.push({id:'study-'+lesson.level,kind:'study',level:lesson.level,title:lesson.title,description:'개념을 익히고 직접 해 본 내용을 적어요.',available,recorded,
   reason:lesson.level>next?'앞의 학습 퀘스트를 먼저 마쳐 주세요.':`게임 Lv.${lesson.level}부터 시작할 수 있어요.`});
 }
 for(const level of missionLevels){
  const r=p.practical2[level],recorded=!!(r.submission||r.virtualAt||r.measurement);
  const history=r.started||recorded||Object.values(r.draft).some(Boolean)||Object.keys(r.findings).length>0||r.jumpers.length>0;
  list.push({id:'practical-'+level,kind:'practical',level,title:practicalTitles[level],description:level<=13?'화면 속 보드로 연습해요.':'실제 보드와 센서가 필요해요.',
   available:p.level>=level||history||level===11&&p.stage1.bossCleared,recorded,reason:`게임 Lv.${level}부터 시작할 수 있어요.`});
 }
 return list;
}
