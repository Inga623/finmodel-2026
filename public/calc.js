// calc.js — ядро финансовой модели (только расчёты, без UI).
// Все формулы и бизнес-логика сосредоточены здесь.

/**
 * @typedef {Object} ModelInput
 * @property {number} [wbPrice] - Чек WB, ₽
 * @property {number} [wbOrders] - Заказы WB / месяц (база)
 * @property {number} [wbBuyoutRate] - Процент выкупа WB
 * @property {number} [wbFee] - Комиссия WB, %
 * @property {number} [wbCost] - Себестоимость WB, %
 * @property {number} [wbAds] - Реклама WB, %
 * @property {number} [wbLogisticsPct] - Логистика WB, %
 * @property {number[]} [wbSeason] - Сезонность WB (12 месяцев)
 * @property {number[]} [wbAdsByMonth] - Реклама WB по месяцам, %
 * @property {number} [ozPrice] - Чек Ozon, ₽
 * @property {number} [ozOrders] - Заказы Ozon / месяц (база)
 * @property {number} [ozBuyoutRate] - Процент выкупа Ozon
 * @property {number} [ozFee] - Комиссия Ozon, %
 * @property {number} [ozCost] - Себестоимость Ozon, %
 * @property {number} [ozAds] - Реклама Ozon, %
 * @property {number} [ozLogisticsPct] - Логистика Ozon, %
 * @property {number[]} [ozSeason] - Сезонность Ozon (12 месяцев)
 * @property {number[]} [ozAdsByMonth] - Реклама Ozon по месяцам, %
 * @property {number} [fot] - ФОТ / месяц, ₽
 * @property {number} [otherOpex] - Прочие расходы / месяц, ₽
 * @property {number} [usnRate] - Ставка УСН (0.02 или 0.06)
 * @property {number} [revenueLag] - Лаг выручки, мес.
 * @property {number} [openingCashBalance] - Остаток кэша на начало года, ₽
 * @property {number} [openingInflow] - Приход в январе (за дек. прошлого года), ₽
 * @property {'base'|'opt'|'stress'} [scenario] - Сценарий
 * @property {string} [version] - Версия модели ('v1' по умолчанию)
 */

/**
 * @typedef {Object} ModelOutput
 * @property {string[]} months
 * @property {{ wb: number[], oz: number[], total: number[] }} revenue
 * @property {{ wb: {...}, oz: {...} }} variable
 * @property {{ wb: number[], oz: number[], total: number[], pct: {...} }} margin
 * @property {{ fot: number[], otherOpex: number[], opProfit: number[] }} opex
 * @property {{ profit: number[], cumulative: number[], usn: number[] }} net
 * @property {{ wb: number[], oz: number[], total: number[] }} taxBase
 * @property {number[]} taxBaseCumul
 * @property {number[]} vat7
 * @property {number[]} vat22
 * @property {{ inflow: number[], outflow: number[], balance: number[] }} cash
 * @property {{ operating: number[], investing: number[], financing: number[], net: number[], closing: number[] }} cashFlow
 * @property {number|null} bepMonth
 * @property {number|null} bepRevenue
 */

/**
 * Рассчитывает финансовую модель за 12 месяцев.
 * @param {ModelInput} params - Входные параметры
 * @param {string} [version='v1'] - Версия модели
 * @returns {ModelOutput}
 */
const VERSION = 'v1';

function validateInput(params) {
  if (!params || typeof params !== 'object') throw new Error('Нет параметров');
  const n = (v, min, max, name) => {
    const x = Number(v);
    if (!Number.isFinite(x)) throw new Error(name + ': не число');
    if (min != null && x < min) throw new Error(name + ': меньше ' + min);
    if (max != null && x > max) throw new Error(name + ': больше ' + max);
    return x;
  };
  if (params.wbPrice != null) n(params.wbPrice, 0, 1e8, 'Чек WB');
  if (params.ozPrice != null) n(params.ozPrice, 0, 1e8, 'Чек Ozon');
  if (params.wbOrders != null) n(params.wbOrders, 0, 1e7, 'Заказы WB');
  if (params.ozOrders != null) n(params.ozOrders, 0, 1e7, 'Заказы Ozon');
  if (params.wbBuyoutRate != null) n(params.wbBuyoutRate, 0, 100, 'Процент выкупа WB');
  if (params.ozBuyoutRate != null) n(params.ozBuyoutRate, 0, 100, 'Процент выкупа Ozon');
  if (params.wbFee != null) n(params.wbFee, 0, 100, 'Комиссия WB');
  if (params.ozFee != null) n(params.ozFee, 0, 100, 'Комиссия Ozon');
  if (params.wbCost != null) n(params.wbCost, 0, 100, 'Себестоимость WB');
  if (params.ozCost != null) n(params.ozCost, 0, 100, 'Себестоимость Ozon');
  if (params.wbAds != null) n(params.wbAds, 0, 100, 'Реклама WB');
  if (params.ozAds != null) n(params.ozAds, 0, 100, 'Реклама Ozon');
  if (params.fot != null) n(params.fot, 0, 1e10, 'ФОТ');
  if (params.otherOpex != null) n(params.otherOpex, 0, 1e10, 'Прочие расходы');
  if (params.usnRate != null) n(params.usnRate, 0, 1, 'Ставка УСН');
  if (params.revenueLag != null) n(params.revenueLag, 0, 12, 'Лаг выручки');
  const sc = params.scenario;
  if (sc != null && sc !== 'base' && sc !== 'opt' && sc !== 'stress') throw new Error('Сценарий должен быть base, opt или stress');
}

