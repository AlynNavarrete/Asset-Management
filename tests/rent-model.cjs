const assert = require('node:assert/strict');
const { calculate, recent, validDate } = require('../vacancy-rent-model.js');
const now = new Date(2026, 8, 22);
const base = { comp1: 100, comp2: 200, comp3: 300, compDate1: '2026-01-01', compDate2: '2026-09-01', compDate3: '2026-09-22', inflation: 8, exitReason: 'Normal', localDensity: 20, cityAverage: 20, saturation: 50, visibility: 3, parking: 3, internalLocation: 3, physicalState: 3, area: 100, negotiationMargin: 20 };
assert.equal(calculate(base, now).inflationApplied, 0);
assert(Math.abs(calculate({ ...base, compDate2: '2025-01-01' }, now).inflationApplied - .08) < 1e-10);
assert.equal(calculate({ ...base, compDate1: '2025-01-01' }, now).inflationApplied, 0);
assert(!recent('2026-12-01', now));
assert(!validDate('2026-02-30'));
assert(!recent('', now));
for (const margin of [0, 17, 100]) {
  const r = calculate({ ...base, negotiationMargin: margin }, now);
  assert(Math.abs((r.publication - r.floor) / r.target * 100 - margin) < 1e-9);
  assert(r.floor <= r.target && r.target <= r.publication);
}
const adjusted = calculate({ ...base, compDate1: '', compDate2: '', compDate3: '', inflation: 90, visibility: 5, parking: 5, internalLocation: 5, physicalState: 5 }, now);
assert.equal(adjusted.hist, .1); assert.equal(adjusted.physical, .1);
assert(Math.abs(200 + 200 * adjusted.hist + 200 * (1 + adjusted.hist) * (adjusted.denue + adjusted.physical) - adjusted.suggestedM2) < 1e-9);
assert.equal(calculate({ ...base, localDensity: 0, cityAverage: 0, saturation: null }, now).denue, 0);
console.log('PASS invoice-year protection, mixed dates, bounds, monetary reconciliation and negotiation spread');
const vm = require('node:vm'), fs = require('node:fs');
const context = { window: { addEventListener() {} } };
vm.runInNewContext(fs.readFileSync(require.resolve('../rent-calculation-store.js'), 'utf8'), context);
const fingerprint = context.window.rpRentCalculations.fingerprint;
assert.equal(fingerprint({ inputs: { marketCounts: { food: 2, health: 3 } } }), fingerprint({ inputs: { marketCounts: { health: 3, food: 2 } } }));
assert.notEqual(fingerprint({ inputs: { marketCounts: { food: 2 } } }), fingerprint({ inputs: { marketCounts: { food: 3 } } }));
assert.equal(fingerprint({ inputs: { inflation: 2 }, outputs: { target: 100 } }), JSON.stringify([[['inflation', '2']], [['target', '100']]]));
console.log('PASS approval detects changes in per-business counts and preserves legacy scalar fingerprints');
