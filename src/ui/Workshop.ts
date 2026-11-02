export function installWorkshop(onOpen: () => void, onClose: () => void) {
  const entry = document.createElement('button');
  entry.textContent = '기술자 마을 · 정비소 방문';
  document.querySelector('footer')!.before(entry);
  const panel = document.createElement('dialog');
  panel.className = 'workshop';
  panel.setAttribute('aria-labelledby', 'workshop-title');
  panel.innerHTML = `<small>기술자 마을 / 정비소</small><h2 id="workshop-title">수리 로봇의 볼트를 찾아라</h2>
    <p>정비공의 의뢰 · 도면을 측정하고 로봇 관절에 맞는 실제 볼트를 골라 주세요.</p>
    <p><b>축척 1:2</b> · 도면 길이 : 실물 길이</p>
    <svg viewBox="0 0 270 70" role="img" aria-label="볼트 머리 아래부터 끝까지 측정하는 축척 도면"><rect x="28" y="10" width="12" height="36" fill="#abc9bc"/><path d="M40 20h80v16H40z" fill="#abc9bc"/>
    <g data-ruler hidden stroke="currentColor" fill="none"><path d="M40 39v25m80-25v25M40 57h80m-80 0 5-3m-5 3 5 3m75-3-5-3m5 3-5 3"/></g></svg>
    <button data-measure>X · 도면 자로 측정</button><p data-reading aria-live="polite"></p>
    <fieldset disabled><legend>부품함 · 실제 볼트 길이</legend></fieldset>
    <p data-status role="status"></p><section data-result hidden><h3>완성 도면 · 기입 치수 20 mm</h3>
    <p>아래는 모두 같은 볼트입니다. 도면에서 잰 길이만 달라집니다.</p></section>
    <button data-close>숲으로 돌아가기</button>`;
  document.body.append(panel);
  const find = <T extends Element>(selector: string) => panel.querySelector<T>(selector)!;
  const parts = find<HTMLFieldSetElement>('fieldset');
  const result = find<HTMLElement>('[data-result]');
  const reading = find<HTMLElement>('[data-reading]');
  const status = find<HTMLElement>('[data-status]');
  for (const [scale, length] of [['축척 1:2', 10], ['현척 1:1', 20], ['배척 2:1', 40]] as const) {
    const row = document.createElement('p');
    row.textContent = scale + ' · 도면 ' + length + ' mm';
    const bar = document.createElement('i');
    bar.style.width = length * 4 + 'px';
    row.append(bar);
    result.append(row);
  }
  function measure() {
    if (!result.hidden) return;
    find('[data-ruler]').removeAttribute('hidden');
    reading.textContent = '도면 자 측정값 · 10 mm';
    parts.disabled = false;
  }
  for (const length of [5, 10, 20]) {
    const button = document.createElement('button');
    button.textContent = length + ' mm';
    parts.append(button);
    button.onclick = () => {
      if (length !== 20) {
        status.textContent = length === 10 ? '10 mm는 도면에서 잰 길이예요. 실물은 그 두 배입니다.' : '1:2에서는 실물이 도면보다 길어요. 다시 골라 보세요.';
        return;
      }
      status.textContent = '수리 성공! 20 mm 볼트가 맞물려 로봇 관절이 다시 움직입니다.';
      parts.disabled = true;
      result.hidden = false;
      reading.textContent = '기입 치수 20 mm · 도면에서 잰 길이 10 mm';
      find('svg').insertAdjacentHTML('beforeend', '<text x="80" y="54" fill="currentColor" text-anchor="middle" font-size="12">20</text>');
    };
  }
  find<HTMLButtonElement>('[data-measure]').onclick = measure;
  panel.addEventListener('keydown', event => { if (event.code === 'KeyX') { event.stopPropagation(); measure(); } });
  entry.onclick = () => { onOpen(); panel.showModal(); };
  find<HTMLButtonElement>('[data-close]').onclick = () => panel.close();
  panel.addEventListener('close', onClose);
}
