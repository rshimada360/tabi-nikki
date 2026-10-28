'use strict';

/* ================= 都道府県 ================= */
const PREF_NAMES = ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県',
  '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県',
  '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県',
  '大分県', '宮崎県', '鹿児島県', '沖縄県'];
const PREF_ROMAJI = ['HOKKAIDO', 'AOMORI', 'IWATE', 'MIYAGI', 'AKITA', 'YAMAGATA', 'FUKUSHIMA', 'IBARAKI', 'TOCHIGI',
  'GUNMA', 'SAITAMA', 'CHIBA', 'TOKYO', 'KANAGAWA', 'NIIGATA', 'TOYAMA', 'ISHIKAWA', 'FUKUI', 'YAMANASHI', 'NAGANO',
  'GIFU', 'SHIZUOKA', 'AICHI', 'MIE', 'SHIGA', 'KYOTO', 'OSAKA', 'HYOGO', 'NARA', 'WAKAYAMA', 'TOTTORI', 'SHIMANE',
  'OKAYAMA', 'HIROSHIMA', 'YAMAGUCHI', 'TOKUSHIMA', 'KAGAWA', 'EHIME', 'KOCHI', 'FUKUOKA', 'SAGA', 'NAGASAKI',
  'KUMAMOTO', 'OITA', 'MIYAZAKI', 'KAGOSHIMA', 'OKINAWA'];
const REGIONS = [
  ['北海道・東北', 1, 7], ['関東', 8, 14], ['中部', 15, 23], ['近畿', 24, 30],
  ['中国', 31, 35], ['四国', 36, 39], ['九州・沖縄', 40, 47],
];
const prefName = id => PREF_NAMES[id - 1];

