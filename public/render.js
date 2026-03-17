import { calculateModel } from './calc.js';

function formatRub(v) {
  if (typeof v === 'string') return v;
  return Math.round(v).toLocaleString("ru-RU");
}

function getByPath(data, path) {
  let o = data;
  for (let i = 0; i < path.length; i++) o = o[path[i]];
  return o;
}

var layoutOwner = [
  { title: "МОДЕЛЬ ПРОДАЖ", rows: [
    { label: "Заказы — ИТОГО", path: ["orders","total"], int: true },
    { label: "Сумма заказов — ИТОГО", path: ["orderSum","total"] },
    { label: "Выкупы — ИТОГО", path: ["buyouts","total"], int: true },
    { label: "Выручка — ИТОГО", path: ["revenue","total"] }
  ]},
  { title: "МАРЖИНАЛЬНАЯ ПРИБЫЛЬ", rows: [
    { label: "Маржа WB", path: ["margin","wb"] },
    { label: "Маржа Ozon", path: ["margin","oz"] },
    { label: "Маржа — ИТОГО", path: ["margin","total"] },
    { label: "% маржи WB", path: ["margin","pct","wb"], pct: true },
    { label: "% маржи Ozon", path: ["margin","pct","oz"], pct: true },
    { label: "% маржи — ИТОГО", path: ["margin","pct","total"], pct: true }
  ]},
  { title: "ОПЕРАЦИОННАЯ ЧАСТЬ", rows: [{ label: "Операционная прибыль", path: ["opex","opProfit"] }] },
  { title: "ЧИСТАЯ ПРИБЫЛЬ", rows: [{ label: "Чистая прибыль", path: ["net","profit"] }] }
];

function buildTableFromLayout(data, layout) {
  const thead = `
    <thead>
      <tr><th>Показатель</th>${data.months.map(m => `<th>${m}</th>`).join("")}<th>ИТОГ</th></tr>
    </thead>`;
  let tbody = "<tbody>";
  for (const sec of layout) {
    tbody += `<tr class="section"><td colspan="${data.months.length + 2}">${sec.title}</td></tr>`;
    for (const r of sec.rows) {
      const arr = getByPath(data, r.path);
      const isTotal = r.path[r.path.length - 1] === 'total' || r.path[r.path.length - 1] === 'cumulative' || r.path[r.path.length - 1] === 'opProfit';
      if (arr) {
        if (r.pct) tbody += rowPct(r.label, arr, isTotal);
        else if (r.int) tbody += rowInt(r.label, arr, isTotal);
        else tbody += row(r.label, arr, isTotal);
      }
    }
  }
  tbody += "</tbody>";
  return thead + tbody;
}

let prevAnnualRevenue = null;
let prevAnnualNet = null;

