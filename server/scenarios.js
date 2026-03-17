/**
 * Конфигурация сценариев модели (base / opt / stress).
 * Дельты применяются к: sales (коэф. выручки), cost (п.п. себестоимости), ads (п.п. рекламы).
 */

const SCENARIOS = {
  base:   { sales: 1,    cost: 0,  ads: 0 },
  opt:    { sales: 1.15, cost: -1, ads: -2 },
  stress: { sales: 0.8,  cost: 2,  ads: 3 }
};

function getScenario(name, overrides = {}) {
  const base = SCENARIOS[name] || SCENARIOS.base;
  return {
    sales: overrides.sales != null ? overrides.sales : base.sales,
    cost:  overrides.cost != null ? overrides.cost : base.cost,
    ads:   overrides.ads != null ? overrides.ads : base.ads
  };
}

module.exports = { SCENARIOS, getScenario };
