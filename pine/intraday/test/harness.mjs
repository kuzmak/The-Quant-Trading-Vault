// Logic harness for the five intraday ports.
// Runs each script on synthetic NQ-like 5m/30m bars (real Globex hours, New York DST) in the open-source
// piner Pine v6 engine and checks behaviour: entry windows, flat by the close, trades per day, stop/target
// levels, stop-and-reverse. Synthetic data => this verifies logic only, never performance.
// Usage: npm install && npm test
import { compile, Engine, ArrayFeed } from '@heyphat/piner';
import fs from 'fs';

const DIR = new URL('../', import.meta.url).pathname;
// piner fixes syminfo.pointvalue at 1, so $ amounts below are price points x 1.
const TICK = 0.25, PV = 1;

// ---------- New York time helpers ----------
const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' });
function ny(ms) { const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hm: +p.hour * 60 + +p.minute, wd: p.weekday, str: `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}` }; }
function nyToUtc(dateStr, h, m) { // brute-force offset (handles DST)
  for (const off of [4, 5]) { const t = Date.UTC(+dateStr.slice(0,4), +dateStr.slice(5,7)-1, +dateStr.slice(8,10), h + off, m);
    const n = ny(t); if (n.date === dateStr && n.hm === h*60+m) return t; } throw new Error('tz'); }

// ---------- Synthetic Globex 5m bars (Sun 18:00 ET -> Fri 17:00 ET, daily break 17:00-18:00 ET) ----------
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2**32;
const gauss = () => Math.sqrt(-2*Math.log(rnd()+1e-12)) * Math.cos(2*Math.PI*rnd());
const rt = x => Math.round(x / TICK) * TICK;

function genBars(startDate, days, stepMin) {
  const bars = []; let px = 17000; let d = new Date(startDate + 'T12:00:00Z');
  for (let i = 0; i < days; i++, d = new Date(d.getTime() + 86400000)) {
    const ds = d.toISOString().slice(0,10); const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue;           // trading days Mon-Fri
    const prev = new Date(d.getTime() - 86400000).toISOString().slice(0,10);
    const sessStart = nyToUtc(prev, 18, 0), sessEnd = nyToUtc(ds, 17, 0);
    const drift = gauss() * 0.004 / 276;            // per-bar trend component (some trend days)
    px = rt(px * (1 + gauss() * 0.002));            // small gap at the Globex open
    for (let t = sessStart; t < sessEnd; t += stepMin * 60000) {
      const hm = ny(t).hm; const rth = hm >= 570 && hm < 960;
      const vol = (rth ? (hm < 630 || hm >= 930 ? 0.0016 : 0.0009) : 0.0004) * Math.sqrt(stepMin / 5);
      const o = px; const c = rt(o * (1 + drift * stepMin / 5 + gauss() * vol));
      const h = rt(Math.max(o, c) + Math.abs(gauss()) * vol * o * 0.5);
      const l = rt(Math.min(o, c) - Math.abs(gauss()) * vol * o * 0.5);
      bars.push({ time: t, open: o, high: h, low: l, close: c, volume: 1000 }); px = c;
    }
  }
  return bars;
}
function aggregateDaily(bars) { // one bar per Globex session, time = session open (18:00 ET prior evening)
  const out = []; let cur = null;
  for (const b of bars) { const n = ny(b.time); const key = n.hm >= 18*60 ? 'next-of-' + n.date : n.date;
    if (!cur || cur.key !== key) { if (cur) out.push(cur.bar); cur = { key, bar: { ...b } }; }
    else { cur.bar.high = Math.max(cur.bar.high, b.high); cur.bar.low = Math.min(cur.bar.low, b.low); cur.bar.close = b.close; } }
  if (cur) out.push(cur.bar); return out;
}

// ---------- Runner ----------
async function run(file, bars, tf, inputs = {}) {
  const compiled = compile(fs.readFileSync(DIR + file, 'utf8'));
  const engine = new Engine(compiled, new ArrayFeed(bars), { inputs });
  const daily = aggregateDaily(bars);
  for (const k of ['NQ@D', 'NQ@1D', 'CME_MINI:NQ@D', 'CME_MINI:NQ@1D']) engine.ctx.securityBars.set(k, daily);
  await engine.run({ symbol: 'NQ', timeframe: tf, mintick: TICK });
  return { trades: engine.strategy.closedTrades, report: engine.strategy };
}

