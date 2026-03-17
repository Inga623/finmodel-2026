// layout_owner.js
// Короткий отчёт для собственника

export const tableLayoutOwner = [

  {
    title: "ВЫРУЧКА",
    rows: [
      { label: "Выручка — ИТОГО", path: ["revenue","total"] }
    ]
  },

  {
    title: "МАРЖИНАЛЬНАЯ ПРИБЫЛЬ",
    rows: [
      { label: "Маржа — ИТОГО", path: ["margin","total"] },
      { label: "% маржи — ИТОГО", path: ["margin","pct","total"] }
    ]
  },

  {
    title: "ОПЕРАЦИОННАЯ ЧАСТЬ",
    rows: [
      { label: "Операционная прибыль", path: ["opex","opProfit"] }
    ]
  },

  {
    title: "ЧИСТАЯ ПРИБЫЛЬ",
    rows: [
      { label: "Чистая прибыль", path: ["net","profit"] }
    ]
  }

];