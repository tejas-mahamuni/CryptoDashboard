// SectorPriceAnalysis.jsx — Grains 6, 7, 8
import React, { useMemo } from 'react';
import { PieChart } from 'lucide-react';
import { PlotlyChart } from '../components/PlotlyChart';
import { getPlotlyLayout, SECTOR_COLORS, SECTOR_LIST, formatCurrency, formatPct } from '../utils';

export function SectorPriceAnalysis({ coins, isDark }) {

  // ══════════════════════════════════════════
  // GRAIN 6 — Sector-Based Performance Matrix
  // ══════════════════════════════════════════
  const grain6 = useMemo(() => {
    const sectorStats = {};
    SECTOR_LIST.forEach(s => {
      sectorStats[s] = { coins: 0, h1: 0, h24: 0, d7: 0, d30: 0, mcap: 0 };
    });

    coins.forEach(c => {
      const s = c.Sector;
      if (!sectorStats[s]) sectorStats[s] = { coins: 0, h1: 0, h24: 0, d7: 0, d30: 0, mcap: 0 };
      sectorStats[s].coins++;
      sectorStats[s].h1  += c['1h']  || 0;
      sectorStats[s].h24 += c['24h'] || 0;
      sectorStats[s].d7  += c['7d']  || 0;
      sectorStats[s].d30 += c['30d'] || 0;
      sectorStats[s].mcap += c['Market Cap'] || 0;
    });

    const sectors = Object.keys(sectorStats);
    const periods = ['1h Avg', '24h Avg', '7d Avg', '30d Avg'];

    const getAvg = (s, key, countKey = 'coins') =>
      sectorStats[s][countKey] > 0 ? sectorStats[s][key] / sectorStats[s][countKey] : 0;

    return [
      {
        type: 'bar',
        name: '1h Avg %',
        x: sectors,
        y: sectors.map(s => +getAvg(s, 'h1').toFixed(3)),
        marker: { color: '#6366f1', opacity: 0.85 },
        hovertemplate: '%{x}<br>1h Avg: %{y:.3f}%<extra></extra>',
      },
      {
        type: 'bar',
        name: '24h Avg %',
        x: sectors,
        y: sectors.map(s => +getAvg(s, 'h24').toFixed(3)),
        marker: { color: '#3b82f6', opacity: 0.85 },
        hovertemplate: '%{x}<br>24h Avg: %{y:.3f}%<extra></extra>',
      },
      {
        type: 'bar',
        name: '7d Avg %',
        x: sectors,
        y: sectors.map(s => +getAvg(s, 'd7').toFixed(3)),
        marker: { color: '#10b981', opacity: 0.85 },
        hovertemplate: '%{x}<br>7d Avg: %{y:.2f}%<extra></extra>',
      },
      {
        type: 'bar',
        name: '30d Avg %',
        x: sectors,
        y: sectors.map(s => +getAvg(s, 'd30').toFixed(3)),
        marker: { color: '#f59e0b', opacity: 0.85 },
        hovertemplate: '%{x}<br>30d Avg: %{y:.2f}%<extra></extra>',
      },
    ];
  }, [coins]);

  // ══════════════════════════════════════════
  // GRAIN 7 — Price Distribution & Accessibility Tiers
  // ══════════════════════════════════════════
  const grain7 = useMemo(() => {
    const bins   = [0, 0.01, 0.1, 1, 10, 100, 1000, 10000, Infinity];
    const labels = ['<$0.01', '$0.01-$0.1', '$0.1-$1', '$1-$10', '$10-$100', '$100-$1K', '$1K-$10K', '$10K+'];
    const counts = new Array(labels.length).fill(0);
    const mcaps  = new Array(labels.length).fill(0);

    coins.forEach(c => {
      if (c.Price <= 0) return;
      for (let i = 0; i < bins.length - 1; i++) {
        if (c.Price >= bins[i] && c.Price < bins[i + 1]) {
          counts[i]++;
          mcaps[i] += c['Market Cap'] || 0;
          break;
        }
      }
    });

    const pcts = counts.map(n => ((n / coins.length) * 100).toFixed(1));
    return [
      {
        type: 'bar',
        name: 'Coin Count',
        x: labels,
        y: counts,
        text: counts.map((c, i) => `${c} (${pcts[i]}%)`),
        textposition: 'outside',
        marker: {
          color: counts,
          colorscale: [[0,'#1e3a8a'],[0.3,'#2563eb'],[0.7,'#38bdf8'],[1,'#7dd3fc']],
          showscale: false,
        },
        hovertemplate: 'Price tier: %{x}<br>Count: %{y}<br>Percentage: %{text}<extra></extra>',
        yaxis: 'y',
      },
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Avg Market Cap',
        x: labels,
        y: mcaps.map((m, i) => counts[i] > 0 ? m / counts[i] : 0),
        yaxis: 'y2',
        line: { color: '#f59e0b', width: 2.5 },
        marker: { color: '#f59e0b', size: 8 },
        hovertemplate: 'Price tier: %{x}<br>Avg MCap: $%{y:,.0f}<extra></extra>',
      },
    ];
  }, [coins]);

  // ══════════════════════════════════════════
  // GRAIN 8 — Momentum Divergence Quadrant (1h vs 30d)
  // ══════════════════════════════════════════
  const grain8 = useMemo(() => {
    const filtered = coins.filter(
      c => isFinite(c['1h']) && isFinite(c['30d']) && c['Market Cap'] > 0
    );
    const sectorNames = [...new Set(filtered.map(c => c.Sector))];

    return sectorNames.map(sector => {
      const sc    = filtered.filter(c => c.Sector === sector);
      const sizes = sc.map(c => Math.max(Math.sqrt(c['Market Cap'] / 1e6), 4));
      return {
        type: 'scatter',
        mode: 'markers',
        name: sector,
        x: sc.map(c => c['1h']),
        y: sc.map(c => c['30d']),
        text: sc.map(c => c['Coin Name']),
        marker: {
          color: SECTOR_COLORS[sector] || '#6366f1',
          size: sizes.map(s => Math.min(s, 30)),
          opacity: 0.7,
          line: { width: 0.5, color: 'rgba(255,255,255,0.3)' },
        },
        customdata: sc.map(c => [c['Coin Name'], c['1h'], c['30d'], formatCurrency(c['Market Cap'])]),
        hovertemplate: '<b>%{customdata[0]}</b><br>1h: %{customdata[1]:.2f}%<br>30d: %{customdata[2]:.2f}%<br>MCap: %{customdata[3]}<extra></extra>',
      };
    });
  }, [coins]);

  const base = isDark;
  return (
    <section>
      <div className="section-header">
        <div className="section-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
          <PieChart size={18} color="white" />
        </div>
        <div>
          <h2 className="section-title">Sector & Price Analysis</h2>
          <p className="section-desc">Grains 6–8 · Sector intelligence, price tiers, momentum divergence</p>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        <PlotlyChart
          data={grain6}
          layout={{
            ...getPlotlyLayout(
              'Sector Performance Matrix',
              'Average returns per sector across all 4 timeframes',
              base
            ),
            barmode: 'group',
            xaxis: {
              ...getPlotlyLayout('','',base).xaxis,
              title: { text: 'Sector', font: { color: base ? '#cbd5e1' : '#374151', size: 12 } },
              tickangle: -20,
            },
            yaxis: {
              ...getPlotlyLayout('','',base).yaxis,
              title: { text: 'Avg Performance (%)', font: { color: base ? '#cbd5e1' : '#374151', size: 12 } },
              zeroline: true,
              zerolinecolor: base ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
              zerolinewidth: 1.5,
            },
            legend: { orientation: 'h', y: 1.08, x: 0, font: { color: base ? '#e2e8f0' : '#1e293b' } },
            margin: { t: 80, r: 20, b: 80, l: 70 },
          }}
          grainNum={6}
          title="Sector Performance Matrix"
          subtitle="5 sectors × 4 timeframes — averaged performance metrics"
        />

        <PlotlyChart
          data={grain7}
          layout={{
            ...getPlotlyLayout(
              'Price Distribution & Accessibility Tiers',
              '77%+ of cryptocurrencies trade under $1',
              base
            ),
            barmode: 'overlay',
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text: 'Price Range', font: { color: base ? '#cbd5e1' : '#374151', size: 12 } } },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text: 'Number of Coins', font: { color: base ? '#cbd5e1' : '#374151', size: 12 } } },
            yaxis2: {
              title: { text: 'Avg Market Cap ($)', font: { color: '#f59e0b', size: 12 } },
              overlaying: 'y',
              side: 'right',
              showgrid: false,
              tickfont: { color: '#f59e0b' },
              linecolor: '#f59e0b',
              tickformat: '$,.0s',
            },
            showlegend: true,
            legend: { orientation: 'h', y: 1.08, x: 0, font: { color: base ? '#e2e8f0' : '#1e293b' } },
            margin: { t: 80, r: 80, b: 80, l: 70 },
          }}
          grainNum={7}
          title="Price Distribution & Tiers"
          subtitle="Bars = coin count · Line = avg market cap per tier"
        />

        <PlotlyChart
          data={[
            ...grain8,
            // Quadrant lines
            {
              type: 'scatter', mode: 'lines', name: 'Zero 1h', showlegend: false,
              x: [0, 0], y: [-200, 1000], line: { color: base ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', dash: 'dash', width: 1.5 }
            },
            {
              type: 'scatter', mode: 'lines', name: 'Zero 30d', showlegend: false,
              x: [-50, 50], y: [0, 0], line: { color: base ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', dash: 'dash', width: 1.5 }
            },
          ]}
          layout={{
            ...getPlotlyLayout(
              'Momentum Divergence — 1h vs 30d',
              'Q1=Bulls · Q2=Reversal Up · Q3=Bears · Q4=Reversal Down',
              base
            ),
            xaxis: {
              ...getPlotlyLayout('','',base).xaxis,
              title: { text: '1h Change % (Short-Term)', font: { color: base ? '#cbd5e1' : '#374151', size: 12 } },
              zeroline: false,
            },
            yaxis: {
              ...getPlotlyLayout('','',base).yaxis,
              title: { text: '30d Change % (Long-Term)', font: { color: base ? '#cbd5e1' : '#374151', size: 12 } },
              zeroline: false,
            },
            annotations: [
              { x: 10,  y: 50,   text: '🟢 BULLS',          showarrow: false, font: { color: '#10b981', size: 13, family: 'Inter' } },
              { x: -10, y: 50,   text: '🔵 REVERSAL UP',    showarrow: false, font: { color: '#3b82f6', size: 13, family: 'Inter' } },
              { x: -10, y: -30,  text: '🔴 BEARS',           showarrow: false, font: { color: '#f43f5e', size: 13, family: 'Inter' } },
              { x: 10,  y: -30,  text: '🟡 REVERSAL DOWN',  showarrow: false, font: { color: '#f59e0b', size: 13, family: 'Inter' } },
            ],
            showlegend: true,
            legend: { orientation: 'h', y: 1.08, x: 0, font: { color: base ? '#e2e8f0' : '#1e293b' } },
            margin: { t: 90, r: 20, b: 70, l: 80 },
          }}
          grainNum={8}
          title="Momentum Divergence Quadrant"
          subtitle="1h% vs 30d% · Bubble size = Market Cap · Detects trend reversals"
        />
      </div>
    </section>
  );
}

export default SectorPriceAnalysis;