/* ================= 保存（IndexedDB） ================= */
const DB = (() => {
  let dbp;
  const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const done = t => new Promise((res, rej) => { t.oncomplete = () => res(); t.onerror = t.onabort = () => rej(t.error); });
  function open() {
    if (!dbp) dbp = new Promise((res, rej) => {
      const r = indexedDB.open('tabi-nikki', 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        db.createObjectStore('items', { keyPath: 'id' }).createIndex('pref', 'pref');
        db.createObjectStore('blobs');
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function store(name, mode = 'readonly') {
    return (await open()).transaction(name, mode).objectStore(name);
  }
  return {
    async counts() {
      const idx = (await store('items')).index('pref');
      const out = {};
      await Promise.all(PREF_NAMES.map((_, i) => req(idx.count(i + 1)).then(n => { out[i + 1] = n; })));
      return out;
    },
    async list(pref) { return req((await store('items')).index('pref').getAll(pref)); },
    async blob(id) { return req((await store('blobs')).get(id)); },
    async put(item) { return req((await store('items', 'readwrite')).put(item)); },
    async add(item, blob) {
      const t = (await open()).transaction(['items', 'blobs'], 'readwrite');
      t.objectStore('items').put(item);
      t.objectStore('blobs').put(blob, item.id);
      return done(t);
    },
    async remove(id) {
      const t = (await open()).transaction(['items', 'blobs'], 'readwrite');
      t.objectStore('items').delete(id);
      t.objectStore('blobs').delete(id);
      return done(t);
    },
  };
})();

/* ================= 小道具 ================= */
const $ = s => document.querySelector(s);
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v);
  }
  for (const kid of kids) if (kid != null) el.append(kid);
  return el;
}
const SVGNS = 'http://www.w3.org/2000/svg';
function s(tag, attrs = {}) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}
function seeded(str) {
  let a = 2166136261;
  for (let i = 0; i < str.length; i++) a = Math.imul(a ^ str.charCodeAt(i), 16777619);
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pad = n => String(n).padStart(2, '0');
const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
const dayKey = t => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fmtDate = t => { const d = new Date(t); return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`; };
const fmtDay = t => { const d = new Date(t); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WEEK[d.getDay()]}）`; };
const filmDate = t => { const d = new Date(t); return `'${pad(d.getFullYear() % 100)} ${d.getMonth() + 1} ${d.getDate()}`; };
const fmtDur = sec => `${Math.floor(sec / 60)}:${pad(Math.round(sec % 60))}`;

let toastTimer;
function toast(msg, ms = 2200) {
  const el = $('#toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  if (ms) toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

/* ================= 地図 ================= */
const PREF_CENTERS = {};
function buildMap() {
  const svg = $('#map');
  const [x, y, w, hh] = JAPAN_MAP.viewBox;
  svg.setAttribute('viewBox', `${x} ${y} ${w} ${hh}`);
  // 沖縄・奄美の枠
  svg.append(s('rect', { class: 'inset', x: 132, y: 272, width: 622, height: 496, rx: 6 }));
  const label = s('text', { class: 'inset-label', x: 148, y: 752 });
  label.textContent = '沖縄・奄美';
  svg.append(label);
  const compass = s('text', { class: 'compass', x: 1560, y: 1560 });
  compass.textContent = 'N ↑';
  svg.append(compass);

  for (const [id, d] of Object.entries(JAPAN_MAP.paths)) {
    const p = s('path', { d, class: 'pref', 'data-pref': id });
    const t = s('title'); t.textContent = prefName(+id); p.append(t);
    svg.append(p);
    PREF_CENTERS[id] = centerOfLargest(d);
  }
  svg.append(s('g', { id: 'stamps' }));
  setupMapGestures($('#mapWrap'), svg);
}
// いちばん大きな島の中心に訪問印を置く
function centerOfLargest(d) {
  let best = null;
  for (const sub of d.split('Z')) {
    if (!sub) continue;
    const pts = sub.slice(1).split('L').map(v => v.split(',').map(Number));
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [px, py] of pts) { x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }
    const a = (x1 - x0) * (y1 - y0);
    if (!best || a > best.a) best = { a, x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
  }
  return best;
}

function setupMapGestures(wrap, svg) {
  let sc = 1, tx = 0, ty = 0;
  const pts = new Map();
  let drag = null, pinch = null, moved = false, target = null;

  const apply = () => { svg.style.transform = `translate(${tx}px, ${ty}px) scale(${sc})`; };
  const clamp = () => {
    const w = wrap.clientWidth, hh = wrap.clientHeight;
    sc = Math.min(10, Math.max(1, sc));
    tx = Math.min(0, Math.max(w - w * sc, tx));
    ty = Math.min(0, Math.max(hh - hh * sc, ty));
  };
  const local = e => { const r = wrap.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const zoomAt = (nsc, cx, cy) => {
    const px = (cx - tx) / sc, py = (cy - ty) / sc;
    sc = nsc; tx = cx - px * sc; ty = cy - py * sc;
    clamp(); apply();
  };
  const unpress = () => { if (target) target.classList.remove('pressed'); };

  wrap.addEventListener('pointerdown', e => {
    wrap.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, local(e));
    if (pts.size === 1) {
      const p = local(e);
      drag = { x: p.x, y: p.y, tx, ty };
      moved = false;
      target = e.target.closest ? e.target.closest('[data-pref]') : null;
      if (target) target.classList.add('pressed');
    } else if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), sc, tx, ty, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      moved = true; unpress();
    }
  });
  wrap.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, local(e));
    if (pts.size >= 2 && pinch) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const px = (pinch.mx - pinch.tx) / pinch.sc, py = (pinch.my - pinch.ty) / pinch.sc;
      sc = pinch.sc * d / pinch.d;
      tx = mx - px * sc; ty = my - py * sc;
      clamp(); apply();
    } else if (drag) {
      const p = local(e);
      const dx = p.x - drag.x, dy = p.y - drag.y;
      if (!moved && Math.hypot(dx, dy) > 8) { moved = true; unpress(); }
      if (moved) { tx = drag.tx + dx; ty = drag.ty + dy; clamp(); apply(); }
    }
  });
  const end = e => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size === 1) {
      // ピンチ後に残った指でそのままドラッグを続ける
      const [p] = [...pts.values()];
      drag = { x: p.x, y: p.y, tx, ty }; pinch = null;
    } else if (pts.size === 0) {
      unpress();
      if (!moved && target && e.type === 'pointerup') location.hash = `#/pref/${target.dataset.pref}`;
      drag = pinch = target = null;
    }
  };
  wrap.addEventListener('pointerup', end);
  wrap.addEventListener('pointercancel', end);
  wrap.addEventListener('wheel', e => {
    e.preventDefault();
    const p = local(e);
    zoomAt(sc * Math.exp(-e.deltaY / 300), p.x, p.y);
  }, { passive: false });
  // iOS Safari のページ全体の拡大を地図上では止める
  wrap.addEventListener('gesturestart', e => e.preventDefault());

  const center = () => ({ x: wrap.clientWidth / 2, y: wrap.clientHeight / 2 });
  $('#zoomIn').onclick = () => { const c = center(); zoomAt(sc * 1.6, c.x, c.y); };
  $('#zoomOut').onclick = () => { const c = center(); zoomAt(sc / 1.6, c.x, c.y); };
  $('#zoomReset').onclick = () => { sc = 1; tx = ty = 0; apply(); };
  window.addEventListener('resize', () => { clamp(); apply(); });
}

