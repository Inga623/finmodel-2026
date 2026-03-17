import { render, getParams, setParams, refreshScenariosList } from './render.js';

document.getElementById('btnSaveScenario').addEventListener('click', async () => {
  const name = (document.getElementById('scenarioName').value || 'Сценарий').trim();
  const params = getParams();
  try {
    const res = await fetch('/api/scenarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, params }) });
    await res.json();
    document.getElementById('scenarioName').value = '';
    await refreshScenariosList();
  } catch (e) {}
});

document.getElementById('loadScenario').addEventListener('change', async function() {
  const id = this.value;
  if (!id) return;
  try {
    const res = await fetch('/api/scenarios/' + id);
    const data = await res.json();
    setParams(data.params);
  } catch (e) {}
});

document.querySelectorAll('input, select').forEach(el => {
  if (el.id === 'loadScenario' || el.id === 'scenarioName') return;
  // Для select в некоторых браузерах 'input' не срабатывает стабильно
  el.addEventListener('input', render);
  if (el.tagName === 'SELECT') el.addEventListener('change', render);
});
const reportViewEl = document.getElementById('reportView');
if (reportViewEl) reportViewEl.addEventListener('change', render);

refreshScenariosList();
render();
