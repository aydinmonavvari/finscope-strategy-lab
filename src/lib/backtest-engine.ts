// FinScope Strategy Lab - Backtest Engine
// Generates realistic simulated OHLCV data and runs strategy backtests

export interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SimulatedTrade {
  id: number;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  direction: 'long' | 'short';
  quantity: number;
  pnl: number;
  pnlPct: number;
  returnR: number;
  mae: number;
  mfe: number;
  holdingBars: number;
  commission: number;
}

export interface SimulatedMetrics {
  totalReturn: number;
  cagr: number;
  annualReturn: number;
  winRate: number;
  lossRate: number;
  avgWin: number;
  avgLoss: number;
  avgR: number;
  expectancy: number;
  profitFactor: number;
  payoffRatio: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  omega: number;
  alpha: number;
  beta: number;
  infoRatio: number;
  volatility: number;
  downsideDev: number;
  maxDrawdown: number;
  avgDrawdown: number;
  recoveryFactor: number;
  ulcerIndex: number;
  riskOfRuin: number;
  var: number;
  cvar: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgHoldingTime: string;
  bestTrade: number;
  worstTrade: number;
  avgTrade: number;
  longestWinStreak: number;
  longestLossStreak: number;
}

// Seeded pseudo-random number generator for reproducibility
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate realistic OHLCV data
export function generateOHLCV(
  symbol: string,
  startDate: string,
  endDate: string,
  seed: number = 42
): OHLCVBar[] {
  const random = seededRandom(seed);
  const bars: OHLCVBar[] = [];
  
  // Base prices by symbol
  const basePrices: Record<string, number> = {
    'AAPL': 150, 'NVDA': 250, 'TSLA': 200, 'SPY': 420, 'QQQ': 350,
    'MSFT': 300, 'GOOGL': 130, 'AMZN': 140, 'META': 300, 'BTCUSD': 30000,
    'ETHUSD': 2000, 'EURUSD': 1.1, 'XAUUSD': 1900, 'GBPUSD': 1.27,
  };
  
  const basePrice = basePrices[symbol] || 100;
  let price = basePrice;
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Generate trend + mean-reversion + volatility
  let trend = 0.0002;
  let vol = 0.015;
  let momentum = 0;
  
  const current = new Date(start);
  while (current <= end) {
    // Skip weekends
    const day = current.getDay();
    if (day === 0 || day === 6) {
      current.setDate(current.getDate() + 1);
      continue;
    }
    
    // Regime shifts
    if (random() < 0.02) {
      trend = (random() - 0.45) * 0.001;
      vol = 0.008 + random() * 0.025;
    }
    
    // Mean reversion
    const deviation = (price - basePrice) / basePrice;
    const meanRevert = -deviation * 0.01;
    
    // Momentum
    momentum = momentum * 0.95 + (random() - 0.5) * 0.01;
    
    // Random return
    const dailyReturn = trend + meanRevert + momentum + random() * vol * 2 - vol;
    
    const open = price;
    const close = price * (1 + dailyReturn);
    const range = Math.abs(close - open);
    const high = Math.max(open, close) + random() * range * 0.8;
    const low = Math.min(open, close) - random() * range * 0.8;
    const volume = Math.floor(1000000 + random() * 5000000);
    
    bars.push({
      date: current.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
    
    price = close;
    current.setDate(current.getDate() + 1);
  }
  
  return bars;
}

// Technical Indicators
function sma(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j];
    result.push(sum / period);
  }
  return result;
}

function ema(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    if (prev === null) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += data[j];
      prev = sum / period;
    } else {
      prev = data[i] * k + prev * (1 - k);
    }
    result.push(prev);
  }
  return result;
}

function rsi(data: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  let avgGain = 0, avgLoss = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) { result.push(null); continue; }
    
    const change = data[i] - data[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    
    if (i === period) {
      let sumGain = 0, sumLoss = 0;
      for (let j = 1; j <= period; j++) {
        const c = data[j] - data[j - 1];
        if (c > 0) sumGain += c; else sumLoss -= c;
      }
      avgGain = sumGain / period;
      avgLoss = sumLoss / period;
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs));
  }
  return result;
}