const results = []; let failures = 0;
const sameBar = t => t.entryBar === t.exitBar;
function check(name, cond, detail) { if (!cond) { failures++; console.log(`   FAIL ${name}: ${detail}`); } }
function common(label, trades, { entryFrom, entryTo, flat = 955, maxPerDay }) {
  check(label + ' trades>0', trades.length > 0, 'no trades generated');
  const perDay = {}; let ocaArtifacts = 0; let prev = null;
  for (const t of trades) {
    // An opposite entry filling on the very bar of the first fill = both bracket legs triggered intrabar.
    // TradingView's OCA cancels the second leg intrabar; piner only processes the cancel at bar close.
    if (prev && ny(prev.entryTime).date === ny(t.entryTime).date && t.entryBar === prev.exitBar && prev.entryBar === prev.exitBar && t.dir !== prev.dir && maxPerDay === 1) { ocaArtifacts++; prev = t; continue; }
    prev = t;
    const e = ny(t.entryTime), x = ny(t.exitTime);
    perDay[e.date] = (perDay[e.date] || 0) + 1;
    check(label + ' entry window', e.hm >= entryFrom && e.hm <= entryTo, `entry ${e.str}`);
    check(label + ' same-day exit', x.date === e.date, `entry ${e.str} exit ${x.str}`);
    check(label + ' flat by close', x.hm <= flat, `exit ${x.str}`);
  }
  const mx = Math.max(0, ...Object.values(perDay));
  check(label + ' max trades/day', mx <= maxPerDay, `max ${mx} > ${maxPerDay}`);
  const net = trades.reduce((s, t) => s + t.profit, 0);
  const sb = trades.filter(sameBar).length;
  if (ocaArtifacts) console.log(`   note: ${ocaArtifacts} same-bar OCA double-fill(s) skipped (piner limitation, see harness comment)`);
  console.log(`   ${trades.length} trades over ${Object.keys(perDay).length} days, max/day ${mx}, same-bar in/out ${sb}, net ${net.toFixed(0)} pts (synthetic data, logic check only)`);
}

const bars5 = genBars('2024-01-02', 182, 5);
const bars30 = genBars('2024-01-02', 182, 30);
console.log(`bars: ${bars5.length} x 5m, ${bars30.length} x 30m; DST change inside range (2024-03-10)`);

// Opening range from the 5m bars, per NY date (for exact level checks).
function rangeOf(bars, date, fromHm, toHm) { let h = -Infinity, l = Infinity;
  for (const b of bars) { const n = ny(b.time); if (n.date === date && n.hm >= fromHm && n.hm < toHm) { h = Math.max(h, b.high); l = Math.min(l, b.low); } }
  return { h, l }; }

{ console.log('01 Opening Range Breakout'); const { trades } = await run('01_opening_range_breakout.pine', bars5, '5');
  common('01', trades, { entryFrom: 570 + 15, entryTo: 720, maxPerDay: 1 });
  for (const t of trades) { const d = ny(t.entryTime).date; const r = rangeOf(bars5, d, 570, 585);
    const lvl = t.dir > 0 ? r.h + TICK : r.l - TICK;
    const ok = t.dir > 0 ? t.entryPrice >= lvl - 1e-9 : t.entryPrice <= lvl + 1e-9;   // stop fill at/through level (+slippage)
    check('01 entry at range level', ok, `${d} dir ${t.dir} entry ${t.entryPrice} level ${lvl}`);
    const mid = rt((r.h + r.l) / 2); const x = ny(t.exitTime);
    if (!sameBar(t) && x.hm < 955 && t.profit < 0) check('01 stop at midpoint', Math.abs(t.exitPrice - mid) <= 2 * TICK, `${d} exit ${t.exitPrice} mid ${mid}`);
    if (!sameBar(t) && x.hm < 955 && t.profit > 0) { const tgt = t.dir > 0 ? lvl + 3 * (lvl - mid) : lvl - 3 * (mid - lvl);
      check('01 target at 3R', Math.abs(t.exitPrice - tgt) <= 2 * TICK, `${d} exit ${t.exitPrice} target ${tgt}`); }
  } }