async function renderHome() {
  const counts = await DB.counts();
  let visited = 0, total = 0;
  const stamps = $('#stamps');
  stamps.replaceChildren();
  for (const path of document.querySelectorAll('#map .pref')) {
    const id = path.dataset.pref, n = counts[id] || 0;
    path.classList.remove('v1', 'v2', 'v3');
    if (n) {
      visited++; total += n;
      path.classList.add(n >= 30 ? 'v3' : n >= 8 ? 'v2' : 'v1');
      const c = PREF_CENTERS[id];
      stamps.append(s('circle', { class: 'stamp', cx: c.x, cy: c.y, r: 13 }));
      stamps.append(s('circle', { class: 'stamp-dot', cx: c.x, cy: c.y, r: 5 }));
    }
  }
  $('#visitedCount').textContent = visited;
  $('#totalCount').textContent = total;

  const list = $('#regionList');
  list.replaceChildren();
  for (const [name, from, to] of REGIONS) {
    const chips = h('div', { class: 'chips' });
    for (let id = from; id <= to; id++) {
      const n = counts[id] || 0;
      const a = h('a', { class: 'chip' + (n ? ' on' : ''), href: `#/pref/${id}` }, prefName(id));
      if (n) a.append(h('small', { text: n }));
      chips.append(a);
    }
    list.append(h('div', { class: 'region' }, h('h4', { text: name }), chips));
  }
}

/* ================= アルバム ================= */
let currentPref = null;
let albumItems = [];
let albumUrls = [];
let videoObserver = null;

function releaseAlbum() {
  albumUrls.forEach(u => URL.revokeObjectURL(u));
  albumUrls = [];
  if (videoObserver) videoObserver.disconnect();
}
const objUrl = blob => { const u = URL.createObjectURL(blob); albumUrls.push(u); return u; };

// vlog のコラージュ用の型。6 列 × 高さ h のブロックに [列, 行, 幅, 高さ] で枠を並べ、隙間なく埋める
const BLOCKS = [
  { h: 4, cells: [[0, 0, 6, 4]] },
  { h: 4, cells: [[0, 0, 4, 4], [4, 0, 2, 2], [4, 2, 2, 2]] },
  { h: 4, cells: [[0, 0, 3, 4], [3, 0, 3, 4]] },
  { h: 3, cells: [[0, 0, 2, 3], [2, 0, 2, 3], [4, 0, 2, 3]] },
  { h: 4, cells: [[0, 0, 2, 2], [0, 2, 2, 2], [2, 0, 4, 4]] },
  { h: 3, cells: [[0, 0, 4, 3], [4, 0, 2, 3]] },
  { h: 5, cells: [[0, 0, 3, 3], [3, 0, 3, 2], [3, 2, 3, 3], [0, 3, 3, 2]] },
  { h: 3, cells: [[0, 0, 2, 3], [2, 0, 4, 3]] },
];
const ratio = it => (it.w || 1) / (it.h || 1);