function render() {

  const wbSeason = [0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
    const el = document.getElementById('wbSeason' + i);
    const v = el ? parseFloat(el.value) : NaN;
    return Number.isFinite(v) ? v : [0.65,0.71,0.70,0.55,0.50,0.42,0.50,0.60,0.75,0.77,0.79,1][i];
  });
  const ozSeason = [0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
    const el = document.getElementById('ozSeason' + i);
    const v = el ? parseFloat(el.value) : NaN;
    return Number.isFinite(v) ? v : [0.76,0.63,0.59,0.54,0.50,0.52,0.61,0.80,1.06,1.40,1.69,1.80][i];
  });
  const wbAdsEl = document.getElementById('wbAds');
  const ozAdsEl = document.getElementById('ozAds');
  const wbAdsByMonth = [0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
    const el = document.getElementById('wbAds' + i);
    const v = el ? parseFloat(el.value) : NaN;
    return Number.isFinite(v) ? v : (wbAdsEl ? +wbAdsEl.value : 12);
  });
  const ozAdsByMonth = [0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
    const el = document.getElementById('ozAds' + i);
    const v = el ? parseFloat(el.value) : NaN;
    return Number.isFinite(v) ? v : (ozAdsEl ? +ozAdsEl.value : 12);
  });

  const get = (id) => document.getElementById(id);
  const params = {
    wbPrice: +(get('wbPrice') && get('wbPrice').value) || 2310,
    wbOrders: +(get('wbOrders') && get('wbOrders').value) || 21100,
    wbBuyoutRate: +(get('wbBuyoutRate') && get('wbBuyoutRate').value) || 100,
    wbFee: +(get('wbFee') && get('wbFee').value) || 30,
    wbCost: +(get('wbCost') && get('wbCost').value) || 15,
    wbAds: +(get('wbAds') && get('wbAds').value) || 12,
    wbAdsByMonth,
    ozAdsByMonth,
    wbLogisticsPct: +(get('wbLogisticsPct') && get('wbLogisticsPct').value) || 2,
    ozPrice: +(get('ozPrice') && get('ozPrice').value) || 3200,
    ozOrders: +(get('ozOrders') && get('ozOrders').value) || 25000,
    ozBuyoutRate: +(get('ozBuyoutRate') && get('ozBuyoutRate').value) || 100,
    ozFee: +(get('ozFee') && get('ozFee').value) || 37,
    ozCost: +(get('ozCost') && get('ozCost').value) || 13,
    ozAds: +(get('ozAds') && get('ozAds').value) || 12,
    ozLogisticsPct: +(get('ozLogisticsPct') && get('ozLogisticsPct').value) || 3,
    wbSeason,
    ozSeason,
    fot: +(get('fot') && get('fot').value) || 2300000,
    otherOpex: +(get('otherOpex') && get('otherOpex').value) || 1480000,
    usnRate: +(get('usnRate') && get('usnRate').value) || 0.06,
    revenueLag: +(get('revenueLag') && get('revenueLag').value) || 1,
    openingCashBalance: +(get('openingCashBalance') && get('openingCashBalance').value) || 16181932,
    openingInflow: +(get('openingInflow') && get('openingInflow').value) || 0,
    scenario: (get('scenario') && get('scenario').value) || 'base'
  };

  let data;
  const errEl = document.getElementById('modelError');
  try {
    data = calculateModel(params);
    if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
  } catch (e) {
    if (errEl) { errEl.style.display = 'block'; errEl.textContent = 'Ошибка ввода: ' + (e && e.message ? e.message : String(e)); }
    return;
  }

  // Годовые итоги
  const sumArr = (arr) => arr.reduce((a, b) => a + b, 0);
  const totalRevenue = sumArr(data.revenue.total);
  const totalNet = sumArr(data.net.profit);

  const revEl = document.getElementById('kpiRevenueTotal');
  const netEl = document.getElementById('kpiNetTotal');
  const revDeltaEl = document.getElementById('kpiRevenueDelta');
  const netDeltaEl = document.getElementById('kpiNetDelta');

  if (revEl) revEl.textContent = formatRub(totalRevenue);
  if (netEl) netEl.textContent = formatRub(totalNet);

  const rosEl = document.getElementById('kpiROS');
  const structEl = document.getElementById('kpiRevenueStructure');
  if (rosEl) rosEl.textContent = totalRevenue > 0 ? (totalNet / totalRevenue * 100).toFixed(1) + '%' : '—';
  if (structEl) {
    const revWb = sumArr(data.revenue.wb);
    const revOz = sumArr(data.revenue.oz);
    const pctWb = totalRevenue > 0 ? (revWb / totalRevenue * 100).toFixed(0) : 0;
    const pctOz = totalRevenue > 0 ? (revOz / totalRevenue * 100).toFixed(0) : 0;
    structEl.textContent = totalRevenue > 0 ? `WB ${pctWb}% / Ozon ${pctOz}%` : '—';
  }

  if (revDeltaEl) {
    revDeltaEl.textContent = '';
    revDeltaEl.className = 'kpi-delta';
    if (prevAnnualRevenue != null && prevAnnualRevenue !== 0) {
      const diff = totalRevenue - prevAnnualRevenue;
      const pct = diff / prevAnnualRevenue * 100;
      if (Math.abs(pct) >= 0.01) {
        revDeltaEl.textContent = (diff > 0 ? '+' : '') + formatRub(diff) + ` (${pct.toFixed(1)}%)`;
        revDeltaEl.classList.add(diff > 0 ? 'up' : 'down');
      }
    }
  }

  if (netDeltaEl) {
    netDeltaEl.textContent = '';
    netDeltaEl.className = 'kpi-delta';
    if (prevAnnualNet != null && prevAnnualNet !== 0) {
      const diffN = totalNet - prevAnnualNet;
      const pctN = diffN / prevAnnualNet * 100;
      if (Math.abs(pctN) >= 0.01) {
        netDeltaEl.textContent = (diffN > 0 ? '+' : '') + formatRub(diffN) + ` (${pctN.toFixed(1)}%)`;
        netDeltaEl.classList.add(diffN > 0 ? 'up' : 'down');
      }
    }
  }

  prevAnnualRevenue = totalRevenue;
  prevAnnualNet = totalNet;
  const reportView = (document.getElementById('reportView') && document.getElementById('reportView').value) || 'full';

  let html;
  if (reportView === 'owner') {
    html = buildTableFromLayout(data, layoutOwner);
  } else {
    html = `
    <thead>
      <tr>
        <th>Показатель</th>
        ${data.months.map(m => `<th>${m}</th>`).join("")}
        <th>ИТОГ</th>
      </tr>
    </thead>
    <tbody>
      <tr class="section"><td colspan="${data.months.length + 2}">МОДЕЛЬ ПРОДАЖ (по каждому маркетплейсу и итоги)</td></tr>
      <tr class="subsection"><td colspan="${data.months.length + 2}">Кол-во заказов</td></tr>
      ${rowInt("Заказы WB", data.orders.wb)}
      ${rowInt("Заказы Ozon", data.orders.oz)}
      ${rowInt("Заказы ИТОГО", data.orders.total, true)}
      <tr class="subsection"><td colspan="${data.months.length + 2}">Сумма заказов, ₽</td></tr>
      ${row("Сумма заказов WB", data.orderSum.wb)}
      ${row("Сумма заказов Ozon", data.orderSum.oz)}
      ${row("Сумма заказов ИТОГО", data.orderSum.total, true)}
      <tr class="subsection"><td colspan="${data.months.length + 2}">Коэффициент сезонности</td></tr>
      ${rowNum("Сезонность WB", data.season.wb, false, 2)}
      ${rowNum("Сезонность Ozon", data.season.oz, false, 2)}
      <tr class="subsection"><td colspan="${data.months.length + 2}">Процент выкупа (выкупы = заказы × % выкупа)</td></tr>
      ${rowPct("Процент выкупа WB", data.buyoutRatePct.wb)}
      ${rowPct("Процент выкупа Ozon", data.buyoutRatePct.oz)}
      <tr class="subsection"><td colspan="${data.months.length + 2}">Кол-во выкупов</td></tr>
      ${rowInt("Выкупы WB", data.buyouts.wb)}
      ${rowInt("Выкупы Ozon", data.buyouts.oz)}
      ${rowInt("Выкупы ИТОГО", data.buyouts.total, true)}
      <tr class="subsection"><td colspan="${data.months.length + 2}">Выручка, ₽</td></tr>
      ${row("Выручка WB", data.revenue.wb)}
      ${row("Выручка Ozon", data.revenue.oz)}
      ${row("Выручка ИТОГО", data.revenue.total, true)}

      <tr class="section"><td colspan="${data.months.length + 2}">ПЕРЕМЕННЫЕ РАСХОДЫ (% к выручке)</td></tr>
      ${rowWithPctOfRevenue("Комиссия WB", data.variable.wb.commission, data.revenue.wb)}
      ${rowWithPctOfRevenue("Себестоимость WB", data.variable.wb.cost, data.revenue.wb)}
      ${rowWithPctOfRevenue("Логистика WB", data.variable.wb.logistics, data.revenue.wb)}
      ${rowWithPctOfRevenue("Реклама WB", data.variable.wb.ads, data.revenue.wb)}

      ${rowWithPctOfRevenue("Комиссия Ozon", data.variable.oz.commission, data.revenue.oz)}
      ${rowWithPctOfRevenue("Себестоимость Ozon", data.variable.oz.cost, data.revenue.oz)}
      ${rowWithPctOfRevenue("Логистика Ozon", data.variable.oz.logistics, data.revenue.oz)}
      ${rowWithPctOfRevenue("Эквайринг Ozon", data.variable.oz.acquiring, data.revenue.oz)}
      ${rowWithPctOfRevenue("Реклама Ozon", data.variable.oz.ads, data.revenue.oz)}

      ${rowWithPctOfRevenue(
        "Переменные ИТОГО",
        data.variable.wb.total.map((v,i)=>v + data.variable.oz.total[i]),
        data.revenue.total,
        true
      )}

      <tr class="section"><td colspan="${data.months.length + 2}">МАРЖА</td></tr>
      ${row("Маржинальная прибыль WB", data.margin.wb)}
      ${row("Маржинальная прибыль Ozon", data.margin.oz)}
      ${row("Маржинальная прибыль ИТОГО", data.margin.total, true)}
      ${rowPct("Маржинальность % WB", data.margin.pct.wb)}
      ${rowPct("Маржинальность % Ozon", data.margin.pct.oz)}
      ${rowPct("Маржинальность % ИТОГО", data.margin.pct.total, true)}

      <tr class="section"><td colspan="${data.months.length + 2}">ОПЕРАЦИОННАЯ ЧАСТЬ</td></tr>
      ${row("ФОТ", data.opex.fot)}
      ${data.opex.otherOpex ? row("Прочие расходы", data.opex.otherOpex) : ''}
      ${row("Операционная прибыль", data.opex.opProfit, true)}

      <tr class="section"><td colspan="${data.months.length + 2}">ЧИСТАЯ ПРИБЫЛЬ</td></tr>
      ${row("УСН", data.net.usn)}
      <tr class="subsection"><td colspan="${data.months.length + 2}">Налогооблагаемая база (НБ) и НДС</td></tr>
      ${row("Налогооблагаемая база WB (65% выручки)", data.taxBase.wb)}
      ${row("Налогооблагаемая база Ozon (50% выручки)", data.taxBase.oz)}
      ${row("Налогооблагаемая база ИТОГО", data.taxBase.total, true)}
      ${rowWithLimit("Налогооблагаемая база накопительно", data.taxBaseCumul, true, data.taxBaseLimit)}
      ${row("НДС 7%", data.vat7)}
      ${row("НДС 22% (при превышении лимита)", data.vat22)}
      <tr class="subsection"><td colspan="${data.months.length + 2}" style="font-size:11px;color:#9aa4c7;">При превышении НБ накопительно 490,5 млн ₽ применяется ставка 22%</td></tr>
      ${row("Чистая прибыль", data.net.profit)}
      ${row("Накопленный итог", data.net.cumulative, true)}

      ${data.cash ? `
      <tr class="section"><td colspan="${data.months.length + 2}">ДЕНЕЖНЫЙ ПОТОК</td></tr>
      ${row("Приход (с лагом)", data.cash.inflow)}
      ${row("Отток", data.cash.outflow)}
      ${rowWithNegativeHighlight("Остаток кэша", data.cash.balance, true)}
      ` : ''}
    </tbody>
  `;
  }

  document.getElementById("financeTable").innerHTML = html;
  if (window.updateCharts) window.updateCharts(data);

  // Обновить отображаемые значения в панели
  const setPanel = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  setPanel('valWbOrders', (params.wbOrders || 0).toLocaleString('ru-RU'));
  setPanel('valWbBuyout', (params.wbBuyoutRate ?? 100));
  setPanel('valOzOrders', (params.ozOrders || 0).toLocaleString('ru-RU'));
  setPanel('valOzBuyout', (params.ozBuyoutRate ?? 100));
  setPanel('valWbPrice', formatRub(params.wbPrice));
  setPanel('valWbFee', params.wbFee);
  setPanel('valWbCost', params.wbCost);
  setPanel('valWbAds', params.wbAds);
  setPanel('valWbLogistics', params.wbLogisticsPct ?? 2);
  setPanel('valOzPrice', formatRub(params.ozPrice));
  setPanel('valOzFee', params.ozFee);
  setPanel('valOzCost', params.ozCost);
  setPanel('valOzAds', params.ozAds);
  setPanel('valOzLogistics', params.ozLogisticsPct ?? 3);
  setPanel('valFot', formatRub(params.fot));
  setPanel('valOtherOpex', formatRub(params.otherOpex));
  setPanel('valOpeningCash', formatRub(params.openingCashBalance ?? 16181932));
  setPanel('valOpeningInflow', formatRub(params.openingInflow ?? 0));
  const totalVarWb = data.variable.wb.total.reduce((a,b)=>a+b,0);
  const totalVarOz = data.variable.oz.total.reduce((a,b)=>a+b,0);
  const totalRev = data.revenue.total.reduce((a,b)=>a+b,0);
  if (totalRev > 0) {
    setPanel('pctVarWb', (totalVarWb / totalRev * 100).toFixed(1));
    setPanel('pctVarOz', (totalVarOz / totalRev * 100).toFixed(1));
  }
  const minCash = data.cash && data.cash.balance.length ? Math.min(...data.cash.balance) : 0;
  setPanel('valMinCash', formatRub(minCash));
  const cashWarnEl = document.getElementById('cashWarning');
  if (cashWarnEl) {
    cashWarnEl.style.display = minCash < 0 ? 'block' : 'none';
  }
  const bepMonthVal = data.bepMonth != null && data.months && data.months[data.bepMonth] ? data.months[data.bepMonth] : '—';
  setPanel('valBepMonth', bepMonthVal);
  setPanel('valBepRevenue', data.bepRevenue != null ? formatRub(data.bepRevenue) : '—');
  const totalOpProfit = data.opex.opProfit && data.opex.opProfit.length ? data.opex.opProfit.reduce((a,b)=>a+b,0) : 0;
  setPanel('valOpProfit', formatRub(totalOpProfit));
  const avgMargin = data.margin.pct.total && data.margin.pct.total.length
    ? (data.margin.pct.total.reduce((a,b)=>a+b,0) / data.margin.pct.total.length).toFixed(1) + '%'
    : '—';
  setPanel('valAvgMargin', avgMargin);

  // Сравнение сценариев
  const baseParams = Object.assign({}, params, { scenario: 'base' });
  const optParams = Object.assign({}, params, { scenario: 'opt' });
  const stressParams = Object.assign({}, params, { scenario: 'stress' });
  const dBase = calculateModel(baseParams);
  const dOpt = calculateModel(optParams);
  const dStress = calculateModel(stressParams);
  const sum = (arr) => arr.reduce((a,b) => a + b, 0);
  const scenarioBody = document.getElementById('scenarioTableBody');
  if (scenarioBody) {
    scenarioBody.innerHTML = `
      <tr><td style="padding:8px;border-bottom:1px solid #273058;">Выручка</td><td style="padding:8px;text-align:right;border-bottom:1px solid #273058;">${formatRub(sum(dBase.revenue.total))}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #273058;">${formatRub(sum(dOpt.revenue.total))}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #273058;">${formatRub(sum(dStress.revenue.total))}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #273058;">Маржа</td><td style="padding:8px;text-align:right;border-bottom:1px solid #273058;">${formatRub(sum(dBase.margin.total))}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #273058;">${formatRub(sum(dOpt.margin.total))}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #273058;">${formatRub(sum(dStress.margin.total))}</td></tr>
      <tr><td style="padding:8px;">Чистая прибыль</td><td style="padding:8px;text-align:right;">${formatRub(sum(dBase.net.profit))}</td><td style="padding:8px;text-align:right;">${formatRub(sum(dOpt.net.profit))}</td><td style="padding:8px;text-align:right;">${formatRub(sum(dStress.net.profit))}</td></tr>
    `;
  }

  // Таблица чувствительности
  const sensitivityScenarios = [
    { name: 'Базовый', p: params },
    { name: 'Выручка −10%', p: Object.assign({}, params, { wbOrders: (params.wbOrders || 21100) * 0.9, ozOrders: (params.ozOrders || 25000) * 0.9 }) },
    { name: 'Выручка +10%', p: Object.assign({}, params, { wbOrders: (params.wbOrders || 21100) * 1.1, ozOrders: (params.ozOrders || 25000) * 1.1 }) },
    { name: 'Комиссия WB +1 п.п.', p: Object.assign({}, params, { wbFee: params.wbFee + 1 }) },
    { name: 'Комиссия Ozon +1 п.п.', p: Object.assign({}, params, { ozFee: params.ozFee + 1 }) },
    { name: 'Выкуп −5 п.п.', p: Object.assign({}, params, { wbBuyoutRate: Math.max(50, (params.wbBuyoutRate ?? 100) - 5), ozBuyoutRate: Math.max(50, (params.ozBuyoutRate ?? 100) - 5) }) },
    { name: 'ФОТ +10%', p: Object.assign({}, params, { fot: params.fot * 1.1 }) }
  ];
  const sensBody = document.getElementById('sensitivityTableBody');
  if (sensBody) {
    sensBody.innerHTML = sensitivityScenarios.map(({ name, p }) => {
      const d = calculateModel(p);
      const rev = sum(d.revenue.total);
      const net = sum(d.net.profit);
      return `<tr><td style="padding:8px;border-bottom:1px solid #273058;">${name}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #273058;">${formatRub(rev)}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #273058;">${formatRub(net)}</td></tr>`;
    }).join('');
  }
}

