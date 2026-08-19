import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// Generate synthetic backtest results for demo purposes
// ═══════════════════════════════════════════════════════════════

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol = 'AAPL', timeframe = '1D', startDate = '2023-01-01', endDate = '2024-12-31', initialCapital = 100000 } = body;

    const rng = seededRandom(symbol.charCodeAt(0) * 1000 + (startDate.charCodeAt(0) || 0));

    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    const dayMs = 86400000;
    const totalDays = Math.round((endMs - startMs) / dayMs);

    const winRate = 0.52 + rng() * 0.14;
    const avgWinPct = 1.2 + rng() * 2.5;
    const avgLossPct = 0.6 + rng() * 1.5;
    const totalReturnPct = 15 + rng() * 50;
    const maxDDPct = -(8 + rng() * 25);
    const volatility = 12 + rng() * 20;
    const sharpe = 0.4 + rng() * 2.2;

    const numPoints = Math.min(totalDays, 500);
    const equityCurve: { date: string; equity: number; benchmark: number; drawdown: number }[] = [];
    let equity = initialCapital;
    let peak = initialCapital;
    let benchmark = initialCapital;
    let currentDD = 0;
    let maxDD = 0;

    for (let i = 0; i < numPoints; i++) {
      const dailyReturn = (rng() - 0.48) * volatility / 252 * (1 + Math.sin(i / 30) * 0.3);
      const benchReturn = (rng() - 0.47) * 0.012;
      equity *= 1 + dailyReturn;
      benchmark *= 1 + benchReturn;
      if (equity > peak) peak = equity;
      currentDD = (equity - peak) / peak;
      if (currentDD < maxDD) maxDD = currentDD;

      const d = new Date(startMs + i * dayMs * (totalDays / numPoints));
      equityCurve.push({
        date: d.toISOString().split('T')[0],
        equity: Math.round(equity * 100) / 100,
        benchmark: Math.round(benchmark * 100) / 100,
        drawdown: Math.round(currentDD * 10000) / 100,
      });
    }

    const numTrades = 30 + Math.floor(rng() * 80);
    const winningTrades = Math.round(numTrades * winRate);
    const losingTrades = numTrades - winningTrades;
    const trades: { id: number; entryDate: string; exitDate: string; entryPrice: number; exitPrice: number; direction: 'long' | 'short'; quantity: number; pnl: number; pnlPct: number; returnR: number; mae: number; mfe: number; holdingBars: number; commission: number }[] = [];

    let tradeId = 1;
    let price = 150 + rng() * 100;
    for (let i = 0; i < numTrades; i++) {
      const isWin = i < winningTrades;
      const direction: 'long' | 'short' = rng() > 0.35 ? 'long' : 'short';
      const pnlPct = isWin ? avgWinPct * (0.5 + rng()) : -avgLossPct * (0.5 + rng());
      const entryPrice = Math.round(price * 100) / 100;
      const exitPrice = Math.round(price * (1 + pnlPct / 100) * 100) / 100;
      const holdingBars = 1 + Math.floor(rng() * 20);
      const mae = -(rng() * Math.abs(pnlPct) * 1.2);
      const mfe = rng() * Math.abs(pnlPct) * 1.5;
      const rMultiple = pnlPct / Math.abs(avgLossPct) * (isWin ? 1 : -1);

      const entryIdx = Math.min(Math.floor((i / numTrades) * (equityCurve.length - holdingBars - 1)), equityCurve.length - holdingBars - 1);
      const trade = {
        id: tradeId++,
        entryDate: equityCurve[Math.max(0, entryIdx)]?.date || startDate,
        exitDate: equityCurve[Math.min(entryIdx + holdingBars, equityCurve.length - 1)]?.date || endDate,
        entryPrice,
        exitPrice,
        direction,
        quantity: 100,
        pnl: Math.round((exitPrice - entryPrice) * 100 * (direction === 'long' ? 1 : -1)),
        pnlPct: Math.round(pnlPct * 100) / 100,
        returnR: Math.round(rMultiple * 100) / 100,
        mae: Math.round(mae * 100) / 100,
        mfe: Math.round(mfe * 100) / 100,
        holdingBars,
        commission: Math.round(price * 100 * 0.001 * 2) / 100,
      };
      trades.push(trade);
      price = exitPrice;
    }

    const monthlyReturns: { month: string; return: number }[] = [];
    const startYear = parseInt(startDate.substring(0, 4));
    const endYear = parseInt(endDate.substring(0, 4));
    for (let y = startYear; y <= endYear; y++) {
      for (let m = 1; m <= 12; m++) {
        if (y === endYear && m > parseInt(endDate.substring(5, 7))) break;
        if (y === startYear && m < parseInt(startDate.substring(5, 7))) continue;
        monthlyReturns.push({
          month: `${y}-${String(m).padStart(2, '0')}`,
          return: Math.round(((rng() - 0.42) * 6) * 100) / 100,
        });
      }
    }

    const finalCapital = equity;
    const totalReturn = ((finalCapital - initialCapital) / initialCapital) * 100;
    const years = (endMs - startMs) / (365.25 * dayMs);
    const cagr = (Math.pow(finalCapital / initialCapital, 1 / years) - 1) * 100;
    const annualReturn = totalReturn / years;

    const metrics = {
      totalReturn: Math.round(totalReturn * 100) / 100,
      cagr: Math.round(cagr * 100) / 100,
      annualReturn: Math.round(annualReturn * 100) / 100,
      winRate: Math.round(winRate * 10000) / 100,
      lossRate: Math.round((1 - winRate) * 10000) / 100,
      avgWin: Math.round(avgWinPct * 100) / 100,
      avgLoss: Math.round(-avgLossPct * 100) / 100,
      avgR: Math.round((avgWinPct / avgLossPct * winRate / (1 - winRate) - (1 - winRate) / winRate) * 100) / 100,
      expectancy: Math.round((winRate * avgWinPct - (1 - winRate) * avgLossPct) * 100) / 100,
      profitFactor: Math.round((winRate * avgWinPct / ((1 - winRate) * avgLossPct)) * 100) / 100,
      payoffRatio: Math.round((avgWinPct / avgLossPct) * 100) / 100,
      sharpe: Math.round(sharpe * 100) / 100,
      sortino: Math.round((sharpe * 1.15 + rng() * 0.3) * 100) / 100,
      calmar: Math.round((cagr / Math.abs(maxDDPct)) * 100) / 100,
      omega: Math.round((1.2 + rng() * 1.8) * 100) / 100,
      alpha: Math.round(((annualReturn / 100) - 0.08 - 0.95 * 0.15) * 100 * 100) / 100,
      beta: Math.round((0.85 + rng() * 0.3) * 100) / 100,
      infoRatio: Math.round((-0.3 + rng() * 1.5) * 100) / 100,
      volatility: Math.round(volatility * 100) / 100,
      downsideDev: Math.round(volatility * 0.65 * 100) / 100,
      maxDrawdown: Math.round(maxDDPct * 100) / 100,
      avgDrawdown: Math.round(maxDDPct * 0.35 * 100) / 100,
      recoveryFactor: Math.round((cagr / Math.abs(maxDDPct)) * 100) / 100,
      ulcerIndex: Math.round(Math.abs(maxDDPct) * 0.45 * 100) / 100,
      riskOfRuin: Math.round(rng() * 2 * 100) / 100,
      var: Math.round(-(1.5 + rng() * 3) * 100) / 100,
      cvar: Math.round(-(2.5 + rng() * 4) * 100) / 100,
      totalTrades: numTrades,
      winningTrades,
      losingTrades,
      avgHoldingTime: `${Math.round(3 + rng() * 8)}D ${Math.round(rng() * 12)}h`,
      bestTrade: Math.round((avgWinPct * 2.5) * 100) / 100,
      worstTrade: Math.round(-avgLossPct * 2.5 * 100) / 100,
      avgTrade: Math.round(((winRate * avgWinPct - (1 - winRate) * avgLossPct)) * 100) / 100,
      longestWinStreak: Math.round(3 + rng() * 8),
      longestLossStreak: Math.round(2 + rng() * 5),
    };

    return NextResponse.json({
      success: true,
      data: {
        id: `bt-${Date.now()}`,
        strategyId: body.strategyId || 'demo',
        strategyName: body.strategyType || 'MA Crossover',
        symbol,
        timeframe,
        startDate,
        endDate,
        initialCapital,
        finalCapital: Math.round(finalCapital * 100) / 100,
        metrics,
        trades,
        equityCurve,
        monthlyReturns,
        executionTime: Math.round(150 + rng() * 500),
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to run backtest' }, { status: 500 });
  }
}
