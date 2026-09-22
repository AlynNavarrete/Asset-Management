/* Calculation rules shared by the editor and regression tests. No network or DOM access. */
(function (root) {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const today = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  const recent = (date, now = new Date()) => validDate(date) && date <= today(now) && Number(date.slice(0, 4)) === now.getFullYear();
  const categories = [{ key: 'food', label: 'Alimentos y bebidas' }, { key: 'health', label: 'Salud y farmacia' }, { key: 'retail', label: 'Comercio minorista' }, { key: 'service', label: 'Servicios' }];
  function calculate(data, now = new Date()) {
    const values = [1, 2, 3].map(i => Number(data[`comp${i}`]));
    const rbComp = median(values);
    // Normalize each comparable independently. A current-year invoice never receives IPC twice.
    const adjusted = values.map((value, index) => value * (1 + (recent(data[`compDate${index + 1}`], now) ? 0 : Number(data.inflation) / 100)));
    const inflationApplied = rbComp > 0 ? Number((median(adjusted) / rbComp - 1).toFixed(12)) : 0;
    const reason = { 'Quiebra por Renta Alta': -.05, Normal: 0, 'Expansión': .03 }[data.exitReason] || 0;
    const histRaw = inflationApplied + reason, hist = clamp(histRaw, -.10, .10);
    const densityEffect = data.cityAverage > 0 ? data.localDensity / data.cityAverage * .05 : 0;
    const denueRaw = densityEffect - Number(data.saturation || 0) / 100 * .03, denue = clamp(denueRaw, -.08, .08);
    const physicalRaw = (data.visibility - 3) * .025 + (data.parking - 3) * .02 + (data.internalLocation - 3) * .025 + (data.physicalState - 3) * .03;
    const physical = clamp(physicalRaw, -.10, .10);
    const suggestedM2 = rbComp * (1 + hist) * (1 + denue + physical), target = suggestedM2 * data.area;
    // The displayed margin is the full spread as a percentage of the target, split equally.
    const margin = clamp(Number(data.negotiationMargin ?? 17), 0, 100) / 100;
    return { reason, inflationApplied, histRaw, hist, densityEffect, denueRaw, denue, physicalRaw, physical, suggestedM2, target, floor: target * (1 - margin / 2), publication: target * (1 + margin / 2) };
  }
  const api = { calculate, recent, validDate, today, categories };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.rpVacancyRentModel = api;
})(typeof window === 'undefined' ? globalThis : window);