function row(name, arr, bold = false) {
  const isPct = arr.length && typeof arr[0] === 'string';
  const sum = isPct ? null : arr.reduce((a,b)=>a+b,0);
  return `
    <tr class="${bold ? "total" : ""}">
      <td>${name}</td>
      ${arr.map(v => `<td>${formatRub(v)}</td>`).join("")}
      <td><b>${isPct ? '—' : formatRub(sum)}</b></td>
    </tr>
  `;
}

function rowWithPctOfRevenue(name, amountArr, revenueArr, bold = false) {
  const sumAmount = amountArr.reduce((a,b)=>a+b,0);
  const sumRevenue = revenueArr.reduce((a,b)=>a+b,0);
  const pctTotal = sumRevenue > 0 ? (sumAmount / sumRevenue * 100).toFixed(1) : '—';
  return `
    <tr class="${bold ? "total" : ""}">
      <td>${name}</td>
      ${amountArr.map((v, i) => {
        const pct = revenueArr[i] > 0 ? (v / revenueArr[i] * 100).toFixed(1) : '—';
        return `<td>${formatRub(v)} <span class="cell-pct">(${pct}%)</span></td>`;
      }).join("")}
      <td><b>${formatRub(sumAmount)} <span class="cell-pct">(${pctTotal}%)</span></b></td>
    </tr>
  `;
}

