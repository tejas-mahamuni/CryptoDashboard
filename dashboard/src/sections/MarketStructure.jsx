// MarketStructure.jsx — Grains 9, 16, 21, 22, 24
import React, { useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import { PlotlyChart } from '../components/PlotlyChart';
import { getPlotlyLayout, SECTOR_COLORS, formatCurrency, formatPct, mcapTier, priceTier } from '../utils';

export function MarketStructure({ coins, isDark }) {
  const base = isDark;

  // ══════════════════════════════════════════
  // GRAIN 9 — Market Concentration (Lorenz/Pareto)
  // ══════════════════════════════════════════
  const grain9 = useMemo(() => {
    const sorted     = [...coins].sort((a, b) => a['Market Cap'] - b['Market Cap']);
    const total      = sorted.reduce((s, c) => s + (c['Market Cap'] || 0), 0);
    const n          = sorted.length;

    let cumMcap = 0;
    const xPct  = [];
    const yPct  = [];
    sorted.forEach((c, i) => {
      cumMcap += (c['Market Cap'] || 0);
      xPct.push(((i + 1) / n) * 100);
      yPct.push((cumMcap / total) * 100);
    });

    // Find top 2.4% mark (top 100 coins)
    const top100Pct = (coins.length - 100) / coins.length * 100;
    const top100MCap = coins.slice(0, 100).reduce((s, c) => s + (c['Market Cap'] || 0), 0) / total * 100;

    return [
      {
        type: 'scatter',
        mode: 'lines',
        name: 'Lorenz Curve (Actual)',
        x: xPct,
        y: yPct,
        line: { color: '#3b82f6', width: 2.5 },
        fill: 'tozeroy',
        fillcolor: 'rgba(59,130,246,0.1)',
        hovertemplate: 'Poorest %{x:.1f}% coins<br>Control %{y:.1f}% of market<extra></extra>',
      },
      {
        type: 'scatter',
        mode: 'lines',
        name: 'Perfect Equality Line',
        x: [0, 100],
        y: [0, 100],
        line: { color: '#f43f5e', width: 1.5, dash: 'dash' },
        hoverinfo: 'skip',
      },
      {
        type: 'scatter',
        mode: 'markers+text',
        name: `Top 100 (${(100/coins.length*100).toFixed(1)}%) control ${top100MCap.toFixed(0)}%`,
        x: [100 - 100/coins.length * 100],
        y: [top100MCap],
        text: [`Top 100: ${top100MCap.toFixed(0)}%`],
        textposition: 'top left',
        marker: { color: '#f59e0b', size: 12, symbol: 'star' },
        textfont: { color: '#f59e0b', size: 11 },
      },
    ];
  }, [coins]);

  // ══════════════════════════════════════════
  // GRAIN 16 — Market Cap Tiers Battle
  // ══════════════════════════════════════════
  const grain16 = useMemo(() => {
    const tierDef = [
      { label: 'Mega-cap\n(#1-10)',    filter: c => c.Rank <= 10 },
      { label: 'Large-cap\n(#11-50)',  filter: c => c.Rank > 10  && c.Rank <= 50  },
      { label: 'Mid-cap\n(#51-200)',   filter: c => c.Rank > 50  && c.Rank <= 200 },
      { label: 'Small-cap\n(#201-1K)', filter: c => c.Rank > 200 && c.Rank <= 1000 },
      { label: 'Micro-cap\n(#1K+)',    filter: c => c.Rank > 1000 },
    ];

    const stats = tierDef.map(({ label, filter }) => {
      const tc  = coins.filter(filter);
      const avg = k => tc.length ? tc.reduce((s, c) => s + (c[k] || 0), 0) / tc.length : 0;
      return { label, count: tc.length, d24: avg('24h'), d7: avg('7d'), d30: avg('30d') };
    });

    return [
      {
        type: 'bar', name: '24h Avg %',
        x: stats.map(s => s.label.replace('\n', ' ')),
        y: stats.map(s => +s.d24.toFixed(3)),
        marker: { color: '#6366f1', opacity: 0.85 },
        hovertemplate: '%{x}<br>24h Avg: %{y:.3f}%<extra></extra>',
      },
      {
        type: 'bar', name: '7d Avg %',
        x: stats.map(s => s.label.replace('\n', ' ')),
        y: stats.map(s => +s.d7.toFixed(2)),
        marker: { color: '#3b82f6', opacity: 0.85 },
        hovertemplate: '%{x}<br>7d Avg: %{y:.2f}%<extra></extra>',
      },
      {
        type: 'bar', name: '30d Avg %',
        x: stats.map(s => s.label.replace('\n', ' ')),
        y: stats.map(s => +s.d30.toFixed(2)),
        marker: { color: '#10b981', opacity: 0.85 },
        hovertemplate: '%{x}<br>30d Avg: %{y:.2f}%<extra></extra>',
      },
    ];
  }, [coins]);

  // ══════════════════════════════════════════
  // GRAIN 21 — Penny Stocks vs Blue Chips
  // ══════════════════════════════════════════
  const grain21 = useMemo(() => {
    const tiers   = ['Penny (<$0.01)', 'Fractional ($0.01-$1)', 'Low ($1-$10)', 'Mid ($10-$100)', 'High ($100-$1K)', 'Blue Chip ($1K+)'];
    const tierData = {};
    tiers.forEach(t => { tierData[t] = { count: 0, mcap: 0, perf: 0, vol: 0 }; });

    coins.forEach(c => {
      if (c.Price <= 0) return;
      const t = priceTier(c.Price);
      if (!tierData[t]) return;
      tierData[t].count++;
      tierData[t].mcap  += c['Market Cap'] || 0;
      tierData[t].perf  += c['30d'] || 0;
      tierData[t].vol   += c['24h Volume'] || 0;
    });

    const validTiers = tiers.filter(t => tierData[t].count > 0);
    const avgPerf    = validTiers.map(t => tierData[t].count > 0 ? tierData[t].perf / tierData[t].count : 0);

    return [
      {
        type: 'bar',
        name: 'Coin Count',
        x: validTiers.map(t => t.split(' ')[0]), // short label
        y: validTiers.map(t => tierData[t].count),
        customdata: validTiers.map(t => [t, tierData[t].count, formatCurrency(tierData[t].mcap / tierData[t].count || 0)]),
        marker: { color: validTiers.map((_, i) => `hsl(${210 + i * 30},70%,50%)`), opacity: 0.85 },
        hovertemplate: '<b>%{customdata[0]}</b><br>Count: %{customdata[1]}<br>Avg MCap: %{customdata[2]}<extra></extra>',
      },
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Avg 30d Performance %',
        x: validTiers.map(t => t.split(' ')[0]),
        y: avgPerf.map(v => +v.toFixed(2)),
        yaxis: 'y2',
        line: { color: '#f59e0b', width: 2.5 },
        marker: { color: '#f59e0b', size: 9 },
        hovertemplate: '%{x}<br>Avg 30d: %{y:.2f}%<extra></extra>',
      },
    ];
  }, [coins]);

  // ══════════════════════════════════════════
  // GRAIN 22 — Volume Leaders vs Silent Giants (Quadrant Scatter)
  // ══════════════════════════════════════════
  const grain22 = useMemo(() => {
    const filtered  = coins.filter(c => c['Market Cap'] > 0 && c['24h Volume'] > 0);
    const medMcap   = median(filtered.map(c => c['Market Cap']));
    const medVol    = median(filtered.map(c => c['24h Volume']));

    const quadrant  = c => {
      const hi_mcap = c['Market Cap'] >= medMcap;
      const hi_vol  = c['24h Volume'] >= medVol;
      if (hi_mcap  && hi_vol)  return { q: 'Liquid Leaders',   color: '#10b981' };
      if (hi_mcap  && !hi_vol) return { q: 'Silent Giants',    color: '#6366f1' };
      if (!hi_mcap && hi_vol)  return { q: 'Speculation Zone', color: '#f43f5e' };
      return                          { q: 'Neglected Coins',  color: '#94a3b8' };
    };

    const quadrants = {
      'Liquid Leaders':   { x: [], y: [], text: [] },
      'Silent Giants':    { x: [], y: [], text: [] },
      'Speculation Zone': { x: [], y: [], text: [] },
      'Neglected Coins':  { x: [], y: [], text: [] },
    };
    const qColors = {
      'Liquid Leaders': '#10b981', 'Silent Giants': '#6366f1',
      'Speculation Zone': '#f43f5e', 'Neglected Coins': '#94a3b8',
    };

    filtered.forEach(c => {
      const { q } = quadrant(c);
      quadrants[q].x.push(c['Market Cap']);
      quadrants[q].y.push(c['24h Volume']);
      quadrants[q].text.push(c['Coin Name']);
    });

    return Object.entries(quadrants).map(([q, d]) => ({
      type: 'scatter',
      mode: 'markers',
      name: q,
      x: d.x,
      y: d.y,
      text: d.text,
      marker: { color: qColors[q], size: 6, opacity: 0.7, line: { width: 0.5, color: 'rgba(255,255,255,0.2)' } },
      hovertemplate: '<b>%{text}</b><br>MCap: $%{x:,.0f}<br>Volume: $%{y:,.0f}<extra></extra>',
    }));
  }, [coins]);

  // ══════════════════════════════════════════
  // GRAIN 24 — Rank Stability Index
  // ══════════════════════════════════════════
  const grain24 = useMemo(() => {
    const sectorNames = [...new Set(coins.map(c => c.Sector))];
    return sectorNames.map(sector => {
      const sc = coins.filter(c => c.Sector === sector);
      return {
        type: 'scatter',
        mode: 'markers',
        name: sector,
        x: sc.map(c => c.Rank),
        y: sc.map(c => c['30d']),
        text: sc.map(c => c['Coin Name']),
        marker: {
          color: SECTOR_COLORS[sector] || '#6366f1',
          size: 6,
          opacity: 0.65,
          line: { width: 0.3, color: 'rgba(255,255,255,0.2)' },
        },
        customdata: sc.map(c => [c['Coin Name'], c.Rank, c['30d'], formatCurrency(c['Market Cap'])]),
        hovertemplate: '<b>%{customdata[0]}</b><br>Rank: #%{customdata[1]}<br>30d: %{customdata[2]:.2f}%<br>MCap: %{customdata[3]}<extra></extra>',
      };
    });
  }, [coins]);

  return (
    <section>
      <div className="section-header">
        <div className="section-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <BarChart2 size={18} color="white" />
        </div>
        <div>
          <h2 className="section-title">Market Structure</h2>
          <p className="section-desc">Grains 9, 16, 21, 22, 24 · Concentration, tiers, and competitive dynamics</p>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <PlotlyChart
          data={grain9}
          layout={{
            ...getPlotlyLayout('Market Concentration — Lorenz Curve', 'How unevenly market cap is distributed', base),
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text: 'Cumulative % of Coins (ranked by cap)', font: { color: base?'#cbd5e1':'#374151', size:12 } }, range: [0,100] },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text: 'Cumulative % of Total Market Cap', font: { color: base?'#cbd5e1':'#374151', size:12 } }, range: [0,100] },
            showlegend: true,
            legend: { orientation: 'h', y: 1.1, x: 0, font: { color: base?'#e2e8f0':'#1e293b' } },
          }}
          grainNum={9}
          title="Lorenz Curve — Market Concentration"
          subtitle="Blue = actual distribution · Red = perfect equality · Gold star = Top 100"
        />

        <PlotlyChart
          data={grain16}
          layout={{
            ...getPlotlyLayout('Market Cap Tiers — Risk/Return Analysis', 'Small-cap premium effect across tiers', base),
            barmode: 'group',
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text: 'Market Cap Tier', font: { color: base?'#cbd5e1':'#374151', size:12 } } },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text: 'Avg Performance (%)', font: { color: base?'#cbd5e1':'#374151', size:12 } },
              zeroline: true, zerolinecolor: base?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.2)', zerolinewidth: 1.5 },
            legend: { orientation: 'h', y: 1.1, x: 0, font: { color: base?'#e2e8f0':'#1e293b' } },
            margin: { t: 80, r: 20, b: 70, l: 80 },
          }}
          grainNum={16}
          title="Market Cap Tiers Battle"
          subtitle="Mega-cap to Micro-cap performance comparison across timeframes"
        />

        <PlotlyChart
          data={grain21}
          layout={{
            ...getPlotlyLayout('Penny Stocks vs Blue Chips', 'Price accessibility vs investment quality', base),
            barmode: 'stack',
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text: 'Price Tier', font: { color: base?'#cbd5e1':'#374151', size:12 } } },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text: 'Number of Coins', font: { color: base?'#cbd5e1':'#374151', size:12 } } },
            yaxis2: {
              title: { text: 'Avg 30d Performance %', font: { color: '#f59e0b', size: 12 } },
              overlaying: 'y', side: 'right', showgrid: false,
              tickfont: { color: '#f59e0b' }, linecolor: '#f59e0b',
            },
            legend: { orientation: 'h', y: 1.1, x: 0, font: { color: base?'#e2e8f0':'#1e293b' } },
            margin: { t: 80, r: 80, b: 60, l: 70 },
          }}
          grainNum={21}
          title="Penny Stocks vs Blue Chips"
          subtitle="Bars = coin count · Line = avg 30d performance per tier"
        />

        <PlotlyChart
          data={[
            ...grain22,
            // Median reference lines
            { type:'scatter', mode:'lines', name:'Median MCap', x:[median(coins.filter(c=>c['Market Cap']>0).map(c=>c['Market Cap'])), median(coins.filter(c=>c['Market Cap']>0).map(c=>c['Market Cap']))], y:[1,1e14], line: { color: base?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.2)', dash:'dot', width:1 }, showlegend:false },
            { type:'scatter', mode:'lines', name:'Median Volume', x:[1,1e14], y:[median(coins.filter(c=>c['24h Volume']>0).map(c=>c['24h Volume'])), median(coins.filter(c=>c['24h Volume']>0).map(c=>c['24h Volume']))], line: { color: base?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.2)', dash:'dot', width:1 }, showlegend:false },
          ]}
          layout={{
            ...getPlotlyLayout('Volume Leaders vs Silent Giants', 'Log-log quadrant reveals liquidity mismatches', base),
            xaxis: { ...getPlotlyLayout('','',base).xaxis, type:'log', title: { text:'Market Cap (log)', font:{color:base?'#cbd5e1':'#374151',size:12} }, tickformat:'$,.0s' },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, type:'log', title: { text:'24h Volume (log)', font:{color:base?'#cbd5e1':'#374151',size:12} }, tickformat:'$,.0s' },
            legend: { orientation:'h', y:1.1, x:0, font:{color:base?'#e2e8f0':'#1e293b'} },
          }}
          grainNum={22}
          title="Volume Leaders vs Silent Giants"
          subtitle="4 market quadrants by liquidity · Log-log scale"
        />

        <PlotlyChart
          data={grain24}
          layout={{
            ...getPlotlyLayout('Rank Stability Index', 'High rank + high 30d performance = position defense', base),
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text:'Market Rank', font:{color:base?'#cbd5e1':'#374151',size:12} }, autorange:'reversed' },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text:'30d Change %', font:{color:base?'#cbd5e1':'#374151',size:12} },
              zeroline:true, zerolinecolor:base?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.2)', zerolinewidth:1.5 },
            legend: { orientation:'h', y:1.1, x:0, font:{color:base?'#e2e8f0':'#1e293b'} },
          }}
          grainNum={24}
          title="Rank Stability Index"
          subtitle="Rank vs 30d% · Color = Sector · Reversed X-axis (rank 1 = most valuable)"
        />
      </div>
    </section>
  );
}

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export default MarketStructure;