function calculateModel_v1(params) {

  const {
    wbPrice, wbOrders, wbBuyoutRate = 100, wbFee, wbCost, wbAds, wbLogisticsPct = 2,
    wbAdsByMonth, ozAdsByMonth,
    ozPrice, ozOrders, ozBuyoutRate = 100, ozFee, ozCost, ozAds, ozLogisticsPct = 3,
    fot, scenario,
    otherOpex = 0,
    usnRate = 0.02,
    revenueLag = 1,
    openingCashBalance = 16181932,
    openingInflow = 0,
    wbSeason: wbSeasonParam,
    ozSeason: ozSeasonParam
  } = params;

  const months = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

  const defaultWbSeason = [0.65,0.71,0.70,0.55,0.50,0.42,0.50,0.60,0.75,0.77,0.79,1];
  const defaultOzSeason = [0.76,0.63,0.59,0.54,0.50,0.52,0.61,0.80,1.06,1.40,1.69,1.80];
  const wbSeason = Array.isArray(wbSeasonParam) && wbSeasonParam.length === 12 ? wbSeasonParam : defaultWbSeason;
  const ozSeason = Array.isArray(ozSeasonParam) && ozSeasonParam.length === 12 ? ozSeasonParam : defaultOzSeason;

  const buyoutWb = (wbBuyoutRate != null ? wbBuyoutRate : 100) / 100;
  const buyoutOz = (ozBuyoutRate != null ? ozBuyoutRate : 100) / 100;
  const ordersWb = wbOrders != null ? wbOrders : 21100;
  const ordersOz = ozOrders != null ? ozOrders : 25000;

  const scenarios = {
    base:   { sales: 1,    cost: 0,  ads: 0 },
    opt:    { sales: 1.15, cost: -1, ads: -2 },
    stress: { sales: 0.8,  cost: 2,  ads: 3 }
  };

  const scenarioName = scenario && scenarios[scenario] ? scenario : 'base';
  let sc = scenarios[scenarioName];
  if (params.scenarioOverrides && typeof params.scenarioOverrides === 'object') {
    sc = { sales: sc.sales, cost: sc.cost, ads: sc.ads, ...params.scenarioOverrides };
  }

  const modelData = {
    months,
    // Последовательность модели: заказы → сумма заказов → сезонность → выкупы → выручка
    orders: { wb: [], oz: [], total: [] },
    orderSum: { wb: [], oz: [], total: [] },
    season: { wb: [], oz: [] },
    buyoutRatePct: { wb: [], oz: [] },
    buyouts: { wb: [], oz: [], total: [] },
    revenue: { wb: [], oz: [], total: [] },
    variable: {
      wb: { cost: [], commission: [], logistics: [], ads: [], total: [] },
      oz: { cost: [], commission: [], logistics: [], acquiring: [], ads: [], total: [] }
    },
    margin: {
      wb: [], oz: [], total: [],
      pct: { wb: [], oz: [], total: [] }
    },
    opex: { fot: [], otherOpex: [], opProfit: [] },
    net: { profit: [], cumulative: [], usn: [] },
    taxBase: { wb: [], oz: [], total: [] },
    taxBaseCumul: [],
    vat7: [],
    vat22: [],
    cash: { inflow: [], outflow: [], balance: [] },
    cashFlow: {
      operating: [],
      investing: [],
      financing: [],
      net: [],
      closing: []
    }
  };

  const TAX_BASE_LIMIT = 490500000; // 490,5 млн — при превышении применяется 22%
  modelData.taxBaseLimit = TAX_BASE_LIMIT;

  const revenueByMonth = [];
  const variableTotalByMonth = [];
  const costByMonth = [];
  let cumulative = 0;
  let cumulativeTaxBase = 0;
  let cashBalance = openingCashBalance != null ? Number(openingCashBalance) : 16181932;

  for (let i = 0; i < 12; i++) {
    const wbOrdersMonth = ordersWb * wbSeason[i] * sc.sales;
    const wbConverted = wbOrdersMonth * buyoutWb;
    const wbRevenue = wbConverted * wbPrice / 1.07;

    const ozOrdersMonth = ordersOz * ozSeason[i] * sc.sales;
    const ozConverted = ozOrdersMonth * buyoutOz;
    const ozRevenue = ozConverted * ozPrice / 1.07;

    const totalRevenue = wbRevenue + ozRevenue;

    const wbCostRub = wbRevenue * (wbCost + sc.cost) / 100;
    const wbCommissionRub = wbRevenue * wbFee / 100;
    const wbLogisticsRub = wbRevenue * (wbLogisticsPct != null ? wbLogisticsPct : 2) / 100;
    const wbAdsPct = (Array.isArray(wbAdsByMonth) && wbAdsByMonth.length === 12 && Number.isFinite(wbAdsByMonth[i])) ? wbAdsByMonth[i] : (wbAds != null ? wbAds : 0);
    const wbAdsRub = wbRevenue * (wbAdsPct + sc.ads) / 100;
    const wbVarTotal = wbCostRub + wbCommissionRub + wbLogisticsRub + wbAdsRub;

    const ozCostRub = ozRevenue * (ozCost + sc.cost) / 100;
    const ozCommissionRub = ozRevenue * ozFee / 100;
    const ozLogisticsRub = ozRevenue * (ozLogisticsPct != null ? ozLogisticsPct : 3) / 100;
    const ozAcquiringRub = ozRevenue * 0.01;
    const ozAdsPct = (Array.isArray(ozAdsByMonth) && ozAdsByMonth.length === 12 && Number.isFinite(ozAdsByMonth[i])) ? ozAdsByMonth[i] : (ozAds != null ? ozAds : 0);
    const ozAdsRub = ozRevenue * (ozAdsPct + sc.ads) / 100;
    const ozVarTotal = ozCostRub + ozCommissionRub + ozLogisticsRub + ozAcquiringRub + ozAdsRub;

    const wbMargin = wbRevenue - wbVarTotal;
    const ozMargin = ozRevenue - ozVarTotal;
    const totalMargin = wbMargin + ozMargin;

    const totalOpex = fot + (otherOpex || 0);
    const opProfit = totalMargin - totalOpex;
    let usn = totalRevenue * (usnRate != null ? usnRate : 0.02);

    const taxBaseWb = wbRevenue * 0.65;
    const taxBaseOz = ozRevenue * 0.5;
    const taxBaseTotal = taxBaseWb + taxBaseOz;
    cumulativeTaxBase += taxBaseTotal;

    // До достижения лимита НБ: НДС 7%, УСН по ставке.
    // После достижения лимита: НДС 22% со всей базы, УСН = 0.
    let vat7Month = 0;
    let vat22Month = 0;
    if (cumulativeTaxBase <= TAX_BASE_LIMIT) {
      vat7Month = taxBaseTotal * 0.07;
    } else {
      usn = 0;
      vat22Month = taxBaseTotal * 0.22;
    }

    const netProfit = opProfit - usn;
    cumulative += netProfit;

    modelData.taxBase.wb.push(taxBaseWb);
    modelData.taxBase.oz.push(taxBaseOz);
    modelData.taxBase.total.push(taxBaseTotal);
    modelData.taxBaseCumul.push(cumulativeTaxBase);
    modelData.vat7.push(vat7Month);
    modelData.vat22.push(vat22Month);

    revenueByMonth.push(totalRevenue);
    variableTotalByMonth.push(wbVarTotal + ozVarTotal);
    costByMonth.push((wbCostRub || 0) + (ozCostRub || 0));

    modelData.orders.wb.push(wbOrdersMonth);
    modelData.orders.oz.push(ozOrdersMonth);
    modelData.orders.total.push(wbOrdersMonth + ozOrdersMonth);
    modelData.orderSum.wb.push(wbOrdersMonth * wbPrice);
    modelData.orderSum.oz.push(ozOrdersMonth * ozPrice);
    modelData.orderSum.total.push(wbOrdersMonth * wbPrice + ozOrdersMonth * ozPrice);
    modelData.season.wb.push(wbSeason[i]);
    modelData.season.oz.push(ozSeason[i]);
    modelData.buyoutRatePct.wb.push(wbBuyoutRate != null ? wbBuyoutRate : 100);
    modelData.buyoutRatePct.oz.push(ozBuyoutRate != null ? ozBuyoutRate : 100);
    modelData.buyouts.wb.push(wbConverted);
    modelData.buyouts.oz.push(ozConverted);
    modelData.buyouts.total.push(wbConverted + ozConverted);
    modelData.revenue.wb.push(wbRevenue);
    modelData.revenue.oz.push(ozRevenue);
    modelData.revenue.total.push(totalRevenue);

    modelData.variable.wb.cost.push(wbCostRub);
    modelData.variable.wb.commission.push(wbCommissionRub);
    modelData.variable.wb.logistics.push(wbLogisticsRub);
    modelData.variable.wb.ads.push(wbAdsRub);
    modelData.variable.wb.total.push(wbVarTotal);

    modelData.variable.oz.cost.push(ozCostRub);
    modelData.variable.oz.commission.push(ozCommissionRub);
    modelData.variable.oz.logistics.push(ozLogisticsRub);
    modelData.variable.oz.acquiring.push(ozAcquiringRub);
    modelData.variable.oz.ads.push(ozAdsRub);
    modelData.variable.oz.total.push(ozVarTotal);

    modelData.margin.wb.push(wbMargin);
    modelData.margin.oz.push(ozMargin);
    modelData.margin.total.push(totalMargin);

    modelData.margin.pct.wb.push(wbRevenue > 0 ? wbMargin / wbRevenue * 100 : 0);
    modelData.margin.pct.oz.push(ozRevenue > 0 ? ozMargin / ozRevenue * 100 : 0);
    modelData.margin.pct.total.push(totalRevenue > 0 ? totalMargin / totalRevenue * 100 : 0);

    modelData.opex.fot.push(fot);
    modelData.opex.otherOpex.push(otherOpex || 0);
    modelData.opex.opProfit.push(opProfit);

    modelData.net.usn.push(usn);
    modelData.net.profit.push(netProfit);
    modelData.net.cumulative.push(cumulative);
  }

  // Точка безубыточности: месяц выхода в ноль и безубыточная выручка в месяц
  const totalRevenueYear = revenueByMonth.reduce((a, b) => a + b, 0);
  const totalVariableYear = variableTotalByMonth.reduce((a, b) => a + b, 0);
  const variableRatio = totalRevenueYear > 0 ? totalVariableYear / totalRevenueYear : 0;
  modelData.bepMonth = modelData.net.cumulative.findIndex((v) => v >= 0);
  if (modelData.bepMonth < 0) modelData.bepMonth = null;
  modelData.bepRevenue = null;
  if (variableRatio < 1 && (fot + (otherOpex || 0)) > 0) {
    modelData.bepRevenue = (fot + (otherOpex || 0)) / (1 - variableRatio);
  }

  // Денежный поток: приход с лагом revenueLag мес.; в январе — приход за декабрь прошлого года (openingInflow)
  const lag = Math.min(Math.max(0, revenueLag || 0), 3);
  const inflowJanFromPrevDec = openingInflow != null ? Number(openingInflow) : 0;
  for (let i = 0; i < 12; i++) {
    const payoutIdx = i - lag;
    const payoutGross = payoutIdx >= 0 ? (revenueByMonth[payoutIdx] || 0) : 0;
    // Маркетплейс удерживает переменные (кроме себестоимости) из выплаты, поэтому приход моделируем нетто.
    const payoutWithheld = payoutIdx >= 0 ? ((variableTotalByMonth[payoutIdx] || 0) - (costByMonth[payoutIdx] || 0)) : 0;
    const payoutNet = Math.max(0, payoutGross - payoutWithheld);
    const inflow = (i === 0 ? inflowJanFromPrevDec : 0) + payoutNet;
    const vatOutflow = (modelData.vat7[i] || 0) + (modelData.vat22[i] || 0);
    // Отток — только то, что платим сами (ФОТ, прочие, налоги). Переменные удержаны в выплате.
    const outflow = fot + (otherOpex || 0) + (modelData.net.usn[i] || 0) + vatOutflow;
    const operatingCF = inflow - outflow;

    cashBalance += operatingCF;

    modelData.cash.inflow.push(inflow);
    modelData.cash.outflow.push(outflow);
    modelData.cash.balance.push(cashBalance);

    modelData.cashFlow.operating.push(operatingCF);
    modelData.cashFlow.investing.push(0);
    modelData.cashFlow.financing.push(0);
    modelData.cashFlow.net.push(operatingCF);
    modelData.cashFlow.closing.push(cashBalance);
  }

  return modelData;
}

function calculateModel(params, version = 'v1') {
  const v = params && params.version != null ? params.version : version;
  if (v !== 'v1') throw new Error('Версия модели не поддерживается: ' + v);
  validateInput(params);
  return calculateModel_v1(params);
}

export { calculateModel, calculateModel_v1, validateInput, VERSION };
