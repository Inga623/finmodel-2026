(function() {
  var chartRevenue, chartProfit, chartStructure, chartCash;

  var months = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  var opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#9aa4c7' } } },
    scales: {
      x: { ticks: { color: '#9aa4c7', maxRotation: 45 } },
      y: { ticks: { color: '#9aa4c7' } }
    }
  };

  function fmt(v) {
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(0) + 'k';
    return Math.round(v);
  }

  window.updateCharts = function(data) {
    if (!data || typeof Chart === 'undefined') return;

    if (chartRevenue) chartRevenue.destroy();
    var ctxRev = document.getElementById('chartRevenue');
    if (ctxRev) {
      chartRevenue = new Chart(ctxRev, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [
            { label: 'Выручка WB', data: data.revenue.wb, backgroundColor: 'rgba(77, 163, 255, 0.7)', borderColor: '#4da3ff', borderWidth: 1 },
            { label: 'Выручка Ozon', data: data.revenue.oz, backgroundColor: 'rgba(255, 180, 80, 0.7)', borderColor: '#ffb450', borderWidth: 1 }
          ]
        },
        options: Object.assign({}, opts, {
          scales: {
            x: opts.scales.x,
            y: { ticks: Object.assign({}, opts.scales.y.ticks, { callback: function(v) { return fmt(v); } }) }
          }
        })
      });
    }

    if (chartProfit) chartProfit.destroy();
    var ctxProfit = document.getElementById('chartProfit');
    if (ctxProfit) {
      chartProfit = new Chart(ctxProfit, {
        type: 'line',
        data: {
          labels: months,
          datasets: [
            { label: 'Чистая прибыль', data: data.net.profit, borderColor: '#6ee7b7', backgroundColor: 'rgba(110, 231, 183, 0.1)', fill: true, tension: 0.2 },
            { label: 'Накопленный итог', data: data.net.cumulative, borderColor: '#a78bfa', backgroundColor: 'rgba(167, 139, 250, 0.1)', fill: true, tension: 0.2 }
          ]
        },
        options: Object.assign({}, opts, {
          scales: {
            x: opts.scales.x,
            y: { ticks: Object.assign({}, opts.scales.y.ticks, { callback: function(v) { return fmt(v); } }) }
          }
        })
      });
    }

    if (chartStructure) chartStructure.destroy();
    var ctxStruct = document.getElementById('chartStructure');
    if (ctxStruct && data.revenue && data.revenue.total) {
      var totalRev = data.revenue.total.reduce(function(a, b) { return a + b; }, 0);
      var totalVar = (data.variable.wb.total.reduce(function(a,b){return a+b;},0) + data.variable.oz.total.reduce(function(a,b){return a+b;},0));
      var totalMargin = data.margin.total.reduce(function(a, b) { return a + b; }, 0);
      var totalFot = (data.opex.fot && data.opex.fot.length) ? data.opex.fot.reduce(function(a,b){return a+b;},0) : 0;
      var totalOther = (data.opex.otherOpex && data.opex.otherOpex.length) ? data.opex.otherOpex.reduce(function(a,b){return a+b;},0) : 0;
      var totalUsn = (data.net.usn && data.net.usn.length) ? data.net.usn.reduce(function(a,b){return a+b;},0) : 0;
      chartStructure = new Chart(ctxStruct, {
        type: 'doughnut',
        data: {
          labels: ['Маржа', 'ФОТ', 'Прочие', 'УСН', 'Переменные'],
          datasets: [{
            data: [
              totalMargin,
              totalFot,
              totalOther,
              totalUsn,
              totalVar
            ].map(function(v) { return Math.max(0, v); }),
            backgroundColor: ['#6ee7b7', '#4da3ff', '#a78bfa', '#f87171', '#94a3b8'],
            borderWidth: 0
          }]
        },
        options: Object.assign({}, opts, { cutout: '55%' })
      });
    }

    if (chartCash) chartCash.destroy();
    var ctxCash = document.getElementById('chartCash');
    if (ctxCash && data.cash) {
      var cashSeries = (data.cashFlow && data.cashFlow.closing && data.cashFlow.closing.length)
        ? data.cashFlow.closing
        : data.cash.balance;
      var dividendsSeries = (data.dividends && Array.isArray(data.dividends.byMonth))
        ? data.dividends.byMonth
        : months.map(function() { return 0; });
      chartCash = new Chart(ctxCash, {
        type: 'line',
        data: {
          labels: months,
          datasets: [
            { label: 'Остаток денег', data: cashSeries, borderColor: '#4da3ff', backgroundColor: 'rgba(77, 163, 255, 0.1)', fill: true, tension: 0.2 },
            { label: 'Дивиденды', data: dividendsSeries, borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)', fill: true, tension: 0.2, yAxisID: 'y1' }
          ]
        },
        options: Object.assign({}, opts, {
          scales: {
            x: opts.scales.x,
            y: { ticks: Object.assign({}, opts.scales.y.ticks, { callback: function(v) { return fmt(v); } }) },
            y1: {
              position: 'right',
              grid: { drawOnChartArea: false },
              ticks: Object.assign({}, opts.scales.y.ticks, { callback: function(v) { return fmt(v); } })
            }
          }
        })
      });
    }
  };
})();
