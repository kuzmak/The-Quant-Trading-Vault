# Top 20 Strategies for CME Futures (NQ / ES / YM / RTY / CL / GC / FX)

An audit of the 5,806 strategy specs in [`strategies/`](strategies/), ranked by how promising they are for **CME futures**: the equity index contracts, crude oil, gold, and FX futures (6E, 6J, 6B and others).

## How the ranking was produced

1. **Every file was parsed with a script**: language, code size, backtest header, use of `security()`/`lookahead_on`, stops, pyramiding, martingale, number of inputs and so on.
2. **Files that cannot apply to futures were removed.**
   - Crypto-only mechanics: funding-rate and cross-exchange arbitrage, perpetual grids, market making, exchange utilities.
   - Non-strategies: tutorials, templates, plug-ins, DCA bots, martingale and "gambler" systems.
   - Files with explicit `lookahead_on`.
3. **About 130 candidates were short-listed.** These are files whose logic matches edges with published evidence in futures:
   - short-term mean reversion in equity indices (IBS, RSI(2), Double Seven, 3-day pullbacks)
   - opening-range breakout
   - time-series trend following (Donchian/Turtle) for commodities and FX
   - classic CTA intraday volatility breakouts (Dual Thrust, R-Breaker)
   - calendar and seasonal effects
   - intraday VWAP setups
   - files that name ES/NQ/CL/GC/FX directly
4. **Every short-listed file was read in full, including its code.** Each was scored 0–10 on:
   - **Edge**: is there a real, documented reason it should work?
   - **Futures fit**: does it suit these contracts, their sessions and their rolls?
   - **Code integrity**: look-ahead, repainting, bugs, unrealistic fills.
   - **Robustness**: number of parameters, exits and stops.
5. **The top candidates were re-checked by hand.**

> **Important caveat:** no file in the vault was ever backtested on futures. Every backtest header points at Binance or OKX crypto data, and the descriptions are auto-generated marketing text. Ignore their claims. The ranking below rests on **edge plausibility plus code quality, not on any performance numbers.** Re-test every strategy on back-adjusted continuous contracts with realistic commissions and slippage before trading it.

---

## The ranking at a glance

