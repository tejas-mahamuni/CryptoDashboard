// SectorDeepDives.jsx — Grains 18, 19, 20
import React, { useMemo } from 'react';
import { Layers } from 'lucide-react';
import { PlotlyChart } from '../components/PlotlyChart';
import { getPlotlyLayout, SECTOR_COLORS, formatCurrency, formatPct } from '../utils';

function stdDev(arr) {
  const valid = arr.filter(v => isFinite(v) && v !== null);
  if (!valid.length) return 0;
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  return Math.sqrt(valid.reduce((a, b) => a + (b - mean) ** 2, 0) / valid.length);
}

export function SectorDeepDives({ coins, isDark }) {
  const base = isDark;

  // Sector subsets
  const defiCoins     = useMemo(() => coins.filter(c => c.Sector === 'DeFi'), [coins]);
  const infraCoins    = useMemo(() => coins.filter(c => c.Sector === 'Infrastructure/L1/L2'), [coins]);
  const memeCoins     = useMemo(() => coins.filter(c => c.Sector === 'Memecoin'), [coins]);
  const stableCoins   = useMemo(() => coins.filter(c => c.Sector === 'Stablecoin'), [coins]);

  // ══════════════════════════════════════════
  // GRAIN 18 — DeFi vs Infrastructure Race
  // ══════════════════════════════════════════
  const grain18 = useMemo(() => {
    const periods = ['1h', '24h', '7d', '30d'];
    const avg = (group, p) => group.length ? group.reduce((s, c) => s + (c[p] || 0), 0) / group.length : 0;

    const defiAvgs  = periods.map(p => +avg(defiCoins, p).toFixed(3));
    const infraAvgs = periods.map(p => +avg(infraCoins, p).toFixed(3));

    return [
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: `DeFi (${defiCoins.length} coins)`,
        x: periods.map(p => `${p}%`),
        y: defiAvgs,
        line: { color: SECTOR_COLORS['DeFi'], width: 3 },
        marker: { color: SECTOR_COLORS['DeFi'], size: 12, symbol: 'circle' },
        fill: 'tozeroy',
        fillcolor: 'rgba(16,185,129,0.12)',
        hovertemplate: 'DeFi<br>%{x}: %{y:.3f}%<extra></extra>',
      },
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: `Infrastructure/L1/L2 (${infraCoins.length} coins)`,
        x: periods.map(p => `${p}%`),
        y: infraAvgs,
        line: { color: SECTOR_COLORS['Infrastructure/L1/L2'], width: 3 },
        marker: { color: SECTOR_COLORS['Infrastructure/L1/L2'], size: 12, symbol: 'diamond' },
        fill: 'tozeroy',
        fillcolor: 'rgba(59,130,246,0.12)',
        hovertemplate: 'Infrastructure<br>%{x}: %{y:.3f}%<extra></extra>',
      },
    ];
  }, [defiCoins, infraCoins]);

  // Add sector stat bars (total volume, market cap)
  const grain18bars = useMemo(() => {
    const labels = ['DeFi', 'Infrastructure/L1/L2'];
    const mcaps  = [
      defiCoins.reduce((s, c) => s + (c['Market Cap'] || 0), 0),
      infraCoins.reduce((s, c) => s + (c['Market Cap'] || 0), 0),
    ];
    const vols = [
      defiCoins.reduce((s, c) => s + (c['24h Volume'] || 0), 0),
      infraCoins.reduce((s, c) => s + (c['24h Volume'] || 0), 0),
    ];
    return [
      {
        type: 'bar', name: 'Total Market Cap',
        x: labels, y: mcaps,
        marker: { color: labels.map(l => SECTOR_COLORS[l]), opacity: 0.85 },
        hovertemplate: '%{x}<br>Market Cap: $%{y:,.0f}<extra></extra>',
      },
      {
        type: 'bar', name: '24h Volume',
        x: labels, y: vols,
        marker: { color: labels.map(l => SECTOR_COLORS[l]), opacity: 0.55 },
        hovertemplate: '%{x}<br>Volume: $%{y:,.0f}<extra></extra>',
      },
    ];
  }, [defiCoins, infraCoins]);

  // ══════════════════════════════════════════
  // GRAIN 19 — Memecoin Madness Meter
  // ══════════════════════════════════════════
  const grain19 = useMemo(() => {
    if (!memeCoins.length) return [];
    const enriched = memeCoins
      .filter(c => isFinite(c['30d']) && c['24h Volume'] > 0)
      .map(c => ({
        ...c,
        VolScore: stdDev([c['1h'], c['24h'], c['7d'], c['30d']]),
        BubbleSize: Math.max(Math.sqrt(c['24h Volume'] / 1e4), 4),
      }));

    const maxPerf = Math.max(...enriched.map(c => Math.abs(c['30d'])));

    return [{
      type: 'scatter',
      mode: 'markers+text',
      name: 'Memecoins',
      x: enriched.map(c => c['30d']),
      y: enriched.map(c => c.VolScore),
      text: enriched.map(c => c.Symbol),
      textposition: 'top center',
      textfont: { size: 9, color: base ? '#cbd5e1' : '#374151' },
      marker: {
        size: enriched.map(c => Math.min(c.BubbleSize, 50)),
        color: enriched.map(c => c['30d']),
        colorscale: [[0,'#f43f5e'],[0.5,'#f59e0b'],[1,'#10b981']],
        showscale: true,
        colorbar: { title: '30d %', thickness: 12 },
        opacity: 0.8,
        line: { color: 'rgba(255,255,255,0.3)', width: 1 },
      },
      customdata: enriched.map(c => [c['Coin Name'], c['30d'], c.VolScore.toFixed(2), formatCurrency(c['24h Volume'])]),
      hovertemplate: '<b>%{customdata[0]}</b><br>30d: %{customdata[1]:.2f}%<br>Volatility: %{customdata[2]}<br>Volume: %{customdata[3]}<extra></extra>',
    }];
  }, [memeCoins, base]);

  // ══════════════════════════════════════════
  // GRAIN 20 — Stablecoin De-pegging Dashboard
  // ══════════════════════════════════════════
  const grain20Data = useMemo(() => {
    if (!stableCoins.length) return [];
    const sorted = [...stableCoins].sort((a, b) => Math.abs(a.Price - 1.0) - Math.abs(b.Price - 1.0)).reverse();
    return sorted.map(c => ({
      ...c,
      deviation: c.Price - 1.0,
      deviationPct: ((c.Price - 1.0) / 1.0) * 100,
    }));
  }, [stableCoins]);

  const grain20 = useMemo(() => {
    if (!grain20Data.length) return [];
    return [
      // Price deviation bars
      {
        type: 'bar',
        name: 'Price Deviation from $1',
        x: grain20Data.map(c => c.Symbol),
        y: grain20Data.map(c => +c.deviation.toFixed(6)),
        marker: {
          color: grain20Data.map(c =>
            Math.abs(c.deviationPct) > 2 ? '#f43f5e' :
            Math.abs(c.deviationPct) > 0.5 ? '#f59e0b' : '#10b981'
          ),
          opacity: 0.85,
          cornerradius: 2,
        },
        customdata: grain20Data.map(c => [c['Coin Name'], c.Price.toFixed(6), c.deviationPct.toFixed(4)+'%', formatCurrency(c['Market Cap'])]),
        hovertemplate: '<b>%{customdata[0]}</b><br>Price: $%{customdata[1]}<br>Deviation: %{customdata[2]}<br>MCap: %{customdata[3]}<extra></extra>',
        yaxis: 'y',
      },
      // 24h change line
      {
        type: 'scatter',
        mode: 'markers',
        name: '24h % Change',
        x: grain20Data.map(c => c.Symbol),
        y: grain20Data.map(c => c['24h']),
        yaxis: 'y2',
        marker: { color: '#6366f1', size: 8, symbol: 'diamond' },
        hovertemplate: '%{x}<br>24h change: %{y:.4f}%<extra></extra>',
      },
    ];
  }, [grain20Data]);

  return (
    <section>
      <div className="section-header">
        <div className="section-icon" style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}>
          <Layers size={18} color="white" />
        </div>
        <div>
          <h2 className="section-title">Sector Deep-Dives</h2>
          <p className="section-desc">Grains 18–20 · DeFi vs Infrastructure, Memecoin madness, Stablecoin risk</p>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Grain 18 — Performance Race */}
        <PlotlyChart
          data={grain18}
          layout={{
            ...getPlotlyLayout('DeFi vs Infrastructure — Performance Race', `4 timeframe comparison · DeFi=(${defiCoins.length} coins) vs Infra=(${infraCoins.length} coins)`, base),
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text: 'Time Period', font: { color: base?'#cbd5e1':'#374151', size: 12 } } },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text: 'Avg Performance (%)', font: { color: base?'#cbd5e1':'#374151', size: 12 } },
              zeroline: true, zerolinecolor: base?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.2)', zerolinewidth: 1.5 },
            legend: { orientation: 'h', y: 1.1, x: 0, font: { color: base?'#e2e8f0':'#1e293b' } },
          }}
          grainNum={18}
          title="DeFi vs Infrastructure Race"
          subtitle="Average performance trajectory across all 4 timeframes"
        />

        {/* Grain 18b — Market cap/volume comparison */}
        <PlotlyChart
          data={grain18bars}
          layout={{
            ...getPlotlyLayout('DeFi vs Infrastructure — Capital & Volume', 'Total market cap and trading volume comparison', base),
            barmode: 'group',
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text: 'Sector', font: { color: base?'#cbd5e1':'#374151', size: 12 } } },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text: 'Total USD Value', font: { color: base?'#cbd5e1':'#374151', size: 12 } }, tickformat: '$,.2s' },
            legend: { orientation: 'h', y: 1.1, x: 0, font: { color: base?'#e2e8f0':'#1e293b' } },
          }}
          grainNum="18b"
          title="DeFi vs Infrastructure — Capital"
          subtitle="Total market cap vs total 24h volume"
        />

        {/* Grain 19 — Memecoin Madness */}
        <PlotlyChart
          data={grain19}
          layout={{
            ...getPlotlyLayout('Memecoin Madness Meter', `All ${memeCoins.length} memecoins · Bubble size = 24h volume · Color = 30d performance`, base),
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text: '30d Performance (%)', font: { color: base?'#cbd5e1':'#374151', size: 12 } },
              zeroline: true, zerolinecolor: base?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.2)', zerolinewidth: 1.5 },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text: 'Volatility Score', font: { color: base?'#cbd5e1':'#374151', size: 12 } } },
            annotations: [
              { x: 50, y:   80, text: '🚀 Pump & Volume', showarrow: false, font: { color: '#10b981', size: 12, family: 'Inter' } },
              { x: -50, y:  80, text: '💀 Dump & Volatile', showarrow: false, font: { color: '#f43f5e', size: 12, family: 'Inter' } },
              { x: 50, y:    5, text: '😴 Stable Gainers', showarrow: false, font: { color: '#f59e0b', size: 12, family: 'Inter' } },
            ],
            showlegend: false,
          }}
          grainNum={19}
          title="Memecoin Madness Meter"
          subtitle={`All ${memeCoins.length} memecoins · X=30d% · Y=Volatility · Size=Volume`}
        />

        {/* Grain 20 — Stablecoin De-pegging */}
        <PlotlyChart
          data={grain20}
          layout={{
            ...getPlotlyLayout('Stablecoin De-pegging Risk Dashboard', `All ${stableCoins.length} stablecoins · Price deviation from $1.00 · Red > ±2%`, base),
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text: 'Stablecoin', font: { color: base?'#cbd5e1':'#374151', size: 12 } }, tickangle: -45 },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text: 'Price Deviation from $1.00', font: { color: base?'#cbd5e1':'#374151', size: 12 } },
              zeroline: true, zerolinecolor: base?'rgba(255,255,255,0.4)':'rgba(0,0,0,0.3)', zerolinewidth: 2 },
            yaxis2: {
              title: { text: '24h % Change', font: { color: '#6366f1', size: 12 } },
              overlaying: 'y', side: 'right', showgrid: false,
              tickfont: { color: '#6366f1' }, linecolor: '#6366f1',
            },
            legend: { orientation: 'h', y: 1.1, x: 0, font: { color: base?'#e2e8f0':'#1e293b' } },
            margin: { t: 80, r: 80, b: 120, l: 90 },
            shapes: [
              { type:'line', x0:0, x1:1, y0:0.02, y1:0.02, xref:'paper', line:{color:'#f43f5e',dash:'dot',width:1.5} },
              { type:'line', x0:0, x1:1, y0:-0.02, y1:-0.02, xref:'paper', line:{color:'#f43f5e',dash:'dot',width:1.5} },
              { type:'line', x0:0, x1:1, y0:0.005, y1:0.005, xref:'paper', line:{color:'#f59e0b',dash:'dot',width:1} },
              { type:'line', x0:0, x1:1, y0:-0.005, y1:-0.005, xref:'paper', line:{color:'#f59e0b',dash:'dot',width:1} },
            ],
          }}
          grainNum={20}
          title="Stablecoin De-pegging Risk"
          subtitle="All stablecoins · Green safe · Yellow warning · Red ±2%+ de-pegged"
        />
      </div>
    </section>
  );
}

export default SectorDeepDives;
