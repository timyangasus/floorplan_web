// Recommendation engine — ported verbatim from router_recommendation_wireframe 1.html (v3.6).
// If the wireframe's back office has published a sandbox catalog (localStorage 'routerLabV36',
// same origin), that catalog is used so both pages stay in sync.
(function () {
  const primaryNames = ['全屋覆蓋', '遊戲', '居家工作', '影音串流', '直播／內容創作', '智慧家庭'];
  const secondaryNames = ['設定與管理簡單', '家庭管理與安全', '遊戲優化與控制', '進階網路功能', '外觀與燈效', '預算與花費', '搭載AI核心', '宅外環境耐受'];
  const booleans = [['mesh', 'AiMesh主機＋Node'], ['vpn', 'VPN'], ['family', '家長控制'], ['security', '網路安全防護'], ['segment', 'IoT/子網隔離'], ['qos', 'QoS/QoE'], ['game', '專用遊戲控制'], ['creator', '創作者專用優先'], ['auto', '自動網路優化'], ['ai', '專用AI核心'], ['rgb', 'RGB'], ['quiet', '低調內置天線造型']];

  function seed(id, series, price, area, wifi, bands, port, flags, note) {
    const m = { id, series, price, area, wifi, bands, port, countries: ['TW'], enabled: true, positioning: '未設定', special: '無', note };
    booleans.forEach(([k], i) => (m[k] = !!flags[i]));
    return m;
  }
  const seeds = [
    seed('BT8', 'ZenWiFi', 9000, 90, '7', 3, 2.5, [1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1], '功能參考BT8官方；定價9000與覆蓋90均為假設。'),
    seed('GT-BE98', 'ROG', 23000, 100, '7', 4, 10, [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0], '價格覆蓋假設；隔離韌體與自動優化分類待審。'),
    seed('TUF-AX6000', 'TUF', 6000, 75, '6', 2, 2.5, [1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0], '價格覆蓋假設；隔離與自動優化為未審保守值。官方頁列RGB。'),
    seed('RT-AX86U Pro', 'RT', 7500, 80, '6', 2, 1, [1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0], '價格覆蓋假設；單一2.5G埠不可同時計WAN/LAN雙2.5G。'),
    seed('PRT-BE5000', 'ProArt', 5500, 70, '7', 2, 2.5, [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1], '價格覆蓋假設；Creator-First與Adaptive QoE。'),
    seed('GT-BE19000AI', 'ROG', 27990, 110, '7', 3, 10, [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0], 'ROG Rapture；27990為官方台灣建議售價。覆蓋110是假設，創作專用分類待確認。'),
  ];
  seeds.push(
    { ...seed('RT-BE58 Go', 'RT', 4500, 60, '7', 2, 1, [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0], '旅行系列。P=4500、A=60為假設。'), special: '旅行' },
    { ...seed('RT-AX57 Go', 'RT', 3500, 55, '6', 2, 1, [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1], '旅行系列。P=3500、A=55為假設。'), special: '旅行' },
  );
  for (const [id, price, area] of [['BD4 Outdoor', 5000, 75], ['BD5 Outdoor', 6500, 85]])
    seeds.push({ ...seed(id, 'ZenWiFi', price, area, '7', 2, 2.5, [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1], '戶外防水防塵分類參考官方；其餘為未核實沙盒值。'), special: '戶外' });

  const tierNames = { '入門': '經濟實惠', '中階': '均衡選擇', '高階': '進階首選', '未設定': '定位待確認' };
  const tierDescriptions = { '入門': '滿足日常連網，兼顧花費', '中階': '兼顧功能、效能與花費', '高階': '適合較高效能與進階功能需求' };
  // Illustrative classifications only, not official ASUS positioning.
  const demoTiers = { 'BT8': '高階', 'GT-BE98': '高階', 'GT-BE19000AI': '高階', 'TUF-AX6000': '中階', 'RT-AX86U Pro': '中階', 'PRT-BE5000': '中階', 'RT-BE58 Go': '入門', 'RT-AX57 Go': '入門', 'BD4 Outdoor': '入門', 'BD5 Outdoor': '中階' };
  seeds.forEach(m => (m.positioning = demoTiers[m.id]));

  const defaults = { products: seeds, alpha: .7, lambda: .1, lambdaBudget: .3, anchor: 20000, wall: .85, eta: .75, beta: 8, slot: 'boost', campaigns: ['GT-BE19000AI'], version: 1 };

  function catalog() {
    try {
      const s = JSON.parse(localStorage.getItem('routerLabV36'));
      if (s && Array.isArray(s.products)) return s;
    } catch (e) { /* storage blocked: fall back to defaults */ }
    return structuredClone(defaults);
  }

  const brandGroup = m => (['ROG', 'TUF'].includes(m.series) ? 'Gaming' : 'ASUS');
  const brandMatch = (m, groups) => !groups || !groups.length || groups.includes(brandGroup(m));
  const tierMatch = (m, tiers) => !tiers || !tiers.length || tiers.includes(m.positioning);
  function campaignPriority(c, id) { const i = (c.campaigns || []).indexOf(id); return c.slot === 'off' || i < 0 ? 0 : [1, .7, .4][i]; }
  function ability(m) { return { Outdoor: Number(m.special === '戶外'), R: ({ '6': .6, '6E': .8, '7': 1 })[m.wifi], H: Math.min(1, (m.bands - 1) / 2), W: Math.min(1, m.port / 2.5), M: +m.mesh, V: +m.vpn, F: +m.family, S: +m.security, I: +m.segment, Q: +m.qos, G: +m.game, C: +m.creator, O: +m.auto, AI: +m.ai, RGB: +m.rgb, Quiet: +m.quiet }; }
  function demands(x) { return [.6 * x.M + .4 * x.H, .45 * x.G + .3 * x.W + .15 * x.Q + .1 * x.R, .35 * x.V + .35 * x.W + .2 * x.Q + .1 * x.R, .4 * x.W + .35 * x.Q + .15 * x.H + .1 * x.R, .4 * x.C + .3 * x.W + .2 * x.Q + .1 * x.R, .6 * x.I + .25 * x.S + .15 * x.M]; }
  function fit(x, u, c, N = null) {
    const d = demands(x), e = [N === null ? x.O : .8 * x.O + .2 / N, .5 * x.F + .5 * x.S, x.G, .5 * x.V + .5 * x.I, u.style === 'rgb' ? x.RGB : x.Quiet, 0, x.AI, x.Outdoor];
    const pw = u.p.map(i => (i === u.top ? 2 : 1)), si = u.s.filter(i => i !== 5 && (i !== 4 || u.style !== 'none')), sw = si.map(i => (i === 2 && u.p.includes(1) ? .5 : 1));
    const P = u.p.reduce((s, i, k) => s + d[i] * pw[k], 0) / pw.reduce((s, v) => s + v, 0);
    const T = si.length ? si.reduce((s, i, k) => s + e[i] * sw[k], 0) / sw.reduce((s, v) => s + v, 0) : 0, a = si.length ? c.alpha : 1;
    return 100 * (a * P + (1 - a) * T);
  }

  function calculate(c, u) {
    let out = [];
    const models = c.products.filter(m => m.enabled && m.countries.includes(u.country) && ['無', '旅行', '戶外'].includes(m.special) && m.special !== '旅行');
    for (const r of models.filter(m => tierMatch(m, u.bundleTiers) && brandMatch(m, u.bundleBrands))) {
      for (const n of models) {
        const floorUnits = []; let N = 0;
        for (let f = 0; f < u.floors; f++) {
          const first = (f === 0 ? r.area : n.area) * c.wall, k = 1 + Math.ceil(Math.max(0, u.area / u.floors - first) / (n.area * c.wall * c.eta));
          floorUnits.push(k); N += k;
        }
        if (N === 1 && r.id !== n.id) continue;
        if (N > 6 || (N > 1 && (!r.mesh || !n.mesh))) continue;
        const x = ability(r);
        if (N > 1) { const y = ability(n); ['M', 'I', 'R', 'H', 'W'].forEach(k => (x[k] = Math.min(x[k], y[k]))); }
        x.Outdoor = (Number(r.special === '戶外') + (N - 1) * Number(n.special === '戶外')) / N;
        const U = fit(x, u, c, N), C = r.price + (N - 1) * n.price, L = 1 / (1 + C / c.anchor), lambda = u.s.includes(5) ? c.lambdaBudget : c.lambda, Z = (1 - lambda) * U + lambda * 100 * L, boost = c.beta * campaignPriority(c, r.id);
        out.push({ id: r.id + '|' + n.id + '|' + N, r, n, N, floorUnits, x, U, C, L, Z, boost, R: Z + boost, reserved: false });
      }
    }
    out = out.filter(a => !out.some(b => a !== b && a.r.id === b.r.id && JSON.stringify(a.x) === JSON.stringify(b.x) && b.N <= a.N && b.C <= a.C && (b.N < a.N || b.C < a.C)));
    const tie = (a, b) => a.C - b.C || a.N - b.N || a.id.localeCompare(b.id);
    out.sort((a, b) => b.Z - a.Z || tie(a, b));
    out.forEach((x, i) => (x.natural = i + 1));
    out.sort((a, b) => b.R - a.R || tie(a, b));
    const promos = c.slot === 'off' ? [] : (c.campaigns || []).map(id => out.find(x => x.r.id === id)).filter(Boolean);
    if (u.sort === 'cost') out.sort((a, b) => a.C - b.C || b.Z - a.Z || a.id.localeCompare(b.id));
    else if (c.slot === 'reserve' && promos.length) { const sel = new Set(promos); promos.forEach(x => (x.reserved = true)); out = [...promos, ...out.filter(x => !sel.has(x))]; }
    return { all: out, rows: out.slice(0, 10), promos };
  }

  function modelRank(c, u) {
    const out = [];
    for (const m of c.products.filter(m => m.enabled && m.countries.includes(u.country) && ['無', '旅行', '戶外'].includes(m.special) && (u.includeTravel || m.special !== '旅行') && tierMatch(m, u.modelTiers) && brandMatch(m, u.modelBrands))) {
      const per = 1 + Math.ceil(Math.max(0, u.area / u.floors - m.area * c.wall) / (m.area * c.wall * c.eta)), N = per * u.floors;
      if (N > 6 || (N > 1 && !m.mesh)) continue;
      const x = ability(m), U = fit(x, u, c), coverage = 100 / N, D = .8 * U + .2 * coverage, C = N * m.price, L = 1 / (1 + C / c.anchor), lambda = u.s.includes(5) ? c.lambdaBudget : c.lambda, Z = (1 - lambda) * D + lambda * 100 * L, priority = campaignPriority(c, m.id), boost = c.beta * priority, tech = 10 * ({ '6': 1, '6E': 2, '7': 3 }[m.wifi]) + (m.ai ? 1 : 0);
      out.push({ id: m.id, m, N, U, coverage, D, C, Z, R: Z + boost, active: priority > 0, priority, boost, tech });
    }
    const natural = (a, b) => b.tech - a.tech || b.Z - a.Z || a.C - b.C || a.id.localeCompare(b.id);
    out.sort(natural);
    out.forEach((x, i) => (x.natural = i + 1));
    if (u.sort === 'cost') out.sort((a, b) => a.C - b.C || b.Z - a.Z || a.id.localeCompare(b.id));
    else out.sort((a, b) => b.priority - a.priority || b.tech - a.tech || b.R - a.R || a.C - b.C || a.id.localeCompare(b.id));
    return out.slice(0, 10);
  }

  window.FPW_ENGINE = { primaryNames, secondaryNames, booleans, tierNames, tierDescriptions, brandGroup, catalog, ability, demands, calculate, modelRank };
})();