// 1 日分を型に流し込む。型の中では縦長の枠に縦長の写真が入るよう並べ替える
function layoutDay(entries) {
  const out = [];
  let row = 0, k = 0, i = 0;
  while (i < entries.length) {
    const left = entries.length - i;
    let block;
    if (i === 0) {
      // その日の最初の 1 枚は大きく。縦長なら縦長の大枠に
      block = ratio(entries[0][0]) >= 0.85 ? BLOCKS[0] : left >= 2 ? BLOCKS[2] : { h: 6, cells: [[1, 0, 4, 6]] };
    }
    else {
      block = BLOCKS[k % BLOCKS.length];
      k++;
      if (block.cells.length > left || block === BLOCKS[0]) {
        block = BLOCKS.find(b => b !== BLOCKS[0] && b.cells.length === left) || BLOCKS[0];
      }
    }
    const chunk = entries.slice(i, i + block.cells.length);
    const cells = block.cells.map(c => [c, c[2] / c[3]]).sort((a, b) => a[1] - b[1]);
    const sorted = [...chunk].sort((a, b) => ratio(a[0]) - ratio(b[0]));
    cells.forEach(([c], j) => out.push({ entry: sorted[j], col: c[0] + 1, row: row + c[1] + 1, w: c[2], h: c[3] }));
    row += block.h;
    i += chunk.length;
  }
  return out.sort((a, b) => a.row - b.row || a.col - b.col);
}

async function renderAlbum(pref) {
  releaseAlbum();
  currentPref = pref;
  $('#albumNo').textContent = `No.${pad(pref)}`;
  $('#albumRomaji').textContent = PREF_ROMAJI[pref - 1];
  $('#albumTitle').textContent = prefName(pref);

  const items = await DB.list(pref);
  items.sort((a, b) => a.takenAt - b.takenAt);
  albumItems = items;

  const nImg = items.filter(i => i.kind === 'image').length;
  const nVid = items.length - nImg;
  let meta = `写真 ${nImg} 枚 · 動画 ${nVid} 本`;
  if (items.length) {
    const a = fmtDate(items[0].takenAt), b = fmtDate(items[items.length - 1].takenAt);
    meta += ` ｜ ${a === b ? a : `${a} – ${b}`}`;
  }
  $('#albumMeta').textContent = meta;

  const body = $('#albumBody');
  body.replaceChildren();
  if (!items.length) {
    body.append(h('div', { class: 'empty' },
      h('b', { text: 'まだ白紙のページです' }),
      '下の「写真・動画を貼る」から', h('br'), 'この土地の思い出を綴じましょう。'));
    return;
  }

  videoObserver = new IntersectionObserver(onVideoVisibility, { threshold: 0.55 });
  const days = new Map();
  items.forEach((it, idx) => {
    const k = dayKey(it.takenAt);
    if (!days.has(k)) days.set(k, []);
    days.get(k).push([it, idx]);
  });
  let dayNo = 0;
  for (const group of days.values()) {
    dayNo++;
    body.append(h('section', { class: 'day' },
      h('h3', {}, h('span', { class: 'dnum', text: `DAY ${pad(dayNo)}` }), h('span', { class: 'ddate', text: fmtDay(group[0][0].takenAt) }))));
    const grid = h('div', { class: 'grid' });
    for (const cell of layoutDay(group)) grid.append(tileEl(cell.entry[0], cell.entry[1], cell));
    body.append(grid);
  }
}

