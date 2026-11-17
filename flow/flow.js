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
    return { p: state.p, s: state.s, top: state.p.includes(state.top) ? state.top : state.p[0], style: state.styles.length === 2 ? 'both' : state.styles[0] || 'none', modelBrands: state.brands, bundleBrands: state.brands, modelTiers: state.tiers, bundleTiers: state.tiers, includeTravel: state.includeTravel, country: state.country, area: state.area, floors: state.floors, sort: 'balanced', bh: state.bh };
  }
  function results() {
    const c = E.catalog(), u = engineInput();
    const calc = E.calculate(c, u);
    // bundles = Top 10 shown in the list; allBundles = every valid combination (for trying any ranked model).
    return { u, models: E.modelRank(c, u), bundles: calc.rows, allBundles: calc.all };
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
    { id: 'home', code: '0_010', rail: 'home', description: '首頁：大字標題＋兩個方形大按鈕（推薦機種／居家配置，各附一句說明），下方為功能 banner（未完成的進度在「我的規劃」）', render: renderHome },
    { id: 'needs', code: '1_010', rail: 'prefs', description: '偏好 1/3：主要用途（可複選，標記最重要的一項）', render: renderNeeds },
    { id: 'care', code: '1_020', rail: 'prefs', description: '偏好 2/3：還在意什麼、外觀偏好、旅行機種', render: renderCare },
    { id: 'home-size', code: '1_030', rail: 'prefs', description: '偏好 3/3：我家的樣子（面積、樓層、回程、地區）', render: renderHomeSize },
    { id: 'results', code: '2_010', rail: 'rank', description: '推薦結果：品牌／產品定位快速篩選＋機種排行＋配置套組，看到即完成；可在我家試擺（約 70%）或購物車前往購買（約 30%）', render: renderResults },
    { id: 'model', code: '2_020', rail: 'rank', description: '機種詳情：規格、功能與需求適配度，可前往購買或試擺', render: renderModel },
    { id: 'exit', code: '2_030', rail: 'rank', description: '購買（約 30%）：列出所選配置，按鈕開新分頁前往 ASUS 線上購物', render: renderExit },
    { id: 'floorplan', code: '3_010', rail: 'plan', description: 'Floor plan 操作環境（約 70%）：自動存成方案；「試其他套組」右側選單直接替換本方案裝置，「重置擺放」讓機器回預設位置', render: renderFloorplan },
    { id: 'plans', code: '4_010', rail: 'plans', description: '我的規劃：資料夾分頁（推薦紀錄藍、自由配置綠），分頁內顯示該來源資訊與方案；推薦紀錄刪除後方案移到「自由配置」', render: renderPlans },
  ];
  const screenById = Object.fromEntries(SCREENS.map(s => [s.id, s]));

  // ── Demo decisions ──
  // Demo branch decisions (none at the moment: the results page offers both paths itself).
  const DECISIONS = {};
  let decisions = [];

  function go(id) { location.hash = id; }

  // ── Rail ──
  // The rail holds global destinations only; the planning flow itself is linear (see stepper).
  function renderRail(active) {
    $('rail').innerHTML = `<button class="rail-btn${active === 'home' ? ' active' : ''}" data-to="home" data-tip="首頁" aria-label="首頁">${I.home}</button>`
      + `<button class="rail-btn${active === 'plans' ? ' active' : ''}" data-to="plans" data-tip="我的規劃" aria-label="我的規劃${hasNewPlans() ? '（有新資料）' : ''}">${I.plans}${hasNewPlans() ? '<span class="rail-dot"></span>' : ''}</button>`
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
        <div class="hero-choices">
          <button class="choice choice-rec" id="start">
            <span class="choice-ico">${I.router}</span>
            <span class="choice-title">推薦機種</span>
            <span class="choice-desc">還不知道買哪台？回答幾個問題，推薦適合你家的機種與台數。</span>
            <span class="choice-go">→</span>
          </button>
          <button class="choice choice-plan" id="startPlan">
            <span class="choice-ico">${I.plan}</span>
            <span class="choice-title">居家配置</span>
            <span class="choice-desc">已經有路由器？直接在平面圖上擺放，查看每個房間的訊號覆蓋。</span>
            <span class="choice-go">→</span>
          </button>
        </div>
      </section>
      <div class="home-strip"><div><div class="eyebrow">能幫你做什麼</div><h2 class="promo-heading">從挑機種到擺位置，一次搞定</h2></div></div>
      ${promoBanners()}
    </div>`;
    $('start').onclick = () => go('needs');
    $('startPlan').onclick = () => go('try');
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
      { key: 'travel', label: '也看旅行機種', on: () => state.includeTravel, toggle: () => { state.includeTravel = !state.includeTravel; } },
    ];
    const opt = (group, v, label, on, sub) => `<button class="chip${on ? ' on' : ''}" data-g="${group}" data-v="${v}">${label}${sub ? `<span class="chip-sub">${sub}</span>` : ''}</button>`;
    let shown = new Set();
    const draw = () => {
      $('sec').innerHTML = items.map(it => `<button class="chip${it.on() ? ' on' : ''}" data-k="${it.key}">${it.on() ? '✓ ' : ''}${it.label}</button>`).join('');
      const panels = [];
      if (state.s.includes(4)) panels.push(`<div class="subopt" data-p="style"><span class="subopt-label">外觀偏好</span><div class="chips">${opt('style', 'quiet', '低調內置天線', state.styles.includes('quiet'))}${opt('style', 'rgb', 'RGB 燈效', state.styles.includes('rgb'))}</div></div>`);
      $('subopts').innerHTML = panels.join('');
      $('subopts').querySelectorAll('[data-p]').forEach(p => p.classList.toggle('still', shown.has(p.dataset.p)));
      shown = new Set([...$('subopts').querySelectorAll('[data-p]')].map(p => p.dataset.p));
      $('sec').querySelectorAll('[data-k]').forEach(b => (b.onclick = () => { items.find(it => it.key === b.dataset.k).toggle(); save(); draw(); }));
      $('subopts').querySelectorAll('[data-g]').forEach(b => (b.onclick = () => {
        const v = b.dataset.v;
        // Sub-options start with the first one picked; clearing them all unticks the parent item.
        state.styles = state.styles.includes(v) ? state.styles.filter(x => x !== v) : [...state.styles, v];
        if (!state.styles.length) state.s = state.s.filter(x => x !== 4);
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
    const { u, models, bundles, allBundles } = results();
    const bestFor = id => allBundles.find(b => b.r.id === id) || null;
    const tried = state.newPlanFrom ? new Map() : new Map(triedPlans(prefsOf()).map(x => [x.bundleId, x]));
    const tryLabel = b => (b && tried.has(bundleKey(b)) ? '開啟方案' : '在我家試擺');
    if (u.country === 'TW') recordRecommendation(models, bundles);
    if (state.inProgress) { state.inProgress = false; save(); }
    const top3 = models.slice(0, 3), rest = models.slice(3);
    const cfgText = b => `${esc(b.r.id)} × 1${b.N > 1 ? ` ＋ ${esc(b.n.id)} × ${b.N - 1}` : ''}<span class="muted">　共 ${b.N} 台</span>`;
    const tags = [u.p.map(i => E.primaryNames[i] + (i === u.top && u.p.length > 1 ? '★' : '')).join('、'), ...u.s.map(i => E.secondaryNames[i]), areaText(u.area), `${u.floors} 層`, u.bh === 'wired' ? '有線回程' : '無線回程'].filter(Boolean);
    const fchip = (g, v, label, on) => `<button class="chip${on ? ' on' : ''}" data-f="${g}" data-v="${v}">${label}</button>`;
    const filters = `<div class="res-filters">
        <div class="res-filter"><span class="res-filter-label">品牌／系列</span><div class="chips">${fchip('brand', '', '全部', !state.brands.length)}${['ASUS', 'ROG', 'TUF'].map(v => fchip('brand', v, v, state.brands.includes(v))).join('')}</div></div>
        <div class="res-filter"><span class="res-filter-label">產品定位</span><div class="chips">${fchip('tier', '', '全部', !state.tiers.length)}${['入門', '中階', '高階'].map(v => fchip('tier', v, E.tierNames[v], state.tiers.includes(v))).join('')}</div></div>
      </div>`;
    el.innerHTML = `<div class="page">
      <div class="res-head"><div><div class="eyebrow">推薦結果</div><div class="title-row"><h1 class="page-title">這些機種最適合你家</h1></div><div class="summary-tags">${tags.map(t => `<span>${esc(t)}</span>`).join('')}<button class="link-btn tags-edit" id="edit">修改條件</button></div></div></div>
      ${filters}
      ${u.country !== 'TW' ? '<div class="card empty" style="margin-top:24px">此地區尚未建立價表與可推薦機種，請改選台灣。</div>' : `
      <div class="section-head"><div><h2>推薦機種</h2><div class="muted small">依你的需求與空間挑出的前 3 名 · 點卡片看詳情</div></div></div>
      ${top3.length ? `<div class="gauges gauges-3">${top3.map((m, i) => `<div class="gauge-card" data-model="${esc(m.id)}">
        <div class="gauge-name-row">${rankTag(i + 1)}<div class="gauge-name" title="${esc(m.id)}">${esc(m.id)}</div></div>
        <div class="gauge-sub">${esc(m.m.series)} · ${esc(E.tierNames[m.m.positioning] || E.tierNames['未設定'])}</div>
        <div class="gauge-body"><div class="gauge-photo">${m.active ? '<span class="tag tag-promo photo-tag">本期主打</span>' : ''}<img src="${productImg(m.id)}" alt="${esc(m.id)}" loading="lazy" onerror="this.style.visibility='hidden'"></div>
        <ul class="gauge-facts"><li>WiFi ${m.m.wifi}</li><li>${m.m.bands} 頻段</li><li>${m.m.ai ? 'AI 核心' : '一般核心'}</li></ul></div>
        ${bestFor(m.id) ? `<div class="gauge-config"><span class="gauge-config-label">建議配置</span><div>${cfgText(bestFor(m.id))}</div></div>` : ''}
        <div class="gauge-foot"><div class="gauge-actions">${bestFor(m.id) ? `<button class="try-link" data-try-model="${esc(m.id)}">${tryLabel(bestFor(m.id))}</button>` : ''}${cartBtn(`data-buy-model="${esc(m.id)}"`)}</div><div class="gauge-badges">${m.m.special !== '無' ? `<span class="badge">${esc(m.m.special)}</span>` : ''}</div></div></div>`).join('')}</div>
        ${rest.length ? `<div class="more-row"><button class="link-btn more-toggle" id="moreModels">${showMoreModels ? '收起更多機種 ▴' : `查看更多機種（${rest.length}）▾`}</button></div>
        ${showMoreModels ? `<div class="more-models">${rest.map((m, i) => `<button data-model="${esc(m.id)}">${rankTag(i + 4)}<span>${esc(m.id)}</span></button>`).join('')}</div>` : ''}` : ''}` : '<div class="card empty">沒有符合目前品牌／定位與空間條件的機種，請調整條件。</div>'}

      ${bundles.length ? `<div class="section-head fold-head${showBundles ? ' open' : ''}" id="moreBundles" role="button" aria-expanded="${showBundles}"><div><h2>推薦配置套組 · 前十名</h2><div class="muted small">主機＋Node 的不同搭配與最少台數；Node 依空間與需求搭配</div></div><span class="fold-toggle">${showBundles ? '收起 ▴' : '展開 ▾'}</span></div>` : ''}
      ${showBundles ? `${bundles.length ? `<div class="bundles">${bundles.map((b, i) => `<div class="bundle">
        <div class="bundle-rank">${String(i + 1).padStart(2, '0')}</div>
        <div><div class="bundle-name">${esc(b.r.id)}${b.N > 1 ? ` <span class="muted">＋ ${esc(b.n.id)}</span>` : ''}${i === 0 ? ' <span class="tag tag-rank1" title="最推薦">★</span>' : ''}</div>
          <div class="bundle-meta"><span>${b.N === 1 ? '單機' : 'AiMesh'}</span><span>WiFi ${b.r.wifi}</span><span>各樓層 ${b.floorUnits.join(' / ')} 台</span><span>${esc(E.tierNames[b.r.positioning] || '')}</span>${b.boost || b.reserved ? '<span class="tag tag-promo">本期主打</span>' : ''}</div>
          </div>
        <div class="bundle-units"><b>${b.N}</b><small>台</small><div>${b.N > 1 ? `主機 1 ＋ Node ${b.N - 1}` : '主機 1'}</div></div>
        <div class="bundle-actions"><button class="btn btn-sm${tried.has(bundleKey(b)) ? ' btn-ghost' : ''}" data-try="${i}">${tryLabel(b)}</button>${cartBtn(`data-buy-bundle="${i}"`)}</div>
        <details><summary>推薦理由與限制</summary>依你選的用途與在意的功能評估；台數是此面積與樓層下的最低預估，不是實測保證。${u.bh === 'wired' ? '有線' : '無線'}回程與混搭相容仍待驗證。</details>
      </div>`).join('')}</div>` : '<div class="card empty">沒有符合條件的配置套組，請調整條件。</div>'}` : ''}

      <div class="cta-band"><div><h3>想知道放在家裡哪裡最好？</h3><p>把第一名機種的建議配置放進你家的平面圖，看每個房間的訊號覆蓋。</p></div><div class="cta-actions"><button class="btn" id="cta" ${bundles.length ? '' : 'disabled'}>開始居家配置 →</button></div></div>
`}
    </div>`;
    $('edit').onclick = () => go('needs');
    // Quick filters: brand is multi-select (none or all three = 全部); 產品定位 is single choice.
    el.querySelectorAll('[data-f]').forEach(b => (b.onclick = () => {
      const v = b.dataset.v;
      if (b.dataset.f === 'brand') {
        state.brands = !v ? [] : state.brands.includes(v) ? state.brands.filter(x => x !== v) : [...state.brands, v];
        if (state.brands.length === 3) state.brands = [];
      } else state.tiers = !v || state.tiers.includes(v) ? [] : [v];
      state.brandOn = !!state.brands.length; state.tierOn = !!state.tiers.length;
      save(); rerenderKeepScroll();
    }));
    el.querySelectorAll('[data-model]').forEach(c => (c.onclick = () => { state.modelId = c.dataset.model; save(); go('model'); }));
    el.querySelectorAll('[data-try]').forEach(b => (b.onclick = () => { pickBundle(bundles[+b.dataset.try]); go('floorplan'); }));
    el.querySelectorAll('[data-try-model]').forEach(b => (b.onclick = e => { e.stopPropagation(); pickBundle(bestFor(b.dataset.tryModel)); go('floorplan'); }));
    el.querySelectorAll('[data-buy-model]').forEach(b => (b.onclick = e => { e.stopPropagation(); const bb = bestFor(b.dataset.buyModel); if (bb) setBuy('bundle', bundleKey(bb)); else setBuy('model', b.dataset.buyModel); go('exit'); }));
    if ($('moreModels')) $('moreModels').onclick = () => { showMoreModels = !showMoreModels; rerenderKeepScroll(); };
    if ($('moreBundles')) $('moreBundles').onclick = () => { showBundles = !showBundles; rerenderKeepScroll(); };
    el.querySelectorAll('[data-buy-bundle]').forEach(b => (b.onclick = () => { setBuy('bundle', bundleKey(bundles[+b.dataset.buyBundle])); go('exit'); }));
    const cta = $('cta');
    if (cta) cta.onclick = () => { pickBundle((models[0] && bestFor(models[0].id)) || bundles[0]); go('floorplan'); };
  }

  let showMoreModels = false, showBundles = false;
  // In-page toggles re-render the screen; keep the scroll position so the page does not jump to the top.
  function rerenderKeepScroll() { const sc = $('screen'), y = sc.scrollTop; render(); sc.scrollTop = y; }
  function pickBundle(b) { if (b) { state.bundleId = bundleKey(b); save(); } }

  // ── 2_020 Model detail ──
  function renderModel(el) {
    const { u, models, bundles, allBundles } = results();
    const c = E.catalog();
    const m = c.products.find(p => p.id === state.modelId) || (models[0] && models[0].m);
    if (!m) { el.innerHTML = '<div class="page"><div class="card empty">尚未選擇機種</div></div>'; return; }
    const rankRow = models.find(x => x.id === m.id);
    const x = E.ability(m), d = E.demands(x);
    const best = allBundles.find(b => b.r.id === m.id) || allBundles.find(b => b.n.id === m.id && b.N > 1);
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
    const { bundles, models, allBundles } = results();
    const buy = state.buy || {};
    const bundle = buy.kind === 'bundle' ? allBundles.find(x => bundleKey(x) === buy.id) : null;
    const model = buy.kind === 'model' ? buy.id : null;
    const items = bundle ? (bundle.N > 1 && bundle.n.id !== bundle.r.id ? [[bundle.r.id, 1], [bundle.n.id, bundle.N - 1]] : [[bundle.r.id, bundle.N]]) : model ? [[model, (models.find(x => x.id === model) || {}).N || 1]] : [];
    const planBundle = bundle || (model && allBundles.find(x => x.r.id === model)) || bundles[0];
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
  // The app opens its 積木拼平面圖 builder when this draft exists and the floor has no walls yet.
  const BLOCK_KEY = 'floorplan_blockDraft_demo';

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
  const hasNewPlans = () => store.plans.some(x => x.createdAt > (store.seenAt || 0));
  const activePlan = () => store.plans.find(x => x.id === store.activeId && isPlan(x)) || null;
  const FILTER_KEYS = ['sort', 'brands', 'tiers', 'brandOn', 'tierOn'];
  const prefSig = pr => JSON.stringify(Object.fromEntries(PREF_KEYS.filter(k => !FILTER_KEYS.includes(k)).map(k => [k, pr[k]])));
  const samePrefs = (a, b) => prefSig(a) === prefSig(b);
  // Plans tried from the same recommendation (same prefs), keyed by bundle.
  const triedPlans = prefs => store.plans.filter(x => isPlan(x) && !x.free && samePrefs(x.prefs, prefs));
  const recOf = plan => (plan.free ? null : store.plans.find(x => x.kind === 'rec' && samePrefs(x.prefs, plan.prefs)) || null);
  // A 自由配置 plan (made from 首頁「居家配置」) is open and no bundle is picked.
  const freeOpen = () => { const p = activePlan(); return !!p && !!p.free && !state.bundleId; };

  // Viewing the results counts as finishing (the ~30% who only want to know what to buy):
  // keep a 推薦紀錄 for these prefs unless a plan with the same prefs already exists.
  function recordRecommendation(models, bundles) {
    if (!models.length && !bundles.length) return;
    const prefs = prefsOf();
    const top = models.slice(0, 3).map(m => m.id), bundle = bundles[0] ? bundleLabel(bundles[0]) : '';
    const rec = store.plans.find(x => x.kind === 'rec' && samePrefs(x.prefs, prefs));
    if (rec) { rec.top = top; rec.bundle = bundle; rec.prefs = prefs; rec.updatedAt = Date.now(); }
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
      const draft = JSON.parse(localStorage.getItem(BLOCK_KEY) || 'null');
      const changed = (proj && JSON.stringify(proj) !== JSON.stringify(plan.project)) || JSON.stringify(draft) !== JSON.stringify(plan.blockDraft || null);
      if (changed) { if (proj) { plan.project = proj; syncDevices(plan); } plan.blockDraft = draft; plan.updatedAt = Date.now(); savePlans(); }
    } catch (e) { /* ignore */ }
  }
  // The card shows what is actually in the editor (devices added or removed there included).
  const FP_REV = Object.fromEntries(Object.entries(FP_MODEL).map(([k, v]) => [v, k]));
  function syncDevices(plan) {
    const rs = (plan.project.floors || []).flatMap(f => f.routers || []);
    if (!rs.length) { if (plan.free) { plan.label = '自由配置'; plan.units = 0; } return; }
    const model = r => (r.displayName && r.displayName.includes(' · ') ? r.displayName.split(' · ').pop() : FP_REV[r.name] || r.name);
    const main = model(rs[0]), nodes = {};
    rs.slice(1).forEach(r => { const m = model(r); nodes[m] = (nodes[m] || 0) + 1; });
    plan.label = `${main} × 1${Object.entries(nodes).map(([m, n]) => ` ＋ Node ${m} × ${n}`).join('')}`;
    plan.units = rs.length;
  }
  // 試其他套組: swap the devices of the open plan in place (walls and floor plan stay; no new plan).
  function swapBundle(plan, b) {
    capturePlan();
    const { u } = results();
    plan.project = placeOnLayout(b, u, plan.project).project;
    plan.bundleId = bundleKey(b); plan.label = bundleLabel(b); plan.units = b.N; plan.updatedAt = Date.now();
    state.bundleId = plan.bundleId; state.loadedPlanId = null;
    savePlans(); save(); render();
    toast(`${plan.name} 已換成 ${bundleLabel(b)}`);
  }
  function loadPlanIntoApp(plan) {
    try {
      AUTH_KEYS.forEach(k => localStorage.setItem(k, 'standalone'));
      localStorage.setItem('standalone_projects', JSON.stringify({ demo: plan.project }));
      localStorage.removeItem('aae_active_floor_demo');
      if (plan.blockDraft) localStorage.setItem(BLOCK_KEY, JSON.stringify(plan.blockDraft)); else localStorage.removeItem(BLOCK_KEY);
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

  // ── 新增方案 setup: 預設格局 / 上傳圖檔 / 積木拼平面圖 ──
  const freeBundle = u => ({ r: { id: '' }, n: { id: '' }, N: 0, floorUnits: Array.from({ length: Math.max(1, u.floors) }, () => 0) });
  function blockDraftFor(u) {
    const perFloor = u.area / Math.max(1, u.floors), w = Math.max(8, Math.ceil(Math.sqrt(perFloor * 4 / 3)) + 4), h = Math.max(6, Math.ceil(perFloor / Math.sqrt(perFloor * 4 / 3)) + 4);
    return { floorId: 'f_1', size: { w, h }, rooms: [] };
  }
  // Project for an upload / blocks setup: same floors and devices as the generated house, no walls.
  function projectFromSetup(b, u, setup) {
    const proj = buildProject(b, u).demo;
    proj.projectName = setup.name || proj.projectName;
    if (setup.source === 'blocks') {
      const d = blockDraftFor(u);
      proj.floors.forEach(f => { f.walls = []; f.imageWidth = d.size.w * 100; f.imageHeight = d.size.h * 100; });
    } else if (setup.source === 'upload' && setup.image) {
      const { url, w, h } = setup.image;
      proj.scaleSet = false; // the app asks for the scale on an uploaded plan
      proj.floors.forEach((f, i) => {
        f.walls = [];
        if (i === 0) Object.assign(f, { floorplanImg: url, imageWidth: w, imageHeight: h });
        f.routers.forEach((r, k, a) => (r.position = { x: Math.round((-0.5 + (k + 0.5) / a.length) * w * 0.6), y: 0 }));
      });
    }
    return proj;
  }
  function createFreePlan(setup) {
    const u = engineInput(), fb = freeBundle(u);
    const project = setup.source === 'default' ? buildProject(fb, u).demo : projectFromSetup(fb, u, setup);
    store.seq += 1;
    project.projectName = setup.name || '方案 ' + store.seq;
    const plan = { id: 'pl_' + Date.now(), free: true, name: project.projectName, createdAt: Date.now(), updatedAt: Date.now(), prefs: prefsOf(), bundleId: '', label: '自由配置', units: 0, project, blockDraft: setup.source === 'blocks' ? blockDraftFor(u) : null };
    store.plans.unshift(plan); store.activeId = plan.id;
    state.openGroups = ['other'];
    savePlans();
    return plan;
  }

  const SAMPLE_PLAN = 'flow/sample-floorplan.webp';
  function readImage(blob, cb) {
    const rd = new FileReader();
    rd.onload = () => { const im = new Image(); im.onload = () => cb({ url: rd.result, w: im.naturalWidth, h: im.naturalHeight }); im.src = rd.result; };
    rd.readAsDataURL(blob);
  }
  // Dialog shown before a new plan opens in the editor. Resolves to the setup, or null when cancelled.
  function planSetupDialog({ needCountry, layoutFrom }) {
    return new Promise(resolve => {
      const wrap = document.createElement('div');
      wrap.className = 'ask-wrap';
      const def = '方案 ' + (store.seq + 1);
      let source = 'default', image = null, sampleOff = false;
      const srcBtn = (v, ico, label) => `<button type="button" class="np-src" data-src="${v}">${ico}<span>${label}</span></button>`;
      wrap.innerHTML = `<div class="np" role="dialog" aria-modal="true" aria-labelledby="npTitle">
        <div class="np-head"><h2 id="npTitle">新增方案</h2><button class="np-x" data-a="0" aria-label="關閉">×</button></div>
        <div class="np-body">
          <div class="np-left">
            <label class="np-label" for="npName">方案名稱</label><input id="npName" class="np-input" maxlength="30" value="${esc(def)}">
            ${needCountry ? `<label class="np-label" for="npCountry">國家</label><select id="npCountry" class="np-input"><option value="TW">台灣</option><option value="CN">中國</option><option value="DE">歐洲 · 德國</option><option value="US">美洲 · 美國</option></select><p class="np-note">之後可以在方案中修改。</p>` : ''}
          </div>
          <div class="np-right">
            <div class="np-srcs">${srcBtn('default', '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 4l9 6.5V20H3z"/><path d="M9 20v-6h6v6"/></svg>', '預設格局')}${srcBtn('upload', '<svg viewBox="0 0 24 24"><path d="M7 18a4 4 0 0 1-.6-7.96A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9H7z"/><path d="M12 15V10m-2.5 2.5L12 10l2.5 2.5"/></svg>', '上傳圖檔')}${srcBtn('blocks', '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="9" rx="1"/><rect x="13" y="4" width="7" height="5" rx="1"/><rect x="13" y="11" width="7" height="9" rx="1"/><rect x="4" y="15" width="7" height="5" rx="1"/></svg>', '積木拼平面圖')}</div>
            <div class="np-pane" id="npPane"></div>
          </div>
        </div>
        <div class="np-foot"><button class="btn btn-ghost btn-sm" data-a="0">取消</button><button class="btn btn-sm" data-a="1" id="npOk">建立</button></div>
      </div>`;
      const q = sel => wrap.querySelector(sel);
      if (needCountry) q('#npCountry').value = state.country || 'TW';
      const pane = () => {
        wrap.querySelectorAll('.np-src').forEach(b => b.classList.toggle('on', b.dataset.src === source));
        const P = q('#npPane');
        if (source === 'default') P.innerHTML = `<div class="np-info"><b>${layoutFrom ? `沿用「${esc(layoutFrom.name)}」的格局` : '使用示意格局'}</b><p>${layoutFrom ? '牆面與平面圖沿用目前方案，裝置換成這一組。' : needCountry ? '自動產生簡單的示意格局，進入後可放置路由器並調整牆面。' : '依你填的坪數與樓層自動產生簡單格局，裝置已擺好，可直接拖曳調整。'}</p></div>`;
        else if (source === 'blocks') P.innerHTML = '<div class="np-info"><b>用房間積木拼出你家</b><p>進入後從右側加入客廳、臥室、廚房等房間，拖曳排好位置，系統會自動產生牆面。</p></div>';
        else if (!image && !sampleOff) {
          // Upload starts with a sample floor plan; × swaps it for the user's own file.
          P.innerHTML = '<div class="np-info"><p>載入示範平面圖…</p></div>';
          fetch(SAMPLE_PLAN).then(r => r.blob()).then(bl => readImage(bl, im => { if (!image && !sampleOff) { image = { ...im, sample: true }; pane(); } })).catch(() => { sampleOff = true; pane(); });
        } else P.innerHTML = image
          ? `<div class="np-preview"><img src="${image.url}" alt="平面圖預覽"><button class="np-clear" id="npClear" aria-label="移除圖檔">×</button></div><p class="np-dim">${image.sample ? '示範平面圖 · ' : ''}${image.w} × ${image.h} px${image.sample ? ' · 按 × 換成自己的圖' : ''}</p>`
          : `<label class="np-drop" id="npDrop"><input type="file" accept="image/png,image/jpeg" id="npFile" hidden><svg viewBox="0 0 24 24"><path d="M7 18a4 4 0 0 1-.6-7.96A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9H7z"/><path d="M12 15V10m-2.5 2.5L12 10l2.5 2.5"/></svg><b>選擇平面圖檔案</b><span>PNG 或 JPG，建議寬度至少 1000px；進入後需設定比例尺</span></label>`;
        q('#npOk').disabled = source === 'upload' && !image;
        const file = q('#npFile');
        if (file) {
          const take = f => {
            if (!f || !/^image\/(png|jpeg)$/.test(f.type)) return toast('請選擇 PNG 或 JPG 圖檔');
            readImage(f, im => { image = im; pane(); });
          };
          file.onchange = () => take(file.files[0]);
          const drop = q('#npDrop');
          drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
          drop.ondragleave = () => drop.classList.remove('over');
          drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); take(e.dataTransfer.files[0]); };
        }
        if (q('#npClear')) q('#npClear').onclick = () => { image = null; sampleOff = true; pane(); };
      };
      wrap.querySelectorAll('.np-src').forEach(b => (b.onclick = () => { source = b.dataset.src; pane(); }));
      const done = ok => {
        document.removeEventListener('keydown', onKey); wrap.remove();
        if (!ok) return resolve(null);
        resolve({ name: q('#npName').value.trim() || def, country: needCountry ? q('#npCountry').value : null, source, image });
      };
      const onKey = e => { if (e.key === 'Escape') done(false); };
      document.addEventListener('keydown', onKey);
      wrap.querySelectorAll('[data-a]').forEach(b => (b.onclick = () => { if (b.dataset.a === '1' && b.disabled) return; done(b.dataset.a === '1'); }));
      document.body.appendChild(wrap);
      pane();
      q('#npName').select();
    });
  }

  function createPlan(b, u, layout, setup) {
    const built = setup && setup.source !== 'default' ? { project: projectFromSetup(b, u, setup), rebuilt: false } : placeOnLayout(b, u, layout);
    const { project, rebuilt } = built;
    store.seq += 1;
    const plan = { id: 'pl_' + Date.now(), name: (setup && setup.name) || '方案 ' + store.seq, createdAt: Date.now(), updatedAt: Date.now(), prefs: prefsOf(), bundleId: bundleKey(b), label: bundleLabel(b), units: b.N, project, blockDraft: setup && setup.source === 'blocks' ? blockDraftFor(u) : null };
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
    swapOpen = false; swapTab = null;
    state.bundleId = plan.bundleId || null; state.prefsDone = !plan.free || state.prefsDone; state.newPlanFrom = null; state.seededKey = null;
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
  // deleted independently; plans whose record was deleted are gathered under 自由配置.
  function renderPlans(el) {
    capturePlan();
    const recs = store.plans.filter(x => !isPlan(x)).sort((x, y) => y.updatedAt - x.updatedAt);
    const plansOnly = store.plans.filter(isPlan);
    const groups = recs.map(rc => ({ key: rc.id, rec: rc, plans: triedPlans(rc.prefs).sort((x, y) => y.updatedAt - x.updatedAt) }));
    const orphans = plansOnly.filter(p => !recOf(p)).sort((x, y) => y.updatedAt - x.updatedAt);
    // 自由配置 only appears when there are plans whose 推薦紀錄 was deleted.
    if (orphans.length) groups.push({ key: 'other', rec: null, plans: orphans });
    // New since the last visit: worked out once when entering the page, so badges stay during this visit.
    if (screenEntered || !plansVisitNew) {
      const seen = store.seenAt || 0;
      plansVisitNew = new Set(store.plans.filter(x => x.createdAt > seen).map(x => x.id));
      if (plansVisitNew.size) {
        const newest = store.plans.filter(x => plansVisitNew.has(x.id)).sort((a, b) => b.createdAt - a.createdAt)[0];
        const g = groups.find(x => (x.rec && x.rec.id === newest.id) || x.plans.some(p => p.id === newest.id));
        if (g) state.openGroups = [g.key];
      }
      store.seenAt = Date.now(); savePlans();
      renderRail('plans');
    }
    const isNew = x => plansVisitNew.has(x.id);
    const newTag = '<span class="tag tag-new">NEW</span>';
    // Open groups: remembered per viewer; by default the group holding the open plan (or the first).
    if (Array.isArray(state.openGroups) && state.openGroups.length > 1) state.openGroups = state.openGroups.slice(-1);
    if (!Array.isArray(state.openGroups)) {
      const cur = activePlan(), g = groups.find(x => cur && x.plans.includes(cur)) || groups[0];
      state.openGroups = g ? [g.key] : [];
    }
    const areaOf = pr => (pr.areaUnit === 'ping' ? (pr.area / PING).toFixed(0) + ' 坪' : Math.round(pr.area) + ' m²');
    const renameBtn = x => `<button class="plan-icon" data-rename="${x.id}" title="改名" aria-label="改名">✎</button>`;
    const delBtn = x => `<button class="plan-icon plan-del" data-del="${x.id}" title="刪除" aria-label="刪除"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M7,21q-0.82,0-1.41-0.59T5,19V6H4V4H9V3h6V4h5V6H19V19q0,0.82-0.59,1.41T17,21H7ZM17,6H7V19H17V6ZM9,17h2V8H9v9Zm4,0h2V8H13v9ZM7,6V19V6Z"/></svg></button>`;
    const created = (x, cls = '') => `<span class="plan-time ${cls}" title="建立時間">${fmtTime(x.createdAt)}</span>`;
    const planCard = pl => `<div class="plan-card${isNew(pl) ? ' is-new' : ''}">
        <div class="plan-thumb">${planThumb(pl)}</div>
        <div class="plan-body">
          <div class="plan-name-row">${isNew(pl) ? newTag : ''}<span class="plan-name">${esc(pl.name)}</span>${renameBtn(pl)}${created(pl, 'plan-time-inline')}</div>
          <div class="plan-meta plan-devices">${esc(pl.label)}</div>
          <div class="plan-meta muted">共 ${pl.units} 台 · ${areaOf(pl.prefs)} · ${pl.prefs.floors} 層</div>
          <div class="plan-actions"><button class="btn btn-sm" data-open="${pl.id}">開啟</button>${delBtn(pl)}</div>
        </div></div>`;
    // Folder tabs: one tab per source (推薦紀錄 = blue, 自由配置 = teal); the selected tab opens into a
    // panel holding that source's info and its plans, so the plans visibly belong to it.
    const selKey = (state.openGroups || []).find(k => groups.some(g => g.key === k)) || (groups[0] && groups[0].key);
    const sel = groups.find(g => g.key === selKey);
    const tab = g => {
      const on = g.key === selKey, fresh = (g.rec && isNew(g.rec)) || g.plans.some(isNew);
      return `<div class="ftab ${g.rec ? 'ftab-rec' : 'ftab-free'}${on ? ' on' : ''}" data-toggle="${g.key}" role="tab" tabindex="0" aria-selected="${on}">
          <span class="ftab-dot"></span><span class="ftab-name">${esc(g.rec ? g.rec.name : '自由配置')}</span><span class="ftab-count">${g.plans.length}</span>${fresh ? '<span class="ftab-new" title="有新資料"></span>' : ''}
        </div>`;
    };
    const panelHead = !sel ? '' : sel.rec
      ? `<div class="fpanel-head">
          <div class="fpanel-ico">${sel.rec.top && sel.rec.top[0] ? `<img src="${productImg(sel.rec.top[0])}" alt="" onerror="this.style.visibility='hidden'">` : ''}</div>
          <div class="fpanel-main">
            <div class="plan-name-row"><span class="src-kind">推薦紀錄</span>${isNew(sel.rec) ? newTag : ''}<span class="plan-name">${esc(sel.rec.name)}</span>${renameBtn(sel.rec)}</div>
            <div class="plan-meta"><b>${esc((sel.rec.top || [])[0] || '')}</b>　<span class="muted">${esc(sel.rec.prefs.p.map(i => E.primaryNames[i]).join('、'))} · ${areaOf(sel.rec.prefs)} · ${sel.rec.prefs.floors} 層</span></div>
          </div>
          <div class="fpanel-actions">${created(sel.rec, 'plan-time-inline')}<button class="btn btn-ghost btn-sm" data-rec="${sel.rec.id}">查看推薦</button>${delBtn(sel.rec)}</div>
        </div>`
      : `<div class="fpanel-head">
          <div class="fpanel-ico fpanel-ico-free">${I.plans}</div>
          <div class="fpanel-main"><div class="plan-name-row"><span class="src-kind">自由配置</span></div><div class="plan-meta muted">直接居家配置，或推薦紀錄已刪除的方案</div></div>
        </div>`;
    const panel = !sel ? '' : `<div class="fpanel ${sel.rec ? 'fpanel-rec' : 'fpanel-free'}" role="tabpanel">
        ${panelHead}
        <div class="fpanel-sub">${sel.plans.length ? `${sel.plans.length} 個方案` : ''}</div>
        ${sel.plans.length ? `<div class="plan-grid">${sel.plans.map(planCard).join('')}</div>`
          : `<div class="src-empty"><p>尚無方案</p>${sel.rec ? `<button class="btn btn-sm" data-rec-try="${sel.rec.id}">在我家試擺</button>` : ''}</div>`}
      </div>`;
    const counts = [recs.length ? `${recs.length} 筆推薦紀錄` : '', plansOnly.length ? `${plansOnly.length} 個方案` : ''].filter(Boolean).join(' · ');
    el.innerHTML = `<div class="page">
      <div class="res-head"><div><div class="eyebrow">我的規劃</div><h1 class="page-title" style="margin-top:6px">我的家</h1>
        <p class="page-sub">${groups.length ? counts + '；點分頁查看它的方案' : '還沒有紀錄。看完推薦結果或進入居家配置後，會自動存在這裡。'}</p></div>
        ${groups.length ? '<button class="btn btn-sm btn-outline" id="startNew">開始規劃 →</button>' : ''}</div>
      ${groups.length ? `<div class="folder"><div class="ftabs" role="tablist">${groups.map(tab).join('')}</div>${panel}</div>` : (`<button class="btn" id="startFirst" style="margin-top:24px">開始規劃 →</button>`)}
    </div>`;
    el.querySelectorAll('[data-toggle]').forEach(h => (h.onclick = e => {
      if (e.target.closest('button, input')) return;
      state.openGroups = [h.dataset.toggle]; // one tab selected at a time
      save(); rerenderKeepScroll();
    }));
    el.querySelectorAll('.ftab').forEach(t => (t.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t.click(); } }));
    el.querySelectorAll('[data-rec-try]').forEach(b => (b.onclick = () => openRecord(b.dataset.recTry, true)));
    el.querySelectorAll('[data-open]').forEach(b => (b.onclick = () => openPlan(b.dataset.open)));
    el.querySelectorAll('[data-rec]').forEach(b => (b.onclick = () => openRecord(b.dataset.rec)));
    el.querySelectorAll('[data-del]').forEach(b => (b.onclick = async e => {
      e.stopPropagation();
      const x = store.plans.find(y => y.id === b.dataset.del);
      if (!x) return;
      const n = isPlan(x) ? 0 : triedPlans(x.prefs).length;
      const ok = await askConfirm(`刪除「${x.name}」？`, isPlan(x) ? '刪除後無法復原。' : n ? `底下 ${n} 個方案不會刪除，會移到「自由配置」。` : '刪除後無法復原。');
      if (!ok) return;
      store.plans = store.plans.filter(y => y.id !== x.id);
      if (store.activeId === x.id) { const nxt = store.plans.find(isPlan); store.activeId = nxt ? nxt.id : null; state.loadedPlanId = null; save(); }
      if (!isPlan(x) && n) { state.openGroups = ['other']; save(); }
      savePlans(); render();
      toast(`已刪除「${x.name}」`);
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
    const sf = $('startFirst');
    if (sf) sf.onclick = () => go('needs');
    // A fresh round of planning: start from default preferences (saved records/plans stay as they are).
    if ($('startNew')) $('startNew').onclick = () => {
      const d = initial();
      PREF_KEYS.forEach(k => (state[k] = d[k]));
      Object.assign(state, { prefsDone: false, bundleId: null, newPlanFrom: null, inProgress: false });
      save(); go('needs');
    };
  }

  function renderFloorplan(el) {
    const { u, bundles, allBundles } = results();
    const blank = state.seededKey === 'blank' && !state.bundleId && !freeOpen();
    try { AUTH_KEYS.forEach(k => localStorage.setItem(k, 'standalone')); } catch (e) { /* ignore */ }
    let plan = null, fresh = false, note = '';
    const b = allBundles.find(x => bundleKey(x) === state.bundleId) || null;
    if (!blank) {
      capturePlan();
      const cur = activePlan();
      const prefsMatch = cur && samePrefs(cur.prefs, prefsOf());
      const existing = triedPlans(prefsOf()).find(x => x.bundleId === state.bundleId);
      if (freeOpen()) {
        plan = cur;
        if (state.loadedPlanId !== cur.id) fresh = loadPlanIntoApp(cur);
      } else if (state.newPlanFrom && b) {
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
      } else if (b && !planSetup) {
        // New plan: ask for its name and floor plan source first.
        el.innerHTML = '<div class="page-full"></div>';
        planSetupDialog({ needCountry: false, layoutFrom: cur }).then(setup => {
          if (location.hash !== '#floorplan') return;
          if (!setup) { go('results'); return; }
          planSetup = setup; render();
        });
        return;
      } else if (b) {
        // Different bundle or prefs: keep the current plan, save this one as a new plan.
        const setup = planSetup; planSetup = null;
        const r = createPlan(b, u, cur && cur.project, setup);
        plan = r.plan;
        if (cur) note = r.rebuilt ? `已另存為${plan.name}；樓層數不同，已重新產生示意格局` : `已另存為${plan.name}，「${cur.name}」保留在我的規劃`;
        if (setup && setup.source === 'upload') note = '請先設定比例尺：在平面圖上標出一段已知長度';
        fresh = loadPlanIntoApp(plan);
      } else if (cur) {
        plan = cur;
        if (state.loadedPlanId !== cur.id) fresh = loadPlanIntoApp(cur);
      }
    }
    // Plans whose 推薦紀錄 was deleted (自由配置) stay as they are: no 試其他套組.
    const orphan = !!plan && !plan.free && !recOf(plan);
    const ids = plan ? plan.bundleId.split('|') : [];
    const mapped = ids.slice(0, 2).filter((id, i, a) => id && a.indexOf(id) === i && FP_MODEL[id] && FP_MODEL[id] !== id);
    // Devices sit on different floors; the app only shows one floor at a time, so offer a floor switcher.
    const floorList = plan && plan.project.floors.length > 1 ? plan.project.floors.map(f => ({ id: f.id, name: f.name, devices: (f.routers || []).map(r => (r.displayName || r.name).replace(' · ', ' ')) })) : [];
    el.innerHTML = `<div class="page-full">
      <div class="fp-bar">
        <span class="quick-ico" style="width:38px;height:38px">${I.plan}</span>
        <div><div class="fp-bar-title">${plan ? `<span class="fp-plan-name">${esc(plan.name)}</span>${esc(plan.label)}` : '自由試用'}</div>
          <div class="fp-bar-meta">${plan && plan.free ? '自動儲存 · 可放置路由器、上傳或拼出自家平面圖' : plan ? `共 ${plan.units} 台 · ${areaText(u.area)} · ${u.floors} 層 · 自動儲存，可拖曳調整或上傳自家平面圖${mapped.length ? `<span class="fp-sim">　以 ${mapped.map(id => esc(FP_MODEL[id])).join('、')} 模擬</span>` : ''}` : '未帶入推薦套組；可上傳平面圖並自行放置路由器'}</div>
          ${floorList.length ? `<div class="fp-floors">${floorList.map((f, i) => `<button class="fp-floor${i === 0 ? ' on' : ''}" data-floor="${f.id}"><b>${f.name}</b>${esc(f.devices.join('、'))}</button>`).join('')}</div>` : ''}</div>
        <span class="spacer"></span>
        ${plan && b ? '<button class="link-btn fp-reset" id="reseed">重置擺放</button>' : ''}
        ${plan && !plan.free && !orphan ? `<button class="btn btn-sm${swapOpen ? ' on' : ''}" id="swap">試其他套組</button>` : ''}
      </div>
      <div class="fp-stage">${plan && !plan.free && !orphan ? swapDrawer(plan) : ''}
      <iframe class="fp-frame" id="fpFrame" title="ASUS WiFi Floorplan" src="${FP_SRC}${fresh ? '?t=' + Date.now() : ''}"></iframe></div>
    </div>`;
    if ($('swap')) $('swap').onclick = () => { swapOpen = !swapOpen; $('swapDrawer').classList.toggle('open', swapOpen); $('swap').classList.toggle('on', swapOpen); };
    // Drawer handlers; switching tabs redraws only the drawer so the editor is not reloaded.
    const bindDrawer = () => {
      if (!$('swapDrawer')) return;
      $('swapClose').onclick = () => { swapOpen = false; $('swapDrawer').classList.remove('open'); $('swap').classList.remove('on'); };
      $('swapDrawer').querySelectorAll('[data-swap-tab]').forEach(t => (t.onclick = () => {
        swapTab = t.dataset.swapTab;
        const tmp = document.createElement('div'); tmp.innerHTML = swapDrawer(plan);
        $('swapDrawer').replaceWith(tmp.firstElementChild); bindDrawer();
      }));
      $('swapDrawer').querySelectorAll('[data-swap]').forEach(btn => (btn.onclick = () => {
        const nb = allBundles.find(x => bundleKey(x) === btn.dataset.swap);
        if (nb && plan && bundleKey(nb) !== plan.bundleId) swapBundle(plan, nb);
      }));
    };
    bindDrawer();
    if ($('reseed')) $('reseed').onclick = async () => {
      if (!await askConfirm('重置擺放？', '機器會回到預設位置，你調整過的位置會被取代；牆和平面圖會保留。', '重置')) return;
      capturePlan();
      plan.project = placeOnLayout(b, u, plan.project).project; plan.updatedAt = Date.now(); savePlans();
      loadPlanIntoApp(plan); $('fpFrame').src = FP_SRC + '?t=' + Date.now(); toast('已重置擺放');
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
  let floorSyncTimer, captureTimer, pendingToasts = [], planSetup = null, swapOpen = false, swapTab = null;
  // Right-side drawer listing the recommendation's bundles; picking one swaps the plan's devices.
  function swapDrawer(plan) {
    const { models, bundles, allBundles } = results();
    // 推薦機種: best config of each top model (same as the results cards); 推薦組合: the top bundles.
    const modelList = models.slice(0, 3).map(m => allBundles.find(b => b.r.id === m.id)).filter(Boolean);
    const lists = { model: modelList, bundle: bundles };
    if (!swapTab) swapTab = !modelList.some(b => bundleKey(b) === plan.bundleId) && bundles.some(b => bundleKey(b) === plan.bundleId) ? 'bundle' : 'model';
    const item = (b, i) => {
      const on = bundleKey(b) === plan.bundleId;
      return `<button class="swap-item${on ? ' on' : ''}" data-swap="${esc(bundleKey(b))}" ${on ? 'aria-current="true"' : ''}>
        <img src="${productImg(b.r.id)}" alt="" onerror="this.style.visibility='hidden'">
        <span class="swap-main"><span class="swap-name">${i < 3 ? rankTag(i + 1) : ''}${esc(b.r.id)}${b.N > 1 ? ` <span class="muted">＋ ${esc(b.n.id)}</span>` : ''}</span>
        <span class="swap-meta">共 ${b.N} 台 · 各樓層 ${b.floorUnits.join(' / ')} 台</span></span>
        ${on ? '<span class="swap-cur">目前</span>' : ''}
      </button>`;
    };
    const tabBtn = (k, label) => `<button class="${swapTab === k ? 'on' : ''}" data-swap-tab="${k}">${label}</button>`;
    return `<aside class="swap-drawer${swapOpen ? ' open' : ''}" id="swapDrawer" aria-label="試其他套組">
      <div class="swap-head"><div><b>試其他套組</b><div class="muted small">選一組直接替換「${esc(plan.name)}」的裝置，牆面與平面圖保留</div></div><button class="np-x" id="swapClose" aria-label="關閉">×</button></div>
      <div class="swap-tabs"><div class="seg seg-sm">${tabBtn('model', '推薦機種')}${tabBtn('bundle', '推薦組合')}</div></div>
      <div class="swap-list">${lists[swapTab].length ? lists[swapTab].map(item).join('') : '<p class="muted small" style="padding:8px">沒有符合條件的組合</p>'}</div>
    </aside>`;
  }

  // ── Simple confirm dialog ──
  function askConfirm(title, detail, okLabel = '刪除') {
    return new Promise(resolve => {
      const wrap = document.createElement('div');
      wrap.className = 'ask-wrap';
      wrap.innerHTML = `<div class="ask" role="alertdialog" aria-modal="true"><div class="ask-title"></div><div class="ask-detail"></div><div class="ask-actions"><button class="btn btn-ghost btn-sm" data-a="0">取消</button><button class="btn btn-sm ask-danger" data-a="1"></button></div></div>`;
      wrap.querySelector('.ask-title').textContent = title;
      wrap.querySelector('.ask-detail').textContent = detail || '';
      wrap.querySelector('[data-a="1"]').textContent = okLabel;
      const done = v => { document.removeEventListener('keydown', onKey); wrap.remove(); resolve(v); };
      const onKey = e => { if (e.key === 'Escape') done(false); if (e.key === 'Enter') done(true); };
      wrap.onclick = e => { if (e.target === wrap) done(false); const a = e.target.closest('[data-a]'); if (a) done(a.dataset.a === '1'); };
      document.addEventListener('keydown', onKey);
      document.body.appendChild(wrap);
      wrap.querySelector('[data-a="1"]').focus();
    });
  }

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

  // Demo data for meetings: 2 推薦紀錄 (2 + 1 plans) and 3 自由配置 (plans without a record).
  function seedDemo() {
    const day = 86400000;
    const scenarios = [
      { rec: true, prefs: { p: [0] }, tries: [0, 1] },                                        // 全屋覆蓋
      { rec: true, prefs: { p: [0, 1], top: 1, s: [2] }, tries: [0] },                        // 全屋覆蓋＋遊戲
      { rec: false, prefs: { p: [2], s: [0] }, tries: [0] },                                  // 居家工作
      { rec: false, prefs: { p: [3], s: [4], styles: ['quiet'] }, tries: [0] },               // 影音串流
      { rec: false, prefs: { p: [5], s: [1], area: 40 * PING, floors: 3 }, tries: [0] },      // 智慧家庭 3 層
    ];
    store = { activeId: null, seq: 0, recSeq: 0, plans: [] };
    let ts = Date.now() - 6 * day, layout = null, lastAttached = null;
    scenarios.forEach(sc => {
      state = Object.assign(initial(), sc.prefs, { prefsDone: true, decisionsSeen: { next: true } });
      const { u, models, bundles } = results();
      if (sc.rec) {
        store.recSeq += 1;
        store.plans.push({ id: 'rc_demo' + store.recSeq, kind: 'rec', name: '推薦紀錄 ' + store.recSeq, createdAt: ts, updatedAt: ts + sc.tries.length * .6 * day, prefs: prefsOf(), top: models.slice(0, 3).map(m => m.id), bundle: bundles[0] ? bundleLabel(bundles[0]) : '' });
      }
      sc.tries.forEach(i => {
        const b = bundles[i];
        if (!b) return;
        ts += .6 * day;
        const same = layout && layout.floors.length === b.floorUnits.length ? layout : null;
        const { project } = placeOnLayout(b, u, same);
        if (!layout) layout = project;
        // Vary the main unit's spot a little so each demo plan looks like a different placement.
        const main = project.floors[0].routers[0], shift = [[0, 0], [-170, -90], [150, 60], [-120, 80], [160, -100], [60, 110]][store.seq % 6];
        if (main) main.position = { x: Math.round(main.position.x + shift[0]), y: Math.round(main.position.y + shift[1]) };
        store.seq += 1;
        const plan = { id: 'pl_demo' + store.seq, name: '方案 ' + store.seq, createdAt: ts, updatedAt: ts, prefs: prefsOf(), bundleId: bundleKey(b), label: bundleLabel(b), units: b.N, project };
        store.plans.push(plan);
        if (sc.rec) lastAttached = plan;
      });
      ts += .4 * day;
    });
    // Open the newest plan that belongs to a record; 我的規劃 expands its group.
    const cur = lastAttached;
    state = Object.assign(initial(), JSON.parse(JSON.stringify(cur.prefs)), { prefsDone: true, bundleId: cur.bundleId, decisionsSeen: { next: true } });
    store.activeId = cur.id;
    const newestPlan = store.plans.filter(isPlan).sort((a, b) => b.createdAt - a.createdAt)[0];
    store.seenAt = newestPlan.createdAt - 1; plansVisitNew = null; // 方案 6 shows as new
    clearFloorplanProject(); savePlans(); save();
    decisions = []; renderDecisionBar(); closeDecision();
    if (currentId() === 'home') render(); else go('home');
    toast('已載入示範資料：2 筆推薦紀錄、6 個方案（我的規劃有 1 筆新資料）');
  }
  $('demo-bar-sample').onclick = seedDemo;

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
  function unlocked() { return state.bundleId || state.seededKey === 'blank' || freeOpen() ? 2 : state.prefsDone ? 1 : 0; }
  function stepOf(s) { return FLOW.findIndex(f => f.key === s.rail); }

  function renderStepper(s) {
    const nav = $('flowSteps'), cur = stepOf(s);
    // The editor page gets the full height: no stepper once the floor plan is open.
    nav.hidden = cur < 0 || s.id === 'floorplan';
    if (nav.hidden) return;
    const max = unlocked();
    const hints = ['', '', '拖曳調整位置，查看訊號覆蓋'];
    const finished = i => (i === 0 ? state.prefsDone : i === 1 ? !!state.bundleId : false);
    const op = activePlan(), orphanOpen = s.id === 'floorplan' && op && !op.free && state.loadedPlanId === op.id && !recOf(op);
    nav.innerHTML = FLOW.map((f, i) => {
      const cls = i === cur ? 'current' : i <= max ? 'done' : 'locked';
      const off = cls === 'locked' || (orphanOpen && i < cur);
      return (i ? `<span class="fs-line${finished(i - 1) ? ' done' : ''}"></span>` : '')
        + `<button class="fs-step ${cls}" data-to="${f.to}" ${off ? 'disabled' : ''} title="${cls === 'locked' ? '請先完成前一步' : orphanOpen && i < cur ? '此方案的推薦紀錄已刪除' : f.label}"><span class="fs-dot">${i !== cur && finished(i) ? '✓' : i + 1}</span><span class="fs-label">${f.label}</span></button>`;
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
  let prevScreen = null, screenEntered = true, plansVisitNew = null;
  function render() {
    let s = screenById[currentId()];
    if (prevScreen === 'floorplan' && s.id !== 'floorplan') capturePlan();
    pendingToasts.forEach(clearTimeout); pendingToasts = [];
    screenEntered = prevScreen !== s.id;
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
    renderRail(s.rail); // pages may add records/plans while rendering: refresh the new-data dot
    document.title = 'ASUS WiFi Floor Plan';
  }
  if (new URLSearchParams(location.search).get('demo') === '0') document.body.classList.add('no-demo');
  // '#try' = free floor plan trial without a recommendation (used by the landing page)
  function route() {
    if (location.hash === '#try') {
      location.replace('#home');
      planSetupDialog({ needCountry: true, layoutFrom: null }).then(setup => {
        if (!setup) return;
        capturePlan();
        if (setup.country) state.country = setup.country;
        const plan = createFreePlan(setup);
        state.bundleId = null; state.seededKey = null; save();
        loadPlanIntoApp(plan);
        go('floorplan');
        if (setup.source === 'upload') setTimeout(() => toast('請先設定比例尺：在平面圖上標出一段已知長度'), 900);
      });
      return;
    }
    render();
  }
  // Unfinished questionnaire is not kept across visits: back to the open plan's prefs, or defaults.
  if (state.inProgress || !state.prefsDone) {
    const cur = activePlan();
    if (cur && !cur.free) state = Object.assign(state, JSON.parse(JSON.stringify(cur.prefs)), { bundleId: cur.bundleId, prefsDone: true });
    else state = Object.assign(initial(), { decisionsSeen: state.decisionsSeen || {}, seededKey: state.seededKey === 'blank' ? 'blank' : null });
    state.newPlanFrom = null; state.inProgress = false; save();
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', () => capturePlan());
  route();
})();