{ console.log('02 ADX Compression Breakout (30m)'); const { trades } = await run('02_adx_compression_breakout.pine', bars30, '30', { 'Stop ($ per contract)': 50 });
  common('02', trades, { entryFrom: 570, entryTo: 930, maxPerDay: 3 });
  for (const t of trades) if (!sameBar(t) && t.profit < 0 && ny(t.exitTime).hm < 930)
    check('02 stop = 50 points', Math.abs((t.entryPrice - t.exitPrice) * t.dir * PV - 50) <= 2 * TICK * PV, `loss pts ${(t.entryPrice - t.exitPrice) * t.dir}`); }

{ console.log('03 First Candle Breakout (close mode)'); const { trades } = await run('03_first_candle_breakout_trailing.pine', bars5, '5');
  common('03', trades, { entryFrom: 575, entryTo: 900, maxPerDay: 1 });
  console.log('03 First Candle Breakout (stop-order mode)'); const r2 = await run('03_first_candle_breakout_trailing.pine', bars5, '5', { 'Entry': 'Stop order at candle high/low' });
  common('03s', r2.trades, { entryFrom: 575, entryTo: 900, maxPerDay: 1 }); }

{ console.log('04 Dual Thrust (5m, RTH anchor)'); const { trades } = await run('04_dual_thrust_intraday.pine', bars5, '5');
  common('04', trades, { entryFrom: 570, entryTo: 930, maxPerDay: 2 });
  console.log('04 Dual Thrust (max 1 entry, hard stop 0.25x)'); const r2 = await run('04_dual_thrust_intraday.pine', bars5, '5', { 'Max entries per day': 1, 'Hard stop (x range, 0 = off)': 0.25 });
  common('04b', r2.trades, { entryFrom: 570, entryTo: 930, maxPerDay: 1 });
  console.log('04 Dual Thrust (narrow bands K=0.15, max 3 entries -> exercises stop-and-reverse)');
  const r3 = await run('04_dual_thrust_intraday.pine', bars5, '5', { 'K1 (upper)': 0.15, 'K2 (lower)': 0.15, 'Max entries per day': 3 });
  common('04c', r3.trades, { entryFrom: 570, entryTo: 930, maxPerDay: 3 });
  const rev = r3.trades.filter((t, i, a) => i > 0 && t.entryBar === a[i-1].exitBar && t.dir !== a[i-1].dir).length;
  check('04c reversals happen', rev > 0, 'no stop-and-reverse observed'); console.log(`   reversals: ${rev}`);
  console.log('04 Dual Thrust (Globex daily-open anchor)');
  const r4 = await run('04_dual_thrust_intraday.pine', bars5, '5', { 'Open anchor': 'Daily bar open (Globex)' });
  common('04d', r4.trades, { entryFrom: 570, entryTo: 930, maxPerDay: 2 }); }

{ console.log('05 ORB Retest (limit)'); const { trades } = await run('05_orb_retest_limit.pine', bars5, '5');
  common('05', trades, { entryFrom: 575, entryTo: 720, maxPerDay: 1 });
  for (const t of trades) { const d = ny(t.entryTime).date; const r = rangeOf(bars5, d, 570, 575);
    const lvl = t.dir > 0 ? r.h : r.l; const opp = t.dir > 0 ? r.l : r.h; const x = ny(t.exitTime);
    if (!sameBar(t) && x.hm < 955 && t.profit < 0) check('05 stop at opposite edge', Math.abs(t.exitPrice - opp) <= 2 * TICK, `${d} exit ${t.exitPrice} opp ${opp}`);
    if (!sameBar(t) && x.hm < 955 && t.profit > 0) check('05 target at 2R', Math.abs(t.exitPrice - (lvl + 2 * (lvl - opp))) <= 2 * TICK, `${d} exit ${t.exitPrice}`);
    check('05 limit fill at edge', t.dir > 0 ? t.entryPrice <= lvl + 1e-9 : t.entryPrice >= lvl - 1e-9, `${d} entry ${t.entryPrice} edge ${lvl}`); }
  console.log('05 ORB Retest (market on confirmation)'); const r2 = await run('05_orb_retest_limit.pine', bars5, '5', { 'Entry': 'Market on confirmation' });
  common('05m', r2.trades, { entryFrom: 575, entryTo: 720, maxPerDay: 1 }); }

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
