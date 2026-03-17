// calc.js — БЕЗ MODULES

function calculateModel(params) {

  const {
    wbPrice, wbQty, wbFee, wbCost, wbAds,
    ozPrice, ozQty, ozFee, ozCost, ozAds,
    fot, scenario
  } = params;

  const months = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

  const wbSeason = [0.65,0.71,0.70,0.55,0.50,0.42,0.50,0.60,0.75,0.77,0.79,1];
  const ozSeason = [0.76,0.63,0.59,0.54,0.50,0.52,0.61,0.80,1.06,1.40,1.69,1.80];

  const scenarios = {
    base:   { sales: 1,    cost: 0,  ads: 0 },
    opt:    { sales: 1.15, cost: -1, ads: -2 },
    stress: { sales: 0.8,  cost: 2,  ads: 3 }
  };

  const sc = scenarios[scenario];

  const modelData = {
    months,
    revenue: { wb: [], oz: [], total: [] },
    variable: {
      wb: { cost: [], commission: [], logistics: [], ads: [], total: [] },
      oz: { cost: [], commission: [], logistics: [], acquiring: [], ads: [], total: [] }
    },
    margin: {
      wb: [], oz: [], total: [],
      pct: { wb: [], oz: [], total: [] }
    },
    opex: { fot: [], opProfit: [] },
    net: { profit: [], cumulative: [] }
  };

  let cumulative = 0;

  for (let i = 0; i < 12; i++) {

    const wbRevenue = wbQty * wbSeason[i] * sc.sales * wbPrice / 1.07;
    const ozRevenue = ozQty * ozSeason[i] * sc.sales * ozPrice / 1.07;
    const totalRevenue = wbRevenue + ozRevenue;

    const wbCostRub = wbRevenue * (wbCost + sc.cost) / 100;
    const wbCommissionRub = wbRevenue * wbFee / 100;
    const wbLogisticsRub = wbRevenue * 0.02;
    const wbAdsRub = wbRevenue * (wbAds + sc.ads) / 100;
    const wbVarTotal = wbCostRub + wbCommissionRub + wbLogisticsRub + wbAdsRub;

    const ozCostRub = ozRevenue * (ozCost + sc.cost) / 100;
    const ozCommissionRub = ozRevenue * ozFee / 100;
    const ozLogisticsRub = ozRevenue * 0.03;
    const ozAcquiringRub = ozRevenue * 0.01;
    const ozAdsRub = ozRevenue * (ozAds + sc.ads) / 100;
    const ozVarTotal = ozCostRub + ozCommissionRub + ozLogisticsRub + ozAcquiringRub + ozAdsRub;

    const wbMargin = wbRevenue - wbVarTotal;
    const ozMargin = ozRevenue - ozVarTotal;
    const totalMargin = wbMargin + ozMargin;

    const opProfit = totalMargin - fot;
    const usn = totalRevenue * 0.02;
    const netProfit = opProfit - usn;
    cumulative += netProfit;

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

    modelData.margin.pct.wb.push((wbMargin / wbRevenue * 100).toFixed(1) + "%");
    modelData.margin.pct.oz.push((ozMargin / ozRevenue * 100).toFixed(1) + "%");
    modelData.margin.pct.total.push((totalMargin / totalRevenue * 100).toFixed(1) + "%");

    modelData.opex.fot.push(fot);
    modelData.opex.opProfit.push(opProfit);

    modelData.net.profit.push(netProfit);
    modelData.net.cumulative.push(cumulative);
  }

  return modelData;
}