function rowPct(name, arr, bold = false) {
  const sum = arr.reduce((a,b)=>a+b,0);
  const avg = arr.length ? sum / arr.length : 0;
  return `
    <tr class="${bold ? "total" : ""}">
      <td>${name}</td>
      ${arr.map(v => `<td>${Number(v).toFixed(1)}%</td>`).join("")}
      <td><b>${avg.toFixed(1)}%</b></td>
    </tr>
  `;
}

function rowInt(name, arr, bold = false) {
  const sum = arr.reduce((a,b)=>a+b,0);
  return `
    <tr class="${bold ? "total" : ""}">
      <td>${name}</td>
      ${arr.map(v => `<td>${Math.round(v).toLocaleString("ru-RU")}</td>`).join("")}
      <td><b>${Math.round(sum).toLocaleString("ru-RU")}</b></td>
    </tr>
  `;
}

function rowNum(name, arr, bold = false, decimals = 2) {
  const sum = arr.reduce((a,b)=>a+b,0);
  const avg = arr.length ? sum / arr.length : 0;
  return `
    <tr class="${bold ? "total" : ""}">
      <td>${name}</td>
      ${arr.map(v => `<td>${Number(v).toFixed(decimals)}</td>`).join("")}
      <td><b>${avg.toFixed(decimals)}</b></td>
    </tr>
  `;
}

