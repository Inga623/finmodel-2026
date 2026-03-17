(function() {
  var chartRevenue, chartProfit, chartStructureWb, chartStructureOz, chartCash;

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
            { label: 'Выручка WB', data: data.revenue.wb, backgroundColor: 'rgba(147, 51, 234, 0.8)', borderColor: '#9333ea', borderWidth: 1 },
            { label: 'Выручка Ozon', data: data.revenue.oz, backgroundColor: 'rgba(37, 99, 235, 0.8)', borderColor: '#2563eb', borderWidth: 1 }
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

    if (chartStructureWb) chartStructureWb.destroy();
    if (chartStructureOz) chartStructureOz.destroy();
    var ctxStructWb = document.getElementById('chartStructureWb');
    var ctxStructOz = document.getElementById('chartStructureOz');
    if (data.revenue && data.revenue.total && data.variable && ctxStructWb && ctxStructOz) {
      var labels = data.months || months;

      // WB breakdown
      var wbCost = data.variable.wb.cost;
      var wbFee = data.variable.wb.commission;
      var wbLog = data.variable.wb.logistics;
      var wbAds = data.variable.wb.ads;

      chartStructureWb = new Chart(ctxStructWb, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            { label: 'Себестоимость', data: wbCost, backgroundColor: 'rgba(147, 51, 234, 0.35)', stack: 'stack0' },
            { label: 'Комиссия', data: wbFee, backgroundColor: 'rgba(147, 51, 234, 0.55)', stack: 'stack0' },
            { label: 'Логистика', data: wbLog, backgroundColor: 'rgba(147, 51, 234, 0.75)', stack: 'stack0' },
            { label: 'Реклама', data: wbAds, backgroundColor: 'rgba(147, 51, 234, 0.95)', stack: 'stack0' }
          ]
        },
        options: Object.assign({}, opts, {
          scales: {
            x: Object.assign({}, opts.scales.x, { stacked: true }),
            y: {
              stacked: true,
              ticks: Object.assign({}, opts.scales.y.ticks, { callback: function(v) { return fmt(v); } })
            }
          }
        })
      });

      // Ozon breakdown
      var ozCost = data.variable.oz.cost;
      var ozFee = data.variable.oz.commission;
      var ozLog = data.variable.oz.logistics;
      var ozAcq = data.variable.oz.acquiring;
      var ozAds = data.variable.oz.ads;

      chartStructureOz = new Chart(ctxStructOz, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            { label: 'Себестоимость', data: ozCost, backgroundColor: 'rgba(59, 130, 246, 0.9)', stack: 'stack0' },
            { label: 'Комиссия', data: ozFee, backgroundColor: 'rgba(37, 99, 235, 0.9)', stack: 'stack0' },
            { label: 'Логистика', data: ozLog, backgroundColor: 'rgba(129, 140, 248, 0.9)', stack: 'stack0' },
            { label: 'Эквайринг', data: ozAcq, backgroundColor: 'rgba(191, 219, 254, 0.9)', stack: 'stack0' },
            { label: 'Реклама', data: ozAds, backgroundColor: 'rgba(56, 189, 248, 0.9)', stack: 'stack0' }
          ]
        },
        options: Object.assign({}, opts, {
          scales: {
            x: Object.assign({}, opts.scales.x, { stacked: true }),
            y: {
              stacked: true,
              ticks: Object.assign({}, opts.scales.y.ticks, { callback: function(v) { return fmt(v); } })
            }
          }
        })
      });
    }

    if (chartCash) chartCash.destroy();
    var ctxCash = document.getElementById('chartCash');
    if (ctxCash && data.margin && data.margin.wb && data.margin.oz) {
      var labels = data.months || months;
      var marginWb = data.margin.wb;
      var marginOz = data.margin.oz;
      var pctWb = data.margin.pct && data.margin.pct.wb ? data.margin.pct.wb : labels.map(function(){return 0;});
      var pctOz = data.margin.pct && data.margin.pct.oz ? data.margin.pct.oz : labels.map(function(){return 0;});

      chartCash = new Chart(ctxCash, {
        data: {
          labels: labels,
          datasets: [
            {
              type: 'bar',
              label: 'Маржинальная прибыль WB, ₽',
              data: marginWb,
              backgroundColor: 'rgba(147, 51, 234, 0.8)', // фиолетовый WB
              borderColor: '#9333ea',
              borderWidth: 1,
              yAxisID: 'y'
            },
            {
              type: 'bar',
              label: 'Маржинальная прибыль Ozon, ₽',
              data: marginOz,
              backgroundColor: 'rgba(37, 99, 235, 0.8)', // синий Ozon
              borderColor: '#2563eb',
              borderWidth: 1,
              yAxisID: 'y'
            },
            {
              type: 'line',
              label: 'Маржинальность WB, %',
              data: pctWb,
              borderColor: '#93c5fd',
              backgroundColor: 'rgba(147, 197, 253, 0.15)',
              fill: false,
              tension: 0.2,
              yAxisID: 'y1'
            },
            {
              type: 'line',
              label: 'Маржинальность Ozon, %',
              data: pctOz,
              borderColor: '#facc15',
              backgroundColor: 'rgba(250, 204, 21, 0.15)',
              fill: false,
              tension: 0.2,
              yAxisID: 'y1'
            }
          ]
        },
        options: Object.assign({}, opts, {
          scales: {
            x: opts.scales.x,
            y: {
              ticks: Object.assign({}, opts.scales.y.ticks, {
                callback: function(v) { return fmt(v); }
              })
            },
            y1: {
              position: 'right',
              grid: { drawOnChartArea: false },
              ticks: {
                color: '#9aa4c7',
                callback: function(v) { return v + '%'; }
              }
            }
          }
        })
      });
    }
  };
})();
