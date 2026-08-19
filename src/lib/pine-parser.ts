/**
 * Pine Script Parser — Extracts strategy logic from TradingView Pine Script code
 * Supports Pine Script v5 syntax
 */

export interface ParsedIndicator {
  name: string;
  type: string;
  params: Record<string, number | string>;
  variable: string;
}

export interface ParsedCondition {
  indicator: string;
  operator: string;
  value: string;
  timeframe?: string;
  direction: 'long' | 'short' | 'exit_long' | 'exit_short';
}

export interface ParsedStrategy {
  name: string;
  description: string;
  indicators: ParsedIndicator[];
  entryConditions: ParsedCondition[];
  exitConditions: ParsedCondition[];
  parameters: Record<string, number | string>;
  source: 'pine' | 'mt5' | 'json';
  rawCode: string;
}

// ═══════════════════════════════════════════════════════════════
// Indicator Detection Patterns
// ═══════════════════════════════════════════════════════════════

const INDICATOR_PATTERNS: {
  pattern: RegExp;
  type: string;
  defaultParams: Record<string, number>;
}[] = [
  {
    pattern: /ta\.sma\(\s*(\w+)\s*,\s*(\w+|\d+)\s*\)/g,
    type: 'SMA',
    defaultParams: { period: 20 },
  },
  {
    pattern: /ta\.ema\(\s*(\w+)\s*,\s*(\w+|\d+)\s*\)/g,
    type: 'EMA',
    defaultParams: { period: 20 },
  },
  {
    pattern: /ta\.rsi\(\s*(\w+)\s*,\s*(\w+|\d+)\s*\)/g,
    type: 'RSI',
    defaultParams: { period: 14 },
  },
  {
    pattern: /ta\.wma\(\s*(\w+)\s*,\s*(\w+|\d+)\s*\)/g,
    type: 'WMA',
    defaultParams: { period: 20 },
  },
  {
    pattern: /ta\.atr\(\s*(\w+|\d+)\s*\)/g,
    type: 'ATR',
    defaultParams: { period: 14 },
  },
  {
    pattern: /ta\.adx\(\s*(\w+|\d+)\s*,\s*(\w+|\d+)\s*\)/g,
    type: 'ADX',
    defaultParams: { period: 14, smoothing: 14 },
  },
  {
    pattern: /ta\.stoch\(\s*(\w+|\d+)\s*,\s*(\w+|\d+)\s*,\s*(\w+|\d+)\s*\)/g,
    type: 'Stochastic',
    defaultParams: { kPeriod: 14, dPeriod: 3, smooth: 3 },
  },
  {
    pattern: /ta\.cci\(\s*(\w+|\d+)\s*\)/g,
    type: 'CCI',
    defaultParams: { period: 20 },
  },
  {
    pattern: /ta\.roc\(\s*(\w+)\s*,\s*(\w+|\d+)\s*\)/g,
    type: 'ROC',
    defaultParams: { period: 12 },
  },
  {
    pattern: /ta\.obv\s*\(\s*\w*\s*\)/g,
    type: 'OBV',
    defaultParams: {},
  },
  {
    pattern: /ta\.macd\(\s*(\w+)\s*,\s*(\w+|\d+)\s*,\s*(\w+|\d+)\s*,\s*(\w+|\d+)\s*\)/g,
    type: 'MACD',
    defaultParams: { fast: 12, slow: 26, signal: 9 },
  },
  {
    pattern: /ta\.bb\(\s*(\w+)\s*,\s*(\w+|\d+)\s*,\s*([\d.]+)\s*\)/g,
    type: 'BollingerBands',
    defaultParams: { period: 20, mult: 2.0 },
  },
  {
    pattern: /ta\.mom\(\s*(\w+)\s*,\s*(\w+|\d+)\s*\)/g,
    type: 'Momentum',
    defaultParams: { period: 10 },
  },
  {
    pattern: /ta\.donchian\(\s*(\w+|\d+)\s*\)/g,
    type: 'Donchian',
    defaultParams: { period: 20 },
  },
];

// ═══════════════════════════════════════════════════════════════
// Condition Detection Patterns
// ═══════════════════════════════════════════════════════════════

