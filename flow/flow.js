(function () {
  const E = window.FPW_ENGINE;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ── State (per-viewer convenience only; works without storage) ──
  const STORE = 'fpw_flow_state';
  const initial = () => ({ p: [0], top: 0, s: [], styles: [], brands: [], tiers: [], includeTravel: false, area: 30 * 3.3058, areaUnit: 'ping', floors: 2, bh: 'wired', country: 'TW', sort: 'balanced', bundleId: null, modelId: null, seededKey: null, decisionsSeen: {}, prefsDone: false, brandOn: false, tierOn: false });
  let state = initial();
  try { Object.assign(state, JSON.parse(localStorage.getItem(STORE)) || {}); } catch (e) { /* ignore */ }
  state.brands = (state.brands || []).filter(b => ['ASUS', 'ROG', 'TUF'].includes(b));
  if (!Array.isArray(state.styles)) state.styles = state.style && state.style !== 'none' ? [state.style] : [];
  delete state.style;
  if (state.brands.length) state.brandOn = true;
  if ((state.tiers || []).length) state.tierOn = true;
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ } };

  function engineInput() {
    return { p: state.p, s: state.s, top: state.p.includes(state.top) ? state.top : state.p[0], style: state.styles.length === 2 ? 'both' : state.styles[0] || 'none', modelBrands: state.brands, bundleBrands: state.brands, modelTiers: state.tiers, bundleTiers: state.tiers, includeTravel: state.includeTravel, country: state.country, area: state.area, floors: state.floors, sort: state.sort, bh: state.bh };
  }
  function results() {
    const c = E.catalog(), u = engineInput();
    return { u, models: E.modelRank(c, u), bundles: E.calculate(c, u).rows };
  }
  const PING = 3.3058; // 1 坪 = 3.3058 m²
  const areaText = m2 => (state.areaUnit === 'ping' ? `${(m2 / PING).toFixed(1).replace(/\.0$/, '')} 坪` : `${Math.round(m2)} m²`);
  const bundleKey = b => b.r.id + '|' + (b.N > 1 ? b.n.id : '') + '|' + b.N;
  function currentBundle(bundles) {
    return bundles.find(b => bundleKey(b) === state.bundleId) || bundles[0] || null;
  }

  // ── Icons ──
  const I = {
    plans: '<svg viewBox="0 0 24 24"><rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3.5h6v1"/><path d="M8.5 10l1.3 1.3L12 9M8.5 15l1.3 1.3L12 14M14 10.3h2.5M14 15.3h2.5"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v8.5a.5.5 0 0 1-.5.5H15v-6H9v6H4.5a.5.5 0 0 1-.5-.5z"/></svg>',
    prefs: '<svg viewBox="0 0 24 24"><path d="M6 4v6M6 14v6M12 4v2M12 10v10M18 4v10M18 18v2M4 12h4M10 8h4M16 16h4"/></svg>',
    rank: '<svg viewBox="0 0 24 24"><path d="M5 20v-6M12 20V6M19 20v-9M3 20h18"/></svg>',
    plan: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 11h7v8.5M14 4.5v6h6.5M10.5 14H8"/></svg>',
    admin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>',
    help: '<svg viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14v3a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2zM20 14v3a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2z"/></svg>',
    account: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3.2"/><path d="M6.2 18.4a6.5 6.5 0 0 1 11.6 0"/></svg>',
    wifi: '<svg viewBox="0 0 24 24"><path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.2" r=".9"/></svg>',
    game: '<svg viewBox="0 0 24 24"><path d="M7 9h10a4 4 0 0 1 4 4v1.5a2.5 2.5 0 0 1-4.6 1.4L15 14H9l-1.4 1.9A2.5 2.5 0 0 1 3 14.5V13a4 4 0 0 1 4-4zM8 11.5v3M6.5 13h3M15.5 12.5h.01M17.5 14h.01"/></svg>',
    work: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 17v3"/></svg>',
    stream: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="13" rx="2"/><path d="m10 9 5 2.5-5 2.5z"/></svg>',
    live: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.5"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.6 4.6a10.5 10.5 0 0 0 0 14.8M19.4 4.6a10.5 10.5 0 0 1 0 14.8"/></svg>',
    smart: '<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v9H4z"/><circle cx="12" cy="14" r="2"/><path d="M12 16v2"/></svg>',
    router: '<svg viewBox="0 0 24 24"><rect x="3" y="13" width="18" height="6" rx="1.5"/><path d="M7 13 5 5M17 13l2-8M7 16h.01M10 16h.01"/></svg>',
    cart: '<svg viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h10.2L20 7H6.2"/><circle cx="9" cy="19.5" r="1.2"/><circle cx="17" cy="19.5" r="1.2"/></svg>',
  };
  const primaryIcons = [I.wifi, I.game, I.work, I.stream, I.live, I.smart];
  const primarySubs = ['每個房間都穩定', '低延遲、少斷線', '視訊會議不卡', '4K／8K 順暢播放', '上傳穩定、多裝置', '大量 IoT 裝置'];

  // Recommendation model id → floor plan app catalog model name
  const FP_MODEL = { 'BT8': 'BT8', 'GT-BE98': 'GT-BE98', 'GT-BE19000AI': 'GT-BE19000AI', 'TUF-AX6000': 'TUF-BE6500', 'RT-AX86U Pro': 'RT-AX86U_Pro', 'PRT-BE5000': 'PRT-BE59', 'RT-BE58 Go': 'RT-BE58_Go', 'RT-AX57 Go': 'PRT-AX57_Go', 'BD4 Outdoor': 'BD4_OD', 'BD5 Outdoor': 'BD4_OD' };
  const fpModel = id => FP_MODEL[id] || 'BT8';
  // Product icons: same ASUS CDN the floor plan app already uses.
  const PRODUCT_IMG = { 'BT8': 'ZenWiFi_BT8', 'GT-BE98': 'GT-BE98', 'GT-BE19000AI': 'GT-BE19000AI', 'TUF-AX6000': 'TUF-AX6000', 'RT-AX86U Pro': 'RT-AX86U_Pro', 'PRT-BE5000': 'PRT-BE5000', 'RT-BE58 Go': 'RT-BE58_Go', 'RT-AX57 Go': 'RT-AX57_Go', 'BD4 Outdoor': 'ZenWiFi_BD4_Outdoor', 'BD5 Outdoor': 'ZenWiFi_BD5_Outdoor' };
  // Buy entry: cart icon button (the secondary path, ~30% of users).
  const cartBtn = (attrs, extra = '') => `<button class="cart-btn ${extra}" ${attrs} title="前往購買" aria-label="前往購買">${I.cart}</button>`;
  function setBuy(kind, id) { state.buy = { kind, id }; save(); }
  // Recommendation rank as a star tag (language neutral): #1 filled orange, others outlined.
  const rankTag = n => `<span class="tag ${n === 1 ? 'tag-rank1' : 'tag-rank'}" title="推薦 ${n}">★${n}</span>`;
  const productImg = id => 'https://nw-dlcdnet.asus.com/plugin/productIcons/' + (PRODUCT_IMG[id] || id.replace(/ /g, '_')) + '.png';

  // ── Screens ──
  const SCREENS = [
    { id: 'home', code: '0_010', rail: 'home', description: '首頁：大字標題＋「開始規劃」主按鈕，下方為功能 banner（未完成的進度在「我的規劃」）', render: renderHome },
    { id: 'needs', code: '1_010', rail: 'prefs', description: '偏好 1/3：主要用途（可複選，標記最重要的一項）', render: renderNeeds },
    { id: 'care', code: '1_020', rail: 'prefs', description: '偏好 2/3：還在意什麼、外觀、品牌與產品定位', render: renderCare },
    { id: 'home-size', code: '1_030', rail: 'prefs', description: '偏好 3/3：我家的樣子（面積、樓層、回程、地區）', render: renderHomeSize },
    { id: 'results', code: '2_010', rail: 'rank', description: '推薦結果：機種排行＋配置套組 Top 10。兩條路：在我家試擺（約 70%）／購物車前往購買（約 30%）', render: renderResults },
    { id: 'model', code: '2_020', rail: 'rank', description: '機種詳情：規格、功能與需求適配度，可前往購買或試擺', render: renderModel },
    { id: 'exit', code: '2_030', rail: 'rank', description: '購買（約 30%）：列出所選配置，按鈕開新分頁前往 ASUS 線上購物', render: renderExit },
    { id: 'floorplan', code: '3_010', rail: 'plan', description: 'Floor plan 操作環境（約 70%）：自動存成方案；換套組會另存新方案，可新增方案複製格局', render: renderFloorplan },
    { id: 'plans', code: '4_010', rail: 'plans', description: '我的規劃：未完成（偏好沒填完）＋依推薦紀錄分組，展開看到從它試擺的方案；推薦紀錄刪除後方案移到「其他方案」', render: renderPlans },
  ];
  const screenById = Object.fromEntries(SCREENS.map(s => [s.id, s]));

  // ── Demo decisions ──
  const DECISIONS = {
    next: {
      index: 0, label: '分流', title: '看完推薦後，使用者下一步？',
      options: [
        { value: 'exit', label: '只想知道買什麼，看完就離開（約 30%）', short: '離開', to: 'exit' },
        { value: 'plan', label: '想看家裡怎麼配置，進入 Floor plan（約 70%）', short: 'Floor plan', to: 'floorplan' },
      ],
    },
  };
  let decisions = [];

  function go(id) { location.hash = id; }

  // ── Rail ──
  // The rail holds global destinations only; the planning flow itself is linear (see stepper).
  function renderRail(active) {
    $('rail').innerHTML = `<button class="rail-btn${active === 'home' ? ' active' : ''}" data-to="home" data-tip="首頁" aria-label="首頁">${I.home}</button>`
      + `<button class="rail-btn${active === 'plans' ? ' active' : ''}" data-to="plans" data-tip="我的規劃" aria-label="我的規劃">${I.plans}</button>`
      + '<div class="rail-spacer"></div>'
      + `<button class="rail-btn" data-href="router_recommendation_wireframe%201.html" data-tip="後台：機種資料與權重（另開）" aria-label="後台">${I.admin}</button>`
      + `<button class="rail-btn" data-tip="帳號（示意）" aria-label="帳號">${I.account}</button>`;
    $('rail').querySelectorAll('[data-to]').forEach(b => (b.onclick = () => go(b.dataset.to)));
    $('rail').querySelectorAll('[data-href]').forEach(b => (b.onclick = () => window.open(b.dataset.href, '_blank')));
  }

  // ── 0_010 Home ──
  function renderHome(el) {
    el.innerHTML = `<div class="page">
      <section class="hero">
        <h1 class="hero-title">嗨，<br>來規劃你家的 WiFi</h1>
        <div class="home-meta">
          <div>告訴我們你的用途與空間 <span class="muted">· 推薦適合的機種與台數</span></div>
          <div>放進你家的平面圖 <span class="muted">· 模擬每個房間的訊號覆蓋</span></div>
        </div>
        <div class="hero-cta"><button class="btn btn-xl" id="start">開始規劃 <span class="btn-arrow">→</span></button><span class="muted">約 3 分鐘 · 免登入</span></div>
      </section>
      <div class="home-strip"><div><div class="eyebrow">能幫你做什麼</div><h2 class="promo-heading">從挑機種到擺位置，一次搞定</h2></div></div>
      ${promoBanners()}
    </div>`;
    $('start').onclick = () => go('needs');
    el.querySelectorAll('[data-promo]').forEach(b => (b.onclick = () => go('needs')));
  }

  // Home "能幫你做什麼" — illustrated promo banners (bento layout). All banners start the flow at step 1.
  function promoBanners() {
    const usage = [I.wifi, I.game, I.work, I.stream, I.live, I.smart];
    const orbit = usage.map((ico, i) => {
      const a = (i / usage.length) * Math.PI * 2 - Math.PI / 2, x = 50 + 38 * Math.cos(a), y = 50 + 38 * Math.sin(a);
      return `<span class="orbit-ico" style="left:${x}%;top:${y}%;animation-delay:${-i * .5}s">${ico}</span>`;
    }).join('');
    return `<div class="promo">
      <button class="promo-card promo-a" data-promo>
        <div class="promo-text"><span class="promo-kicker">STEP 1 · 偏好設定</span><h3>6 種生活情境<br>挑出最適合你的</h3><p>遊戲、居家工作、追劇、直播…選你最常用的，我們幫你算。</p><span class="promo-cta">開始規劃 →</span></div>
        <div class="promo-art art-orbit"><svg class="orbit-house" viewBox="0 0 120 120"><path d="M20 58 60 24l40 34v40a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" fill="#fff" fill-opacity=".95"/><path d="M48 102V76h24v26" fill="#d6e8ff"/><g fill="none" stroke="#1982ff" stroke-width="4" stroke-linecap="round"><path class="wave w1" d="M46 60a20 20 0 0 1 28 0"/><path class="wave w2" d="M38 52a31 31 0 0 1 44 0"/></g><circle cx="60" cy="67" r="4" fill="#1982ff"/></svg>${orbit}</div>
      </button>
      <button class="promo-card promo-b" data-promo>
        <div class="promo-text"><span class="promo-kicker">STEP 1 · 我家的樣子</span><h3>1–6 層樓都能算</h3><p>坪數 × 樓層，估出最少要幾台。</p></div>
        <div class="promo-art"><svg viewBox="0 0 140 110"><g class="floor f3"><path d="M70 14 120 34 70 54 20 34z" fill="#fff"/><path d="M20 34v6l50 20v-6zM120 34v6L70 60v-6z" fill="#9fdcc9"/></g><g class="floor f2"><path d="M70 38 120 58 70 78 20 58z" fill="#fff"/><path d="M20 58v6l50 20v-6zM120 58v6L70 84v-6z" fill="#9fdcc9"/></g><g class="floor f1"><path d="M70 62 120 82 70 102 20 82z" fill="#fff"/><path d="M20 82v6l50 20v-6zM120 82v6l-50 20v-6z" fill="#9fdcc9"/></g><circle class="ping" cx="70" cy="34" r="5" fill="#13a37f"/><circle class="ping p2" cx="70" cy="58" r="5" fill="#13a37f"/><circle class="ping p3" cx="70" cy="82" r="5" fill="#13a37f"/></svg></div>
      </button>
      <button class="promo-card promo-c" data-promo>
        <div class="promo-text"><span class="promo-kicker">STEP 2 · 推薦結果</span><h3>Top 10 配置套組</h3><p>主機＋Node 怎麼搭、要幾台，一次排好。</p></div>
        <div class="promo-art"><svg viewBox="0 0 140 110"><rect x="12" y="62" width="36" height="40" rx="4" fill="#fff" fill-opacity=".8"/><rect x="52" y="44" width="36" height="58" rx="4" fill="#fff"/><rect x="92" y="74" width="36" height="28" rx="4" fill="#fff" fill-opacity=".7"/><text x="30" y="88" text-anchor="middle" font-size="16" fill="#e08a2b" font-weight="600">2</text><text x="70" y="80" text-anchor="middle" font-size="20" fill="#e08a2b" font-weight="700">1</text><text x="110" y="94" text-anchor="middle" font-size="14" fill="#e08a2b" font-weight="600">3</text><g class="trophy"><rect x="54" y="26" width="32" height="12" rx="3" fill="#2b2f36"/><path d="M60 26 56 16M80 26l4-10" stroke="#2b2f36" stroke-width="2.5" stroke-linecap="round"/><circle cx="62" cy="32" r="1.6" fill="#7ee0a1"/><circle cx="68" cy="32" r="1.6" fill="#7ee0a1"/></g><path class="spark s1" d="M100 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fff"/><path class="spark s2" d="M34 34l1.5 3.5 3.5 1.5-3.5 1.5L34 44l-1.5-3.5L29 39l3.5-1.5z" fill="#fff"/></svg></div>
      </button>
      <button class="promo-card promo-d" data-promo>
        <div class="promo-text"><span class="promo-kicker">STEP 3 · 居家配置</span><h3>把推薦放進你家</h3><p>推薦套組自動擺進平面圖，2D／3D 覆蓋一眼看出死角。</p><span class="promo-cta light">開始規劃 →</span></div>
        <div class="promo-art art-plan"><svg viewBox="0 0 240 130"><defs><radialGradient id="heat"><stop offset="0" stop-color="#4be3a0" stop-opacity=".95"/><stop offset=".55" stop-color="#ffd25e" stop-opacity=".55"/><stop offset="1" stop-color="#ff7a7a" stop-opacity="0"/></radialGradient></defs><rect x="10" y="10" width="220" height="110" rx="6" fill="#fff" fill-opacity=".1" stroke="#fff" stroke-opacity=".85" stroke-width="3"/><path d="M110 10v62M10 66h60M110 72h70M180 72v48" stroke="#fff" stroke-opacity=".7" stroke-width="2.5"/><circle class="heat h1" cx="62" cy="40" r="56" fill="url(#heat)"/><circle class="heat h2" cx="170" cy="88" r="56" fill="url(#heat)"/><g class="node"><circle cx="62" cy="40" r="9" fill="#fff"/><circle cx="62" cy="40" r="4" fill="#5b5bd6"/></g><g class="node"><circle cx="170" cy="88" r="9" fill="#fff"/><circle cx="170" cy="88" r="4" fill="#5b5bd6"/></g><path class="mesh" d="M70 44 162 84" stroke="#fff" stroke-width="2" stroke-dasharray="5 6"/></svg></div>
      </button>
    </div>`;
  }

  function qHeader(step, title, sub) {
    return `<div class="q-head"><div><div class="eyebrow">STEP ${step} / 3 · ${['主要用途', '在意什麼', '我家的樣子'][step - 1]}</div><h1 class="page-title" style="margin-top:6px">${title}</h1><p class="page-sub">${sub}</p></div><div class="counter"><b>0${step}</b> / 03</div></div>
      <div class="q-progress"><span style="width:${step * 33.34}%"></span></div>`;
  }

  // ── 1_010 Needs ──
  function renderNeeds(el) {
    el.innerHTML = `<div class="page">${qHeader(1, '主要拿網路做什麼？', '可複選，選你最常用的情境。')}
      <div class="tiles" id="tiles"></div>
      <p class="q-hint" id="topHint"></p>
      <div class="q-foot"><button class="link-btn" data-to="home">‹ 回首頁</button><button class="btn" id="next">下一步</button></div></div>`;
    const draw = () => {
      if (!state.p.includes(state.top)) state.top = state.p[0];
      $('tiles').innerHTML = E.primaryNames.map((n, i) => {
        const on = state.p.includes(i);
        return `<button class="tile${on ? ' on' : ''}" data-i="${i}"><span class="tile-check">${on ? '✓' : ''}</span><span class="tile-ico">${primaryIcons[i]}</span><span class="tile-title">${n}</span><span class="tile-sub">${primarySubs[i]}</span>${on && state.p.length > 1 ? `<span class="star${state.top === i ? ' on' : ''}" data-star="${i}">${state.top === i ? '★ 最重要' : '☆ 設為最重要'}</span>` : ''}</button>`;
      }).join('');
      $('next').disabled = !state.p.length;
      $('topHint').innerHTML = state.p.length > 1 ? `選了 ${state.p.length} 項：推薦會以「<b>${E.primaryNames[state.top]}</b>」為主。想換的話，點其他卡片上的「☆ 設為最重要」。` : state.p.length ? '' : '至少選一項才能繼續。';
      $('tiles').querySelectorAll('.tile').forEach(t => (t.onclick = e => {
        const i = +t.dataset.i;
        if (e.target.dataset.star) { state.top = i; }
        else state.p = state.p.includes(i) ? state.p.filter(x => x !== i) : [...state.p, i].sort();
        save(); draw();
      }));
    };
    draw();
    el.querySelector('[data-to]').onclick = () => go('home');
    $('next').onclick = () => { if (!state.prefsDone) { state.inProgress = true; save(); } go('care'); };
  }

  // ── 1_020 Care ──
  // One checklist; picking 外觀與燈效 / 指定品牌 / 指定產品定位 reveals that item's sub-options.
  function renderCare(el) {
    el.innerHTML = `<div class="page">${qHeader(2, '你還在意什麼？', '可複選，不選也可以。')}
      <div class="chips chips-lg" id="sec"></div>
      <div class="subopts" id="subopts"></div>
      <div class="q-foot"><button class="link-btn" id="back">‹ 上一步</button><button class="btn" id="next">下一步</button></div></div>`;
    const items = [
      ...E.secondaryNames.map((label, i) => ({ key: 's' + i, label, on: () => state.s.includes(i), toggle: () => { state.s = state.s.includes(i) ? state.s.filter(x => x !== i) : [...state.s, i].sort(); if (i === 4) state.styles = state.s.includes(4) ? ['quiet'] : []; } })),
      { key: 'brand', label: '指定品牌／系列', on: () => state.brandOn, toggle: () => { state.brandOn = !state.brandOn; state.brands = state.brandOn ? ['ASUS'] : []; } },
      { key: 'tier', label: '指定產品定位', on: () => state.tierOn, toggle: () => { state.tierOn = !state.tierOn; state.tiers = state.tierOn ? ['入門'] : []; } },
      { key: 'travel', label: '也看旅行機種', on: () => state.includeTravel, toggle: () => { state.includeTravel = !state.includeTravel; } },
    ];
    const opt = (group, v, label, on, sub) => `<button class="chip${on ? ' on' : ''}" data-g="${group}" data-v="${v}">${label}${sub ? `<span class="chip-sub">${sub}</span>` : ''}</button>`;
    let shown = new Set();
    const draw = () => {
      $('sec').innerHTML = items.map(it => `<button class="chip${it.on() ? ' on' : ''}" data-k="${it.key}">${it.on() ? '✓ ' : ''}${it.label}</button>`).join('');
      const panels = [];
      if (state.s.includes(4)) panels.push(`<div class="subopt" data-p="style"><span class="subopt-label">外觀偏好</span><div class="chips">${opt('style', 'quiet', '低調內置天線', state.styles.includes('quiet'))}${opt('style', 'rgb', 'RGB 燈效', state.styles.includes('rgb'))}</div></div>`);
      if (state.brandOn) panels.push(`<div class="subopt" data-p="brand"><span class="subopt-label">品牌／系列</span><div class="chips">${['ASUS', 'ROG', 'TUF'].map(v => opt('brand', v, v, state.brands.includes(v))).join('')}</div></div>`);
      if (state.tierOn) panels.push(`<div class="subopt" data-p="tier"><span class="subopt-label">產品定位</span><div class="chips">${['入門', '中階', '高階'].map(v => opt('tier', v, E.tierNames[v], state.tiers.includes(v), E.tierDescriptions[v])).join('')}</div></div>`);
      $('subopts').innerHTML = panels.join('');
      $('subopts').querySelectorAll('[data-p]').forEach(p => p.classList.toggle('still', shown.has(p.dataset.p)));
      shown = new Set([...$('subopts').querySelectorAll('[data-p]')].map(p => p.dataset.p));
      $('sec').querySelectorAll('[data-k]').forEach(b => (b.onclick = () => { items.find(it => it.key === b.dataset.k).toggle(); save(); draw(); }));
      $('subopts').querySelectorAll('[data-g]').forEach(b => (b.onclick = () => {
        const v = b.dataset.v;
        // Sub-options start with the first one picked; clearing them all unticks the parent item.
        const key = { style: 'styles', brand: 'brands', tier: 'tiers' }[b.dataset.g];
        state[key] = state[key].includes(v) ? state[key].filter(x => x !== v) : [...state[key], v];
        if (!state[key].length) {
          if (key === 'styles') state.s = state.s.filter(x => x !== 4);
          else state[key === 'brands' ? 'brandOn' : 'tierOn'] = false;
        }
        save(); draw();
      }));
    };
    draw();
    $('back').onclick = () => go('needs');
    $('next').onclick = () => go('home-size');
  }

  // ── 1_030 Home size ──
  function renderHomeSize(el) {
    el.innerHTML = `<div class="page">${qHeader(3, '你家的空間有多大？', '填寫大約數值即可，進入居家配置後可再依實際平面圖調整。')}
      <div class="q-cols">
        <div class="field-card"><div class="field-head"><label class="field-label" for="area">室內總面積</label><div class="seg seg-sm" id="unit"></div></div><div class="big-input"><input id="area" type="number" min="1" max="1000" step="any" inputmode="decimal"><span id="unitLabel"></span></div><p class="muted small" id="ping" style="margin:10px 0 0"></p></div>
        <div class="field-card"><span class="field-label">樓層數</span><div class="stepper"><button id="minus" aria-label="減少樓層">−</button><output id="floors"></output><button id="plus" aria-label="增加樓層">＋</button></div></div>
        <div class="field-card"><span class="field-label">主機與 Node 之間怎麼連（回程）</span><div class="seg" id="bh"></div><p class="muted small" style="margin:10px 0 0">家裡有預埋網路線就選有線，覆蓋與速度通常較好。</p></div>
        <div class="field-card"><label class="field-label" for="country">購買地區</label><select class="select" id="country"><option value="TW">台灣</option><option value="CN">中國</option><option value="DE">歐洲 · 德國</option><option value="US">美洲 · 美國</option></select><p class="muted small" style="margin:10px 0 0">目前只有台灣有可推薦機種與價表。</p></div>
      </div>
      <div class="q-foot"><button class="link-btn" id="back">‹ 上一步</button><button class="btn" id="next">看推薦結果</button></div></div>`;
    const draw = () => {
      const ping = state.areaUnit === 'ping';
      $('unit').innerHTML = [['m2', 'm²'], ['ping', '坪']].map(([v, l]) => `<button class="${state.areaUnit === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('');
      $('unit').querySelectorAll('button').forEach(b => (b.onclick = () => { state.areaUnit = b.dataset.v; save(); draw(); }));
      $('unitLabel').textContent = ping ? '坪' : 'm²';
      $('area').value = ping ? +(state.area / PING).toFixed(1) : +state.area.toFixed(1);
      areaHint();
      $('floors').textContent = state.floors;
      $('bh').innerHTML = [['wired', '有線回程'], ['wireless', '無線回程（待驗證）']].map(([v, l]) => `<button class="${state.bh === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('');
      $('bh').querySelectorAll('button').forEach(b => (b.onclick = () => { state.bh = b.dataset.v; save(); draw(); }));
      $('country').value = state.country;
    };
    draw();
    function areaHint() {
      const perFloor = state.area / state.floors;
      $('ping').textContent = state.areaUnit === 'ping'
        ? `約 ${state.area.toFixed(0)} m² · 每層約 ${(perFloor / PING).toFixed(1)} 坪`
        : `約 ${(state.area / PING).toFixed(1)} 坪 · 每層約 ${perFloor.toFixed(0)} m²`;
    }
    $('area').oninput = () => { const v = +$('area').value; if (v > 0) { state.area = state.areaUnit === 'ping' ? v * PING : v; save(); areaHint(); } };
    $('minus').onclick = () => { state.floors = Math.max(1, state.floors - 1); save(); draw(); };
    $('plus').onclick = () => { state.floors = Math.min(6, state.floors + 1); save(); draw(); };
    $('country').onchange = () => { state.country = $('country').value; save(); };
    $('back').onclick = () => go('care');
    $('next').onclick = () => {
      if (!(state.area > 0)) return toast('請輸入面積');
      state.bundleId = null; state.prefsDone = true; if (state.seededKey === 'blank') state.seededKey = null; save(); go('results');
    };
  }


  // ── 2_010 Results ──
  function renderResults(el) {
    const { u, models, bundles } = results();
    const tried = state.newPlanFrom ? new Map() : new Map(triedPlans(prefsOf()).map(x => [x.bundleId, x]));
    const tryLabel = b => (b && tried.has(bundleKey(b)) ? '開啟方案' : '在我家試擺');
    if (u.country === 'TW') recordRecommendation(models, bundles);
    if (state.inProgress) { state.inProgress = false; save(); }
    const top4 = models.slice(0, 4), rest = models.slice(4);
    const tags = [u.p.map(i => E.primaryNames[i] + (i === u.top && u.p.length > 1 ? '★' : '')).join('、'), ...u.s.map(i => E.secondaryNames[i]), areaText(u.area), `${u.floors} 層`, u.bh === 'wired' ? '有線回程' : '無線回程', state.brands.length ? '品牌：' + state.brands.join('／') : null, state.tiers.length ? '定位：' + state.tiers.map(t => E.tierNames[t]).join('／') : null].filter(Boolean);
    el.innerHTML = `<div class="page">
      <div class="res-head"><div><div class="eyebrow">推薦結果</div><div class="title-row"><h1 class="page-title">這些機種最適合你家</h1><button class="btn btn-ghost btn-sm" id="edit">修改條件</button></div><div class="summary-tags">${tags.map(t => `<span>${esc(t)}</span>`).join('')}</div></div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><div class="seg" id="sort"><button data-v="balanced" class="${state.sort !== 'cost' ? 'on' : ''}">平衡推薦</button><button data-v="cost" class="${state.sort === 'cost' ? 'on' : ''}">較低花費優先</button></div></div></div>
      ${u.country !== 'TW' ? '<div class="card empty" style="margin-top:24px">此地區尚未建立價表與可推薦機種，請改選台灣。</div>' : `
      <div class="section-head"><div><h2>推薦機種排行</h2><div class="muted small">每型號一筆 · 已納入你的面積與樓層 · 點卡片看詳情</div></div></div>
      ${top4.length ? `<div class="gauges">${top4.map((m, i) => `<div class="gauge-card" data-model="${esc(m.id)}">
        <div class="gauge-name-row">${rankTag(i + 1)}<div class="gauge-name" title="${esc(m.id)}">${esc(m.id)}</div></div>
        <div class="gauge-sub">${esc(m.m.series)} · ${esc(E.tierNames[m.m.positioning] || E.tierNames['未設定'])}</div>
        <div class="gauge-body"><div class="gauge-photo">${m.active ? '<span class="tag tag-promo photo-tag">本期主打</span>' : ''}<img src="${productImg(m.id)}" alt="${esc(m.id)}" loading="lazy" onerror="this.style.visibility='hidden'"></div>
        <ul class="gauge-facts"><li>WiFi ${m.m.wifi}</li><li>${m.m.bands} 頻段</li><li>最少 ${m.N} 台</li><li>${m.m.ai ? 'AI 核心' : '一般核心'}</li></ul></div>
        <div class="gauge-foot"><div class="gauge-actions">${bundles.some(b => b.r.id === m.id) ? `<button class="try-link" data-try-model="${esc(m.id)}">${tryLabel(bundles.find(b => b.r.id === m.id))}</button>` : ''}${cartBtn(`data-buy-model="${esc(m.id)}"`)}</div><div class="gauge-badges">${m.m.special !== '無' ? `<span class="badge">${esc(m.m.special)}</span>` : ''}</div></div></div>`).join('')}</div>
        ${rest.length ? `<div class="more-models">${rest.map((m, i) => `<button data-model="${esc(m.id)}">${rankTag(i + 5)}<span>${esc(m.id)}</span></button>`).join('')}</div>` : ''}` : '<div class="card empty">沒有符合目前品牌／定位與空間條件的機種，請調整條件。</div>'}

      <div class="section-head"><div><h2>推薦配置套組 · Top ${bundles.length}</h2><div class="muted small">主機＋Node 的組合與最少台數；選一組放進你家試擺</div></div></div>
      ${bundles.length ? `<div class="bundles">${bundles.map((b, i) => `<div class="bundle">
        <div class="bundle-rank">${String(i + 1).padStart(2, '0')}</div>
        <div><div class="bundle-name">${esc(b.r.id)}${b.N > 1 ? ` <span class="muted">＋ ${esc(b.n.id)}</span>` : ''}${i === 0 ? ' <span class="tag tag-rank1" title="最推薦">★</span>' : ''}</div>
          <div class="bundle-meta"><span>${b.N === 1 ? '單機' : 'AiMesh'}</span><span>WiFi ${b.r.wifi}</span><span>各樓層 ${b.floorUnits.join(' / ')} 台</span><span>${esc(E.tierNames[b.r.positioning] || '')}</span>${b.boost || b.reserved ? '<span class="tag tag-promo">本期主打</span>' : ''}</div>
          </div>
        <div class="bundle-units"><b>${b.N}</b><small>台</small><div>${b.N > 1 ? `主機 1 ＋ Node ${b.N - 1}` : '主機 1'}</div></div>
        <div class="bundle-actions"><button class="btn btn-sm${tried.has(bundleKey(b)) ? ' btn-ghost' : ''}" data-try="${i}">${tryLabel(b)}</button>${cartBtn(`data-buy-bundle="${i}"`)}</div>
        <details><summary>推薦理由與限制</summary>依你選的用途與在意的功能評估；台數是此面積與樓層下的最低預估，不是實測保證。${u.bh === 'wired' ? '有線' : '無線'}回程與混搭相容仍待驗證。</details>
      </div>`).join('')}</div>` : '<div class="card empty">沒有符合條件的配置套組，請調整條件。</div>'}

      <div class="cta-band"><div><h3>想知道放在家裡哪裡最好？</h3><p>把第一名套組放進你家的平面圖，看每個房間的訊號覆蓋。</p></div><div class="cta-actions"><button class="btn" id="cta" ${bundles.length ? '' : 'disabled'}>開始居家配置 →</button>${bundles.length ? cartBtn('data-buy-bundle="0"', 'cart-btn-light') : ''}</div></div>
`}
    </div>`;
    $('edit').onclick = () => go('needs');
    $('sort').querySelectorAll('button').forEach(b => (b.onclick = () => { state.sort = b.dataset.v; save(); render(); }));
    el.querySelectorAll('[data-model]').forEach(c => (c.onclick = () => { state.modelId = c.dataset.model; save(); go('model'); }));
    el.querySelectorAll('[data-try]').forEach(b => (b.onclick = () => { pickBundle(bundles[+b.dataset.try]); go('floorplan'); }));
    el.querySelectorAll('[data-try-model]').forEach(b => (b.onclick = e => { e.stopPropagation(); pickBundle(bundles.find(x => x.r.id === b.dataset.tryModel)); go('floorplan'); }));
    el.querySelectorAll('[data-buy-model]').forEach(b => (b.onclick = e => { e.stopPropagation(); setBuy('model', b.dataset.buyModel); go('exit'); }));
    el.querySelectorAll('[data-buy-bundle]').forEach(b => (b.onclick = () => { setBuy('bundle', bundleKey(bundles[+b.dataset.buyBundle])); go('exit'); }));
    const cta = $('cta');
    if (cta) cta.onclick = () => { pickBundle(bundles[0]); go('floorplan'); };
    if (bundles.length && !state.decisionsSeen.next) { state.decisionsSeen.next = true; save(); setTimeout(() => openDecision('next'), 600); }
  }

  function pickBundle(b) { if (b) { state.bundleId = bundleKey(b); save(); } }

  // ── 2_020 Model detail ──
  function renderModel(el) {
    const { u, models, bundles } = results();
    const c = E.catalog();
    const m = c.products.find(p => p.id === state.modelId) || (models[0] && models[0].m);
    if (!m) { el.innerHTML = '<div class="page"><div class="card empty">尚未選擇機種</div></div>'; return; }
    const rankRow = models.find(x => x.id === m.id);
    const x = E.ability(m), d = E.demands(x);
    const best = bundles.find(b => b.r.id === m.id) || bundles.find(b => b.n.id === m.id && b.N > 1);
    el.innerHTML = `<div class="page">
      <button class="link-btn" id="back">‹ 推薦結果</button>
      <div class="res-head" style="margin-top:14px"><div><div class="eyebrow">${esc(m.series)} · ${esc(E.tierNames[m.positioning] || '')}</div><h1 class="hero-title" style="font-size:56px;margin-top:6px">${esc(m.id)}</h1>
        <div class="summary-tags">${rankRow ? `<span>${rankTag(models.indexOf(rankRow) + 1)}</span><span>你家最少 ${rankRow.N} 台</span>` : '<span>不在目前條件的排行內</span>'}<span>WiFi ${m.wifi}</span><span>${m.bands} 頻段</span><span>有線 ${m.port} Gbps</span></div></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-ghost" id="buy">${I.cart.replace('<svg', '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"')} 前往購買</button><button class="btn" id="try" ${best ? '' : 'disabled'}>在我家試擺</button></div></div>
      <div class="detail-grid">
        <div class="card"><h3 class="card-title">規格</h3><table class="spec-table" style="margin-top:10px">
          <tr><td>系列</td><td>${esc(m.series)}</td></tr><tr><td>WiFi 世代</td><td>WiFi ${m.wifi}</td></tr><tr><td>頻段數</td><td>${m.bands}</td></tr>
          <tr><td>有線速率上限</td><td>${m.port} Gbps</td></tr><tr><td>單台有效覆蓋（假設）</td><td>${m.area} m²</td></tr><tr><td>特殊系列</td><td>${esc(m.special)}</td></tr></table>
          <h3 class="card-title" style="margin-top:22px">功能</h3><div class="feature-list" style="margin-top:12px">${E.booleans.map(([k, l]) => `<span class="${m[k] ? 'yes' : 'no'}">${l}</span>`).join('')}</div></div>
        <div class="card"><h3 class="card-title">與你的用途適配度</h3><p class="muted small">依各用途需求計算的能力分（0–100），★ 為你選的用途</p>
          <div class="demand-bars">${d.map((v, i) => `<div><span>${u.p.includes(i) ? '★ ' : ''}${E.primaryNames[i]}</span><i><span style="width:${(100 * v).toFixed(0)}%"></span></i><span>${(100 * v).toFixed(0)}</span></div>`).join('')}</div>
          ${best ? `<h3 class="card-title" style="margin-top:22px">包含這台的最佳套組</h3><p style="margin:8px 0 0">${esc(best.r.id)} × 1${best.N > 1 ? ` ＋ Node ${esc(best.n.id)} × ${best.N - 1}` : ''} <span class="muted">· 共 ${best.N} 台</span></p>` : ''}
        </div>
      </div></div>`;
    $('back').onclick = () => go('results');
    $('buy').onclick = () => { setBuy('model', m.id); go('exit'); };
    $('try').onclick = () => { pickBundle(best); go('floorplan'); };
  }

  // ── 2_030 Exit ──
  // Temporary destination until per-model product URLs are available.
  const ASUS_STORE = 'https://www.asus.com/tw/store/networking-iot-servers/';
  function renderExit(el) {
    const { bundles, models } = results();
    const buy = state.buy || {};
    const bundle = buy.kind === 'bundle' ? bundles.find(x => bundleKey(x) === buy.id) : null;
    const model = buy.kind === 'model' ? buy.id : null;
    const items = bundle ? (bundle.N > 1 && bundle.n.id !== bundle.r.id ? [[bundle.r.id, 1], [bundle.n.id, bundle.N - 1]] : [[bundle.r.id, bundle.N]]) : model ? [[model, (models.find(x => x.id === model) || {}).N || 1]] : [];
    const planBundle = bundle || (model && bundles.find(x => x.r.id === model)) || bundles[0];
    el.innerHTML = `<div class="page"><div class="exit-wrap">
      <div class="exit-ico">${I.cart}</div>
      <h1 class="page-title">${items.length ? '你選的配置' : '前往 ASUS 線上購物'}</h1>
      ${items.length ? `<div class="buy-items">${items.map(([id, qty]) => `<div class="buy-item"><img src="${productImg(id)}" alt="" onerror="this.style.visibility='hidden'"><span>${esc(id)}</span><b>× ${qty}</b></div>`).join('')}</div>` : ''}
      <a class="btn exit-store" href="${ASUS_STORE}" target="_blank" rel="noopener">${I.cart.replace('<svg', '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"')}前往 ASUS 線上購物</a>
      <p class="exit-try">買之前想先看看家裡怎麼擺？<button class="link-btn" id="plan" ${planBundle ? '' : 'disabled'}>在我家試擺 ›</button></p>
      <button class="link-btn" id="back" style="margin-top:28px">‹ 回推薦結果</button>
    </div></div>`;
    $('plan').onclick = () => { pickBundle(planBundle); go('floorplan'); };
    $('back').onclick = () => go('results');
  }

  // ── 3_010 Floor plan (embedded standalone app) ──
  const FP_SRC = 'dist-standalone/floorplan-demo.html';
  const AUTH_KEYS = ['aae_cusid', 'aae_deviceid', 'aae_deviceticket'];

  function clearFloorplanProject() { try { localStorage.removeItem('standalone_projects'); } catch (e) { /* ignore */ } }

  // Build a simple house (exterior + a few interior walls) per floor and drop the bundle's
  // units onto it, so the app opens with the recommendation already placed. 100 units = 1 m.
  function buildProject(b, u) {
    const perFloor = u.area / u.floors, w = Math.sqrt(perFloor * 4 / 3), d = perFloor / w;
    const W = w * 100, D = d * 100, x0 = -W / 2, y0 = -D / 2;
    const wall = (ax, ay, bx, by, type) => ({ start: { x: Math.round(ax), y: Math.round(ay) }, end: { x: Math.round(bx), y: Math.round(by) }, type });
    let node = 0;
    const floors = b.floorUnits.map((k, f) => {
      const walls = [
        wall(x0, y0, x0 + W, y0, 'concrete'), wall(x0 + W, y0, x0 + W, y0 + D, 'concrete'),
        wall(x0 + W, y0 + D, x0, y0 + D, 'concrete'), wall(x0, y0 + D, x0, y0, 'concrete'),
        wall(x0 + W * .55, y0, x0 + W * .55, y0 + D * .6, 'brick'),
        wall(x0, y0 + D * .5, x0 + W * .35, y0 + D * .5, 'drywall'),
        wall(x0 + W * .55, y0 + D * .6, x0 + W * .8, y0 + D * .6, 'drywall'),
      ];
      const routers = Array.from({ length: k }, (_, i) => {
        const isMain = f === 0 && i === 0, model = isMain ? b.r.id : b.n.id;
        const label = isMain ? '主機 · ' + model : 'Node ' + (++node) + ' · ' + model;
        return { name: fpModel(model), displayName: label, position: { x: Math.round(x0 + W * (i + .5) / k), y: Math.round(y0 + D * (f % 2 ? .3 : .7)) }, height: 1, rotate: 0, meshGroup: null, meshRole: null, mac: null };
      });
      return { id: 'f_' + (f + 1), floorNumber: f + 1, order: f, name: (f + 1) + 'F', floorHeight: 250, ceilingThickness: 20, ceilingType: 'concrete', anchor: { x: 0, y: 0 }, rotation: 0, scale: 1, imageWidth: 0, imageHeight: 0, floorplanImg: '', walls, routers, ceilingRegions: [], clients: [] };
    });
    const name = `推薦配置 · ${b.r.id}${b.N > 1 ? ' ＋ ' + b.n.id : ''} × ${b.N}`;
    return { demo: { projectName: name, version: 3, scale: 100, scaleSet: true, floors } };
  }

  function seedFloorplan(b, u) {
    try {
      AUTH_KEYS.forEach(k => localStorage.setItem(k, 'standalone'));
      localStorage.setItem('standalone_projects', JSON.stringify(buildProject(b, u)));
      localStorage.removeItem('aae_active_floor_demo'); // open a freshly seeded plan on 1F
      return true;
    } catch (e) { return false; }
  }

  // ── 我的規劃：one home, several 方案 (each keeps its own prefs, bundle and floor plan) ──
  // Stored in this browser only. Each plan holds a full copy of the floor plan project, so a
  // new plan copies the layout of its source and the two can then be edited independently.
  const PLANS_KEY = 'fpw_plans';
  const PREF_KEYS = ['p', 'top', 's', 'styles', 'brands', 'tiers', 'brandOn', 'tierOn', 'includeTravel', 'area', 'areaUnit', 'floors', 'bh', 'country', 'sort'];
  let store = { activeId: null, seq: 0, plans: [] };
  try { Object.assign(store, JSON.parse(localStorage.getItem(PLANS_KEY)) || {}); } catch (e) { /* ignore */ }
  function savePlans() {
    try { localStorage.setItem(PLANS_KEY, JSON.stringify(store)); return true; }
    catch (e) { toast('瀏覽器儲存空間不足，請到「我的規劃」刪除舊方案'); return false; }
  }
  // Two kinds of entries: 'plan' (went into 居家配置, has a floor plan) and 'rec' (只看推薦: prefs + top picks).
  const isPlan = x => x.kind !== 'rec';
  const activePlan = () => store.plans.find(x => x.id === store.activeId && isPlan(x)) || null;
  const prefSig = pr => JSON.stringify(Object.fromEntries(PREF_KEYS.filter(k => k !== 'sort').map(k => [k, pr[k]])));
  const samePrefs = (a, b) => prefSig(a) === prefSig(b);
  // Plans tried from the same recommendation (same prefs), keyed by bundle.
  const triedPlans = prefs => store.plans.filter(x => isPlan(x) && samePrefs(x.prefs, prefs));
  const recOf = plan => store.plans.find(x => x.kind === 'rec' && samePrefs(x.prefs, plan.prefs)) || null;

  // Viewing the results counts as finishing (the ~30% who only want to know what to buy):
  // keep a 推薦紀錄 for these prefs unless a plan with the same prefs already exists.
  function recordRecommendation(models, bundles) {
    if (!models.length && !bundles.length) return;
    const prefs = prefsOf();
    const top = models.slice(0, 3).map(m => m.id), bundle = bundles[0] ? bundleLabel(bundles[0]) : '';
    const rec = store.plans.find(x => x.kind === 'rec' && samePrefs(x.prefs, prefs));
    if (rec) { rec.top = top; rec.bundle = bundle; rec.updatedAt = Date.now(); }
    else {
      store.recSeq = (store.recSeq || 0) + 1;
      store.plans.unshift({ id: 'rc_' + Date.now(), kind: 'rec', name: '推薦紀錄 ' + store.recSeq, createdAt: Date.now(), updatedAt: Date.now(), prefs, top, bundle });
    }
    store.plans.sort((x, y) => y.updatedAt - x.updatedAt);
    savePlans();
  }
  function openRecord(id, thenTry) {
    const rec = store.plans.find(x => x.id === id);
    if (!rec) return;
    capturePlan();
    Object.assign(state, JSON.parse(JSON.stringify(rec.prefs)));
    state.prefsDone = true; state.bundleId = null; state.newPlanFrom = null; state.inProgress = false; save();
    if (thenTry) { pickBundle(results().bundles[0]); go('floorplan'); } else go('results');
  }
  const prefsOf = () => Object.fromEntries(PREF_KEYS.map(k => [k, JSON.parse(JSON.stringify(state[k]))]));
  const bundleLabel = b => `${b.r.id} × 1${b.N > 1 ? ` ＋ Node ${b.n.id} × ${b.N - 1}` : ''}`;
  const fmtTime = ts => { const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };

  // Pull the app's latest edits (it autosaves to standalone_projects) back into the open plan.
  function capturePlan() {
    const plan = activePlan();
    if (!plan || state.loadedPlanId !== plan.id) return;
    try {
      const proj = (JSON.parse(localStorage.getItem('standalone_projects')) || {}).demo;
      if (proj && JSON.stringify(proj) !== JSON.stringify(plan.project)) { plan.project = proj; plan.updatedAt = Date.now(); savePlans(); }
    } catch (e) { /* ignore */ }
  }
  function loadPlanIntoApp(plan) {
    try {
      AUTH_KEYS.forEach(k => localStorage.setItem(k, 'standalone'));
      localStorage.setItem('standalone_projects', JSON.stringify({ demo: plan.project }));
      localStorage.removeItem('aae_active_floor_demo');
      state.loadedPlanId = plan.id; save();
      return true;
    } catch (e) { toast('瀏覽器儲存空間不足，無法開啟方案'); return false; }
  }

  // Put a bundle's devices onto an existing layout (keeps walls and floor plan images).
  // Falls back to a freshly generated house when the floor count differs.
  function placeOnLayout(b, u, layout) {
    const fresh = buildProject(b, u).demo;
    if (!layout || (layout.floors || []).length !== b.floorUnits.length) return { project: fresh, rebuilt: !!layout };
    const project = JSON.parse(JSON.stringify(layout));
    project.projectName = fresh.projectName;
    project.floors.forEach((f, i) => {
      const pts = (f.walls || []).flatMap(w => [w.start, w.end]);
      const gen = fresh.floors[i].routers;
      if (!pts.length) { f.routers = gen; return; }
      const xs = pts.map(q => q.x), ys = pts.map(q => q.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      f.routers = gen.map((r, k) => ({ ...r, position: { x: Math.round(x0 + (x1 - x0) * (k + .5) / gen.length), y: Math.round(y0 + (y1 - y0) * (i % 2 ? .3 : .7)) } }));
    });
    return { project, rebuilt: false };
  }

  function createPlan(b, u, layout) {
    const { project, rebuilt } = placeOnLayout(b, u, layout);
    store.seq += 1;
    const plan = { id: 'pl_' + Date.now(), name: '方案 ' + store.seq, createdAt: Date.now(), updatedAt: Date.now(), prefs: prefsOf(), bundleId: bundleKey(b), label: bundleLabel(b), units: b.N, project };
    if (!store.plans.some(x => x.kind === 'rec' && samePrefs(x.prefs, plan.prefs))) { const r = results(); recordRecommendation(r.models, r.bundles); }
    store.plans.unshift(plan); store.activeId = plan.id;
    delete state.openGroups; // 我的規劃 opens the group holding this plan next time
    savePlans();
    return { plan, rebuilt };
  }

  // Open a saved plan: restore its prefs and bundle, load its floor plan.
  function openPlan(id) {
    capturePlan();
    const plan = store.plans.find(x => x.id === id);
    if (!plan) return;
    Object.assign(state, JSON.parse(JSON.stringify(plan.prefs)));
    state.bundleId = plan.bundleId; state.prefsDone = true; state.newPlanFrom = null; state.seededKey = null;
    store.activeId = plan.id; savePlans();
    loadPlanIntoApp(plan);
    go('floorplan');
  }

  // Start a new plan that copies the layout of `fromId`; prefs are pre-filled for editing.
  function startNewPlan(fromId) {
    capturePlan();
    const src = store.plans.find(x => x.id === fromId);
    if (src) Object.assign(state, JSON.parse(JSON.stringify(src.prefs)));
    state.newPlanFrom = src ? src.id : null; state.bundleId = null; state.prefsDone = true; state.inProgress = true; save();
    go('needs');
  }

  // Small SVG preview of a plan's first floor (walls + devices).
  function planThumb(plan) {
    const f = plan.project && plan.project.floors && plan.project.floors[0];
    const walls = (f && f.walls) || [], routers = (f && f.routers) || [];
    const pts = walls.flatMap(w => [w.start, w.end]).concat(routers.map(r => r.position));
    if (!pts.length) return `<img src="${productImg((plan.bundleId || '').split('|')[0])}" alt="">`;
    const xs = pts.map(q => q.x), ys = pts.map(q => q.y), x0 = Math.min(...xs), y0 = Math.min(...ys);
    const w = Math.max(1, Math.max(...xs) - x0), h = Math.max(1, Math.max(...ys) - y0), pad = Math.max(w, h) * .08, sw = Math.max(w, h) / 70;
    return `<svg viewBox="${x0 - pad} ${y0 - pad} ${w + pad * 2} ${h + pad * 2}" preserveAspectRatio="xMidYMid meet">`
      + walls.map(l => `<line x1="${l.start.x}" y1="${l.start.y}" x2="${l.end.x}" y2="${l.end.y}" stroke="#7c8794" stroke-width="${sw}" stroke-linecap="round"/>`).join('')
      + routers.map(r => `<circle cx="${r.position.x}" cy="${r.position.y}" r="${sw * 3.2}" fill="#1982ff" fill-opacity=".18"/><circle cx="${r.position.x}" cy="${r.position.y}" r="${sw * 1.4}" fill="#1982ff"/>`).join('')
      + '</svg>';
  }

  // ── 4_010 我的規劃 ──
  // Grouped by 推薦紀錄: each record expands to the plans tried from it. Records and plans are
  // deleted independently; plans whose record was deleted are gathered under 其他方案.
  function renderPlans(el) {
    capturePlan();
    const recs = store.plans.filter(x => !isPlan(x)).sort((x, y) => y.updatedAt - x.updatedAt);
    const plansOnly = store.plans.filter(isPlan);
    const groups = recs.map(rc => ({ key: rc.id, rec: rc, plans: triedPlans(rc.prefs).sort((x, y) => y.updatedAt - x.updatedAt) }));
    const orphans = plansOnly.filter(p => !recOf(p)).sort((x, y) => y.updatedAt - x.updatedAt);
    // 其他方案 is always listed as its own category (empty until a record with plans is deleted).
    if (groups.length || orphans.length) groups.push({ key: 'other', rec: null, plans: orphans });
    // Open groups: remembered per viewer; by default the group holding the open plan (or the first).
    if (Array.isArray(state.openGroups) && state.openGroups.length > 1) state.openGroups = state.openGroups.slice(-1);
    if (!Array.isArray(state.openGroups)) {
      const cur = activePlan(), g = groups.find(x => cur && x.plans.includes(cur)) || groups[0];
      state.openGroups = g ? [g.key] : [];
    }
    const pending = state.inProgress && state.seededKey !== 'blank';
    const src = state.newPlanFrom && store.plans.find(x => x.id === state.newPlanFrom);
    const pendingCard = pending ? `<div class="pending-card">
        <span class="quick-ico">${I.prefs}</span>
        <div class="pending-body"><div class="pending-title">未完成的規劃 <span class="tag tag-rank">未完成</span></div>
          <div class="quick-sub">偏好設定還沒填完${src ? `　·　新增方案，沿用「${esc(src.name)}」的格局` : ''}</div>
          <div class="quick-sub">${esc(state.p.map(i => E.primaryNames[i]).join('、'))} · ${areaText(state.area)} · ${state.floors} 層</div></div>
        <button class="link-btn" id="dropPending">捨棄</button><button class="btn btn-sm" id="resumePending">繼續填寫</button>
      </div>` : '';
    const areaOf = pr => (pr.areaUnit === 'ping' ? (pr.area / PING).toFixed(0) + ' 坪' : Math.round(pr.area) + ' m²');
    const renameBtn = x => `<button class="plan-icon" data-rename="${x.id}" title="改名" aria-label="改名">✎</button>`;
    const delBtn = x => `<button class="plan-icon plan-del" data-del="${x.id}" title="刪除" aria-label="刪除">🗑</button>`;
    const planCard = pl => `<div class="plan-card${pl.id === store.activeId ? ' current' : ''}">
        <div class="plan-thumb">${planThumb(pl)}${pl.id === store.activeId ? '<span class="tag tag-promo plan-current">目前</span>' : ''}</div>
        <div class="plan-body">
          <div class="plan-name-row"><span class="plan-name">${esc(pl.name)}</span>${renameBtn(pl)}</div>
          <div class="plan-meta">${esc(pl.label)}</div>
          <div class="plan-meta muted">共 ${pl.units} 台 · ${areaOf(pl.prefs)} · ${pl.prefs.floors} 層 · ${fmtTime(pl.updatedAt)}</div>
          <div class="plan-actions"><button class="btn btn-sm" data-open="${pl.id}">開啟</button>${delBtn(pl)}</div>
        </div></div>`;
    const groupHead = g => g.rec
      ? `<div class="grp-icon">${g.rec.top && g.rec.top[0] ? `<img src="${productImg(g.rec.top[0])}" alt="" onerror="this.style.visibility='hidden'">` : ''}</div>
         <div class="grp-main">
           <div class="plan-name-row"><span class="tag tag-kind-rec">推薦紀錄</span><span class="plan-name">${esc(g.rec.name)}</span>${renameBtn(g.rec)}</div>
           <div class="plan-meta">${esc((g.rec.top || [])[0] || '')}　<span class="muted">${esc(g.rec.prefs.p.map(i => E.primaryNames[i]).join('、'))} · ${areaOf(g.rec.prefs)} · ${g.rec.prefs.floors} 層 · ${fmtTime(g.rec.updatedAt)}</span></div>
         </div>
         <span class="grp-count">${g.plans.length ? `${g.plans.length} 個方案` : '尚未試擺'}</span>
         <button class="btn btn-ghost btn-sm" data-rec="${g.rec.id}">查看推薦</button>${delBtn(g.rec)}`
      : `<div class="grp-icon grp-icon-other">${I.plans}</div>
         <div class="grp-main"><div class="plan-name-row"><span class="plan-name">其他方案</span></div></div>
         <span class="grp-count">${g.plans.length ? `${g.plans.length} 個方案` : '沒有方案'}</span>`;
    const groupBlock = g => {
      const open = state.openGroups.includes(g.key);
      return `<section class="grp${open ? ' open' : ''}${g.rec ? '' : ' grp-other'}">
        <div class="grp-head" data-toggle="${g.key}"><span class="grp-chev">›</span>${groupHead(g)}</div>
        ${open ? `<div class="grp-body">${g.plans.length ? `<div class="plan-grid">${g.plans.map(planCard).join('')}</div>` : !g.rec ? '<p class="muted small grp-empty">目前沒有其他方案。刪除推薦紀錄時，底下的方案會移到這裡。</p>' : '<p class="muted small grp-empty">還沒有從這筆推薦試擺的方案。按「查看推薦」，在推薦結果選一組「在我家試擺」。</p>'}</div>` : ''}
      </section>`;
    };
    const counts = [recs.length ? `${recs.length} 筆推薦紀錄` : '', plansOnly.length ? `${plansOnly.length} 個方案` : ''].filter(Boolean).join(' · ');
    el.innerHTML = `<div class="page">
      <div class="res-head"><div><div class="eyebrow">我的規劃</div><h1 class="page-title" style="margin-top:6px">我的家</h1>
        <p class="page-sub">${groups.length ? counts + '；點推薦紀錄展開從它試擺的方案' : '還沒有紀錄。看完推薦結果或進入居家配置後，會自動存在這裡。'}</p></div>
        ${plansOnly.length ? '<button class="btn btn-ghost btn-sm" id="newPlan">＋ 新增方案</button>' : ''}</div>
      ${pendingCard}
      ${groups.length ? `<div class="grp-list">${groups.map(groupBlock).join('')}</div>` : (pending ? '' : `<button class="btn" id="startFirst" style="margin-top:24px">開始規劃 →</button>`)}
    </div>`;
    el.querySelectorAll('[data-toggle]').forEach(h => (h.onclick = e => {
      if (e.target.closest('button, input')) return;
      const k = h.dataset.toggle;
      state.openGroups = state.openGroups.includes(k) ? [] : [k]; // accordion: one group open at a time
      save(); render();
    }));
    el.querySelectorAll('[data-open]').forEach(b => (b.onclick = () => openPlan(b.dataset.open)));
    el.querySelectorAll('[data-rec]').forEach(b => (b.onclick = () => openRecord(b.dataset.rec)));
    if ($('resumePending')) $('resumePending').onclick = () => go('needs');
    if ($('dropPending')) $('dropPending').onclick = () => {
      if (!confirm('捨棄這個未完成的規劃？')) return;
      const cur = activePlan();
      if (cur) { Object.assign(state, JSON.parse(JSON.stringify(cur.prefs))); state.bundleId = cur.bundleId; state.prefsDone = true; }
      else { state.prefsDone = false; state.bundleId = null; }
      state.newPlanFrom = null; state.inProgress = false; save(); render();
    };
    el.querySelectorAll('[data-del]').forEach(b => (b.onclick = () => {
      const x = store.plans.find(y => y.id === b.dataset.del);
      if (!x) return;
      const n = isPlan(x) ? 0 : triedPlans(x.prefs).length;
      if (!confirm(isPlan(x) ? `刪除「${x.name}」？刪除後無法復原。` : `刪除「${x.name}」？${n ? `底下 ${n} 個方案不會刪除，會移到「其他方案」。` : ''}`)) return;
      store.plans = store.plans.filter(y => y.id !== x.id);
      if (store.activeId === x.id) { const nxt = store.plans.find(isPlan); store.activeId = nxt ? nxt.id : null; state.loadedPlanId = null; save(); }
      if (!isPlan(x) && n) { state.openGroups = ['other']; save(); }
      savePlans(); render();
    }));
    el.querySelectorAll('[data-rename]').forEach(b => (b.onclick = () => {
      const x = store.plans.find(y => y.id === b.dataset.rename);
      const span = b.parentElement.querySelector('.plan-name');
      const input = document.createElement('input');
      input.className = 'plan-name-input'; input.value = x.name; input.maxLength = 30;
      span.replaceWith(input); b.hidden = true; input.focus(); input.select();
      input.onclick = e => e.stopPropagation();
      const done = ok => { if (ok && input.value.trim()) { x.name = input.value.trim(); savePlans(); } render(); };
      input.onkeydown = e => { if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); };
      input.onblur = () => done(true);
    }));
    const np = $('newPlan');
    if (np) np.onclick = () => startNewPlan((activePlan() || plansOnly[0]).id);
    const sf = $('startFirst');
    if (sf) sf.onclick = () => go('needs');
  }

  function renderFloorplan(el) {
    const { u, bundles } = results();
    const blank = state.seededKey === 'blank' && !state.bundleId;
    try { AUTH_KEYS.forEach(k => localStorage.setItem(k, 'standalone')); } catch (e) { /* ignore */ }
    let plan = null, fresh = false, note = '';
    const b = bundles.find(x => bundleKey(x) === state.bundleId) || null;
    if (!blank) {
      capturePlan();
      const cur = activePlan();
      const prefsMatch = cur && samePrefs(cur.prefs, prefsOf());
      const existing = triedPlans(prefsOf()).find(x => x.bundleId === state.bundleId);
      if (state.newPlanFrom && b) {
        // Explicit 新增方案: copy the source plan's layout.
        const src = store.plans.find(x => x.id === state.newPlanFrom);
        const r = createPlan(b, u, src && src.project);
        plan = r.plan; state.newPlanFrom = null; save();
        note = r.rebuilt ? `已建立${plan.name}；樓層數不同，已重新產生示意格局` : `已建立${plan.name}，沿用「${src ? src.name : '原方案'}」的格局`;
        fresh = loadPlanIntoApp(plan);
      } else if (cur && cur.bundleId === state.bundleId && prefsMatch) {
        plan = cur;
        if (state.loadedPlanId !== cur.id) fresh = loadPlanIntoApp(cur);
      } else if (existing) {
        // Already tried this bundle for this recommendation: reopen that plan instead of duplicating it.
        capturePlan();
        plan = existing; store.activeId = existing.id; savePlans();
        fresh = loadPlanIntoApp(existing);
        note = `已開啟${existing.name}`;
      } else if (b) {
        // Different bundle or prefs: keep the current plan, save this one as a new plan on the same layout.
        const r = createPlan(b, u, cur && cur.project);
        plan = r.plan;
        if (cur) note = r.rebuilt ? `已另存為${plan.name}；樓層數不同，已重新產生示意格局` : `已另存為${plan.name}，「${cur.name}」保留在我的規劃`;
        fresh = loadPlanIntoApp(plan);
      } else if (cur) {
        plan = cur;
        if (state.loadedPlanId !== cur.id) fresh = loadPlanIntoApp(cur);
      }
    }
    const ids = plan ? plan.bundleId.split('|') : [];
    const mapped = ids.slice(0, 2).filter((id, i, a) => id && a.indexOf(id) === i && FP_MODEL[id] && FP_MODEL[id] !== id);
    // Devices sit on different floors; the app only shows one floor at a time, so offer a floor switcher.
    const floorList = plan && plan.project.floors.length > 1 ? plan.project.floors.map(f => ({ id: f.id, name: f.name, devices: (f.routers || []).map(r => (r.displayName || r.name).replace(' · ', ' ')) })) : [];
    el.innerHTML = `<div class="page-full">
      <div class="fp-bar">
        <span class="quick-ico" style="width:38px;height:38px">${I.plan}</span>
        <div><div class="fp-bar-title">${plan ? `<span class="fp-plan-name">${esc(plan.name)}</span>${esc(plan.label)}` : '自由試用'}</div>
          <div class="fp-bar-meta">${plan ? `共 ${plan.units} 台 · ${areaText(u.area)} · ${u.floors} 層 · 自動儲存，可拖曳調整或上傳自家平面圖` : '未帶入推薦套組；可上傳平面圖並自行放置路由器'}</div>
          ${floorList.length ? `<div class="fp-floors">${floorList.map((f, i) => `<button class="fp-floor${i === 0 ? ' on' : ''}" data-floor="${f.id}"><b>${f.name}</b>${esc(f.devices.join('、'))}</button>`).join('')}</div>` : ''}</div>
        ${mapped.length ? `<span class="fp-warn" title="Floor plan 機種庫沒有同名型號，暫以近似機種模擬">${mapped.map(id => esc(id) + '→' + esc(FP_MODEL[id])).join('、')}</span>` : ''}
        <span class="spacer"></span>
        ${plan && b ? '<button class="btn btn-ghost btn-sm" id="reseed" title="保留格局，重新放入這組機器">重新帶入</button>' : ''}
        ${plan ? '<button class="btn btn-ghost btn-sm" id="newPlan" title="複製目前格局，試試不同的偏好或套組">新增方案</button>' : ''}
        <button class="btn btn-sm" id="swap">${plan ? '換一組配置' : '先看推薦'}</button>
      </div>
      <iframe class="fp-frame" id="fpFrame" title="ASUS WiFi Floorplan" src="${FP_SRC}${fresh ? '?t=' + Date.now() : ''}"></iframe>
    </div>`;
    $('swap').onclick = () => go('results');
    if ($('newPlan')) $('newPlan').onclick = () => startNewPlan(plan.id);
    if ($('reseed')) $('reseed').onclick = () => {
      capturePlan();
      plan.project = placeOnLayout(b, u, plan.project).project; plan.updatedAt = Date.now(); savePlans();
      loadPlanIntoApp(plan); $('fpFrame').src = FP_SRC + '?t=' + Date.now(); toast('已在目前格局重新放入這組機器');
    };
    // Keep the plan in sync with the app's autosave while this page is open.
    clearInterval(captureTimer);
    if (plan) captureTimer = setInterval(() => { if (!document.body.contains($('fpFrame'))) return clearInterval(captureTimer); capturePlan(); }, 3000);
    if (floorList.length) {
      const frameDoc = () => { try { return $('fpFrame').contentDocument; } catch (e) { return null; } };
      el.querySelectorAll('[data-floor]').forEach(btn => (btn.onclick = () => {
        const item = frameDoc() && frameDoc().querySelector(`.floor-item[data-floor-id="${btn.dataset.floor}"]`);
        if (!item) return toast('Floor plan 還在載入，請稍候');
        item.click(); syncFloor();
      }));
      // Keep the switcher in sync when the user changes floor inside the app.
      const syncFloor = () => {
        const active = frameDoc() && frameDoc().querySelector('.floor-item.active');
        if (active) el.querySelectorAll('[data-floor]').forEach(btn => btn.classList.toggle('on', btn.dataset.floor === active.dataset.floorId));
      };
      clearInterval(floorSyncTimer);
      floorSyncTimer = setInterval(() => { if (!document.body.contains(el.querySelector('.fp-floors'))) return clearInterval(floorSyncTimer); syncFloor(); }, 700);
    }
    const msg = [note, floorList.length ? `這組分在 ${floorList.length} 個樓層，點上方樓層切換查看` : ''].filter(Boolean);
    msg.forEach((m, i) => pendingToasts.push(setTimeout(() => toast(m), 900 + i * 2200)));
  }
  let floorSyncTimer, captureTimer, pendingToasts = [];

  // ── Toast ──
  let toastTimer;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1800); }

  // ── Demo bar ──
  function updateDemoBar(s) { $('demo-bar-pagenum').textContent = s.code; $('demo-bar-desc').textContent = s.description; $('demo-bar-desc').title = s.description; }
  function renderPageList(cur) {
    const list = $('demo-bar-pagelist');
    list.replaceChildren(...SCREENS.map(s => {
      const item = document.createElement('div');
      item.className = 'demo-bar-pagelist-item' + (s.id === cur ? ' current' : '');
      item.innerHTML = '<span class="demo-bar-pagelist-num"></span><span class="demo-bar-pagelist-desc"></span>';
      item.children[0].textContent = s.code; item.children[1].textContent = s.description;
      item.onclick = () => { list.classList.remove('show'); unlockFor(s.id); go(s.id); };
      return item;
    }));
  }
  $('demo-bar-pagenum-btn').onclick = () => { if ($('demo-bar-pagelist').classList.toggle('show')) renderPageList(currentId()); };
  document.addEventListener('click', e => { if (!e.target.closest('.demo-bar-pagenum-wrap')) $('demo-bar-pagelist').classList.remove('show'); });
  $('demo-bar-reset').onclick = () => {
    state = initial(); save(); clearFloorplanProject();
    store = { activeId: null, seq: 0, plans: [] }; savePlans();
    decisions = []; renderDecisionBar(); closeDecision();
    if (currentId() === 'home') render(); else go('home');
  };

  function openDecision(name) {
    const d = DECISIONS[name];
    $('flow-decision-title').textContent = d.title;
    $('flow-decision-options').replaceChildren(...d.options.map(o => {
      const btn = document.createElement('button');
      btn.className = 'flow-decision-option'; btn.textContent = o.label;
      btn.onclick = () => chooseDecision(name, o.value);
      return btn;
    }));
    const el = $('flow-decision'); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  }
  function closeDecision() { $('flow-decision').classList.remove('show'); }
  function chooseDecision(name, value) {
    const d = DECISIONS[name], opt = d.options.find(o => o.value === value);
    decisions = decisions.slice(0, d.index); decisions[d.index] = { name, value };
    renderDecisionBar(); closeDecision();
    if (opt.to === 'floorplan' && !state.bundleId) pickBundle(results().bundles[0]);
    if (opt.to) go(opt.to);
  }
  function renderDecisionBar() {
    $('demo-bar-decisions').replaceChildren(...decisions.filter(Boolean).map(({ name, value }) => {
      const d = DECISIONS[name], sel = document.createElement('select');
      sel.className = 'demo-bar-decision'; sel.title = d.title;
      d.options.forEach(o => sel.add(new Option(`${d.label}: ${o.short}`, o.value, false, o.value === value)));
      sel.onchange = () => chooseDecision(name, sel.value);
      return sel;
    }));
  }
  $('flow-decision-close').onclick = closeDecision;

  // ── Linear flow: 偏好設定 → 推薦結果 → 居家配置 ──
  const FLOW = [
    { key: 'prefs', label: '偏好設定', to: 'needs' },
    { key: 'rank', label: '推薦結果', to: 'results' },
    { key: 'plan', label: '居家配置', to: 'floorplan' },
  ];
  // Highest step the user has unlocked: prefs always; results after finishing the
  // questionnaire; floor plan once a bundle was picked on the results page.
  function unlocked() { return state.bundleId || state.seededKey === 'blank' ? 2 : state.prefsDone ? 1 : 0; }
  function stepOf(s) { return FLOW.findIndex(f => f.key === s.rail); }

  function renderStepper(s) {
    const nav = $('flowSteps'), cur = stepOf(s);
    nav.hidden = cur < 0;
    if (cur < 0) return;
    const max = unlocked();
    const hints = ['填完 3 題就能看推薦', '', '拖曳調整位置，查看訊號覆蓋'];
    const finished = i => (i === 0 ? state.prefsDone : i === 1 ? !!state.bundleId : false);
    nav.innerHTML = FLOW.map((f, i) => {
      const cls = i === cur ? 'current' : i <= max ? 'done' : 'locked';
      return (i ? `<span class="fs-line${finished(i - 1) ? ' done' : ''}"></span>` : '')
        + `<button class="fs-step ${cls}" data-to="${f.to}" ${cls === 'locked' ? 'disabled' : ''} title="${cls === 'locked' ? '請先完成前一步' : f.label}"><span class="fs-dot">${i !== cur && finished(i) ? '✓' : i + 1}</span><span class="fs-label">${f.label}</span></button>`;
    }).join('') + (state.newPlanFrom && cur < 2
      ? `<span class="fs-hint fs-newplan">新增方案中：沿用「${esc((store.plans.find(x => x.id === state.newPlanFrom) || {}).name || '')}」的格局 <button class="link-btn" id="cancelNew">取消</button></span>`
      : `<span class="fs-hint">${hints[cur]}</span>`);
    const cancel = nav.querySelector('#cancelNew');
    if (cancel) cancel.onclick = () => { const id = state.newPlanFrom; state.newPlanFrom = null; save(); openPlan(id); };
    nav.querySelectorAll('.fs-step:not([disabled])').forEach(b => (b.onclick = () => { if (b.dataset.to !== location.hash.slice(1)) go(b.dataset.to); }));
  }

  // Demo page list may jump anywhere: fill in prerequisites with defaults.
  function unlockFor(id) {
    const need = stepOf(screenById[id]);
    if (need >= 1) state.prefsDone = true;
    if (need >= 2 && !state.bundleId && state.seededKey !== 'blank') pickBundle(results().bundles[0]);
    save();
  }

  // ── Router ──
  function currentId() { const id = location.hash.slice(1); return screenById[id] ? id : SCREENS[0].id; }
  let prevScreen = null;
  function render() {
    let s = screenById[currentId()];
    if (prevScreen === 'floorplan' && s.id !== 'floorplan') capturePlan();
    pendingToasts.forEach(clearTimeout); pendingToasts = [];
    prevScreen = s.id;
    const need = stepOf(s), max = unlocked();
    if (need > max) {
      toast(max === 0 ? '請先完成偏好設定' : '請先在推薦結果選一組套組');
      location.replace('#' + FLOW[max].to);
      return;
    }
    if (s.id !== 'results') closeDecision();
    renderStepper(s);
    updateDemoBar(s);
    renderRail(s.rail);
    const el = $('screen');
    el.scrollTop = 0;
    s.render(el);
    document.title = 'ASUS WiFi Floor Plan';
  }
  if (new URLSearchParams(location.search).get('demo') === '0') document.body.classList.add('no-demo');
  // '#try' = free floor plan trial without a recommendation (used by the landing page)
  function route() {
    if (location.hash === '#try') { state.bundleId = null; state.seededKey = 'blank'; save(); clearFloorplanProject(); location.replace('#floorplan'); return; }
    render();
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', () => capturePlan());
  route();
})();
