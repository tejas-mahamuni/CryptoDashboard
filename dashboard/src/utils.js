// =============================================================
// utils.js — Shared helpers and constants for the dashboard
// =============================================================

// ---- Sector Color Palette (consistent across ALL charts) ----
export const SECTOR_COLORS = {
  'Altcoin':              '#6366f1', // Indigo
  'Infrastructure/L1/L2':'#3b82f6', // Blue
  'DeFi':                '#10b981', // Emerald
  'Stablecoin':          '#f59e0b', // Amber
  'Memecoin':            '#f43f5e', // Rose
};

export const SECTOR_LIST = [
  'Altcoin', 'Infrastructure/L1/L2', 'DeFi', 'Stablecoin', 'Memecoin'
];

// ---- Number Formatters ----
export function formatCurrency(val) {
  if (!isFinite(val) || val === null) return '$0';
  const abs = Math.abs(val);
  if (abs >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `$${(val / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `$${(val / 1e6).toFixed(2)}M`;
  if (abs >= 1e3)  return `$${(val / 1e3).toFixed(1)}K`;
  if (abs >= 1)    return `$${val.toFixed(2)}`;
  return `$${val.toFixed(6)}`;
}

export function formatNumber(val) {
  if (!isFinite(val) || val === null) return '0';
  const abs = Math.abs(val);
  if (abs >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `${(val / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `${(val / 1e6).toFixed(2)}M`;
  if (abs >= 1e3)  return `${(val / 1e3).toFixed(1)}K`;
  return `${val.toFixed(2)}`;
}

export function formatPct(val) {
  if (!isFinite(val) || val === null) return '0.0%';
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
}

// ---- Plotly Base Layout (applies theming) ----
export function getPlotlyLayout(title, subtitle, isDark, extra = {}) {
  const bg      = isDark ? '#0f0f1a' : '#ffffff';
  const paperBg = isDark ? '#161627' : '#f8fafc';
  const gridCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textCol = isDark ? '#e2e8f0' : '#1e293b';
  const subCol  = isDark ? '#94a3b8' : '#64748b';
  const axisCol = isDark ? '#cbd5e1' : '#374151';

  return {
    title: {
      text: subtitle ? `<b>${title}</b><br><span style="font-size:12px;color:${subCol}">${subtitle}</span>` : `<b>${title}</b>`,
      font: { family: '-apple-system, BlinkMacSystemFont, "SF Pro", "SF Pro Display", "SF Pro Rounded", "Helvetica Neue", Arial, sans-serif', size: 16, color: textCol },
      x: 0.02,
      xanchor: 'left',
    },
    paper_bgcolor: paperBg,
    plot_bgcolor: bg,
    font: { family: '-apple-system, BlinkMacSystemFont, "SF Pro", "SF Pro Display", "SF Pro Rounded", "Helvetica Neue", Arial, sans-serif', color: textCol, size: 12 },
    xaxis: {
      gridcolor: gridCol,
      linecolor: axisCol,
      tickcolor: axisCol,
      tickfont: { color: axisCol, size: 11 },
      title: { font: { color: axisCol, size: 12 } },
      showgrid: true,
      zeroline: false,
    },
    yaxis: {
      gridcolor: gridCol,
      linecolor: axisCol,
      tickcolor: axisCol,
      tickfont: { color: axisCol, size: 11 },
      title: { font: { color: axisCol, size: 12 } },
      showgrid: true,
      zeroline: false,
    },
    legend: {
      bgcolor: isDark ? 'rgba(15,15,26,0.8)' : 'rgba(255,255,255,0.9)',
      bordercolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      borderwidth: 1,
      font: { color: textCol, size: 11 },
    },
    margin: { t: 70, r: 20, b: 60, l: 60 },
    hoverlabel: {
      bgcolor: isDark ? '#1e293b' : '#ffffff',
      bordercolor: isDark ? '#334155' : '#cbd5e1',
      font: { family: '-apple-system, BlinkMacSystemFont, "SF Pro", "SF Pro Display", "SF Pro Rounded", "Helvetica Neue", Arial, sans-serif', size: 12, color: textCol },
    },
    ...extra,
  };
}

// ---- Plotly Config (download button) ----
export const PLOTLY_CONFIG = {
  displayModeBar: true,
  modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d'],
  displaylogo: false,
  toImageButtonOptions: { format: 'png', scale: 2 },
  responsive: true,
};

// ---- Computed Column Helpers ----
export function enrichData(coins) {
  return coins.map(coin => ({
    ...coin,
    // Liquidity Score = 24h Volume / Market Cap
    LiquidityScore: coin['Market Cap'] > 0 ? coin['24h Volume'] / coin['Market Cap'] : 0,
    // Supply Utilization % = (Circulating Supply / Total Supply) × 100
    SupplyUtilization: coin['Total Supply'] > 0
      ? Math.min((coin['Circulating Supply'] / coin['Total Supply']) * 100, 100)
      : 100,
    // Volatility Index = std dev approximated from 4 timeframes
    VolatilityScore: stdDev([coin['1h'], coin['24h'], coin['7d'], coin['30d']]),
    // FDV Gap = (Total Supply × Price) - Market Cap
    FDVGap: (coin['Total Supply'] * coin['Price']) - coin['Market Cap'],
    // Performance tiers (for classification)
    PositiveCount: [coin['1h'], coin['24h'], coin['7d'], coin['30d']].filter(v => v > 0).length,
  }));
}

function stdDev(arr) {
  const valid = arr.filter(v => isFinite(v));
  if (valid.length === 0) return 0;
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  const variance = valid.reduce((a, b) => a + (b - mean) ** 2, 0) / valid.length;
  return Math.sqrt(variance);
}

// ---- Price Tier Helper ----
export function priceTier(price) {
  if (price < 0.01)          return 'Penny (<$0.01)';
  if (price < 1)             return 'Fractional ($0.01-$1)';
  if (price < 10)            return 'Low ($1-$10)';
  if (price < 100)           return 'Mid ($10-$100)';
  if (price < 1000)          return 'High ($100-$1K)';
  return                            'Blue Chip ($1K+)';
}

// ---- Market Cap Tier Helper ----
export function mcapTier(rank) {
  if (rank <= 10)   return 'Mega-cap (1-10)';
  if (rank <= 50)   return 'Large-cap (11-50)';
  if (rank <= 200)  return 'Mid-cap (51-200)';
  if (rank <= 1000) return 'Small-cap (201-1K)';
  return                   'Micro-cap (1K+)';
}
