// LiquidityRisk.jsx — Grains 10, 11, 12, 17, 25
import React, { useMemo } from 'react';
import { ShieldAlert } from 'lucide-react';
import { PlotlyChart } from '../components/PlotlyChart';
import { getPlotlyLayout, SECTOR_COLORS, formatCurrency, formatPct } from '../utils';

function stdDev(arr) {
  const valid = arr.filter(v => isFinite(v) && v !== 0);
  if (!valid.length) return 0;
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  return Math.sqrt(valid.reduce((a, b) => a + (b - mean) ** 2, 0) / valid.length);
}

function zScore(val, mean, sd) {
  return sd > 0 ? (val - mean) / sd : 0;
}

export function LiquidityRisk({ coins, isDark }) {
  const base = isDark;

  // ══════════════════════════════════════════
  // GRAIN 10 — Volume-to-Market-Cap Ratio (Liquidity Score)
  // ══════════════════════════════════════════
  const grain10 = useMemo(() => {
    const enriched = coins
      .filter(c => c['Market Cap'] > 0)
      .map(c => ({ ...c, LiqScore: c['24h Volume'] / c['Market Cap'] }))
      .sort((a, b) => b.LiqScore - a.LiqScore)
      .slice(0, 50);

    return [{
      type: 'bar',
      orientation: 'h',
      name: 'Liquidity Score',
      x: enriched.map(c => +c.LiqScore.toFixed(4)),
      y: enriched.map(c => c.Symbol),
      marker: {
        color: enriched.map(c => SECTOR_COLORS[c.Sector] || '#6366f1'),
        opacity: enriched.map(c => c.LiqScore > 1 ? 1 : 0.75),
        line: {
          color: enriched.map(c => c.LiqScore > 1 ? '#f59e0b' : 'transparent'),
          width: enriched.map(c => c.LiqScore > 1 ? 2 : 0),
        },
      },
      customdata: enriched.map(c => [c['Coin Name'], c.Sector, c.LiqScore.toFixed(4), formatCurrency(c['Market Cap']), formatCurrency(c['24h Volume'])]),
      hovertemplate: '<b>%{customdata[0]}</b><br>Sector: %{customdata[1]}<br>Liquidity Score: %{customdata[2]}<br>MCap: %{customdata[3]}<br>Volume: %{customdata[4]}<extra></extra>',
    }];
  }, [coins]);

  // ══════════════════════════════════════════
  // GRAIN 11 — Supply Utilization Efficiency
  // ══════════════════════════════════════════
  const grain11 = useMemo(() => {
    const enriched = coins
      .filter(c => c['Total Supply'] > 0 && c['Circulating Supply'] > 0)
      .map(c => ({
        ...c,
        utilPct: Math.min((c['Circulating Supply'] / c['Total Supply']) * 100, 100),
      }))
      .sort((a, b) => b.utilPct - a.utilPct)
      .slice(0, 50);

    return [{
      type: 'bar',
      orientation: 'h',
      name: 'Supply Utilization %',
      x: enriched.map(c => +c.utilPct.toFixed(2)),
      y: enriched.map(c => c.Symbol),
      marker: {
        color: enriched.map(c => {
          if (c.utilPct >= 80) return '#10b981';
          if (c.utilPct >= 50) return '#f59e0b';
          return '#f43f5e';
        }),
        opacity: 0.85,
      },
      customdata: enriched.map(c => [
        c['Coin Name'], c.utilPct.toFixed(1) + '%', formatCurrency(c['Circulating Supply']), formatCurrency(c['Total Supply'])
      ]),
      hovertemplate: '<b>%{customdata[0]}</b><br>Utilization: %{customdata[1]}<br>Circ: %{customdata[2]}<br>Total: %{customdata[3]}<extra></extra>',
    }];
  }, [coins]);

  // ══════════════════════════════════════════
  // GRAIN 12 — Volatility Index (Box Plot by Sector)
  // ══════════════════════════════════════════
  const grain12 = useMemo(() => {
    const sectorNames = [...new Set(coins.map(c => c.Sector))];
    return sectorNames.map(sector => {
      const sc = coins.filter(c => c.Sector === sector);
      const volScores = sc.map(c => stdDev([c['1h'], c['24h'], c['7d'], c['30d']]));
      return {
        type: 'box',
        name: sector,
        y: volScores,
        marker: { color: SECTOR_COLORS[sector] || '#6366f1' },
        boxpoints: 'outliers',
        jitter: 0.3,
        pointpos: -1.5,
        hovertemplate: `<b>${sector}</b><br>Volatility: %{y:.2f}<extra></extra>`,
      };
    });
  }, [coins]);

  // ══════════════════════════════════════════
  // GRAIN 17 — Fully Diluted Valuation Gap
  // ══════════════════════════════════════════
  const grain17 = useMemo(() => {
    const enriched = coins
      .filter(c => c['Total Supply'] > 0 && c.Price > 0 && c['Market Cap'] > 0)
      .map(c => ({
        ...c,
        FDVGap: (c['Total Supply'] * c.Price) - c['Market Cap'],
        FDVGapPct: ((c['Total Supply'] * c.Price) / c['Market Cap'] - 1) * 100,
      }))
      .filter(c => c.FDVGap > 0 && isFinite(c.FDVGap))
      .sort((a, b) => b.FDVGap - a.FDVGap)
      .slice(0, 40);

    return [{
      type: 'bar',
      name: 'FDV Gap ($)',
      x: enriched.map(c => c.Symbol),
      y: enriched.map(c => c.FDVGap),
      marker: {
        color: enriched.map(c => SECTOR_COLORS[c.Sector] || '#6366f1'),
        opacity: 0.85,
        cornerradius: 3,
      },
      customdata: enriched.map(c => [
        c['Coin Name'], formatCurrency(c.FDVGap),
        `+${c.FDVGapPct.toFixed(0)}%`, c.Sector, formatCurrency(c['Market Cap'])
      ]),
      hovertemplate: '<b>%{customdata[0]}</b><br>FDV Gap: %{customdata[1]}<br>Gap %: %{customdata[2]}<br>Sector: %{customdata[3]}<br>Current MCap: %{customdata[4]}<extra></extra>',
    }];
  }, [coins]);

  // ══════════════════════════════════════════
  // GRAIN 25 — Outlier Detection Matrix (Z-Score Heatmap)
  // ══════════════════════════════════════════
  const grain25 = useMemo(() => {
    const metrics = ['Price', '24h Volume', '1h', '24h', '7d', '30d', 'Market Cap'];
    const allValues = {};
    metrics.forEach(m => {
      const vals = coins.map(c => c[m] || 0).filter(v => isFinite(v));
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const sd   = stdDev(vals);
      allValues[m] = { mean, sd };
    });

    // Find most extreme outliers by sum of |z-scores|
    const ranked = coins
      .map(c => {
        const zScores = metrics.map(m => {
          const { mean, sd } = allValues[m];
          return Math.abs(zScore(c[m] || 0, mean, sd));
        });
        return { coin: c, zScores, totalZ: zScores.reduce((a, b) => a + b, 0) };
      })
      .sort((a, b) => b.totalZ - a.totalZ)
      .slice(0, 50);

    const symbols  = ranked.map(r => r.coin.Symbol);
    const z        = metrics.map((m, mi) => ranked.map(r => +r.zScores[mi].toFixed(2)));

    return [{
      type: 'heatmap',
      x: symbols,
      y: metrics,
      z,
      colorscale: [[0, '#0f172a'], [0.3, '#1e3a8a'], [0.6, '#dc2626'], [1, '#fbbf24']],
      zmid: 2,
      colorbar: { title: '|Z-Score|', thickness: 12 },
      hovertemplate: 'Coin: %{x}<br>Metric: %{y}<br>|Z-Score|: %{z:.2f}<extra></extra>',
    }];
  }, [coins]);

  return (
    <section>
      <div className="section-header">
        <div className="section-icon" style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}>
          <ShieldAlert size={18} color="white" />
        </div>
        <div>
          <h2 className="section-title">Liquidity & Risk Analysis</h2>
          <p className="section-desc">Grains 10–12, 17, 25 · Liquidity scores, supply mechanics, volatility, FDV gaps, outliers</p>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        <PlotlyChart
          data={grain10}
          layout={{
            ...getPlotlyLayout('Volume-to-Market-Cap Ratio', 'Top 50 most liquid · Gold border = ratio > 1.0 (extreme speculation)', base),
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text: 'Liquidity Score (Vol / MCap)', font: { color: base?'#cbd5e1':'#374151', size: 12 } } },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text: 'Cryptocurrency', font: { color: base?'#cbd5e1':'#374151', size: 12 } }, autorange: true, tickfont: { size: 9 } },
            margin: { t: 80, r: 20, b: 60, l: 60 },
            height: 520,
            shapes: [{
              type: 'line', x0: 1, x1: 1, y0: 0, y1: 1, yref: 'paper',
              line: { color: '#f59e0b', dash: 'dash', width: 2 },
            }],
          }}
          grainNum={10}
          title="Liquidity Score (Vol/MCap)"
          subtitle="Top 50 · Gold outline = ratio > 1x · High = speculative trading"
        />

        <PlotlyChart
          data={grain11}
          layout={{
            ...getPlotlyLayout('Supply Utilization Efficiency', 'Green >80% (near full dilution) · Yellow 50-80% · Red <50%', base),
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text: 'Supply Utilization %', font: { color: base?'#cbd5e1':'#374151', size: 12 } }, range: [0, 105] },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text: 'Cryptocurrency', font: { color: base?'#cbd5e1':'#374151', size: 12 } }, tickfont: { size: 9 } },
            margin: { t: 80, r: 20, b: 60, l: 60 },
            height: 520,
            shapes: [
              { type:'line', x0:50, x1:50, y0:0, y1:1, yref:'paper', line: { color:'#f59e0b', dash:'dot', width:1.5 } },
              { type:'line', x0:80, x1:80, y0:0, y1:1, yref:'paper', line: { color:'#10b981', dash:'dot', width:1.5 } },
            ],
          }}
          grainNum={11}
          title="Supply Utilization Efficiency"
          subtitle="Top 50 · Red <50% inflation risk · Yellow 50-80% · Green >80% safe"
        />

        <PlotlyChart
          data={grain12}
          layout={{
            ...getPlotlyLayout('Volatility Index by Sector', 'Std dev across 1h/24h/7d/30d per coin — sector risk profiles', base),
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text: 'Sector', font: { color: base?'#cbd5e1':'#374151', size: 12 } } },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text: 'Volatility Score (Std Dev)', font: { color: base?'#cbd5e1':'#374151', size: 12 } } },
            showlegend: false,
          }}
          grainNum={12}
          title="Volatility Index (Box Plot by Sector)"
          subtitle="Spread = volatility distribution · Outliers shown as dots"
        />

        <PlotlyChart
          data={grain17}
          layout={{
            ...getPlotlyLayout('Fully Diluted Valuation Gap', 'FDV Gap = (Total Supply × Price) − Market Cap — unlock/inflation risk', base),
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text: 'Cryptocurrency', font: { color: base?'#cbd5e1':'#374151', size: 12 } }, tickangle: -45 },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text: 'FDV Gap (USD)', font: { color: base?'#cbd5e1':'#374151', size: 12 } }, tickformat: '$,.2s' },
            margin: { t: 80, r: 20, b: 100, l: 90 },
          }}
          grainNum={17}
          title="Fully Diluted Valuation Gap"
          subtitle="Top 40 coins by dilution pressure · Color = Sector"
        />

        <PlotlyChart
          data={grain25}
          layout={{
            ...getPlotlyLayout('Outlier Detection Matrix (Z-Score)', 'Top 50 statistical outliers across all key metrics — |Z| > 2 = outlier', base),
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text: 'Cryptocurrency', font: { color: base?'#cbd5e1':'#374151', size: 12 } }, tickangle: -60 },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text: 'Metric', font: { color: base?'#cbd5e1':'#374151', size: 12 } } },
            margin: { t: 80, r: 80, b: 120, l: 100 },
          }}
          grainNum={25}
          title="Outlier Detection Matrix"
          subtitle="Z-Score heatmap · Yellow = extreme outlier · Top 50 anomalous coins"
          fullWidth
        />
      </div>
    </section>
  );
}

export default LiquidityRisk;