function tileEl(it, idx, { col, row, w: cw, h: rh }) {
  const rnd = seeded(it.id + 'deco');
  const big = cw >= 4;
  const fig = h('figure', { class: `tile ${it.kind}` + (big ? ' big' : '') });
  fig.style.gridColumn = `${col} / span ${cw}`;
  fig.style.gridRow = `${row} / span ${rh}`;
  if (rnd() < 0.55) fig.style.setProperty('--rot', `${((rnd() - 0.5) * (big ? 1 : 3.2)).toFixed(2)}deg`);
  if (rnd() < 0.3) { fig.classList.add('taped'); fig.style.setProperty('--tape', `${((rnd() - 0.5) * 14).toFixed(1)}deg`); }

  const photo = h('div', { class: 'photo' });
  if (it.thumb) photo.append(h('img', { src: objUrl(it.thumb), alt: it.caption || '', loading: 'lazy', decoding: 'async' }));
  else photo.append(h('div', { class: 'noimg', text: it.kind === 'video' ? '▶' : '?' }));
  if (it.kind === 'video') {
    photo.append(h('span', { class: 'badge', text: `▶ ${fmtDur(it.dur || 0)}` }));
    fig.dataset.id = it.id;
    videoObserver.observe(fig);
  }
  photo.append(h('span', { class: 'stamp-date', text: filmDate(it.takenAt) }));
  if (it.caption && cw >= 3) photo.append(h('span', { class: 'cap', text: it.caption }));
  fig.append(h('div', { class: 'frame' }, photo));
  fig.addEventListener('click', () => openViewer(idx));
  return fig;
}

// 画面に入った動画だけ、音なしでループ再生する
function onVideoVisibility(entries) {
  for (const en of entries) {
    const fig = en.target;
    let v = fig.querySelector('video');
    if (en.isIntersecting) {
      if (v) { v.play().catch(() => {}); continue; }
      const id = fig.dataset.id;
      DB.blob(id).then(blob => {
        if (!blob || !fig.isConnected || fig.querySelector('video')) return;
        v = h('video', { muted: '', loop: '', playsinline: '', autoplay: '', preload: 'auto' });
        v.muted = true;
        v.src = objUrl(blob);
        fig.querySelector('.photo').insertBefore(v, fig.querySelector('.badge'));
        v.play().catch(() => {});
      });
    } else if (v) {
      v.pause();
    }
  }
}

/* ================= 追加 ================= */
async function addFiles(pref, files) {
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  let ok = 0, ng = 0;
  for (let i = 0; i < files.length; i++) {
    toast(`綴じています… ${i + 1} / ${files.length}`, 0);
    try {
      const item = await buildItem(files[i], pref);
      await DB.add(item, files[i]);
      ok++;
    } catch (err) {
      console.error(err);
      ng++;
    }
  }
  toast(ng ? `${ok} 件を追加（${ng} 件は読み込めませんでした）` : `${ok} 件を追加しました`);
  if (currentPref === pref) renderAlbum(pref);
}

async function buildItem(file, pref) {
  const isVideo = file.type.startsWith('video/') || /\.(mov|mp4|m4v|webm)$/i.test(file.name);
  const meta = isVideo ? await videoMeta(file) : await imageMeta(file);
  const taken = isVideo ? null : await exifDate(file);
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    pref,
    kind: isVideo ? 'video' : 'image',
    type: file.type,
    name: file.name,
    w: meta.w, h: meta.h, dur: meta.dur || 0,
    thumb: meta.thumb,
    takenAt: taken || file.lastModified || Date.now(),
    addedAt: Date.now(),
    caption: '',
  };
}

function drawThumb(src, w, hh, max = 960) {
  const k = Math.min(1, max / Math.max(w, hh));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * k));
  c.height = Math.max(1, Math.round(hh * k));
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return new Promise(res => c.toBlob(res, 'image/jpeg', 0.82));
}