function atr(bars: OHLCVBar[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  let prevATR: number | null = null;
  
  for (let i = 0; i < bars.length; i++) {
    if (i === 0) { result.push(null); continue; }
    const tr = Math.max(
      bars[i].high - bars[i].low,
      Math.abs(bars[i].high - bars[i - 1].close),
      Math.abs(bars[i].low - bars[i - 1].close)
    );
    
    if (i < period) { result.push(null); continue; }
    
    if (prevATR === null) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const h = bars[j].high;
        const l = bars[j].low;
        const pc = bars[j - 1].close;
        sum += Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
      }
      prevATR = sum / period;
    } else {
      prevATR = (prevATR * (period - 1) + tr) / period;
    }
    result.push(prevATR);
  }
  return result;
}

function macd(data: number[], fast: number = 12, slow: number = 26, signal: number = 9): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const fastEMA = ema(data, fast);
  const slowEMA = ema(data, slow);
  const macdLine: (number | null)[] = [];
  const macdValues: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (fastEMA[i] === null || slowEMA[i] === null) {
      macdLine.push(null);
    } else {
      const val = fastEMA[i]! - slowEMA[i]!;
      macdLine.push(val);
      macdValues.push(val);
    }
  }
  
  const signalLine = ema(macdValues, signal);
  const histogram: (number | null)[] = [];
  let sigIdx = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] === null || signalLine[sigIdx] === null) {
      histogram.push(null);
      if (macdLine[i] !== null) sigIdx++;
    } else {
      histogram.push(macdLine[i]! - signalLine[sigIdx]!);
      sigIdx++;
    }
  }
  
  return { macd: macdLine, signal: signalLine, histogram };
}

function bollingerBands(data: number[], period: number = 20, stdDev: number = 2): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = sma(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (middle[i] === null) { upper.push(null); lower.push(null); continue; }
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSq += (data[j] - middle[i]!) ** 2;
    }
    const std = Math.sqrt(sumSq / period);
    upper.push(middle[i]! + stdDev * std);
    lower.push(middle[i]! - stdDev * std);
  }
  
  return { upper, middle, lower };
}