| # | Strategy | Family | Best markets / TF | Score | Ready? |
|---|---|---|---|---|---|
| 1 | [Double Seven (Connors)](strategies/Double-Seven-Strategy-Trend-Following-and-Mean-Reversion-Dual-Optimization-Trading-SystemDouble-Seven-Strategy.md) | Index mean reversion | ES, NQ, YM · daily | 7.5 | ✅ as-is (add stop) |
| 2 | [IBS + Weekly High SP500 Futures](strategies/IBS-and-Weekly-High-Based-SP500-Futures-Trading-Strategy.md) | Index mean reversion | ES, NQ, RTY · daily | 7.5 | ✅ minor fill fix |
| 3 | [Dynamic Opening Range Breakout](strategies/Dynamic-Opening-Range-Breakout-High-Frequency-Trading-Strategy.md) | Intraday ORB | NQ, ES, RTY · 1–5m | 7 | 🔧 one bug |
| 4 | [Donchian Channels Long-Term Trend](strategies/Donchian-Channels-Long-Term-Trend-Following-Strategy.md) | Trend following | CL, GC, 6E, 6J · daily | 7 | ✅ add sizing |
| 5 | [MyLanguage Turtle (full system)](strategies/MyLanguage-Turtle-Strategy-Experience.md) | Trend following | CL, GC, 6E, 6J, 6B · daily | 7 | ✅ add sizing |
| 6 | [RSI(2) with MA Filter](strategies/RSI2-Based-Dynamic-Breakout-Trading-Strategy-with-Moving-Average-Filter-System.md) | Index mean reversion | ES, NQ, YM · daily | 7 | ✅ add stop |
| 7 | [3-Day Reversion (Connors)](strategies/Turtle-Trading-3-Day-Reversion-Strategy.md) | Index mean reversion | ES, NQ, YM, RTY · daily | 7 | ✅ add stop |
| 8 | [Cumulative RSI (Connors)](strategies/Cumulative-RSI-Breakout-Strategy.md) | Index mean reversion | ES, NQ · daily | 6.5 | ✅ fix sizing |
| 9 | [IBS Trend Reversal (SPY/NDX)](strategies/Internal-Bar-Strength-Trend-Reversal-Trading-System.md) | Index mean reversion | ES, NQ, RTY · daily | 6.5 | 🔧 lag fix |
| 10 | [Connors RSI + 200/5 MA](strategies/Connors-Dual-Moving-Average-RSI-Reversal-Trading-Strategy.md) | Index mean reversion | ES, NQ, YM, RTY · daily | 6.5 | 🔧 one-line fix |
| 11 | [Donchian Breakout + ATR Trailing Stop](strategies/Donchian-Channel-Breakout-Strategy-with-ATRSL-Trailing-Stop.md) | Trend following | GC, CL, NQ · daily | 6.5 | ✅ add short side |
| 12 | [ADX Compression Breakout](strategies/ADX-Trend-Breakout-Momentum-Trading-Strategy.md) | Intraday breakout | NQ, ES · 30m | 6 | 🔧 small fixes |
| 13 | [Dual Thrust (MyLanguage)](strategies/Dual-Thrust-MyLanguage-version.md) | CTA volatility breakout | CL, GC, NQ, ES · intraday | 6 | 🔧 session flat |
| 14 | [Kevin Davey Crude Oil Strategy](strategies/Crude-Oil-ADX-Trend-Following-Strategy.md) | Momentum | CL · daily / 60m | 6 | 🔧 small fixes |
| 15 | [First-Candle Breakout + Trailing + EOD](strategies/First-Candle-Breakout-Dynamic-Trailing-Stop-EOD-Close-Strategy.md) | Intraday ORB | NQ, ES (CL) · 5m | 6 | 🔧 time fixes |
| 16 | [MTF Opening Range Breakout (limit entry)](strategies/Multi-Timeframe-Opening-Range-Breakout-Strategy-with-Limit-Entry-and-Automated-Risk-Management.md) | Intraday ORB | NQ, ES · 1–5m | 5.5 | 🔧 several fixes |
| 17 | [Connecticut Turtle](strategies/Connecticut-Turtle-System.md) | Trend following | CL, GC, 6E, 6J · daily | 5.5 | 🔧 state bug |
| 18 | [S&P 500 Hybrid Seasonal (Katsanos)](strategies/SP500-Hybrid-Seasonal-Trading-Strategy.md) | Seasonality overlay | ES, MES, YM · daily | 5.5 | ✅ as overlay |
| 19 | [Bollinger Breakout with risk sizing ("MCL-YG")](strategies/MCL-YG-Bollinger-Band-Breakout-Pair-Trading-Strategy.md) | Trend / vol breakout | CL/MCL, GC/MGC, 6E · daily | 5.5 | 🔧 widen bands |
| 20 | [Eight-Day Extended Run (Raschke)](strategies/Eight-Day-Extended-Run-Strategy.md) | Short-term reversal | ES, ZN, GC · daily | 5 | ✅ add stop |

**Ready?** ✅ means the logic is sound and only needs risk and sizing work. 🔧 means there are specific bugs to fix first; each is described below.

---

## Detailed rationale

### Family A: Short-term mean reversion on equity index futures (ES/NQ/YM/RTY, daily bars)

US equity indices have one of the best-documented short-term edges anywhere: buy a short pullback inside a long-term uptrend and sell into the bounce. The supporting work is by Connors/Alvarez, Pagonidis on IBS, and a large practitioner literature. The edge is concentrated on the **long side**, because indices have positive drift and their selloffs come back quickly.

Strategies 1, 2 and 6–10 all trade this one effect. They are highly correlated with each other, so pick one or two rather than stacking all seven.

**1. Double Seven: the cleanest file in the vault for ES/NQ.**
- **Rules:** go long when close > SMA(200) and close is at a 7-day closing low; exit at a 7-day closing high.
- **Why it ranks first:**
  - Two parameters, both canonical.
  - Signals come from confirmed closes and fill at the next open, so there is no look-ahead.
  - The code matches the published Connors rules exactly, so there is nothing hidden and nothing to fit.
- **Needs:**
  - A disaster stop or a time stop of about 10 days. Without one, a 2008, 2020 or 2022-style slide is held all the way down.
  - Volatility-based contract sizing (MES/MNQ make that practical).
  - Back-adjusted continuous data.

