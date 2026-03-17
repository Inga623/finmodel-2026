const express = require('express');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const SCENARIOS_FILE = path.join(DATA_DIR, 'scenarios.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SCENARIOS_FILE)) {
    fs.writeFileSync(SCENARIOS_FILE, '[]', 'utf8');
  }
}

function readScenarios() {
  ensureDataDir();
  const raw = fs.readFileSync(SCENARIOS_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeScenarios(arr) {
  ensureDataDir();
  fs.writeFileSync(SCENARIOS_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

// GET /api/scenarios — список сохранённых сценариев
app.get('/api/scenarios', (req, res) => {
  const list = readScenarios().map(({ id, name, params, createdAt }) => ({
    id,
    name: name || 'Без названия',
    params,
    createdAt: createdAt || null
  }));
  res.json(list);
});

// POST /api/scenarios — сохранить сценарий
app.post('/api/scenarios', (req, res) => {
  const { name, params } = req.body || {};
  const scenarios = readScenarios();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  scenarios.push({
    id,
    name: name || 'Сценарий ' + (scenarios.length + 1),
    params: params || {},
    createdAt: new Date().toISOString()
  });
  writeScenarios(scenarios);
  res.status(201).json({ id, name: scenarios[scenarios.length - 1].name });
});

// GET /api/scenarios/:id — загрузить сценарий по id
app.get('/api/scenarios/:id', (req, res) => {
  const scenarios = readScenarios();
  const s = scenarios.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Сценарий не найден' });
  res.json({ id: s.id, name: s.name, params: s.params, createdAt: s.createdAt });
});

// DELETE /api/scenarios/:id — удалить сценарий
app.delete('/api/scenarios/:id', (req, res) => {
  const scenarios = readScenarios().filter(x => x.id !== req.params.id);
  writeScenarios(scenarios);
  res.json({ ok: true });
});

// POST /api/calculate — расчёт модели по параметрам (ядро в public/calc.js).
// body.scenarioOverrides — опционально { sales?, cost?, ads? } для кастомного сценария.
app.post('/api/calculate', async (req, res) => {
  try {
    const calcPath = path.join(__dirname, '..', 'public', 'calc.js');
    const { calculateModel } = await import(pathToFileURL(calcPath).href);
    const params = { ...(req.body || {}) };
    const result = calculateModel(params);
    if (process.env.NODE_ENV !== 'production') {
      const sum = (arr) => (arr && Array.isArray(arr)) ? arr.reduce((a, b) => a + b, 0) : 0;
      console.log('CALC INPUT', Object.keys(params).join(', '));
      console.log('CALC RESULT (summary)', {
        revenue: sum(result.revenue && result.revenue.total),
        net: sum(result.net && result.net.profit)
      });
    }
    res.json(result);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.log('CALC ERROR', err.message);
    res.status(400).json({ error: err.message || String(err) });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('Финансовая модель 2026: порт ' + PORT);
  });
}

module.exports = app;