async function imageMeta(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const w = img.naturalWidth, hh = img.naturalHeight;
    return { w, h: hh, thumb: await drawThumb(img, w, hh) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function videoMeta(file) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    let finished = false;
    const finish = async grab => {
      if (finished) return;
      finished = true;
      const w = v.videoWidth || 1280, hh = v.videoHeight || 720;
      let thumb = null;
      if (grab && v.videoWidth) { try { thumb = await drawThumb(v, w, hh); } catch (e) { /* 取得できない端末もある */ } }
      const dur = isFinite(v.duration) ? v.duration : 0;
      v.removeAttribute('src'); v.load();
      URL.revokeObjectURL(url);
      resolve({ w, h: hh, dur, thumb });
    };
    v.addEventListener('loadedmetadata', () => {
      try { v.currentTime = Math.min(0.6, (v.duration || 1) / 3); } catch (e) { finish(false); }
    });
    v.addEventListener('seeked', () => finish(true));
    v.addEventListener('error', () => finish(false));
    setTimeout(() => finish(!!v.videoWidth), 8000);
    v.src = url;
    v.load();
  });
}

// JPEG の EXIF から撮影日時を読む
async function exifDate(file) {
  try {
    const dv = new DataView(await file.slice(0, 262144).arrayBuffer());
    if (dv.getUint16(0) !== 0xFFD8) return null;
    let o = 2;
    while (o + 10 < dv.byteLength) {
      const marker = dv.getUint16(o);
      if ((marker & 0xFF00) !== 0xFF00) return null;
      if (marker === 0xFFE1 && dv.getUint32(o + 4) === 0x45786966) return tiffDate(dv, o + 10);
      o += 2 + dv.getUint16(o + 2);
    }
  } catch (e) { /* EXIF なし */ }
  return null;
}
function tiffDate(dv, t) {
  const le = dv.getUint16(t) === 0x4949;
  const u16 = p => dv.getUint16(p, le), u32 = p => dv.getUint32(p, le);
  const find = (ifd, tag) => {
    const n = u16(t + ifd);
    for (let i = 0; i < n; i++) { const e = t + ifd + 2 + i * 12; if (u16(e) === tag) return e; }
    return -1;
  };
  const ptr = find(u32(t + 4), 0x8769);
  if (ptr < 0) return null;
  const exif = u32(ptr + 8);
  for (const tag of [0x9003, 0x9004]) {
    const e = find(exif, tag);
    if (e < 0) continue;
    const at = t + u32(e + 8);
    let str = '';
    for (let i = 0; i < 19; i++) str += String.fromCharCode(dv.getUint8(at + i));
    const m = str.match(/(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d):(\d\d)/);
    if (m) {
      const d = new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
      if (!isNaN(d)) return d.getTime();
    }
  }
  return null;
}

/* ================= ビューア ================= */
const V = { i: 0, url: null, dirty: false };

function openViewer(i) {
  V.i = i; V.dirty = false;
  $('#viewer').hidden = false;
  document.body.classList.add('noscroll');
  document.querySelectorAll('.tile video').forEach(v => v.pause());
  showCurrent();
}

async function showCurrent() {
  const it = albumItems[V.i];
  const stage = $('#vStage');
  $('#vConfirm').hidden = true;
  $('#vCount').textContent = `${V.i + 1} / ${albumItems.length}`;
  $('#vCaption').value = it.caption || '';
  $('#vDate').value = dayKey(it.takenAt);
  $('#vPrev').hidden = V.i === 0;
  $('#vNext').hidden = V.i === albumItems.length - 1;

  const blob = await DB.blob(it.id);
  if (albumItems[V.i] !== it) return; // 読み込み中に移動した
  if (V.url) URL.revokeObjectURL(V.url);
  V.url = blob ? URL.createObjectURL(blob) : null;
  stage.replaceChildren();
  if (!V.url) { stage.append(h('p', { text: '読み込めませんでした' })); return; }
  if (it.kind === 'video') {
    const v = h('video', { controls: '', playsinline: '', autoplay: '' });
    v.src = V.url;
    stage.append(v);
    v.play().catch(() => {});
  } else {
    stage.append(h('img', { src: V.url, alt: it.caption || '' }));
  }
}