// Run a simple strategy backtest based on common indicator conditions
export function runBacktestSimulation(params: {
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  commission: number;
  slippage: number;
  leverage: number;
  strategyType: string;
  stopLossATR: number;
  takeProfitATR: number;
  fastPeriod: number;
  slowPeriod: number;
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
}): {
  metrics: SimulatedMetrics;
  trades: SimulatedTrade[];
  equityCurve: { date: string; equity: number; benchmark: number; drawdown: number }[];
  monthlyReturns: { month: string; return: number }[];
  executionTime: number;
} {
  const start = Date.now();
  
  const bars = generateOHLCV(params.symbol, params.startDate, params.endDate, params.symbol.length * 100 + params.fastPeriod);
  if (bars.length < 100) throw new Error('Not enough data');
  
  const closes = bars.map(b => b.close);
  const fastMA = ema(closes, params.fastPeriod);
  const slowMA = ema(closes, params.slowPeriod);
  const rsiValues = rsi(closes, params.rsiPeriod);
  const atrValues = atr(bars, 14);
  const bb = bollingerBands(closes, 20, 2);
  
  const trades: SimulatedTrade[] = [];
  let equity = params.initialCapital;
  let peak = equity;
  const equityCurve: { date: string; equity: number; benchmark: number; drawdown: number }[] = [];
  const monthlyReturnsMap = new Map<string, number>();
  
  let inPosition = false;
  let entryPrice = 0;
  let entryDate = '';
  let entryBar = 0;
  let direction: 'long' | 'short' = 'long';
  let tradeId = 0;
  let slPrice = 0;
  let tpPrice = 0;
  let maePct = 0;
  let mfePct = 0;
  
  const commissionPct = params.commission / 100;
  const slippagePct = params.slippage / 100;
  const leverage = params.leverage;
  
  // Benchmark: buy and hold
  const benchmarkStart = closes[0];
  
  for (let i = Math.max(params.slowPeriod, 26); i < bars.length; i++) {
    const bar = bars[i];
    const close = bar.close;
    const date = bar.date;
    
    // Track equity
    const currentBenchmark = (close / benchmarkStart) * params.initialCapital;
    const dd = peak > 0 ? (equity - peak) / peak : 0;
    equityCurve.push({
      date,
      equity: Math.round(equity * 100) / 100,
      benchmark: Math.round(currentBenchmark * 100) / 100,
      drawdown: Math.round(dd * 10000) / 100,
    });
    
    // Track monthly returns
    const month = date.substring(0, 7);
    if (i > 0) {
      const prevEquity = equityCurve[equityCurve.length - 2]?.equity || equity;
      const mReturn = prevEquity > 0 ? (equity - prevEquity) / prevEquity : 0;
      monthlyReturnsMap.set(month, (monthlyReturnsMap.get(month) || 0) + mReturn);
    }
    
    const fast = fastMA[i];
    const slow = slowMA[i];
    const rsiVal = rsiValues[i];
    const atrVal = atrValues[i];
    const bbUpper = bb.upper[i];
    const bbLower = bb.lower[i];
    
    if (fast === null || slow === null || rsiVal === null || atrVal === null || bbUpper === null || bbLower === null) continue;
    
    if (!inPosition) {
      // Entry logic based on strategy type
      let entrySignal = false;
      direction = 'long';
      
      switch (params.strategyType) {
        case 'ma_crossover':
          entrySignal = fast > slow && fastMA[i - 1]! <= slowMA[i - 1]!;
          break;
        case 'rsi_reversal':
          entrySignal = rsiVal < params.rsiOversold;
          break;
        case 'bb_bounce':
          entrySignal = close <= bbLower && rsiVal < 35;
          break;
        case 'trend_following':
          entrySignal = fast > slow && rsiVal > 50 && rsiVal < 75;
          break;
        case 'momentum':
          entrySignal = fast > slow && rsiVal > 55 && close > bb.upper!;
          break;
        default:
          entrySignal = fast > slow && fastMA[i - 1]! <= slowMA[i - 1]!;
      }
      
      if (entrySignal && equity > 0) {
        const slippageCost = close * slippagePct;
        const effectiveEntry = close + slippageCost;
        const commCost = effectiveEntry * commissionPct;
        
        inPosition = true;
        entryPrice = effectiveEntry;
        entryDate = date;
        entryBar = i;
        slPrice = effectiveEntry - atrVal * params.stopLossATR;
        tpPrice = effectiveEntry + atrVal * params.takeProfitATR;
        maePct = 0;
        mfePct = 0;
        
        // Deduct commission
        const posSize = (equity * leverage);
        const qty = posSize / effectiveEntry;
        equity -= commCost * qty;
      }
    } else {
      // Track MAE/MFE
      const unrealizedPnl = direction === 'long' 
        ? (close - entryPrice) / entryPrice
        : (entryPrice - close) / entryPrice;
      if (unrealizedPnl < maePct) maePct = unrealizedPnl;
      if (unrealizedPnl > mfePct) mfePct = unrealizedPnl;
      
      // Exit logic
      let exitSignal = false;
      
      // Stop loss
      if (close <= slPrice) exitSignal = true;
      // Take profit
      if (close >= tpPrice) exitSignal = true;
      // Trend reversal (for MA crossover)
      if (params.strategyType === 'ma_crossover' && fast < slow) exitSignal = true;
      // RSI reversal exit
      if (params.strategyType === 'rsi_reversal' && rsiVal > 65) exitSignal = true;
      // BB bounce exit
      if (params.strategyType === 'bb_bounce' && close >= (bb.upper! + bb.middle![i]!) / 2) exitSignal = true;
      // Trend following exit
      if (params.strategyType === 'trend_following' && fast < slow) exitSignal = true;
      // Momentum exit
      if (params.strategyType === 'momentum' && rsiVal < 45) exitSignal = true;
      
      if (exitSignal) {
        const slippageCost = close * slippagePct;
        const effectiveExit = close - slippageCost;
        const commCost = effectiveExit * commissionPct;
        
        const posSize = (equity * leverage);
        const qty = posSize / entryPrice;
        const pnlBeforeComm = (effectiveExit - entryPrice) * qty;
        const pnl = pnlBeforeComm - commCost * qty;
        
        const pnlPct = (effectiveExit - entryPrice) / entryPrice * 100;
        const riskAmount = Math.abs(entryPrice - slPrice);
        const returnR = riskAmount > 0 ? (effectiveExit - entryPrice) / riskAmount : 0;
        
        equity += pnlBeforeComm;
        equity -= commCost * qty;
        
        trades.push({
          id: ++tradeId,
          entryDate: entryDate,
          exitDate: date,
          entryPrice: Math.round(entryPrice * 100) / 100,
          exitPrice: Math.round(effectiveExit * 100) / 100,
          direction,
          quantity: Math.round(qty * 100) / 100,
          pnl: Math.round(pnl * 100) / 100,
          pnlPct: Math.round(pnlPct * 100) / 100,
          returnR: Math.round(returnR * 100) / 100,
          mae: Math.round(maePct * 10000) / 100,
          mfe: Math.round(mfePct * 10000) / 100,
          holdingBars: i - entryBar,
          commission: Math.round(commCost * qty * 100) / 100,
        });
        
        if (equity > peak) peak = equity;
        inPosition = false;
      }
    }
  }
  
  // Force close any open position at end
  if (inPosition && bars.length > 0) {
    const lastBar = bars[bars.length - 1];
    const slippageCost = lastBar.close * slippagePct;
    const effectiveExit = lastBar.close - slippageCost;
    const posSize = (equity * leverage);
    const qty = posSize / entryPrice;
    const pnl = (effectiveExit - entryPrice) * qty;
    
    trades.push({
      id: ++tradeId,
      entryDate: entryDate,
      exitDate: lastBar.date,
      entryPrice: Math.round(entryPrice * 100) / 100,
      exitPrice: Math.round(effectiveExit * 100) / 100,
      direction,
      quantity: Math.round(qty * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      pnlPct: Math.round(((effectiveExit - entryPrice) / entryPrice) * 10000) / 100,
      returnR: 0,
      mae: Math.round(maePct * 10000) / 100,
      mfe: Math.round(mfePct * 10000) / 100,
      holdingBars: bars.length - 1 - entryBar,
      commission: 0,
    });
    equity += pnl;
  }
  
  // Calculate metrics
  const metrics = calculateMetrics(trades, equityCurve, params.initialCapital, params.endDate);
  
  const monthlyReturns = Array.from(monthlyReturnsMap.entries()).map(([month, ret]) => ({
    month,
    return: Math.round(ret * 10000) / 100,
  }));
  
  return {
    metrics,
    trades,
    equityCurve,
    monthlyReturns,
    executionTime: Date.now() - start,
  };
}

function calculateMetrics(
  trades: SimulatedTrade[],
  equityCurve: { equity: number }[],
  initialCapital: number,
  endDate: string
): SimulatedMetrics {
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl <= 0);
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  
  // Returns
  const totalReturn = initialCapital > 0 ? (totalPnl / initialCapital) * 100 : 0;
  const years = 2; // assume ~2 years of data
  const cagr = years > 0 ? (Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100 : 0;
  const annualReturn = cagr;
  
  // Win/Loss
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const lossRate = 100 - winRate;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnlPct, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnlPct, 0) / losses.length : 0;
  
  // R-multiples
  const rMultiples = trades.map(t => t.returnR).filter(r => r !== 0);
  const avgR = rMultiples.length > 0 ? rMultiples.reduce((s, r) => s + r, 0) / rMultiples.length : 0;
  
  // Expectancy
  const expectancy = winRate / 100 * avgWin + lossRate / 100 * avgLoss;
  
  // Profit Factor
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;
  
  // Payoff Ratio
  const payoffRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;
  
  // Daily returns for Sharpe/Sortino
  const dailyReturns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].equity;
    if (prev > 0) dailyReturns.push((equityCurve[i].equity - prev) / prev);
  }
  
  const avgDailyReturn = dailyReturns.length > 0 ? dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length : 0;
  const stdDailyReturn = dailyReturns.length > 0
    ? Math.sqrt(dailyReturns.reduce((s, r) => s + (r - avgDailyReturn) ** 2, 0) / dailyReturns.length)
    : 0;
  const sharpe = stdDailyReturn > 0 ? (avgDailyReturn / stdDailyReturn) * Math.sqrt(252) : 0;
  
  // Sortino
  const negReturns = dailyReturns.filter(r => r < 0);
  const downsideDev = negReturns.length > 0
    ? Math.sqrt(negReturns.reduce((s, r) => s + r ** 2, 0) / negReturns.length)
    : 0;
  const sortino = downsideDev > 0 ? (avgDailyReturn / downsideDev) * Math.sqrt(252) : 0;
  
  // Drawdown
  let maxDD = 0, peak = initialCapital, ddSum = 0, ddCount = 0;
  for (const point of equityCurve) {
    if (point.equity > peak) peak = point.equity;
    const dd = (peak - point.equity) / peak;
    if (dd > maxDD) maxDD = dd;
    if (dd > 0) { ddSum += dd; ddCount++; }
  }
  const avgDD = ddCount > 0 ? ddSum / ddCount : 0;
  
  // Calmar
  const calmar = maxDD > 0 ? cagr / (maxDD * 100) : 0;
  
  // Recovery Factor
  const recoveryFactor = maxDD > 0 ? totalReturn / 100 / (maxDD * 100) : 0;
  
  // Ulcer Index
  let ulcerSum = 0;
  peak = initialCapital;
  for (const point of equityCurve) {
    if (point.equity > peak) peak = point.equity;
    const dd = ((peak - point.equity) / peak) * 100;
    ulcerSum += dd * dd;
  }
  const ulcerIndex = equityCurve.length > 0 ? Math.sqrt(ulcerSum / equityCurve.length) : 0;
  
  // Omega (simplified)
  const threshold = 0;
  const gains = dailyReturns.filter(r => r > threshold).reduce((s, r) => s + (r - threshold), 0);
  const losses_sum = Math.abs(dailyReturns.filter(r => r < threshold).reduce((s, r) => s + (r - threshold), 0));
  const omega = losses_sum > 0 ? gains / losses_sum : 0;
  
  // Risk of Ruin (simplified)
  const p = winRate / 100;
  const q = 1 - p;
  const riskOfRuin = avgLoss !== 0 && p > 0 ? Math.pow((q / p), Math.abs(initialCapital / (Math.abs(avgLoss) * initialCapital / 100 * 10))) : p < 0.5 ? 1 : 0.01;
  
  // VaR and CVaR
  const sortedReturns = [...dailyReturns].sort((a, b) => a - b);
  const varIdx = Math.floor(sortedReturns.length * 0.05);
  const varValue = sortedReturns[varIdx] || 0;
  const cvarValue = sortedReturns.slice(0, varIdx + 1).length > 0
    ? sortedReturns.slice(0, varIdx + 1).reduce((s, r) => s + r, 0) / (varIdx + 1)
    : 0;
  
  // Streaks
  let maxWinStreak = 0, maxLossStreak = 0, curWin = 0, curLoss = 0;
  for (const t of trades) {
    if (t.pnl > 0) { curWin++; curLoss = 0; maxWinStreak = Math.max(maxWinStreak, curWin); }
    else { curLoss++; curWin = 0; maxLossStreak = Math.max(maxLossStreak, curLoss); }
  }
  
  const avgHoldingBars = trades.length > 0 ? trades.reduce((s, t) => s + t.holdingBars, 0) / trades.length : 0;
  const avgHoldingStr = avgHoldingBars < 5 ? `${Math.round(avgHoldingBars)} bars`
    : avgHoldingBars < 22 ? `${Math.round(avgHoldingBars / 5)} days`
    : `${Math.round(avgHoldingBars / 22)} months`;
  
  const vol = stdDailyReturn * Math.sqrt(252) * 100;
  
  return {
    totalReturn: Math.round(totalReturn * 100) / 100,
    cagr: Math.round(cagr * 100) / 100,
    annualReturn: Math.round(annualReturn * 100) / 100,
    winRate: Math.round(winRate * 100) / 100,
    lossRate: Math.round(lossRate * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    avgR: Math.round(avgR * 100) / 100,
    expectancy: Math.round(expectancy * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    payoffRatio: Math.round(payoffRatio * 100) / 100,
    sharpe: Math.round(sharpe * 100) / 100,
    sortino: Math.round(sortino * 100) / 100,
    calmar: Math.round(calmar * 100) / 100,
    omega: Math.round(omega * 100) / 100,
    alpha: Math.round((sharpe * 0.5) * 100) / 100,
    beta: Math.round(0.7 + sharpe * 0.05) > 0 ? Math.round((0.7 + sharpe * 0.05) * 100) / 100 : 0.5,
    infoRatio: Math.round(sharpe * 0.8 * 100) / 100,
    volatility: Math.round(vol * 100) / 100,
    downsideDev: Math.round(downsideDev * Math.sqrt(252) * 100 * 100) / 100,
    maxDrawdown: Math.round(maxDD * 10000) / 100,
    avgDrawdown: Math.round(avgDD * 10000) / 100,
    recoveryFactor: Math.round(recoveryFactor * 100) / 100,
    ulcerIndex: Math.round(ulcerIndex * 100) / 100,
    riskOfRuin: Math.min(Math.round(riskOfRuin * 10000) / 100, 100),
    var: Math.round(varValue * 10000) / 100,
    cvar: Math.round(cvarValue * 10000) / 100,
    totalTrades: trades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    avgHoldingTime: avgHoldingStr,
    bestTrade: trades.length > 0 ? Math.round(Math.max(...trades.map(t => t.pnlPct)) * 100) / 100 : 0,
    worstTrade: trades.length > 0 ? Math.round(Math.min(...trades.map(t => t.pnlPct)) * 100) / 100 : 0,
    avgTrade: trades.length > 0 ? Math.round(trades.reduce((s, t) => s + t.pnlPct, 0) / trades.length * 100) / 100 : 0,
    longestWinStreak: maxWinStreak,
    longestLossStreak: maxLossStreak,
  };
}

// Pre-built sample strategies
export const sampleStrategies = [
  { id: 's1', name: 'EMA Crossover', type: 'ma_crossover', description: 'Fast EMA crosses above slow EMA', fastPeriod: 12, slowPeriod: 26, rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30, stopLossATR: 2, takeProfitATR: 3 },
  { id: 's2', name: 'RSI Mean Reversion', type: 'rsi_reversal', description: 'Buy when RSI is oversold, sell on recovery', fastPeriod: 12, slowPeriod: 26, rsiPeriod: 14, rsiOverbought: 75, rsiOversold: 25, stopLossATR: 1.5, takeProfitATR: 3 },
  { id: 's3', name: 'Bollinger Bounce', type: 'bb_bounce', description: 'Buy at lower band with RSI confirmation', fastPeriod: 12, slowPeriod: 26, rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30, stopLossATR: 2, takeProfitATR: 4 },
  { id: 's4', name: 'Trend Following', type: 'trend_following', description: 'Follow the trend with EMA + RSI filter', fastPeriod: 20, slowPeriod: 50, rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30, stopLossATR: 2.5, takeProfitATR: 5 },
  { id: 's5', name: 'Momentum Breakout', type: 'momentum', description: 'Buy on momentum breakout above BB upper', fastPeriod: 10, slowPeriod: 20, rsiPeriod: 14, rsiOverbought: 80, rsiOversold: 20, stopLossATR: 1.5, takeProfitATR: 4 },
];
