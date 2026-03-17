// layout.js
export const tableLayout = [

  {
    title: "ВЫРУЧКА",
    rows: [
      { label: "Выручка — ИТОГО", path: ["revenue","total"] },
      { label: "Выручка — WB", path: ["revenue","wb"] },
      { label: "Выручка — Ozon", path: ["revenue","oz"] }
    ]
  },

  {
    title: "ПЕРЕМЕННЫЕ РАСХОДЫ",
    rows: [
      { label: "Переменные расходы WB — ИТОГО", path: ["variable","wb","total"], percentOf: "wb" },
      { label: "Себестоимость WB", path: ["variable","wb","cost"], percentOf: "wb" },
      { label: "Комиссия WB", path: ["variable","wb","commission"], percentOf: "wb" },
      { label: "Логистика WB", path: ["variable","wb","logistics"], percentOf: "wb" },
      { label: "Реклама WB", path: ["variable","wb","ads"], percentOf: "wb" },

      { label: "Переменные расходы Ozon — ИТОГО", path: ["variable","oz","total"], percentOf: "oz" },
      { label: "Себестоимость Ozon", path: ["variable","oz","cost"], percentOf: "oz" },
      { label: "Комиссия Ozon", path: ["variable","oz","commission"], percentOf: "oz" },
      { label: "Логистика Ozon", path: ["variable","oz","logistics"], percentOf: "oz" },
      { label: "Эквайринг Ozon", path: ["variable","oz","acquiring"], percentOf: "oz" },
      { label: "Маркетинг Ozon", path: ["variable","oz","ads"], percentOf: "oz" }
    ]
  },

  {
    title: "МАРЖИНАЛЬНАЯ ПРИБЫЛЬ",
    rows: [
      { label: "Маржа — ИТОГО", path: ["margin","total"] },
      { label: "Маржа — WB", path: ["margin","wb"] },
      { label: "Маржа — Ozon", path: ["margin","oz"] },
      { label: "% маржи — ИТОГО", path: ["margin","pct","total"] }
    ]
  },

  {
    title: "ОПЕРАЦИОННАЯ ЧАСТЬ",
    rows: [
      { label: "ФОТ", path: ["opex","fot"] },
      { label: "Операционная прибыль", path: ["opex","opProfit"] }
    ]
  },

  {
    title: "ЧИСТАЯ ПРИБЫЛЬ",
    rows: [
      { label: "Чистая прибыль", path: ["net","profit"] },
      { label: "Накопительная прибыль", path: ["net","cumulative"] }
    ]
  }
];