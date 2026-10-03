# Intraday CME Futures Strategies: Pine Script v6 Ports

These are Pine Script v6 rewrites of the five intraday strategies picked out in [`FUTURES_STRATEGY_RANKING.md`](../../FUTURES_STRATEGY_RANKING.md). Every known bug from the originals is fixed, and each script is set up for CME futures. They are all `strategy()` scripts and run standalone; no library import is needed.

| # | Script | Original spec | Markets / bars | Core rule |
|---|---|---|---|---|
| 1 | [`01_opening_range_breakout.pine`](01_opening_range_breakout.pine) | [Dynamic ORB](../../strategies/Dynamic-Opening-Range-Breakout-High-Frequency-Trading-Strategy.md) | NQ, ES, RTY · 1–5m | 09:30–09:45 ET range; bracketed stop entries 1 tick beyond it until 12:00; stop at the range midpoint (or the opposite side); 3R target; one trade per day |
| 2 | [`02_adx_compression_breakout.pine`](02_adx_compression_breakout.pine) | [ADX Breakout](../../strategies/ADX-Trend-Breakout-Momentum-Trading-Strategy.md) | NQ, ES · 30m | New 34-bar closing high while ADX(50,14) < 17.5 → buy-stop 1 tick above; $1,000 (or ATR) stop; ≤ 3 trades per day; long-only by default |
| 3 | [`03_first_candle_breakout_trailing.pine`](03_first_candle_breakout_trailing.pine) | [First Candle + Trailing](../../strategies/First-Candle-Breakout-Dynamic-Trailing-Stop-EOD-Close-Strategy.md) | NQ, ES (CL, GC from their pit opens) · 1–5m | First 5-minute candle after the open; the first close beyond it enters (or a stop-order mode); trailing stop 1.5 × the candle's range; one trade per day |
| 4 | [`04_dual_thrust_intraday.pine`](04_dual_thrust_intraday.pine) | [Dual Thrust (MyLanguage)](../../strategies/Dual-Thrust-MyLanguage-version.md) | CL, GC, NQ, ES · 5–15m | Range = max(HH−LC, HC−LL) over the prior 4 days; bands = open ± 0.5 × range; stop-and-reverse, capped by a maximum number of entries per day |
| 5 | [`05_orb_retest_limit.pine`](05_orb_retest_limit.pine) | [MTF ORB Limit Entry](../../strategies/Multi-Timeframe-Opening-Range-Breakout-Strategy-with-Limit-Entry-and-Automated-Risk-Management.md) | NQ, ES · 1–5m | 09:30–09:35 ET range; the first bar fully outside it sets the direction; limit entry on the retest of the range edge; stop at the opposite edge; 2R target |

Each file starts with a header comment that lists every fix made to its original.

## Using them in TradingView

1. Open the Pine Editor, paste a script, then **Save** and **Add to chart**.
2. Use a continuous futures chart, for example `CME_MINI:NQ1!`, `CME_MINI:ES1!`, `NYMEX:CL1!` or `COMEX:GC1!`, on the bar size listed above. The scripts stop with a clear error on a daily chart, or when the bar size is longer than the opening range or first candle.
3. **All times are New York time** and handle daylight-saving changes on their own. The chart can show either regular-hours or extended-hours bars; the scripts read the clock, not the chart's session setting.
4. In **Properties**, check the defaults against your broker:
   - $2.50 per contract per side commission
   - 1 tick slippage
   - fixed 1-contract sizing
   - Turn on **Bar Magnifier** if your plan includes it. It makes stop and limit fills inside a bar more realistic.
5. For alerts, create a strategy alert with the message `{{strategy.order.alert_message}}`. Every entry and the end-of-day flatten carry a descriptive message.

## Conventions shared by all five scripts

- **Flat every day.** On the last bar that ends at or before *Flatten at* (default 15:55 ET), the script cancels all working orders and exits at the next open. On 5-minute bars that exit happens at 15:55; on 30-minute bars it happens at 15:30. The script never holds a position overnight, whatever the bar size.
- **Real orders.** Entries are resting stop or limit orders, except where an input chooses a market entry on confirmation.
- **Stops are live from the fill bar.** Stops and targets are attached before the entry fills, then re-sent every bar while the position is open.
- **No dependence on OCA alone.** Where both sides are bracketed, the opposite entry is also cancelled explicitly once a position exists.
- **No repainting.** Daily data comes from the `request.security(..., expr[1], lookahead = barmerge.lookahead_on)` pattern, which only reads completed days. Dual Thrust also uses the current day's `open`, which is known at the start of the day.
- **Sizing.** You can trade a *Fixed contracts* count, or use *Risk per trade ($)*. Risk mode computes contracts as ⌊risk ÷ (stop distance × point value)⌋, capped by *Max contracts*. If not even one contract fits the risk budget, the trade is skipped.
- **Margin checks are off.** `margin_long` and `margin_short` are set to 0 because v6's default of 100% would trigger false margin calls on futures. Control exposure with the sizing inputs instead.
- **Style.** The code follows TradingView's [style guide](https://www.tradingview.com/pine-script-docs/writing/style-guide/):
  - constants, then grouped inputs with tooltips, then documented functions, calculations, orders and visuals
  - `camelCase` names, `SNAKE_CASE` constants, and the `…Input` suffix on input variables
  - every `ta.*` call made in global scope
  - no v5-only syntax, such as `when=`, implicit bool casts, or `na` bools

## What was verified, and what was not

- **Static checks.** All five scripts pass the [`pinescript-v6-validator`](https://www.npmjs.com/package/pinescript-v6-validator), which finds 0 errors and 0 warnings, and they compile in [`@heyphat/piner`](https://www.npmjs.com/package/@heyphat/piner), an independent open-source Pine v6 engine.
- **Logic checks.** [`test/harness.mjs`](test/harness.mjs) runs every script, plus the alternative input modes, in piner on **synthetic** NQ-style 5-minute and 30-minute bars. The bars use real Globex hours and cross a DST change. The harness asserts:
  - entries happen only inside the trading window
  - every position is flat by the flatten time on the same day
  - daily trade limits hold
  - ORB stop and target fills land at the range midpoint and at 3R
  - ORB-retest limit fills, stops and targets land at the range edges
  - the ADX stop distance matches the setting
  - Dual Thrust stop-and-reverse actually happens

  To run it: `cd test && npm install && npm test`.
- **Two piner limitations** are reported separately by the harness, not counted as failures. TradingView handles both correctly:
  1. When an entry and an attached exit fill on the *same* bar, piner checks the exit against the bar's open, ignoring that the entry filled later in the bar.
  2. When both legs of a bracket trigger inside one wide bar, piner only applies the OCA cancel at the bar's close.
- **Not done:**
  - **None of the scripts has been compiled in TradingView itself.** No offline tool fully reproduces its compiler, so open each one in the Pine Editor first.
  - **No performance claims.** The synthetic data proves the mechanics work, not that the strategies have an edge. Backtest on at least 2 years of real NQ/ES data, then walk-forward the session times and R multiples, before trading.