**2. IBS + Weekly High (Hobbiecode).**
- **Rules:** on Monday, if close < Friday's close and IBS < 0.5, go long. Exit on close > prior high, or after 4–5 bars.
- **Why it ranks high:**
  - It was written for S&P 500 futures.
  - IBS (close position within the day's range) is one of the most robust index mean-reversion signals.
  - `request.security("W", close[1])` only uses confirmed data.
  - It has a time stop built in.
- **Needs:**
  - `process_orders_on_close=true` or market-on-close execution. As written it fills at Tuesday's open, which gives up part of the edge.
  - RTH-session daily bars.
  - A catastrophe stop.
  - A test across the other days of the week, so you know whether the Monday filter adds anything.

**6. RSI(2) with MA filter.**
- **Rules:** after RSI(2) < 25, wait for RSI(2) to turn up while close is above SMA(50), then hold for a fixed 5 bars.
- **Strengths:** Connors RSI(2) is a classic edge and the code is clean.
- **Weaknesses:**
  - Waiting for RSI to turn up gives up some of the edge.
  - The exit is time-only.
- **Needs:** the classic "close > SMA(5)" exit, a disaster stop, and a comparison of SMA(200) against SMA(50) as the filter.

**7. Connors 3-Day Reversion.**
- **Rules:** three consecutive lower highs and lower lows, with close below EMA(5) and above EMA(200). Exit when close crosses above EMA(5).
- **Strengths:** a faithful Connors ETF rule, and `process_orders_on_close` gives a realistic MOC-style fill.
- **Weaknesses:**
  - Trades are rare (a handful per year per market), so trade all four index contracts to get a sample.
  - It has no stop.
  - The date-range inputs are dead code.

**8. Cumulative RSI.**
- **Rules:** buy when the 3-bar sum of RSI(3) recovers above 60 (on a 0–300 scale); exit above 282.
- **Strengths:** a legitimate Connors variant. It also includes commission and slippage, which few files in the vault do.
- **Weaknesses:**
  - The input labels are swapped ("Oversold" sets the exit).
  - Default sizing is 110% of equity, and there is no stop.
- **Needs:** fixed contract sizing and a time stop.

**9. IBS Trend Reversal (SPY/NDX).**
- **Rules:** long when IBS < 0.09 and close is above EMA(220), with a 14-bar time stop.
- **Strengths:** the edge is real and the code has a time stop.
- **Weaknesses:**
  - The **IBS is computed from the previous bar** (`close[1]`, `high[1]`, `low[1]`) and fills at the next open. That enters about 1.5 days after the signal close, when most of the IBS edge is realised on the very next day.
  - The short side at IBS > 0.985 is unvalidated for indices, and `pyramiding=2`.
- **Fix:** use the current bar's IBS with `process_orders_on_close=true`, go long-only, and exit when IBS > 0.8.

**10. Connors RSI + 200/5 MA.**
- **Rules:** this is the textbook Connors setup. Buy RSI(2) < 5 above SMA(200), exit on close > SMA(5).
- **Critical bug:** the stop test is inverted. `if (exitLongCondition or close >= stopLossLevelLong)` closes every long on the bar after entry, and the short side has the mirror bug.
- **Fix:** change `>=` to `<=` for longs and `<=` to `>=` for shorts, and make it long-only. After that it is arguably the best-documented rule set in this family. It ranks 10th only because it is broken as shipped.

### Family B: Opening-range breakout on index futures (NQ/ES/RTY, 1–5m)

Opening-range breakout (ORB) is the strongest intraday edge with published support for index futures; see for example Zarattini & Aziz's 5-minute ORB studies on QQQ/NQ. Nasdaq (NQ) works best because its intraday trends persist.

**3. Dynamic Opening Range Breakout.**
- **Rules:** the opening range is 9:30–9:45 ET, anchored with `America/New_York`, so it is DST-safe and CME-correct. It takes one trade a day before noon, with the stop at the range midpoint and a 3R target, and goes flat at 16:00.
- **Why it ranks high:** this is the most futures-native intraday file in the vault.
- **Bug:** the target `limit = strategy.position_avg_price + targetSize` is set on the signal bar. The strategy is still flat at that point, so the average price is `na` and **the take-profit is never placed**. Compute it from `orHigh`/`orLow` instead.
- **Also:** drop the hard-coded Monday/Thursday exclusion, which looks curve-fit. Consider adding a volatility filter, such as trading only when the range is above X% of ATR.

**15. First-Candle Breakout + Trailing Stop + EOD Close.**
- **Strengths:** the same idea as #3, with one trade a day, a trailing stop sized from the range and a flat at end of day.
- **Bugs:**
  - `hour > startHour` blocks all entries until 10:00, which loses the best part of the window.
  - The EOD exit requires an exact `hour == endHour and minute == endMinute` bar.
  - The stops are evaluated on close instead of being resting orders.
  - The defaults are NSE India hours.

**16. Multi-Timeframe ORB with limit entry.**
- **Strengths:** it uses the published 5-minute NQ ORB structure, with the stop at the opposite side of the range.
- **Bugs:**
  - The "range" is only the first bar (`openingHigh := na(openingHigh) ? high : openingHigh` never takes the max).
  - Unfilled limit orders are never cancelled.
  - The EOD exit needs an exact `time_close`.
- **Design flaw:** limit entries on a retest suffer adverse selection, because they mostly fill on failed breakouts. Compare against a stop-entry version.

**12. ADX Compression Breakout.**
- **Rules:** buy a 34-bar closing high while ADX < 17.5 (a breakout from compression), using a buy-stop one tick above. Stop is $1,000 computed via `syminfo.pointvalue`, maximum three trades a day, flat at the end of the session.
- **Why it ranks here:** it is one of the few files actually written for CME contract specs.
- **Fixes:**
  - The stop is only placed on the bar after the fill, so the fill bar has no stop.
  - The trade counter counts orders, not fills.
  - The session string `0730-1430` is in exchange time (CT) and cuts off the last 30 minutes of RTH.
- **Needs:** a profit target or trailing exit, and out-of-sample tests on RTY and YM.

### Family C: Time-series trend following (CL, GC, FX futures; daily bars)

Trend following in commodity and currency futures is the edge behind the managed-futures (CTA) industry, with more than a century of supporting evidence (Hurst, Ooi & Pedersen; Moskowitz, Ooi & Pedersen). Two cautions:
- **It only works as a diversified portfolio.** On a single market the Sharpe ratio is thin and drawdowns are long.
- **It is weak on equity indices**, which tend to mean-revert at short horizons.

**4. Donchian Channels Long-Term Trend.**
- **Rules:** enter on a close beyond the prior 20-bar high or low (`highest(high,20)[1]`, so no leak). Exit at the 40-bar channel midline. Fully symmetric long/short, with two parameters.
- **Why it ranks high:** clean, textbook and bias-free.
- **Needs:** ATR (N) position sizing, back-adjusted continuous contracts, and a basket of at least CL, GC, 6E, 6J, ZN and ES rather than one market.

**5. MyLanguage Turtle (full system).**
- **Rules:** a faithful implementation of the Turtle rules. 20- and 55-bar breakouts, unit size = 1% of equity ÷ ATR, adds every 0.5 ATR up to 4 units, a 2 ATR stop, a 10-bar exit, and the "skip after a winner" filter.
- **Why it ranks high:**
  - `HV()` excludes the current bar, so there is no look-ahead.
  - It was written for commodity futures (CTP), so it ports to CME almost directly.
- **Needs:**
  - Remove the crypto `ZOOM` hack.
  - Add a portfolio heat cap.
  - The 55-bar system should exit on 20 bars, not 10.
- A simpler sibling, [M-Language-Turtle V1.0](strategies/M-Language-Turtle-Trading-strategy-implementationsV-10.md), uses the same structure.

**11. Donchian Breakout + ATR Trailing Stop.**
- **Rules:** a 100-bar Donchian breakout (using the prior channel, so no leak) with a 3×ATR(10) trailing stop; four parameters.
- **Strengths:** robust structure and clean code.
- **Weakness:** long-only.
- **Needs:** the mirrored short side for CL and FX, and volatility sizing. As written it is reasonable for long-only GC and NQ.

**14. Kevin Davey's free crude oil strategy.**
- **Rules:** go long or short when 65-bar momentum crosses zero. Reverses on the opposite signal, with a fixed $4,500 target and $3,000 stop per CL contract (450 and 300 ticks).
- **Strengths:** published by a well-known futures system developer specifically for CL.
- **Fixes:**
  - `calc_on_every_tick=true` causes real-time repainting.
  - The `adx > 10` filter is almost always true, so it does nothing.
  - The tick-based stops only make sense on CL; use ATR multiples elsewhere.

**17. Connecticut Turtle.**
- **Strengths:** a 20/55-day Turtle with pyramiding every 1N and a 2N stop.
- **Weaknesses:**
  - Long-only.
  - A state bug: after a winning trade the System 1 skip sets `inBuy := true` without entering, and the pyramid branch can then open a real position from that phantom trade.
  - Sizing is 10% of equity instead of N-based.
- Use #5 unless you need Pine.

**19. Bollinger breakout with risk sizing ("MCL-YG pair trading").**
- **What it is:** despite the name it is **not** a pair trade. It is a single-instrument 20-bar, 1σ Bollinger breakout with an exit at the moving average.
- **Why it is here:** good futures plumbing. Risk-based sizing via `syminfo.pointvalue` and per-order commissions.
- **Needs:** wider bands (2σ or a longer lookback), because 1σ whipsaws. Also guard against a computed size of 0 contracts on small accounts.

### Family D: Classic CTA intraday volatility breakout

**13. Dual Thrust (MyLanguage).**
- **Rules:** the original 3-parameter Michael Chalek design. Range = max(HH−LC, HC−LL) over N prior days; trigger = today's open ± K×range; stop-and-reverse.
- **Strengths:** a long-standing intraday CTA system on Chinese and US futures, and `HV()`/`LV()` exclude the current bar.
- **Caveat:** it relies on FMZ evaluating signals on the latest price within the bar. In a bar-close backtester, run it on an intraday chart with the daily range computed via `REF(...,1)`.
- **Needs:** a session-end flatten (the original system is intraday-only) and a protective stop.
- Avoid the Pine versions in the vault: they repaint (`Dual-Thrust-Strategy.md`) or are only a `study` (`Dual-Thrust-Trading-Algorithm-ps4.md`).

### Family E: Seasonality / regime overlays and short-term reversal

**18. S&P 500 Hybrid Seasonal (Katsanos, TASC 2022).**
- **Rules:** long October–July, out in August, with VIX/ATR-spike and volume-flow exits.
- **Strengths:** the Halloween effect is real and the code is mostly correct.
- **Weaknesses:**
  - About one trade a year, so statistical power is low.
  - The volume-flow exit gets distorted by volume drops at contract rolls.
- **Bugs:** the ATR-length input is unused, and the date window is dead code.
- **Best use:** a **regime filter** layered on Families A and B, not a standalone system.

**20. Eight-Day Extended Run (Raschke).**
- **Rules:** after nine or more consecutive closes above the 5-SMA, buy the first close below it (and the mirror for shorts), with an 11-bar time exit.
- **Strengths:** clean code, symmetric, and based on Linda Raschke's published work.
- **Weaknesses:** signals are rare and there is no price stop.
- **Needs:** a protective stop, and the backtest header has to be set to daily bars.

---

## Honourable mentions: great ideas, broken code (rewrite rather than port)

| File | The edge | Why it isn't in the top 20 |
|---|---|---|
| [Cross-Market Overnight Position](strategies/Cross-Market-Overnight-Position-Strategy-with-EMA-Filter.md) | Overnight (close-to-open) drift in ES/NQ is one of the strongest documented equity anomalies | The code never uses its own entry and exit signals; it flips in and out every bar. A proper version is about 20 lines. |
| [Turnaround Tuesday](strategies/Turnaround-Tuesday-Strategy-Weekend-Filter.md) | Down Monday → up Tuesday in ES/NQ | It is off by a day: Friday's data drives the signal and it fills at Tuesday's open. |
| [Monthly Opening / Month-end Closing](strategies/Monthly-Opening-Long-and-Month-end-Closing-Strategy.md) | Turn-of-month effect in ES/NQ is genuine | The code is actually *buy Monday, sell Friday*. |
| [Futures Candlestick Size Threshold](strategies/Futures-Candlestick-Size-Threshold-Trading-Strategy.md) | CME-native: momentum after the 7:30 and 8:30 CT data releases and the cash open | Its time window uses `timenow`, so backtests never trade; the bracket follows the close instead of staying at entry. |
| [Candlestick-Body "Dual Thrust"](strategies/Candlestick-Body-Based-Dual-Thrust-Strategy.md) | Fading oversized candles (short-term reversal) on ES/NQ | It is mislabelled and has no stop. |
| [R-Breaker (all 3 versions)](strategies/js-R-Breaker.md) | A classic intraday CTA reversal/breakout system | None of the three is a working R-Breaker: the JS version has no trading logic, and the Python versions invert or mangle the rules. |
| [Volatility-Filtered Market Timing](strategies/Volatility-Filtered-Market-Timing-Strategy.md) | Leaving equities when volatility spikes | A useful ES/NQ overlay, but it is mostly beta, not alpha. |
| [VWAP Deviation Band + Vol Filter](strategies/VWAP-Deviation-Band-and-Volatility-Filter-Trading-Strategy.md) | Fading moves beyond ±2σ of session VWAP on ES/NQ | The stop variable is wiped before the order fills, so no stop is ever placed. |

## Traps: popular-sounding files to avoid

- **Mislabelled files:**
  - "Pair-trading-strategy", "Multi-MA-Pair-Trading" and "MCL-YG Pair" are all single-instrument strategies.
  - "Holy-Grail-Strategy" inverts Raschke's rules.
  - "Absolute-Momentum-Indicator" goes short on strong trends in *either* direction.
- **Inverted or broken core logic:**
  - [`Larry-Connors-RSI2.md`](strategies/Larry-Connors-RSI2.md) shorts strength in uptrends, the opposite of Connors.
  - `Asian-Session-High-Low-Breakout` fades the break it claims to trade.
  - `Lazy-Bear-Squeeze-Momentum` opens and closes on the same bar.
  - `Gold-Silver-30m` shorts almost every bar.
- **Repainting / look-ahead:**
  - `Donchian-Breakout-no-repaint` uses `lookahead_on` despite its name.
  - `Dual-Thrust-Strategy` (Pine) changes the daily open it uses between live trading and historical bars.
  - `Dynamic-Stop-Loss...VWAP-and-Cross-Timeframe` uses a repainting daily VWAP.
- **Crypto-only mechanics:** weekend strategies, funding arbitrage and perpetual grids do not apply, because CME is closed on weekends and has no funding rate or perpetual contracts.

---

## Suggested futures portfolio built from this list

Combine families rather than stacking correlated strategies within one:

1. **Index mean reversion (ES/NQ, daily):** #1 Double Seven + #2 IBS, about 30% of the risk budget. Long-only, short holding periods, a high win rate.
2. **Intraday ORB (NQ, 5m):** #3 Dynamic ORB once its target bug is fixed, about 30%. Flat every night, so no gap risk.
3. **Trend following (CL, GC, 6E, 6J, ZN, daily):** #5 Turtle or #4 Donchian with ATR sizing, about 40%. Positively skewed returns that pay off when crises push indices into extended trends; it complements the two families above.
4. **Overlay:** #18 seasonal or a volatility filter to cut index exposure in high-volatility regimes.

### Before trading anything
- Use **back-adjusted continuous contracts** for daily systems and decide explicitly between **RTH and full-session (ETH) bars**. IBS, gap and ORB logic all depend on that choice.
- Replace percent-of-equity sizing with **contracts sized by ATR × point value**. MES, MNQ, MCL and MGC make small accounts workable.
- Model **commissions of about $2–5 per side** plus **1 tick of slippage** per side. Most vault files model neither.
- Use **resting stop and limit orders**, not `if close <= stop → strategy.close`, which fills a bar late.
- **Walk-forward test** at least 10 years per market. Treat every default parameter as unverified, because none were optimised on futures.

## Pine Script v6 ports (intraday)

The five intraday strategies (#3, #12, #13, #15 and #16) have been rewritten as Pine Script v6, with their known bugs fixed and settings adapted to CME futures. They are in [`pine/intraday/`](pine/intraday/README.md).

## Housekeeping note

[`strategies/Keltner-Channel-Breakout-Stop-Loss-Plus-Profit-10-I.e.-Long-Term-Holding-Strategy-V23-Dev-Multi-Cycle.md`](strategies/Keltner-Channel-Breakout-Stop-Loss-Plus-Profit-10-I.e.-Long-Term-Holding-Strategy-V23-Dev-Multi-Cycle.md) contains exchange `AccessKey`/`SecretKey` values in its backtest header, carried over from the original FMZ source. They look partial and probably belong to the original author, but they should be redacted.