const CONDITION_PATTERNS: {
  pattern: RegExp;
  operator: string;
  extractValue: (match: RegExpMatchArray) => string;
}[] = [
  // ta.crossover(a, b) → crosses_above
  {
    pattern: /ta\.crossover\(\s*(\w+)\s*,\s*(\w+)\s*\)/g,
    operator: 'crosses_above',
    extractValue: (m) => m[2],
  },
  // ta.crossunder(a, b) → crosses_below
  {
    pattern: /ta\.crossunder\(\s*(\w+)\s*,\s*(\w+)\s*\)/g,
    operator: 'crosses_below',
    extractValue: (m) => m[2],
  },
  // a > b → gt
  {
    pattern: /(\w+)\s*>\s*(\w+|\d+\.?\d*)/g,
    operator: 'gt',
    extractValue: (m) => m[2],
  },
  // a < b → lt
  {
    pattern: /(\w+)\s*<\s*(\w+|\d+\.?\d*)/g,
    operator: 'lt',
    extractValue: (m) => m[2],
  },
];

// ═══════════════════════════════════════════════════════════════
// Main Parser
// ═══════════════════════════════════════════════════════════════

export function parsePineScript(code: string): ParsedStrategy {
  const lines = code.split('\n').map((l) => l.trim()).filter(Boolean);
  const indicators: ParsedIndicator[] = [];
  const entryConditions: ParsedCondition[] = [];
  const exitConditions: ParsedCondition[] = [];
  const parameters: Record<string, number | string> = {};

  // Variable mapping: varName → indicator type
  const varMap: Record<string, string> = {};

  // Extract strategy name
  const nameMatch = code.match(/strategy\s*\(\s*["'](.+?)["']/);
  const strategyName = nameMatch ? nameMatch[1] : 'Imported Pine Strategy';

  // Extract description (from strategy() call or comment)
  const descMatch = code.match(/strategy\s*\([^)]*shorttitle\s*=\s*["'](.+?)["']/);
  const description = descMatch ? descMatch[1] : `Imported from TradingView Pine Script`;

  // Extract input parameters
  const inputPattern = /(\w+)\s*=\s*input\.(int|float|bool|string|source)\s*\(([^,)]+)(?:,\s*([^,)]+))?(?:,\s*([^,)]+))?/g;
  let inputMatch;
  while ((inputMatch = inputPattern.exec(code)) !== null) {
    const varName = inputMatch[1];
    const inputType = inputMatch[2];
    const defaultValue = inputMatch[3].trim();
    // Try to extract title from quoted string in any of the later groups
    const allGroups = [inputMatch[4], inputMatch[5]].filter(Boolean).join(' ');
    const titleMatch = allGroups.match(/"([^"]*)"/);
    const title = titleMatch ? titleMatch[1] : varName;
    parameters[varName] = inputType === 'int' || inputType === 'float'
      ? parseFloat(defaultValue) || 0
      : defaultValue;
    parameters[`${varName}_label`] = title;
  }

  // Extract indicators
  for (const indDef of INDICATOR_PATTERNS) {
    const regex = new RegExp(indDef.pattern.source, 'g');
    let match;
    while ((match = regex.exec(code)) !== null) {
      // Find the variable name this is assigned to
      const lineStart = code.lastIndexOf('\n', match.index) + 1;
      const lineEnd = code.indexOf('\n', match.index);
      const line = code.substring(lineStart, lineEnd > -1 ? lineEnd : undefined).trim();
      const assignMatch = line.match(/^(\w+)\s*=/);
      const variable = assignMatch ? assignMatch[1] : `${indDef.type}_${indicators.length}`;

      const params: Record<string, number | string> = { ...indDef.defaultParams };
      for (let i = 1; i < match.length; i++) {
        if (match[i] !== undefined) {
          const numVal = parseFloat(match[i]);
          if (!isNaN(numVal)) {
            const keys = Object.keys(indDef.defaultParams);
            if (keys[i - 1]) params[keys[i - 1]] = numVal;
          }
        }
      }

      indicators.push({
        name: `${indDef.type}(${Object.values(params).filter((v) => typeof v === 'number').join(',')})`,
        type: indDef.type,
        params,
        variable,
      });

      varMap[variable] = indDef.type;
    }
  }

  // Extract strategy.entry / strategy.close blocks to determine long/short
  const entryBlocks: { varName: string; direction: 'long' | 'short' }[] = [];
  const exitBlocks: { varName: string; direction: 'exit_long' | 'exit_short' }[] = [];

  // Helper: find the condition variable from an if-block before a given position
  const findIfCondition = (pos: number): string | null => {
    // Search backwards for a line that starts with 'if'
    let searchPos = pos;
    while (searchPos > 0) {
      const nlPos = code.lastIndexOf('\n', searchPos - 1);
      const lineEnd = searchPos;
      const line = code.substring(nlPos + 1, lineEnd).trim();
      if (line.startsWith('if')) {
        const m = line.match(/^if\s*\(\s*(\w+)/);
        return m ? m[1] : null;
      }
      searchPos = nlPos;
      // Only look back a few lines
      if (pos - searchPos > 200) break;
    }
    return null;
  };

  const entryRegex = /strategy\.entry\s*\(\s*["'](\w+)["']\s*,\s*strategy\.(long|short)\s*\)/g;
  let eMatch;
  while ((eMatch = entryRegex.exec(code)) !== null) {
    const condVar = findIfCondition(eMatch.index);
    if (condVar) {
      entryBlocks.push({ varName: condVar, direction: eMatch[2] as 'long' | 'short' });
    }
  }

  const exitRegex = /strategy\.close\s*\(\s*["'](\w+)["']\s*\)/g;
  let xMatch;
  while ((xMatch = exitRegex.exec(code)) !== null) {
    const condVar = findIfCondition(xMatch.index);
    if (condVar) {
      exitBlocks.push({ varName: condVar, direction: 'exit_long' });
    }
  }

  // Extract conditions from variable definitions
  const conditionDefs: Record<string, { indicator: string; operator: string; value: string }> = {};
  for (const condDef of CONDITION_PATTERNS) {
    const regex = new RegExp(condDef.pattern.source, 'g');
    let cMatch;
    while ((cMatch = regex.exec(code)) !== null) {
      const lineStart = code.lastIndexOf('\n', cMatch.index) + 1;
      const lineEnd = code.indexOf('\n', cMatch.index);
      const line = code.substring(lineStart, lineEnd > -1 ? lineEnd : undefined).trim();
      const assignMatch = line.match(/^(\w+)\s*=/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const indicatorVar = cMatch[1];
        const indicatorType = varMap[indicatorVar] || indicatorVar;
        conditionDefs[varName] = {
          indicator: indicatorType,
          operator: condDef.operator,
          value: condDef.extractValue(cMatch),
        };
      }
    }
  }

  // Map entry blocks to conditions
  for (const block of entryBlocks) {
    const cond = conditionDefs[block.varName];
    if (cond) {
      entryConditions.push({
        ...cond,
        direction: block.direction,
        timeframe: '1D',
      });
    } else {
      // Variable not found in condition defs — create a generic one
      const indicatorType = varMap[block.varName] || 'SMA';
      entryConditions.push({
        indicator: indicatorType,
        operator: 'gt',
        value: '0',
        direction: block.direction,
        timeframe: '1D',
      });
    }
  }

  // Map exit blocks to conditions
  for (const block of exitBlocks) {
    const cond = conditionDefs[block.varName];
    if (cond) {
      exitConditions.push({
        ...cond,
        direction: block.direction,
        timeframe: '1D',
      });
    }
  }

  return {
    name: strategyName,
    description,
    indicators,
    entryConditions,
    exitConditions,
    parameters,
    source: 'pine',
    rawCode: code,
  };
}

// ═══════════════════════════════════════════════════════════════
// MT5 JSON Parser
// ═══════════════════════════════════════════════════════════════

export interface MT5StrategyJson {
  name?: string;
  description?: string;
  type?: string;
  indicators?: {
    name: string;
    type: string;
    params: Record<string, number | string>;
  }[];
  entry_conditions?: {
    indicator: string;
    operator: string;
    value: string | number;
    timeframe?: string;
  }[];
  exit_conditions?: {
    indicator: string;
    operator: string;
    value: string | number;
    timeframe?: string;
  }[];
  risk_management?: {
    stop_loss?: { type: string; value: number };
    take_profit?: { type: string; value: number };
    trailing_stop?: { enabled: boolean; activation: number; distance: number };
  };
  position_sizing?: {
    type: string;
    size: number;
    risk_per_trade?: number;
    leverage?: number;
  };
  symbol?: string;
  timeframe?: string;
}

export function parseMT5Json(jsonStr: string): ParsedStrategy {
  let data: MT5StrategyJson;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    throw new Error('Invalid JSON format. Please check your MetaTrader 5 export.');
  }

  if (!data.entry_conditions || data.entry_conditions.length === 0) {
    throw new Error('No entry conditions found in the MT5 export. Make sure the JSON includes "entry_conditions".');
  }

  const indicators: ParsedIndicator[] = (data.indicators || []).map((ind, i) => ({
    name: ind.name || `${ind.type}_${i}`,
    type: ind.type,
    params: ind.params || {},
    variable: `${ind.type}_${i}`,
  }));

  // Build varMap from indicators
  const varMap: Record<string, string> = {};
  indicators.forEach((ind) => {
    varMap[ind.variable] = ind.type;
  });

  const entryConditions: ParsedCondition[] = data.entry_conditions.map((c) => ({
    indicator: c.indicator,
    operator: c.operator,
    value: String(c.value),
    timeframe: c.timeframe || '1D',
    direction: 'long',
  }));

  const exitConditions: ParsedCondition[] = (data.exit_conditions || []).map((c) => ({
    indicator: c.indicator,
    operator: c.operator,
    value: String(c.value),
    timeframe: c.timeframe || '1D',
    direction: 'exit_long',
  }));

  const parameters: Record<string, number | string> = {};
  if (data.symbol) parameters.symbol = data.symbol;
  if (data.timeframe) parameters.timeframe = data.timeframe;
  if (data.risk_management?.stop_loss) parameters.sl = data.risk_management.stop_loss.value;
  if (data.risk_management?.take_profit) parameters.tp = data.risk_management.take_profit.value;

  return {
    name: data.name || 'Imported MT5 Strategy',
    description: data.description || 'Imported from MetaTrader 5',
    indicators,
    entryConditions,
    exitConditions,
    parameters,
    source: 'mt5',
    rawCode: jsonStr,
  };
}

// ═══════════════════════════════════════════════════════════════
// MT5 JSON Template (for user reference)
// ═══════════════════════════════════════════════════════════════

export const MT5_JSON_TEMPLATE = `{
  "name": "My MT5 Strategy",
  "description": "Strategy exported from MetaTrader 5",
  "type": "trend",
  "symbol": "EURUSD",
  "timeframe": "H1",
  "indicators": [
    { "name": "EMA 20", "type": "EMA", "params": { "period": 20 } },
    { "name": "EMA 50", "type": "EMA", "params": { "period": 50 } },
    { "name": "RSI 14", "type": "RSI", "params": { "period": 14 } }
  ],
  "entry_conditions": [
    { "indicator": "EMA", "operator": "crosses_above", "value": "EMA(50)", "timeframe": "1h" },
    { "indicator": "RSI", "operator": "gt", "value": "50", "timeframe": "1h" }
  ],
  "exit_conditions": [
    { "indicator": "EMA", "operator": "crosses_below", "value": "EMA(20)", "timeframe": "1h" }
  ],
  "risk_management": {
    "stop_loss": { "type": "fixed", "value": 2.0 },
    "take_profit": { "type": "fixed", "value": 4.0 },
    "trailing_stop": { "enabled": false, "activation": 1.5, "distance": 1.5 }
  },
  "position_sizing": {
    "type": "fixed",
    "size": 0.1,
    "risk_per_trade": 1.0,
    "leverage": 1
  }
}`;

export const PINE_EXAMPLE = `//@version=5
strategy("EMA Cross RSI", overlay=true, margin_long=100, margin_short=100)

// Inputs
fastLen = input.int(20, "Fast EMA Length")
slowLen = input.int(50, "Slow EMA Length")
rsiLen = input.int(14, "RSI Length")
rsiOverbought = input.int(70, "RSI Overbought")
rsiOversold = input.int(30, "RSI Oversold")

// Indicators
fastEMA = ta.ema(close, fastLen)
slowEMA = ta.ema(close, slowLen)
rsi = ta.rsi(close, rsiLen)
atr = ta.atr(14)

// Conditions
longCondition = ta.crossover(fastEMA, slowEMA)
shortCondition = ta.crossunder(fastEMA, slowEMA)
exitLong = rsi > rsiOverbought
exitShort = rsi < rsiOversold

// Entries
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.entry("Short", strategy.short)

// Exits
if (exitLong)
    strategy.close("Long")
if (exitShort)
    strategy.close("Short")

// Plot
plot(fastEMA, "Fast EMA", color=color.green)
plot(slowEMA, "Slow EMA", color=color.red)`;
