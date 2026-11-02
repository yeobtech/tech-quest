import { students, studentArt, type Student } from '../data/characterArt';

export function chooseStudent(start: (id: Student) => void) {
  const key = 'tech-quest:student:v1';
  let current: Student = 'boy';
  try { if (localStorage.getItem(key) === 'girl') current = 'girl'; } catch { /* session only */ }
  const dialog = document.createElement('dialog');
  dialog.className = 'workshop student-picker';
  dialog.setAttribute('aria-label', '견습 기술자 선택');
  dialog.innerHTML = '<small>TECH QUEST</small><h2>견습 기술자 선택</h2><p>안전가위를 들고 모험을 시작하세요. 두 학생의 능력치는 같습니다.</p>';
  const choices = document.createElement('fieldset');
  choices.innerHTML = '<legend>캐릭터</legend>';
  for (const id of ['boy','girl'] as const) {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio'; radio.name = 'student'; radio.checked = current === id;
    radio.onchange = () => { current = id; };
    const portrait = document.createElement('span');
    portrait.className = 'student-preview';
    portrait.style.backgroundImage = 'url(' + studentArt(id, 'idle') + ')';
    label.append(radio, portrait, students[id]);
    choices.append(label);
  }
  const enter = document.createElement('button');
  enter.textContent = '선택한 학생으로 시작';
  enter.onclick = () => {
    try { localStorage.setItem(key, current); } catch { /* session only */ }
    dialog.close(); dialog.remove(); start(current);
  };
  dialog.addEventListener('cancel', e => e.preventDefault());
  dialog.append(choices, enter); document.body.append(dialog); dialog.showModal();
}