function rowWithLimit(name, arr, bold = false, limit = 490500000) {
  const sum = arr.reduce((a,b)=>a+b,0);
  const cls = (v) => (v >= (limit || 490500000) ? ' class="nb-over-limit"' : '');
  return `
    <tr class="${bold ? "total" : ""}">
      <td>${name}</td>
      ${arr.map(v => `<td${cls(v)}>${formatRub(v)}</td>`).join("")}
      <td${cls(sum)}><b>${formatRub(sum)}</b></td>
    </tr>
  `;
}

function rowWithNegativeHighlight(name, arr, bold = false) {
  const sum = arr.reduce((a,b)=>a+b,0);
  const cls = (v) => (v < 0 ? ' class="cash-negative"' : '');
  return `
    <tr class="${bold ? "total" : ""}">
      <td>${name}</td>
      ${arr.map(v => `<td${cls(v)}>${formatRub(v)}</td>`).join("")}
      <td${cls(sum)}><b>${formatRub(sum)}</b></td>
    </tr>
  `;
}

function getParams() {
  const g = (id) => document.getElementById(id);
  const wbOrdersEl = g('wbOrders');
  const wbBuyoutEl = g('wbBuyoutRate');
  const ozOrdersEl = g('ozOrders');
  const ozBuyoutEl = g('ozBuyoutRate');
  const wbAdsEl = g('wbAds');
  const ozAdsEl = g('ozAds');
  const wbSeason = [0,1,2,3,4,5,6,7,8,9,10,11].map(i => parseFloat(g('wbSeason' + i)?.value) || 0);
  const ozSeason = [0,1,2,3,4,5,6,7,8,9,10,11].map(i => parseFloat(g('ozSeason' + i)?.value) || 0);
  return {
    wbPrice: +(g('wbPrice')?.value) || 2310,
    wbOrders: wbOrdersEl ? +wbOrdersEl.value : 21100,
    wbBuyoutRate: wbBuyoutEl ? +wbBuyoutEl.value : 100,
    wbFee: +(g('wbFee')?.value) || 30,
    wbCost: +(g('wbCost')?.value) || 15,
    wbAds: +(wbAdsEl?.value) || 12,
    wbAdsByMonth: [0,1,2,3,4,5,6,7,8,9,10,11].map(i => { const v = parseFloat(g('wbAds' + i)?.value); return Number.isFinite(v) ? v : +(wbAdsEl?.value) || 12; }),
    ozAdsByMonth: [0,1,2,3,4,5,6,7,8,9,10,11].map(i => { const v = parseFloat(g('ozAds' + i)?.value); return Number.isFinite(v) ? v : +(ozAdsEl?.value) || 12; }),
    wbLogisticsPct: +(g('wbLogisticsPct')?.value) || 2,
    ozPrice: +(g('ozPrice')?.value) || 3200,
    ozOrders: ozOrdersEl ? +ozOrdersEl.value : 25000,
    ozBuyoutRate: ozBuyoutEl ? +ozBuyoutEl.value : 100,
    ozFee: +(g('ozFee')?.value) || 37,
    ozCost: +(g('ozCost')?.value) || 13,
    ozAds: +(ozAdsEl?.value) || 12,
    ozLogisticsPct: +(g('ozLogisticsPct')?.value) || 3,
    wbSeason: wbSeason.every(v => v > 0) ? wbSeason : undefined,
    ozSeason: ozSeason.every(v => v > 0) ? ozSeason : undefined,
    fot: +(g('fot')?.value) || 2300000,
    otherOpex: +(g('otherOpex')?.value) || 1480000,
    usnRate: +(g('usnRate')?.value) || 0.06,
    revenueLag: +(g('revenueLag')?.value) || 1,
    openingCashBalance: +(g('openingCashBalance')?.value) || 16181932,
    openingInflow: +(g('openingInflow')?.value) || 0,
    scenario: (g('scenario')?.value) || 'base'
  };
}