function closeViewer() {
  const v = $('#vStage video');
  if (v) v.pause();
  $('#vStage').replaceChildren();
  if (V.url) { URL.revokeObjectURL(V.url); V.url = null; }
  $('#viewer').hidden = true;
  document.body.classList.remove('noscroll');
  if (V.dirty) renderAlbum(currentPref);
  else document.querySelectorAll('.tile video').forEach(v => v.play().catch(() => {}));
}

function step(d) {
  const n = V.i + d;
  if (n < 0 || n >= albumItems.length) return;
  saveCaption();
  V.i = n;
  showCurrent();
}

function saveCaption() {
  const it = albumItems[V.i];
  const val = $('#vCaption').value.trim();
  if (it && val !== (it.caption || '')) {
    it.caption = val;
    V.dirty = true;
    DB.put(it);
  }
}

function setupViewer() {
  const viewer = $('#viewer');
  viewer.classList.add('sepia');
  $('#vClose').onclick = () => { saveCaption(); closeViewer(); };
  $('#vPrev').onclick = () => step(-1);
  $('#vNext').onclick = () => step(1);
  $('#vTone').onclick = e => {
    const on = viewer.classList.toggle('sepia');
    e.currentTarget.classList.toggle('off', !on);
  };
  $('#vCaption').addEventListener('change', saveCaption);
  $('#vDate').addEventListener('change', e => {
    const it = albumItems[V.i];
    const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(e.target.value);
    if (!m) return;
    const d = new Date(it.takenAt);
    d.setFullYear(+m[1], m[2] - 1, +m[3]);
    it.takenAt = d.getTime();
    V.dirty = true;
    DB.put(it);
  });
  $('#vShare').onclick = async () => {
    const it = albumItems[V.i];
    const blob = await DB.blob(it.id);
    if (!blob) return;
    const ext = it.kind === 'video' ? 'mp4' : 'jpg';
    const file = new File([blob], it.name || `tabi-${it.id}.${ext}`, { type: blob.type || it.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file] }).catch(() => {});
    } else {
      window.open(V.url, '_blank');
    }
  };
  $('#vDelete').onclick = () => { $('#vConfirm').hidden = false; };
  $('#vDeleteNo').onclick = () => { $('#vConfirm').hidden = true; };
  $('#vDeleteYes').onclick = async () => {
    const it = albumItems[V.i];
    await DB.remove(it.id);
    albumItems.splice(V.i, 1);
    V.dirty = true;
    toast('削除しました');
    if (!albumItems.length) { closeViewer(); return; }
    V.i = Math.min(V.i, albumItems.length - 1);
    showCurrent();
  };

  // 左右スワイプで前後へ
  const stage = $('#vStage');
  let sx = null, sy = null;
  stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  });
  document.addEventListener('keydown', e => {
    if (viewer.hidden) return;
    if (e.target.matches('textarea, input')) return;
    if (e.key === 'Escape') $('#vClose').click();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
}

/* ================= 画面遷移 ================= */
function route() {
  const m = /^#\/pref\/(\d+)$/.exec(location.hash);
  const pref = m ? +m[1] : 0;
  if (!$('#viewer').hidden) closeViewer();
  if (pref >= 1 && pref <= 47) {
    $('#home').hidden = true;
    $('#album').hidden = false;
    window.scrollTo(0, 0);
    renderAlbum(pref);
  } else {
    releaseAlbum();
    currentPref = null;
    $('#album').hidden = true;
    $('#home').hidden = false;
    renderHome();
  }
}

function init() {
  $('#year').textContent = new Date().getFullYear();
  buildMap();
  setupViewer();
  $('#backBtn').onclick = () => { location.hash = '#/'; };
  $('#fileInput').addEventListener('change', e => {
    const files = [...e.target.files];
    e.target.value = '';
    if (files.length && currentPref) addFiles(currentPref, files);
  });
  window.addEventListener('hashchange', route);
  route();

  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init();
