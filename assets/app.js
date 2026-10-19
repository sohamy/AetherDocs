/* Project Aether 기획서 — 탭, 지도, 도감 렌더링 */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* 저장 불가 환경 */ } },
  };

  const elBadge = id => { const e = ELEMENTS[id] || ELEMENTS.none; return `<span class="el" style="background:${e.color}"><i>${e.glyph}</i>${e.name}</span>`; };
  const gradeBadge = g => `<span class="grade" style="background:${(GRADES[g] || {}).color || '#888'}">${esc(g)}</span>`;
  const addBadge = on => on ? ' <span class="badge-add">보완</span>' : '';
  const regionName = id => id === 0 ? '전 지역(이벤트)' : (REGIONS.find(r => r.id === id) || {}).name;
  const artBg = c => `background:radial-gradient(circle at 50% 38%, ${c}33 0%, ${c}66 55%, ${c}cc 100%)`;

  /* ── 탭 · 해시 라우팅 ─────────────────── */
  const panels = $$('.panel').map(p => p.id);
  function activate(id, scrollTarget) {
    $$('.panel').forEach(p => p.classList.toggle('active', p.id === id));
    $$('.tab').forEach(t => {
      const on = t.dataset.tab === id;
      t.setAttribute('aria-selected', on);
      if (on) t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    if (scrollTarget) requestAnimationFrame(() => scrollTarget.scrollIntoView({ block: 'start' }));
    else window.scrollTo(0, 0);
  }
  function route() {
    const h = decodeURIComponent(location.hash.slice(1)) || 'overview';
    if (panels.includes(h)) return activate(h);
    const target = document.getElementById(h);
    const panel = target && target.closest('.panel');
    activate(panel ? panel.id : 'overview', target);
  }
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    if (location.hash === '#' + t.dataset.tab) activate(t.dataset.tab); else location.hash = t.dataset.tab;
  }));
  window.addEventListener('hashchange', route);
  // 상단 바 높이(탭 줄 수에 따라 바뀜)를 목차·스크롤 위치 계산에 쓴다
  const setHeadH = () => document.documentElement.style.setProperty('--head-h', $('.topbar').offsetHeight + 'px');
  setHeadH(); addEventListener('resize', setHeadH);

  /* ── 테마 ─────────────────────────────── */
  const themeBtn = $('#themeBtn');
  const isDark = () => document.documentElement.dataset.theme === 'dark' ||
    (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  const paintThemeBtn = () => { themeBtn.textContent = isDark() ? '☀️ 낮' : '🌙 밤하늘'; };
  const saved = store.get('aether-theme');
  if (saved) document.documentElement.dataset.theme = saved;
  paintThemeBtn();
  themeBtn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = next; store.set('aether-theme', next); paintThemeBtn();
  });

  /* ── 모달 · 라이트박스 ─────────────────── */
  const modal = $('#modal'), lightbox = $('#lightbox');
  [modal, lightbox].forEach(d => {
    d.addEventListener('click', e => { if (e.target === d || e.target.classList.contains('modal-close')) d.close(); });
  });
  function openModal(html) { $('#modalContent').innerHTML = html; modal.showModal(); modal.scrollTop = 0; const b = $('.modal-body', modal); if (b) b.scrollTop = 0; }
  function openImage(src, cap) { $('img', lightbox).src = src; $('img', lightbox).alt = cap; $('.cap', lightbox).textContent = cap; lightbox.showModal(); }
  document.addEventListener('click', e => {
    const z = e.target.closest('[data-zoom]');
    if (z) { e.preventDefault(); openImage(z.dataset.zoom, z.dataset.cap || ''); }
  });

  /* ── 개요: 하늘 · 출연진 · 문서 목록 ─────── */
  $('#heroCast').innerHTML = CHARACTERS.map(c =>
    `<figure data-char="${c.id}"><img src="${c.img}" alt="${c.name}" loading="eager"><figcaption>${c.name}<small>${c.role}</small></figcaption></figure>`).join('');
  $$('#heroCast figure').forEach(f => f.addEventListener('click', () => openChar(f.dataset.char)));

  (function sky() {
    const cv = $('#heroSky'), ctx = cv.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stars = [], w = 0, h = 0;
    function size() {
      const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1;
      w = r.width; h = r.height; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      stars = Array.from({ length: Math.round(w * h / 2600) }, () => ({ x: Math.random() * w, y: Math.random() * h * .8, r: Math.random() * 1.3 + .3, p: Math.random() * 6.28, s: Math.random() * .02 + .005 }));
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.p += s.s; const a = .35 + Math.sin(s.p) * .35 + .3;
        ctx.globalAlpha = Math.max(0, Math.min(1, a)); ctx.fillStyle = '#fff6dc';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      if (!reduce && $('#overview').classList.contains('active')) requestAnimationFrame(draw);
      else if (!reduce) setTimeout(() => requestAnimationFrame(draw), 400);
    }
    size(); draw(); addEventListener('resize', size);
  })();

  const DOCS = [
    ['world', '세계관', '에테르, 아스트라, 대낙성, 성좌와 계약, 연표'],
    ['lore', '생활 설정집', '음식, 옷, 집, 돈, 축제, 종족 문화, 시스템 → 세계관 답'],
    ['codex', '세계 백과', '역사, 지역 생활, 제도, 경제 설계, 결사, 자연, FAQ'],
    ['story', '스토리', '메인 미스터리, 장 구성, 반전, 네 주인공 관계'],
    ['growth', '성장 · 인크리멘탈', '5단계 해방, 재화, 공식, 시즌 초월'],
    ['items', '아이템 설계', '회복 음식, 배부름, 전용 재화 총람, 장비 슬롯·등급·강화, 재료 사전'],
    ['combat', '전투 · 직업', '자동사냥, 헌터와 파티, 4직업 8속성, 상성, 엘리트 AI'],
    ['guild', '별무리 · PvP', '길드, 영지, 성좌 전쟁, 천궁과 국왕'],
    ['map', '월드맵', '7개 지역, 마을, 지역 제작 기준'],
    ['content', '콘텐츠 · 운영', '퀘스트(튜토리얼), 수집, 둥지, 탈것, 생활, 등불 밝히기, 평판, 운영 달력, 랭킹, UI, 사운드, 결혼 · 별씨 아이, 외형 선택, 전직, BM 큰 틀'],
    ['chars', '캐릭터 도감', '탐사대 4인과 주요 NPC'],
    ['stars', '성좌 도감', '큰 성좌 10 + 사라진 일곱째 + 아스트라(빈자리)'],
    ['monsters', '몬스터 도감', `지역별 몬스터 ${MONSTERS.length}종`],
    ['pets', '펫 도감', `별동무 ${PETS.length}종`],
    ['forms', '변신 도감', `성현 ${FORMS.length}종`],
    ['art', '아트 디렉션', '키워드, 비율, 팔레트, 원화 갤러리'],
    ['roadmap', '로드맵', '확정 순서, 마일스톤, 미정 사항'],
  ];
  $('#docIndex').innerHTML = DOCS.map(([id, t, d]) =>
    `<a class="card" href="#${id}" style="text-decoration:none;color:inherit"><h4>${t} →</h4><p style="color:var(--muted);font-size:13.5px">${d}</p></a>`).join('');

  /* ── 전투: 직업 표 · 전직 · 상성 ─────────── */
  const CLASSES = [
    { cls: '검사(탱커)', hero: '루미', els: [['earth', '대지의 방패 — 도발, 기절, 받는 피해 감소'], ['light', '성스러운 힘 — 보호막, 치유의 빛']] },
    { cls: '궁수', hero: '포코', els: [['wind', '빠른 연사와 이동 — 다중 사격, 회피'], ['chaos', '혼돈 화살 — 튕기고 갈라지는 화살, 교란']] },
    { cls: '힐러', hero: '네무', els: [['water', '회복 — 지속 치유, 정화'], ['order', '질서 — 종소리 박자 회복, 보호막, 정화']] },
    { cls: '마법사', hero: '모리', els: [['fire', '화염 — 범위 폭발, 화상'], ['dark', '어둠 — 저주와 지속 피해, 달빛 없는 밤']] },
  ];
  $('#classTable').innerHTML = `<tr><th>직업</th><th>주인공</th><th>속성 A</th><th>속성 B</th></tr>` + CLASSES.map(c =>
    `<tr><td><b>${c.cls}</b></td><td>${c.hero}</td>${c.els.map(([e, d]) => `<td>${elBadge(e)}<br><span style="font-size:13px">${d}</span></td>`).join('')}</tr>`).join('');
  const ADV = [
    ['0차 · 견습', '시작', ['견습 검사', '견습 궁수', '견습 치유사', '견습 마법사']],
    ['1차 · 직업', 'Lv 40 · 1장', ['검사', '궁수', '힐러', '마법사']],
    ['2차 · 속성 선택', 'Lv 60 · 2장 · 공명 4', ['대지기사 / 성광기사', '바람사수 / 혼돈사수', '샘물사제 / 질서사제', '화염술사 / 그믐술사']],
    ['3차 · 속성 각성', 'Lv 100 · 4장 · 공명 7', ['반석수호자 / 여명수호자', '질풍사수 / 별똥사수', '생명의 샘 / 조율의 종', '홍염마도 / 칠흑마도']],
    ['4차 · 하늘 계약', '5장 · 공명 9', ['칭호 「(계약 성좌)의 검」', '「…의 화살」', '「…의 종」', '「…의 별」']],
  ];
  $('#advTable').innerHTML = `<tr><th>단계</th><th>조건</th><th>검사</th><th>궁수</th><th>힐러</th><th>마법사</th></tr>` +
    ADV.map(([s, c, a]) => `<tr><td><b>${s}</b></td><td class="num">${c}</td>${a.map(x => `<td>${x}</td>`).join('')}</tr>`).join('');

  (function ring() {
    // 왼쪽: 자연 고리(한 방향 순환) · 오른쪽: 하늘의 맞수 두 쌍(서로 ×1.3)
    let s = `<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--gold)"/></marker></defs>`;
    const node = (p, key) => { const e = ELEMENTS[key];
      return `<circle cx="${p[0]}" cy="${p[1]}" r="24" fill="${e.color}"/><text x="${p[0]}" y="${p[1] - 2}" text-anchor="middle" fill="#fff" font-size="14" font-family="Gowun Batang,serif" font-weight="700">${e.glyph}</text><text x="${p[0]}" y="${p[1] + 13}" text-anchor="middle" fill="#fff" font-size="10">${e.name}</text>`; };
    const line = (p, q, both) => { const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), m = 30 / L;
      return `<line x1="${p[0] + dx * m}" y1="${p[1] + dy * m}" x2="${q[0] - dx * m}" y2="${q[1] - dy * m}" stroke="var(--gold)" stroke-width="2" marker-end="url(#arr)"${both ? ' marker-start="url(#arr)"' : ''}/>`; };
    const order = ['water', 'fire', 'wind', 'earth'], cx = 92, cy = 112, R = 58;
    const pts = order.map((e, i) => { const ang = -Math.PI / 2 + i * Math.PI / 2; return [cx + R * Math.cos(ang), cy + R * Math.sin(ang)]; });
    s += `<text x="${cx}" y="22" text-anchor="middle" fill="var(--muted)" font-size="12" font-weight="700">땅의 넷 — 자연 고리</text>`;
    pts.forEach((p, i) => { s += line(p, pts[(i + 1) % 4]); });
    pts.forEach((p, i) => { s += node(p, order[i]); });
    s += `<text x="268" y="22" text-anchor="middle" fill="var(--muted)" font-size="12" font-weight="700">하늘의 넷 — 맞수 두 쌍</text>`;
    [[['light', 'dark'], 74], [['order', 'chaos'], 150]].forEach(([[a1, b1], y]) => {
      const p = [222, y], q = [314, y];
      s += line(p, q, true) + node(p, a1) + node(q, b1);
    });
    $('#ringSvg').innerHTML = s;
  })();

  /* ── 월드맵 ───────────────────────────── */
  const ICON = { 1: '🌾', 2: '🌳', 3: '💎', 4: '⚡', 5: '🏛️', 6: '☄️', 7: '🏰' };
  (function map() {
    const svg = $('#worldMap');
    let s = `<defs>
      <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151838"/><stop offset="1" stop-color="#2a2b63"/></linearGradient>
      <linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efe5cc"/><stop offset="1" stop-color="#ddcfae"/></linearGradient>
      ${REGIONS.map(r => `<radialGradient id="rg${r.id}"><stop offset="0" stop-color="${r.color}" stop-opacity=".75"/><stop offset="1" stop-color="${r.color}" stop-opacity="0"/></radialGradient>`).join('')}</defs>
      <rect width="1000" height="640" fill="url(#sea)"/>`;
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 140; i++) s += `<circle cx="${rnd() * 1000}" cy="${rnd() * 640}" r="${rnd() * 1.4 + .3}" fill="#fff6dc" opacity="${rnd() * .6 + .2}"/>`;
    s += `<path d="M80,520 C60,430 140,360 200,300 C250,240 320,200 410,210 C500,220 560,170 640,170 C730,170 800,230 860,280 C930,340 985,430 965,525 C945,605 860,632 760,622 C650,612 560,600 460,592 C360,584 260,604 180,592 C120,584 92,562 80,520 Z" fill="url(#land)" stroke="#c9b68a" stroke-width="3"/>`;
    s += `<ellipse cx="870" cy="118" rx="96" ry="44" fill="#efe5cc" stroke="#e0c26a" stroke-width="3"/><path d="M790,128 Q870,190 950,128" fill="#c9b68a" opacity=".6"/>`;
    REGIONS.forEach(r => { s += `<circle cx="${r.x}" cy="${r.y}" r="${r.id === 7 ? 70 : 92}" fill="url(#rg${r.id})"/>`; });
    const P = REGIONS.map(r => [r.x, r.y]);
    let d = `M${P[0][0]},${P[0][1]}`;
    for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i]; d += ` Q${(a[0] + b[0]) / 2 + (i % 2 ? 40 : -40)},${(a[1] + b[1]) / 2 + (i % 2 ? -30 : 30)} ${b[0]},${b[1]}`; }
    s += `<path d="${d}" fill="none" stroke="#b8892f" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>`;
    REGIONS.forEach(r => {
      s += `<g class="map-node" tabindex="0" role="button" aria-label="${r.id}. ${r.name}" data-region="${r.id}">
        <circle cx="${r.x}" cy="${r.y}" r="36" fill="url(#rg${r.id})"/>
        <circle class="ring" cx="${r.x}" cy="${r.y}" r="27" fill="#fffaf0" stroke="${r.color}" stroke-width="4"/>
        <text x="${r.x}" y="${r.y + 8}" text-anchor="middle" font-size="22">${ICON[r.id]}</text>
        <rect x="${r.x - 62}" y="${r.y + 34}" width="124" height="24" rx="12" fill="#2b2d5c" opacity=".88"/>
        <text x="${r.x}" y="${r.y + 51}" text-anchor="middle" font-size="13" fill="#f7f1e3" font-family="Gowun Batang,serif" font-weight="700">${r.id}. ${r.name}</text></g>`;
    });
    s += `<text x="24" y="40" fill="#f1cf7a" font-family="Gowun Batang,serif" font-size="22" font-weight="700">에테르 · Aether</text><text x="24" y="62" fill="#f7f1e3" opacity=".6" font-size="12">별이 떨어진 자리들을 따라가는 여행</text>`;
    svg.innerHTML = s;
    $$('.map-node', svg).forEach(n => {
      n.addEventListener('click', () => showRegion(+n.dataset.region));
      n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showRegion(+n.dataset.region); } });
    });
  })();
  $('#regionList').innerHTML = REGIONS.map(r =>
    `<button class="card region-row" data-region="${r.id}"><span class="num" style="background:${r.color}">${r.id}</span><span><b style="font-family:var(--serif);font-size:16px">${r.name}</b>${addBadge(r.added)} <span class="chip">Lv ${r.lv}</span><br><span style="font-size:13px;color:var(--muted)">${r.elements.map(e => ELEMENTS[e].name).join(' · ')} · ${r.stage} · 중심: ${r.hero}</span></span></button>`).join('');
  $$('#regionList .region-row').forEach(b => b.addEventListener('click', () => { showRegion(+b.dataset.region); if (innerWidth <= 1024) $('#regionDetail').scrollIntoView({ block: 'start' }); }));
  function showRegion(id) {
    const r = REGIONS.find(x => x.id === id);
    const mons = MONSTERS.filter(m => m.region === id);
    $$('#regionList .region-row').forEach(b => b.setAttribute('aria-current', +b.dataset.region === id));
    $('#regionDetail').innerHTML = `
      <div class="k">REGION ${r.id} · ${r.en}</div>
      <h3>${ICON[r.id]} ${r.name}${addBadge(r.added)}</h3>
      <div class="row" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px"><span class="chip">Lv ${r.lv}</span>${r.elements.map(elBadge).join('')}<span class="chip">성장 단계: ${r.stage}</span></div>
      <p>${r.desc}</p>
      <h4 style="margin-top:12px">이야기</h4><p>${r.story}</p>
      <h4>시스템</h4><p>${r.feature}</p>
      <h4>랜드마크</h4><ul style="padding-left:18px;margin:4px 0 12px">${r.landmarks.map(l => `<li>${l}</li>`).join('')}</ul>
      <h4>출현 몬스터 <span style="font-weight:400;color:var(--muted);font-size:13px">${mons.length}종</span></h4>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">${mons.map(m => `<button class="chip" style="cursor:pointer" data-mon="${MONSTERS.indexOf(m)}">${m.emoji} ${m.name}</button>`).join('')}</div>`;
    $$('#regionDetail [data-mon]').forEach(b => b.addEventListener('click', () => openMonster(+b.dataset.mon)));
  }
  showRegion(1);
  $('#villageGrid').innerHTML = VILLAGE.map(v => `<div class="card"><h4>${v.icon} ${v.name}</h4><div class="k">NPC · ${v.npc}</div><p style="font-size:14px">${v.func}</p></div>`).join('');

  /* ── 캐릭터 도감 ──────────────────────── */
  $('#charCount').textContent = `주인공 ${CHARACTERS.length} · NPC ${NPCS.length}`;
  $('#charGrid').innerHTML = CHARACTERS.map(c => `
    <button class="char-card" data-char="${c.id}">
      <div class="portrait"><span class="kw">${c.keyword}</span><img src="${c.img}" alt="${c.name}" loading="lazy"></div>
      <div class="body"><h4>${c.name} <span style="font-family:var(--sans);font-size:12px;color:var(--muted)">${c.en}</span></h4>
        <div class="role">${c.role} · ${c.species}</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${c.elements.map(elBadge).join('')}</div>
        <q>${c.quotes[0]}</q></div>
    </button>`).join('');
  $$('#charGrid .char-card').forEach(b => b.addEventListener('click', () => openChar(b.dataset.char)));
  const sheetSrc = k => `assets/img/sheets/${k}.webp`;
  const sheetTitle = k => (SHEETS.find(s => s.key === k) || {}).title || k;
  function openChar(id) {
    const c = CHARACTERS.find(x => x.id === id);
    openModal(`<div class="modal-inner">
      <div class="modal-art" style="background:linear-gradient(180deg,#fbf3e6,#e9d9bd)"><img src="${c.img}" alt="${c.name}"></div>
      <div class="modal-body">
        <div class="k" style="color:var(--muted);font-size:12px">${c.en} · ${c.role}</div>
        <h2>${c.name}</h2>
        <div class="row">${c.elements.map(elBadge).join('')}<span class="chip">★ ${c.star}</span><span class="chip">${c.keyword} 담당</span></div>
        <div class="swatches">${c.colors.map(x => `<span class="swatch" style="background:${x}" title="${x}"></span>`).join('')}</div>
        <dl>
          <dt>종족</dt><dd>${c.species}</dd><dt>키</dt><dd>${c.height}</dd>
          <dt>성격</dt><dd>${c.personality}</dd>
          <dt>디자인</dt><dd>${c.design.join(' · ')}</dd>
          <dt>좋아함</dt><dd>${c.likes}</dd><dt>싫어함</dt><dd>${c.dislikes}</dd>
          <dt>세계관 역할</dt><dd>${c.lore}</dd>
          <dt>전투</dt><dd>${c.combat}</dd>
        </dl>
        <div class="quotes">${c.quotes.map(q => `<q>${q}</q>`).join('')}</div>
        <div class="secret">${c.secret}</div>
        <h4 style="margin:16px 0 8px">원화</h4>
        <div class="mini-gallery">${c.sheets.map(k => `<img src="${sheetSrc(k)}" alt="${sheetTitle(k)}" data-zoom="${sheetSrc(k)}" data-cap="${c.name} · ${sheetTitle(k)}" loading="lazy">`).join('')}</div>
      </div></div>`);
  }
  $('#npcGrid').innerHTML = NPCS.map(n => `<div class="card npc"><div class="emo">${n.emoji}</div><div><h4>${n.name}</h4><div class="role">${n.species} · ${n.role}</div><p>${n.desc}</p><q>${n.quote}</q></div></div>`).join('');

  /* ── 성좌 도감 ────────────────────────── */
  function constellationSvg(c, big) {
    const k = .625, locked = c.locked;
    const col = locked ? '#8a86a0' : (c.element === 'none' ? '#f1cf7a' : ELEMENTS[c.element].color);
    let s = `<svg viewBox="0 0 100 62.5" ${big ? 'style="width:100%;height:auto"' : ''} aria-hidden="true">`;
    let seed = c.id.length * 97 + c.id.charCodeAt(0); const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 40; i++) s += `<circle cx="${rnd() * 100}" cy="${rnd() * 62.5}" r="${rnd() * .35 + .1}" fill="#fff" opacity="${rnd() * .5 + .15}"/>`;
    c.lines.forEach(([a, b]) => { const p = c.stars[a], q = c.stars[b];
      s += `<line x1="${p[0]}" y1="${p[1] * k}" x2="${q[0]}" y2="${q[1] * k}" stroke="${col}" stroke-width=".5" opacity=".8"/>`; });
    if (c.dashed) { const pts = c.stars.map(p => `${p[0]},${p[1] * k}`).join(' ');
      s += `<polygon points="${pts}" fill="none" stroke="#f1cf7a" stroke-width=".4" stroke-dasharray="1 1.5" opacity=".6"/>`; }
    c.stars.forEach((p, i) => {
      const r = i === 0 || (c.id === 'astra' && i === 0) ? 1.6 : 1.1;
      s += `<circle cx="${p[0]}" cy="${p[1] * k}" r="${r * 2.4}" fill="${col}" opacity=".25"/><circle cx="${p[0]}" cy="${p[1] * k}" r="${r}" fill="${c.dashed ? 'none' : '#fff8e1'}" stroke="${c.dashed ? '#f1cf7a' : 'none'}" stroke-width=".3"/>`;
    });
    if (locked) s += `<text x="50" y="36" text-anchor="middle" font-size="12" fill="#cfc8e8" font-family="Gowun Batang,serif">?</text>`;
    return s + '</svg>';
  }
  const starFilter = { group: 'all' };
  const STAR_GROUPS = [['all', '전체'], ['element', '속성 성좌'], ['special', '특수 성좌']];
  $('#starCount').textContent = `${CONSTELLATIONS.length}좌`;
  $('#starFilters').innerHTML = `<div class="filter-row">${STAR_GROUPS.map(([k, t]) => `<button class="filter" data-g="${k}" aria-pressed="${k === 'all'}">${t}</button>`).join('')}</div>`;
  $$('#starFilters .filter').forEach(b => b.addEventListener('click', () => {
    starFilter.group = b.dataset.g; $$('#starFilters .filter').forEach(x => x.setAttribute('aria-pressed', x === b)); renderStars();
  }));
  function renderStars() {
    const list = CONSTELLATIONS.filter(c => starFilter.group === 'all' || (starFilter.group === 'element') === (c.element !== 'none'));
    $('#starGrid').innerHTML = list.map(c => `
      <button class="star-card" data-star="${c.id}">
        <div class="star-sky">${constellationSvg(c)}<span class="title">${c.title}</span></div>
        <div class="body"><h4>${c.name} ${c.element !== 'none' ? elBadge(c.element) : '<span class="chip">특수</span>'}${addBadge(c.added)}</h4>
          <div class="sub">${c.motif} · 계약자: ${c.contractor}</div></div>
      </button>`).join('');
    $$('#starGrid .star-card').forEach(b => b.addEventListener('click', () => openStar(b.dataset.star)));
  }
  renderStars();
  function openStar(id) {
    const c = CONSTELLATIONS.find(x => x.id === id);
    openModal(`<div class="modal-inner">
      <div class="modal-art star-sky" style="aspect-ratio:auto">${constellationSvg(c, true)}</div>
      <div class="modal-body">
        <div class="k" style="color:var(--muted);font-size:12px">${c.title}</div>
        <h2>${c.name}</h2>
        <div class="row">${c.element !== 'none' ? elBadge(c.element) : '<span class="chip">특수 성좌</span>'}<span class="chip">상징: ${c.motif}</span></div>
        <dl><dt>성격</dt><dd>${c.personality}</dd><dt>대표 계약자</dt><dd>${c.contractor}</dd>
          <dt>계약 효과</dt><dd>${c.pact}</dd><dt>별무리 버프</dt><dd>${c.guild}</dd></dl>
        <div class="secret">${c.secret}</div>
      </div></div>`);
  }

  /* ── 공통 도감 (몬스터 · 펫 · 변신) ───────── */
  function dex({ list, grid, count, tools, filters, card, open, unit }) {
    const state = { q: '' }; filters.forEach(f => state[f.key] = 'all');
    $(tools).innerHTML = `<input type="search" placeholder="이름·설명 검색" aria-label="검색">` + filters.map(f =>
      `<div class="filter-row"><span class="lbl">${f.label}</span><button class="filter" data-k="${f.key}" data-v="all" aria-pressed="true">전체</button>${f.options.map(([v, t]) => `<button class="filter" data-k="${f.key}" data-v="${v}" aria-pressed="false">${t}</button>`).join('')}</div>`).join('');
    $(`${tools} input`).addEventListener('input', e => { state.q = e.target.value.trim(); render(); });
    $$(`${tools} .filter`).forEach(b => b.addEventListener('click', () => {
      state[b.dataset.k] = b.dataset.v;
      $$(`${tools} .filter[data-k="${b.dataset.k}"]`).forEach(x => x.setAttribute('aria-pressed', x === b)); render();
    }));
    function render() {
      const items = list.map((x, i) => [x, i]).filter(([x]) =>
        filters.every(f => state[f.key] === 'all' || String(f.get(x)) === state[f.key]) &&
        (!state.q || (x.name + x.desc).includes(state.q)));
      $(count).textContent = `${items.length} / ${list.length}${unit}`;
      $(grid).innerHTML = items.length ? items.map(([x, i]) => card(x, i)).join('') : `<p style="color:var(--muted)">조건에 맞는 항목이 없다.</p>`;
      $$(`${grid} .dex-card`).forEach(b => b.addEventListener('click', () => open(+b.dataset.i)));
    }
    render();
  }
  const usedElements = arr => Object.keys(ELEMENTS).filter(k => arr.some(x => x.element === k)).map(k => [k, ELEMENTS[k].name]);
  const usedGrades = arr => Object.keys(GRADES).filter(g => arr.some(x => x.grade === g)).map(g => [g, g]);
  const dexCard = (x, i, sub) => {
    const c = (ELEMENTS[x.element] || ELEMENTS.none).color;
    return `<button class="dex-card" data-i="${i}">
      <div class="dex-art${x.locked ? ' locked' : ''}" style="${artBg(c)}"><span class="no">No.${String(i + 1).padStart(3, '0')}</span><span class="tag">${gradeBadge(x.grade)}</span>${x.img ? `<img class="dex-img" src="${x.img}" alt="${esc(x.name)}" loading="lazy">` : `<span class="emo">${x.emoji}</span>`}</div>
      <div class="dex-info"><h4>${x.locked ? '???' : esc(x.name)}${addBadge(x.added)}</h4><div class="row">${elBadge(x.element)}${sub}</div><div class="sub">${x.locked ? '아직 밝혀지지 않았다.' : esc(x.desc)}</div></div></button>`;
  };
  const dexModal = (x, i, label, rows) => {
    const c = (ELEMENTS[x.element] || ELEMENTS.none).color;
    openModal(`<div class="modal-inner">
      <div class="modal-art${x.locked ? ' locked' : ''}${x.img ? ' has-img' : ''}" style="${artBg(c)}">${x.img
        ? `<img src="${x.img}" alt="${esc(x.name)}" data-zoom="${x.img}" data-cap="${esc(x.name)} · 컨셉아트">`
        : `<span class="emo" style="${x.locked ? 'filter:grayscale(1) brightness(.35)' : ''}">${x.emoji}</span>`}</div>
      <div class="modal-body">
        <div class="k" style="color:var(--muted);font-size:12px">${label} No.${String(i + 1).padStart(3, '0')}</div>
        <h2>${x.locked ? '???' : esc(x.name)}</h2>
        <div class="row">${gradeBadge(x.grade)}${elBadge(x.element)}${x.added ? '<span class="badge-add">보완</span>' : ''}</div>
        <p>${x.locked ? '아직 밝혀지지 않았다. 8장(결말)과 함께 공개된다.' : esc(x.desc)}</p>
        <dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
        ${x.gallery ? `<h4 style="margin:16px 0 8px">원화</h4><div class="mini-gallery">${x.gallery.map(([src, cap]) =>
          `<figure style="margin:0"><img src="${src}" alt="${esc(x.name)} ${cap}" data-zoom="${src}" data-cap="${esc(x.name)} · ${cap}" loading="lazy"><figcaption style="font-size:12px;color:var(--muted);margin-top:4px">${cap}</figcaption></figure>`).join('')}</div>` : ''}
        <p style="font-size:12.5px;color:var(--muted);margin-top:14px">${x.img ? '※ 그림을 누르면 크게 볼 수 있다' : '※ 아이콘은 원화 제작 전 임시 표시'}</p>
      </div></div>`);
  };

  function openMonster(i) {
    const m = MONSTERS[i];
    dexModal(m, i, '몬스터', [
      ['지역', regionName(m.region)], ['레벨', m.lv], ...(m.trait ? [['성격', m.trait]] : []),
      ['행동', esc(m.behavior)], ['드롭', m.drops.map(d => `<span class="chip">${esc(d)}</span>`).join(' ')],
    ]);
  }
  dex({
    list: MONSTERS, grid: '#monGrid', count: '#monCount', tools: '#monFilters', unit: '종', open: openMonster,
    filters: [
      { key: 'region', label: '지역', get: m => m.region, options: [...REGIONS.map(r => [r.id, `${r.id}. ${r.name}`]), [0, '이벤트']] },
      { key: 'element', label: '속성', get: m => m.element, options: usedElements(MONSTERS) },
      { key: 'grade', label: '등급', get: m => m.grade, options: usedGrades(MONSTERS) },
    ],
    card: (m, i) => dexCard(m, i, `<span class="chip">Lv ${m.lv}</span>${m.trait ? `<span class="chip">${m.trait}</span>` : ''}`),
  });

  dex({
    list: PETS, grid: '#petGrid', count: '#petCount', tools: '#petFilters', unit: '종',
    open: i => { const p = PETS[i]; dexModal(p, i, '펫', [['획득처', p.source], ['보유 효과', p.own], ['동행 효과', p.with]]); },
    filters: [
      { key: 'grade', label: '등급', get: p => p.grade, options: usedGrades(PETS) },
      { key: 'element', label: '속성', get: p => p.element, options: usedElements(PETS) },
    ],
    card: (p, i) => dexCard(p, i, `<span class="chip">보유 ${p.locked ? '???' : esc(p.own)}</span>`),
  });

  dex({
    list: FORMS, grid: '#formGrid', count: '#formCount', tools: '#formFilters', unit: '종',
    open: i => { const f = FORMS[i]; dexModal(f, i, '변신', [['성좌', f.star], ['획득처', f.source], ['보유 효과', f.own], ['장착 효과', f.equip]]); },
    filters: [
      { key: 'grade', label: '등급', get: f => f.grade, options: usedGrades(FORMS) },
      { key: 'element', label: '속성', get: f => f.element, options: usedElements(FORMS) },
    ],
    card: (f, i) => dexCard(f, i, f.star !== '—' ? `<span class="chip">★ ${f.star}</span>` : ''),
  });

  /* ── 아트: 팔레트 · 갤러리 ─────────────── */
  $('#paletteGrid').innerHTML = CHARACTERS.map(c => `<div class="card"><h4>${c.name}</h4><div class="k" style="margin-bottom:8px">${c.species}</div><div class="swatches">${c.colors.map(x => `<span class="swatch" style="background:${x}" title="${x}"></span>`).join('')}</div></div>`).join('');
  const galState = { who: 'all' };
  const whos = [...new Set(SHEETS.map(s => s.who))];
  $('#galFilters').innerHTML = `<div class="filter-row"><button class="filter" data-w="all" aria-pressed="true">전체</button>${whos.map(w => `<button class="filter" data-w="${w}" aria-pressed="false">${w}</button>`).join('')}</div>`;
  $$('#galFilters .filter').forEach(b => b.addEventListener('click', () => {
    galState.who = b.dataset.w; $$('#galFilters .filter').forEach(x => x.setAttribute('aria-pressed', x === b)); renderGallery();
  }));
  function renderGallery() {
    $('#gallery').innerHTML = SHEETS.filter(s => galState.who === 'all' || s.who === galState.who).map(s =>
      `<button data-zoom="${(s.src || sheetSrc(s.key))}" data-cap="${s.who} · ${s.title}"><img src="${(s.src || sheetSrc(s.key))}" alt="${s.who} ${s.title}" loading="lazy"><div class="cap"><b>${s.who}</b>${s.title}</div></button>`).join('');
  }
  renderGallery();

  /* ── 아이템: 재료 사전 ─────────────────── */
  (function dropTable() {
    const map = new Map();
    MONSTERS.forEach(m => m.drops.forEach(dr => { if (!map.has(dr)) map.set(dr, []); map.get(dr).push(m.name); }));
    const rows = [...map.entries()].filter(([dr]) => DROP_USES[dr] !== '—');
    const missing = rows.filter(([dr]) => !DROP_USES[dr]).length;
    $('#dropTable').innerHTML = `<tr><th>드롭 (${rows.length}종${missing ? ` · 미정 ${missing}` : ''})</th><th>나오는 곳</th><th>쓰임</th></tr>` + rows.map(([dr, ms]) =>
      `<tr><td>${esc(dr)}</td><td style="font-size:13px;color:var(--muted)">${ms.map(esc).join(', ')}</td><td>${DROP_USES[dr] ? esc(DROP_USES[dr]) : '<b style="color:#c4573d">미정</b>'}</td></tr>`).join('');
  })();

  route();
})();