const defaultWbSeason = [0.65,0.71,0.70,0.55,0.50,0.42,0.50,0.60,0.75,0.77,0.79,1];
const defaultOzSeason = [0.76,0.63,0.59,0.54,0.50,0.52,0.61,0.80,1.06,1.40,1.69,1.80];

function setParams(p) {
  if (!p) return;
  const g = (id) => document.getElementById(id);
  if (p.wbPrice != null) { const el = g('wbPrice'); if (el) el.value = p.wbPrice; }
  const wbOrdersEl = g('wbOrders');
  const wbBuyoutEl = g('wbBuyoutRate');
  if (p.wbOrders != null && wbOrdersEl) wbOrdersEl.value = p.wbOrders;
  else if (p.wbQty != null && wbOrdersEl) { wbOrdersEl.value = p.wbQty; if (wbBuyoutEl) wbBuyoutEl.value = 100; }
  if (p.wbBuyoutRate != null && wbBuyoutEl) wbBuyoutEl.value = p.wbBuyoutRate;
  if (p.wbFee != null) { const el = g('wbFee'); if (el) el.value = p.wbFee; }
  if (p.wbCost != null) { const el = g('wbCost'); if (el) el.value = p.wbCost; }
  if (p.wbAds != null) { const el = g('wbAds'); if (el) el.value = p.wbAds; }
  if (Array.isArray(p.wbAdsByMonth) && p.wbAdsByMonth.length === 12) {
    p.wbAdsByMonth.forEach((v, i) => { const el = g('wbAds' + i); if (el) el.value = v != null ? v : ''; });
  }
  const wbLogEl = g('wbLogisticsPct');
  if (p.wbLogisticsPct != null && wbLogEl) wbLogEl.value = p.wbLogisticsPct;
  if (p.ozPrice != null) { const el = g('ozPrice'); if (el) el.value = p.ozPrice; }
  const ozOrdersEl = g('ozOrders');
  const ozBuyoutEl = g('ozBuyoutRate');
  if (p.ozOrders != null && ozOrdersEl) ozOrdersEl.value = p.ozOrders;
  else if (p.ozQty != null && ozOrdersEl) { ozOrdersEl.value = p.ozQty; if (ozBuyoutEl) ozBuyoutEl.value = 100; }
  if (p.ozBuyoutRate != null && ozBuyoutEl) ozBuyoutEl.value = p.ozBuyoutRate;
  if (p.ozFee != null) { const el = g('ozFee'); if (el) el.value = p.ozFee; }
  if (p.ozCost != null) { const el = g('ozCost'); if (el) el.value = p.ozCost; }
  if (p.ozAds != null) { const el = g('ozAds'); if (el) el.value = p.ozAds; }
  if (Array.isArray(p.ozAdsByMonth) && p.ozAdsByMonth.length === 12) {
    p.ozAdsByMonth.forEach((v, i) => { const el = g('ozAds' + i); if (el) el.value = v != null ? v : ''; });
  }
  const ozLogEl = g('ozLogisticsPct');
  if (p.ozLogisticsPct != null && ozLogEl) ozLogEl.value = p.ozLogisticsPct;
  if (Array.isArray(p.wbSeason) && p.wbSeason.length === 12) {
    p.wbSeason.forEach((v, i) => { const el = g('wbSeason' + i); if (el) el.value = v; });
  }
  if (Array.isArray(p.ozSeason) && p.ozSeason.length === 12) {
    p.ozSeason.forEach((v, i) => { const el = g('ozSeason' + i); if (el) el.value = v; });
  }
  if (p.fot != null) { const el = g('fot'); if (el) el.value = p.fot; }
  const oo = g('otherOpex');
  const ur = g('usnRate');
  const rl = g('revenueLag');
  const ocb = g('openingCashBalance');
  const oci = g('openingInflow');
  if (oo && p.otherOpex != null) oo.value = p.otherOpex;
  if (ur && p.usnRate != null) ur.value = String(p.usnRate);
  if (rl && p.revenueLag != null) rl.value = String(p.revenueLag);
  if (ocb && p.openingCashBalance != null) ocb.value = p.openingCashBalance;
  if (oci && p.openingInflow != null) oci.value = p.openingInflow;
  if (p.scenario != null) { const el = g('scenario'); if (el) el.value = p.scenario; }
  render();
}

async function refreshScenariosList() {
  const sel = document.getElementById('loadScenario');
  if (!sel) return;
  try {
    const res = await fetch('/api/scenarios');
    const list = await res.json();
    const cur = sel.value;
    sel.innerHTML = '<option value="">— выберите —</option>' + list.map(s => '<option value="' + s.id + '">' + (s.name || s.id) + '</option>').join('');
    if (cur) sel.value = cur;
  } catch (e) {
    sel.innerHTML = '<option value="">— ошибка загрузки —</option>';
  }
}

export { render, getParams, setParams, refreshScenariosList };
