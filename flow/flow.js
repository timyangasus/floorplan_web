(function () {
  const E = window.FPW_ENGINE;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ── State (per-viewer convenience only; works without storage) ──
  const STORE = 'fpw_flow_state';
  const initial = () => ({ p: [0], top: 0, s: [], style: 'none', brands: [], tiers: [], includeTravel: false, area: 100, floors: 2, bh: 'wired', country: 'TW', sort: 'balanced', bundleId: null, modelId: null, seededKey: null, decisionsSeen: {}, prefsDone: false });
  let state = initial();
  try { Object.assign(state, JSON.parse(localStorage.getItem(STORE)) || {}); } catch (e) { /* ignore */ }
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ } };

  function engineInput() {
    return { p: state.p, s: state.s, top: state.p.includes(state.top) ? state.top : state.p[0], style: state.style, modelBrands: state.brands, bundleBrands: state.brands, modelTiers: state.tiers, bundleTiers: state.tiers, includeTravel: state.includeTravel, country: state.country, area: state.area, floors: state.floors, sort: state.sort, bh: state.bh };
  }
  function results() {
    const c = E.catalog(), u = engineInput();
    return { u, models: E.modelRank(c, u), bundles: E.calculate(c, u).rows };
  }
  const bundleKey = b => b.r.id + '|' + (b.N > 1 ? b.n.id : '') + '|' + b.N;
  function currentBundle(bundles) {
    return bundles.find(b => bundleKey(b) === state.bundleId) || bundles[0] || null;
  }

  // ── Icons ──
  const I = {
    home: '<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v8.5a.5.5 0 0 1-.5.5H15v-6H9v6H4.5a.5.5 0 0 1-.5-.5z"/></svg>',
    prefs: '<svg viewBox="0 0 24 24"><path d="M6 4v6M6 14v6M12 4v2M12 10v10M18 4v10M18 18v2M4 12h4M10 8h4M16 16h4"/></svg>',
    rank: '<svg viewBox="0 0 24 24"><path d="M5 20v-6M12 20V6M19 20v-9M3 20h18"/></svg>',
    plan: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 11h7v8.5M14 4.5v6h6.5M10.5 14H8"/></svg>',
    admin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>',
    help: '<svg viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14v3a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2zM20 14v3a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2z"/></svg>',
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

  // ── Screens ──
  const SCREENS = [
    { id: 'home', code: '0_010', rail: 'home', description: '首頁：說明三步驟流程，唯一入口「開始規劃」（有進度時可繼續）', render: renderHome },
    { id: 'needs', code: '1_010', rail: 'prefs', description: '偏好 1/3：主要用途（可複選，標記最重要的一項）', render: renderNeeds },
    { id: 'care', code: '1_020', rail: 'prefs', description: '偏好 2/3：還在意什麼、外觀、品牌與產品定位', render: renderCare },
    { id: 'home-size', code: '1_030', rail: 'prefs', description: '偏好 3/3：我家的樣子（面積、樓層、回程、地區）', render: renderHomeSize },
    { id: 'results', code: '2_010', rail: 'rank', description: '推薦結果：機種排行＋配置套組 Top 10。分流點：約 30% 離開、約 70% 進入 Floor plan', render: renderResults },
    { id: 'model', code: '2_020', rail: 'rank', description: '機種詳情：規格、功能與需求適配度，可前往購買或試擺', render: renderModel },
    { id: 'exit', code: '2_030', rail: 'rank', description: '離開流程（約 30%）：前往購買頁，仍保留進入 Floor plan 的入口', render: renderExit },
    { id: 'floorplan', code: '3_010', rail: 'plan', description: 'Floor plan 操作環境（約 70%）：已自動帶入所選套組，之後都在這一頁操作', render: renderFloorplan },
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
      + '<div class="rail-spacer"></div>'
      + `<button class="rail-btn" data-href="router_recommendation_wireframe%201.html" data-tip="後台：機種資料與權重（另開）" aria-label="後台">${I.admin}</button>`
      + `<button class="rail-btn" data-tip="客服支援（示意）" aria-label="客服支援">${I.help}</button>`;
    $('rail').querySelectorAll('[data-to]').forEach(b => (b.onclick = () => go(b.dataset.to)));
    $('rail').querySelectorAll('[data-href]').forEach(b => (b.onclick = () => window.open(b.dataset.href, '_blank')));
  }

  // ── 0_010 Home ──
  function renderHome(el) {
    const max = unlocked();
    const resume = state.prefsDone ? FLOW[max] : null;
    el.innerHTML = `<div class="page">
      <span class="pill-tag">✓ 免登入 · 約 3 分鐘</span>
      <div class="home-grid" style="margin-top:26px">
        <div>
          <h1 class="hero-title">嗨，<br>來規劃你家的 WiFi</h1>
          <div class="home-meta">
            <div>告訴我們你的用途與空間 <span class="muted">· 推薦適合的機種與台數</span></div>
            <div>放進你家的平面圖 <span class="muted">· 模擬每個房間的訊號覆蓋</span></div>
          </div>
          <button class="btn" id="start">開始規劃</button>
        </div>
        <div>
          <div class="flow-card">
            <div class="flow-row"><span class="flow-num">1</span><div><div class="flow-row-title">偏好設定</div><div class="flow-row-sub">主要用途 · 在意的功能 · 我家的樣子，共 3 題</div></div></div>
            <div class="flow-row"><span class="flow-num">2</span><div><div class="flow-row-title">推薦結果</div><div class="flow-row-sub">機種排行與主機＋Node 配置套組 Top 10</div><span class="flow-split">只想知道買什麼，到這裡就完成</span></div></div>
            <div class="flow-row"><span class="flow-num">3</span><div><div class="flow-row-title">居家配置</div><div class="flow-row-sub">選好的套組自動放進平面圖，查看每個房間的訊號</div><span class="flow-split">想確認怎麼擺，繼續到這一步</span></div></div>
          </div>
          ${resume ? `<div class="resume"><span class="quick-ico">${resume.key === 'plan' ? I.plan : I.rank}</span><div><div class="quick-title">繼續上次進度</div><div class="quick-sub">已完成偏好設定${state.bundleId ? '，並選了配置套組' : ''}</div></div><button class="btn btn-sm" id="resume">前往${resume.label}</button></div>` : ''}
        </div>
      </div>
      <div class="home-strip"><div><div class="eyebrow">能幫你做什麼</div><h2 class="promo-heading">從挑機種到擺位置，一次搞定</h2></div></div>
      ${promoBanners()}
    </div>`;
    $('start').onclick = () => go('needs');
    if (resume) $('resume').onclick = () => go(resume.to);
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
    return `<div class="q-head"><div><div class="eyebrow">STEP ${step} / 3</div><h1 class="page-title" style="margin-top:6px">${title}</h1><p class="page-sub">${sub}</p></div><div class="counter"><b>0${step}</b> / 03</div></div>
      <div class="steps"><span class="${step === 1 ? 'on' : ''}">主要用途</span><span class="${step === 2 ? 'on' : ''}">在意什麼</span><span class="${step === 3 ? 'on' : ''}">我家的樣子</span></div>
      <div class="q-progress"><span style="width:${step * 33.34}%"></span></div>`;
  }

  // ── 1_010 Needs ──
  function renderNeeds(el) {
    el.innerHTML = `<div class="page">${qHeader(1, '主要拿網路做什麼？', '可複選。點「最重要」標記一項，推薦時會加倍考量。')}
      <div class="tiles" id="tiles"></div>
      <div class="q-foot"><button class="link-btn" data-to="home">‹ 回首頁</button><button class="btn" id="next">下一步</button></div></div>`;
    const draw = () => {
      if (!state.p.includes(state.top)) state.top = state.p[0];
      $('tiles').innerHTML = E.primaryNames.map((n, i) => {
        const on = state.p.includes(i);
        return `<button class="tile${on ? ' on' : ''}" data-i="${i}"><span class="tile-check">${on ? '✓' : ''}</span><span class="tile-ico">${primaryIcons[i]}</span><span class="tile-title">${n}</span><span class="tile-sub">${primarySubs[i]}</span>${on && state.p.length > 1 ? `<span class="star${state.top === i ? ' on' : ''}" data-star="${i}">★ 最重要</span>` : ''}</button>`;
      }).join('');
      $('next').disabled = !state.p.length;
      $('tiles').querySelectorAll('.tile').forEach(t => (t.onclick = e => {
        const i = +t.dataset.i;
        if (e.target.dataset.star) { state.top = i; }
        else state.p = state.p.includes(i) ? state.p.filter(x => x !== i) : [...state.p, i].sort();
        save(); draw();
      }));
    };
    draw();
    el.querySelector('[data-to]').onclick = () => go('home');
    $('next').onclick = () => go('care');
  }

  // ── 1_020 Care ──
  function renderCare(el) {
    el.innerHTML = `<div class="page">${qHeader(2, '你還在意什麼？', '都可以不選。這些會影響排序，但不會排除機種（品牌與定位除外）。')}
      <div class="q-section"><h3>在意的功能</h3><p class="muted">可複選</p><div class="chips" id="sec"></div></div>
      <div class="q-cols">
        <div class="field-card"><span class="field-label">外觀偏好 <span class="muted small" id="styleHint"></span></span><div class="seg" id="style"></div></div>
        <div class="field-card"><span class="field-label">品牌／系列</span><div class="seg" id="brand"></div></div>
        <div class="field-card"><span class="field-label">產品定位</span><div class="seg" id="tier"></div><p class="muted small" id="tierHint" style="margin:10px 0 0"></p></div>
        <div class="field-card"><span class="field-label">其他</span><div class="chips"><button class="chip" id="travel">納入旅行系列機種</button></div><p class="muted small" style="margin:10px 0 0">只影響機種排行；旅行機種不參與配置套組。</p></div>
      </div>
      <div class="q-foot"><button class="link-btn" id="back">‹ 上一步</button><button class="btn" id="next">下一步</button></div></div>`;
    const draw = () => {
      const styleOn = state.s.includes(4);
      if (!styleOn) state.style = 'none';
      $('sec').innerHTML = E.secondaryNames.map((n, i) => `<button class="chip${state.s.includes(i) ? ' on' : ''}" data-i="${i}">${n}</button>`).join('');
      $('style').innerHTML = [['none', '無特別偏好'], ['quiet', '低調內置天線'], ['rgb', 'RGB 燈效']].map(([v, l]) => `<button class="${state.style === v ? 'on' : ''}" data-v="${v}" ${styleOn ? '' : 'disabled'}>${l}</button>`).join('');
      $('styleHint').textContent = styleOn ? '' : '（先勾「外觀與燈效」）';
      $('style').style.opacity = styleOn ? 1 : .45;
      $('brand').innerHTML = [['', '全部'], ['ASUS', 'ASUS'], ['Gaming', 'ROG／TUF']].map(([v, l]) => `<button class="${(v ? state.brands.includes(v) : !state.brands.length) ? 'on' : ''}" data-v="${v}">${l}</button>`).join('');
      $('tier').innerHTML = [['', '全部'], ['入門', E.tierNames['入門']], ['中階', E.tierNames['中階']], ['高階', E.tierNames['高階']]].map(([v, l]) => `<button class="${(v ? state.tiers.includes(v) : !state.tiers.length) ? 'on' : ''}" data-v="${v}">${l}</button>`).join('');
      $('tierHint').textContent = state.tiers.length ? state.tiers.map(t => E.tierNames[t] + '：' + E.tierDescriptions[t]).join('；') : '不限定位，所有等級都會參與排名。';
      $('travel').classList.toggle('on', state.includeTravel);
      $('sec').querySelectorAll('.chip').forEach(b => (b.onclick = () => { const i = +b.dataset.i; state.s = state.s.includes(i) ? state.s.filter(x => x !== i) : [...state.s, i].sort(); save(); draw(); }));
      $('style').querySelectorAll('button').forEach(b => (b.onclick = () => { if (!styleOn) return; state.style = b.dataset.v; save(); draw(); }));
      const multi = (key, v) => { if (!v) state[key] = []; else state[key] = state[key].includes(v) ? state[key].filter(x => x !== v) : [...state[key], v]; save(); draw(); };
      $('brand').querySelectorAll('button').forEach(b => (b.onclick = () => multi('brands', b.dataset.v)));
      $('tier').querySelectorAll('button').forEach(b => (b.onclick = () => multi('tiers', b.dataset.v)));
    };
    draw();
    $('travel').onclick = () => { state.includeTravel = !state.includeTravel; save(); draw(); };
    $('back').onclick = () => go('needs');
    $('next').onclick = () => go('home-size');
  }

  // ── 1_030 Home size ──
  function renderHomeSize(el) {
    el.innerHTML = `<div class="page">${qHeader(3, '你家大概長什麼樣子？', '大概就好。之後在 Floor plan 可以用實際平面圖調整。')}
      <div class="q-cols">
        <div class="field-card"><label class="field-label" for="area">室內總面積</label><div class="big-input"><input id="area" type="number" min="10" max="1000" step="1" inputmode="numeric"><span>m²</span></div><p class="muted small" id="ping" style="margin:10px 0 0"></p></div>
        <div class="field-card"><span class="field-label">樓層數</span><div class="stepper"><button id="minus" aria-label="減少樓層">−</button><output id="floors"></output><button id="plus" aria-label="增加樓層">＋</button></div><div class="house-preview" id="house"></div></div>
        <div class="field-card"><span class="field-label">主機與 Node 之間怎麼連（回程）</span><div class="seg" id="bh"></div><p class="muted small" style="margin:10px 0 0">家裡有預埋網路線就選有線，覆蓋與速度通常較好。</p></div>
        <div class="field-card"><label class="field-label" for="country">購買地區</label><select class="select" id="country"><option value="TW">台灣</option><option value="CN">中國</option><option value="DE">歐洲 · 德國</option><option value="US">美洲 · 美國</option></select><p class="muted small" style="margin:10px 0 0">目前只有台灣有可推薦機種與價表。</p></div>
      </div>
      <div class="q-foot"><button class="link-btn" id="back">‹ 上一步</button><button class="btn" id="next">看推薦結果</button></div></div>`;
    const draw = () => {
      $('area').value = state.area;
      $('ping').textContent = `約 ${(state.area / 3.3058).toFixed(1)} 坪 · 每層約 ${(state.area / state.floors).toFixed(0)} m²`;
      $('floors').textContent = state.floors;
      $('house').innerHTML = Array.from({ length: state.floors }, (_, i) => `<div class="house-floor" style="height:${Math.max(16, 100 / state.floors - 6)}px">${state.floors - i}F</div>`).join('').replace(/^/, '<div style="display:flex;flex-direction:column;gap:4px">') + '</div>';
      $('bh').innerHTML = [['wired', '有線回程'], ['wireless', '無線回程（待驗證）']].map(([v, l]) => `<button class="${state.bh === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('');
      $('bh').querySelectorAll('button').forEach(b => (b.onclick = () => { state.bh = b.dataset.v; save(); draw(); }));
      $('country').value = state.country;
    };
    draw();
    $('area').oninput = () => { const v = +$('area').value; if (v > 0) { state.area = v; save(); $('ping').textContent = `約 ${(v / 3.3058).toFixed(1)} 坪 · 每層約 ${(v / state.floors).toFixed(0)} m²`; } };
    $('minus').onclick = () => { state.floors = Math.max(1, state.floors - 1); save(); draw(); };
    $('plus').onclick = () => { state.floors = Math.min(6, state.floors + 1); save(); draw(); };
    $('country').onchange = () => { state.country = $('country').value; save(); };
    $('back').onclick = () => go('care');
    $('next').onclick = () => {
      if (!(state.area > 0)) return toast('請輸入面積');
      state.bundleId = null; state.prefsDone = true; if (state.seededKey === 'blank') state.seededKey = null; save(); go('results');
    };
  }

  function ring(value, color) {
    const r = 56, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value));
    return `<svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="${r}" fill="none" stroke="#eef0f3" stroke-width="7"/><circle cx="66" cy="66" r="${r}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c * v / 100} ${c}"/></svg>`;
  }
  const ringColors = ['#1982ff', '#4f9dff', '#7bb6ff', '#a5ccff'];

  // ── 2_010 Results ──
  function renderResults(el) {
    const { u, models, bundles } = results();
    const top4 = models.slice(0, 4), rest = models.slice(4);
    const tags = [u.p.map(i => E.primaryNames[i] + (i === u.top && u.p.length > 1 ? '★' : '')).join('、'), ...u.s.map(i => E.secondaryNames[i]), `${u.area} m²`, `${u.floors} 層`, u.bh === 'wired' ? '有線回程' : '無線回程', state.brands.length ? '品牌：' + state.brands.join('／') : null, state.tiers.length ? '定位：' + state.tiers.map(t => E.tierNames[t]).join('／') : null].filter(Boolean);
    el.innerHTML = `<div class="page">
      <div class="res-head"><div><div class="eyebrow">推薦結果</div><h1 class="page-title" style="margin-top:6px">這些機種最適合你家</h1><div class="summary-tags">${tags.map(t => `<span>${esc(t)}</span>`).join('')}</div></div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><div class="seg" id="sort"><button data-v="balanced" class="${state.sort !== 'cost' ? 'on' : ''}">平衡推薦</button><button data-v="cost" class="${state.sort === 'cost' ? 'on' : ''}">較低花費優先</button></div><button class="btn btn-ghost btn-sm" id="edit">修改條件</button></div></div>
      ${u.country !== 'TW' ? '<div class="card empty" style="margin-top:24px">此地區尚未建立價表與可推薦機種，請改選台灣。</div>' : `
      <div class="section-head"><div><h2>推薦機種排行</h2><div class="muted small">每型號一筆 · 已納入你的面積與樓層 · 點卡片看詳情</div></div><div class="steps">${top4.map((m, i) => `<span class="${i === 0 ? 'on' : ''}">${esc(m.id)}</span>`).join('')}</div></div>
      ${top4.length ? `<div class="gauges">${top4.map((m, i) => `<div class="gauge-card" data-model="${esc(m.id)}">
        <div class="gauge-top"><div><div class="gauge-name">${esc(m.id)}</div><div class="gauge-sub">${esc(m.m.series)} · ${esc(E.tierNames[m.m.positioning] || E.tierNames['未設定'])}</div></div><span class="rank-badge">#${i + 1}</span></div>
        <div class="gauge-body"><div class="ring">${ring(m.Z, ringColors[i])}<div class="ring-val"><b>${m.Z.toFixed(0)}</b><span>綜合分</span></div></div>
        <ul class="gauge-facts"><li>WiFi ${m.m.wifi}</li><li>${m.m.bands} 頻段</li><li>最少 ${m.N} 台</li><li>${m.m.ai ? '搭載 AI 核心' : '一般核心'}</li></ul></div>
        <div>${m.active ? '<span class="badge promo">本期主打</span>' : ''}${m.m.special !== '無' ? `<span class="badge">${esc(m.m.special)}</span>` : ''}</div></div>`).join('')}</div>
        ${rest.length ? `<div class="more-models">${rest.map((m, i) => `<button data-model="${esc(m.id)}">#${i + 5} ${esc(m.id)}</button>`).join('')}</div>` : ''}` : '<div class="card empty">沒有符合目前品牌／定位與空間條件的機種，請調整條件。</div>'}

      <div class="section-head"><div><h2>推薦配置套組 · Top ${bundles.length}</h2><div class="muted small">主機＋Node 的組合與最少台數；選一組放進你家試擺</div></div></div>
      ${bundles.length ? `<div class="bundles">${bundles.map((b, i) => `<div class="bundle">
        <div class="bundle-rank">${String(i + 1).padStart(2, '0')}</div>
        <div><div class="bundle-name">${esc(b.r.id)}${b.N > 1 ? ` <span class="muted">＋ ${esc(b.n.id)}</span>` : ''}</div>
          <div class="bundle-meta"><span>${b.N === 1 ? '單機' : 'AiMesh'}</span><span>WiFi ${b.r.wifi}</span><span>各樓層 ${b.floorUnits.join(' / ')} 台</span><span>${esc(E.tierNames[b.r.positioning] || '')}</span>${b.boost || b.reserved ? '<span class="accent">本期主打</span>' : ''}</div>
          <div class="bundle-bar"><span style="width:${Math.max(4, Math.min(100, b.Z))}%"></span></div></div>
        <div class="bundle-units"><b>${b.N}</b><small>台</small><div>${b.N > 1 ? `主機 1 ＋ Node ${b.N - 1}` : '主機 1'}</div></div>
        <button class="btn btn-sm" data-try="${i}">在我家試擺</button>
        <details><summary>推薦理由與限制</summary>能力適配 ${b.U.toFixed(1)} 分；台數是此面積與樓層下的最低預估，不是實測保證。${u.bh === 'wired' ? '有線' : '無線'}回程與混搭相容仍待驗證。</details>
      </div>`).join('')}</div>` : '<div class="card empty">沒有符合條件的配置套組，請調整條件。</div>'}

      <div class="cta-band"><div><h3>想知道放在家裡哪裡最好？</h3><p>把第一名套組放進你家的平面圖，看每個房間的訊號覆蓋。</p></div><button class="btn" id="cta" ${bundles.length ? '' : 'disabled'}>開始居家配置 →</button></div>
      <p class="note">規劃沙盒：核心規格參考官方；有效覆蓋與多數定價為測試資料。結果不顯示金額。產品定位為示範分級，非官方定位。</p>`}
    </div>`;
    $('edit').onclick = () => go('needs');
    $('sort').querySelectorAll('button').forEach(b => (b.onclick = () => { state.sort = b.dataset.v; save(); render(); }));
    el.querySelectorAll('[data-model]').forEach(c => (c.onclick = () => { state.modelId = c.dataset.model; save(); go('model'); }));
    el.querySelectorAll('[data-try]').forEach(b => (b.onclick = () => { pickBundle(bundles[+b.dataset.try]); go('floorplan'); }));
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
        <div class="summary-tags">${rankRow ? `<span>機種排行 #${models.indexOf(rankRow) + 1}</span><span>你家最少 ${rankRow.N} 台</span>` : '<span>不在目前條件的排行內</span>'}<span>WiFi ${m.wifi}</span><span>${m.bands} 頻段</span><span>有線 ${m.port} Gbps</span></div></div>
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
    $('buy').onclick = () => go('exit');
    $('try').onclick = () => { pickBundle(best); go('floorplan'); };
  }

  // ── 2_030 Exit ──
  function renderExit(el) {
    el.innerHTML = `<div class="page"><div class="exit-wrap">
      <div class="exit-ico">${I.cart}</div>
      <h1 class="page-title">已前往 ASUS 購買頁面</h1>
      <p class="page-sub">示意：此處實際會開啟官網商品頁或經銷通路。約 30% 的使用者在這裡完成流程。</p>
      <div class="card" style="margin-top:30px;text-align:left;display:flex;gap:18px;align-items:center;flex-wrap:wrap">
        <span class="quick-ico">${I.plan}</span><div style="flex:1;min-width:200px"><div class="quick-title">買之前，想先看看家裡怎麼擺？</div><div class="quick-sub">把推薦套組放進平面圖，確認每個房間都收得到。</div></div>
        <button class="btn btn-sm" id="plan">開始居家配置</button></div>
      <button class="link-btn" id="back" style="margin-top:22px">‹ 回推薦結果</button>
    </div></div>`;
    $('plan').onclick = () => { if (!state.bundleId) { const b = results().bundles[0]; pickBundle(b); } go('floorplan'); };
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
      return true;
    } catch (e) { return false; }
  }

  function renderFloorplan(el) {
    const { u, bundles } = results();
    const blank = state.seededKey === 'blank' && !state.bundleId;
    const b = blank ? null : currentBundle(bundles);
    try { AUTH_KEYS.forEach(k => localStorage.setItem(k, 'standalone')); } catch (e) { /* ignore */ }
    let fresh = false;
    if (b) {
      const key = bundleKey(b) + '|' + u.area + '|' + u.floors;
      if (state.seededKey !== key) { fresh = seedFloorplan(b, u); state.seededKey = key; state.bundleId = bundleKey(b); save(); }
    }
    const mapped = b ? [b.r.id, b.n.id].filter((id, i, a) => a.indexOf(id) === i && FP_MODEL[id] && FP_MODEL[id] !== id) : [];
    el.innerHTML = `<div class="page-full">
      <div class="fp-bar">
        <span class="quick-ico" style="width:38px;height:38px">${I.plan}</span>
        <div><div class="fp-bar-title">${b ? `${esc(b.r.id)} × 1${b.N > 1 ? ` ＋ Node ${esc(b.n.id)} × ${b.N - 1}` : ''}` : '自由試用'}</div>
          <div class="fp-bar-meta">${b ? `共 ${b.N} 台 · ${u.area} m² · ${u.floors} 層 · 已自動放進示意平面圖，可拖曳調整或上傳自家平面圖` : '未帶入推薦套組；可上傳平面圖並自行放置路由器'}</div></div>
        ${mapped.length ? `<span class="fp-warn" title="Floor plan 機種庫沒有同名型號，暫以近似機種模擬">${mapped.map(id => esc(id) + '→' + esc(FP_MODEL[id])).join('、')}</span>` : ''}
        <span class="spacer"></span>
        ${b ? '<button class="btn btn-ghost btn-sm" id="reseed" title="捨棄目前的調整，重新放入推薦套組">重新帶入</button>' : ''}
        <button class="btn btn-sm" id="swap">${b ? '換一組配置' : '先看推薦'}</button>
      </div>
      <iframe class="fp-frame" id="fpFrame" title="ASUS WiFi Floorplan" src="${FP_SRC}${fresh ? '?t=' + Date.now() : ''}"></iframe>
    </div>`;
    $('swap').onclick = () => go('results');
    const re = $('reseed');
    if (re) re.onclick = () => { seedFloorplan(b, u); $('fpFrame').src = FP_SRC + '?t=' + Date.now(); toast('已重新帶入推薦套組'); };
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
    const hints = ['填完 3 題就能看推薦', '選一組套組進入居家配置', '拖曳調整位置，查看訊號覆蓋'];
    const finished = i => (i === 0 ? state.prefsDone : i === 1 ? !!state.bundleId : false);
    nav.innerHTML = FLOW.map((f, i) => {
      const cls = i === cur ? 'current' : i <= max ? 'done' : 'locked';
      return (i ? `<span class="fs-line${finished(i - 1) ? ' done' : ''}"></span>` : '')
        + `<button class="fs-step ${cls}" data-to="${f.to}" ${cls === 'locked' ? 'disabled' : ''} title="${cls === 'locked' ? '請先完成前一步' : f.label}"><span class="fs-dot">${i !== cur && finished(i) ? '✓' : i + 1}</span><span class="fs-label">${f.label}</span></button>`;
    }).join('') + `<span class="fs-hint">${hints[cur]}</span>`;
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
  function render() {
    let s = screenById[currentId()];
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
  route();
})();
