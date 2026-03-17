function ₽(v) {
  return Math.round(v).toLocaleString("ru-RU");
}

function render() {

  const params = {
    wbPrice: +wbPrice.value,
    wbQty: +wbQty.value,
    wbFee: +wbFee.value,
    wbCost: +wbCost.value,
    wbAds: +wbAds.value,

    ozPrice: +ozPrice.value,
    ozQty: +ozQty.value,
    ozFee: +ozFee.value,
    ozCost: +ozCost.value,
    ozAds: +ozAds.value,

    fot: +fot.value,
    scenario: scenario.value
  };

  const data = calculateModel(params);

  let html = `
    <thead>
      <tr>
        <th>Показатель</th>
        ${data.months.map(m => `<th>${m}</th>`).join("")}
        <th>ИТОГ</th>
      </tr>
    </thead>
    <tbody>
      <tr class="section"><td colspan="${data.months.length + 2}">ВЫРУЧКА</td></tr>
      ${row("Выручка WB", data.revenue.wb)}
      ${row("Выручка Ozon", data.revenue.oz)}
      ${row("Выручка ИТОГО", data.revenue.total, true)}

      <tr class="section"><td colspan="${data.months.length + 2}">ПЕРЕМЕННЫЕ РАСХОДЫ</td></tr>
      ${row("Комиссия WB", data.variable.wb.commission)}
      ${row("Себестоимость WB", data.variable.wb.cost)}
      ${row("Логистика WB", data.variable.wb.logistics)}
      ${row("Реклама WB", data.variable.wb.ads)}

      ${row("Комиссия Ozon", data.variable.oz.commission)}
      ${row("Себестоимость Ozon", data.variable.oz.cost)}
      ${row("Логистика Ozon", data.variable.oz.logistics)}
      ${row("Эквайринг Ozon", data.variable.oz.acquiring)}
      ${row("Реклама Ozon", data.variable.oz.ads)}

      ${row(
        "Переменные ИТОГО",
        data.variable.wb.total.map((v,i)=>v + data.variable.oz.total[i]),
        true
      )}

      <tr class="section"><td colspan="${data.months.length + 2}">МАРЖА</td></tr>
      ${row("Маржинальная прибыль", data.margin.total)}
      ${row("Маржинальность %", data.margin.pct.total)}

      <tr class="section"><td colspan="${data.months.length + 2}">ОПЕРАЦИОННАЯ ЧАСТЬ</td></tr>
      ${row("ФОТ", data.opex.fot)}
      ${row("Операционная прибыль", data.opex.opProfit, true)}

      <tr class="section"><td colspan="${data.months.length + 2}">ЧИСТАЯ ПРИБЫЛЬ</td></tr>
      ${row("Чистая прибыль", data.net.profit)}
      ${row("Накопленный итог", data.net.cumulative, true)}
    </tbody>
  `;

  document.getElementById("financeTable").innerHTML = html;
}

function row(name, arr, bold = false) {
  const sum = arr.reduce((a,b)=>a+b,0);
  return `
    <tr class="${bold ? "total" : ""}">
      <td>${name}</td>
      ${arr.map(v => `<td>${₽(v)}</td>`).join("")}
      <td><b>${₽(sum)}</b></td>
    </tr>
  `;
}

document
  .querySelectorAll("input, select")
  .forEach(el => el.addEventListener("input", render));

render();