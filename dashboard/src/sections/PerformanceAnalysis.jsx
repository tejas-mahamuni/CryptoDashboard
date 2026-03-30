// PerformanceAnalysis.jsx — Grains 13, 14, 15, 23
import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { PlotlyChart } from '../components/PlotlyChart';
import { getPlotlyLayout, SECTOR_COLORS, formatCurrency, formatPct } from '../utils';

export function PerformanceAnalysis({ coins, isDark }) {
  const base = isDark;

  // ══════════════════════════════════════════
  // GRAIN 13 — Performance Consistency Classification
  // ══════════════════════════════════════════
  const grain13 = useMemo(() => {
    const classify = coin => {
      const pos = [coin['1h'], coin['24h'], coin['7d'], coin['30d']].filter(v => v > 0).length;
      if (pos === 4) return 'All-Positive';
      if (pos === 3) return 'Mostly Positive';
      if (pos === 2) return 'Mixed';
      if (pos === 1) return 'Mostly Negative';
      return 'All-Negative';
    };

    const cats  = ['All-Positive', 'Mostly Positive', 'Mixed', 'Mostly Negative', 'All-Negative'];
    const stats = {};
    cats.forEach(c => stats[c] = { count: 0, mcap: 0 });
    coins.forEach(coin => {
      const cat = classify(coin);
      stats[cat].count++;
      stats[cat].mcap += coin['Market Cap'] || 0;
    });

    const colors = { 'All-Positive':'#10b981', 'Mostly Positive':'#34d399', 'Mixed':'#f59e0b', 'Mostly Negative':'#fb7185', 'All-Negative':'#f43f5e' };

    return [
      {
        type: 'bar',
        name: 'Coin Count',
        x: cats,
        y: cats.map(c => stats[c].count),
        marker: { color: cats.map(c => colors[c]), opacity: 0.9 },
        text: cats.map(c => stats[c].count),
        textposition: 'outside',
        hovertemplate: '%{x}<br>Coins: %{y}<br>Avg MCap: $%{customdata:,.0f}<extra></extra>',
        customdata: cats.map(c => stats[c].count > 0 ? stats[c].mcap / stats[c].count : 0),
      },
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Avg Market Cap',
        x: cats,
        y: cats.map(c => stats[c].count > 0 ? stats[c].mcap / stats[c].count : 0),
        yaxis: 'y2',
        line: { color: '#6366f1', width: 2.5 },
        marker: { color: '#6366f1', size: 9 },
        hovertemplate: '%{x}<br>Avg MCap: $%{y:,.0f}<extra></extra>',
      },
    ];
  }, [coins]);

  // ══════════════════════════════════════════
  // GRAIN 14 — Bitcoin Correlation Index
  // ══════════════════════════════════════════
  const grain14 = useMemo(() => {
    const btc = coins.find(c => c.Symbol === 'BTC');
    if (!btc) return [];

    const others = coins.filter(c => c.Symbol !== 'BTC' && c['Market Cap'] > 1e6);
    const sectorNames = [...new Set(others.map(c => c.Sector))];

    return sectorNames.map(sector => {
      const sc = others.filter(c => c.Sector === sector);
      return {
        type: 'scatter',
        mode: 'markers',
        name: sector,
        x: sc.map(() => btc['30d']),
        y: sc.map(c => c['30d']),
        text: sc.map(c => c['Coin Name']),
        marker: {
          color: SECTOR_COLORS[sector] || '#6366f1',
          size: sc.map(c => Math.max(Math.sqrt(c['Market Cap'] / 5e6), 4)),
          opacity: 0.65,
          line: { width: 0.5, color: 'rgba(255,255,255,0.2)' },
        },
        customdata: sc.map(c => [c['Coin Name'], c['30d'], c.Sector, formatCurrency(c['Market Cap'])]),
        hovertemplate: '<b>%{customdata[0]}</b><br>30d: %{customdata[1]:.2f}%<br>BTC 30d: %{x:.2f}%<br>MCap: %{customdata[3]}<extra></extra>',
      };
    });
  }, [coins]);

  // ══════════════════════════════════════════
  // GRAIN 15 — Top Gainers vs Top Losers (Diverging Bar)
  // ══════════════════════════════════════════
  const grain15 = useMemo(() => {
    const sorted   = [...coins].filter(c => isFinite(c['30d'])).sort((a, b) => b['30d'] - a['30d']);
    const gainers  = sorted.slice(0, 25);
    const losers   = sorted.slice(-25).reverse();

    return [
      {
        type: 'bar',
        name: 'Top 25 Gainers (30d)',
        x: gainers.map(c => c['30d']),
        y: gainers.map(c => c.Symbol),
        orientation: 'h',
        marker: {
          color: '#10b981',
          opacity: 0.85,
          cornerradius: 2,
        },
        customdata: gainers.map(c => [c['Coin Name'], c['30d'], c.Sector, formatCurrency(c['Market Cap'])]),
        hovertemplate: '<b>%{customdata[0]}</b><br>30d: +%{x:.1f}%<br>Sector: %{customdata[2]}<br>MCap: %{customdata[3]}<extra></extra>',
        xaxis: 'x',
      },
      {
        type: 'bar',
        name: 'Top 25 Losers (30d)',
        x: losers.map(c => c['30d']),
        y: losers.map(c => c.Symbol),
        orientation: 'h',
        marker: {
          color: '#f43f5e',
          opacity: 0.85,
          cornerradius: 2,
        },
        customdata: losers.map(c => [c['Coin Name'], c['30d'], c.Sector, formatCurrency(c['Market Cap'])]),
        hovertemplate: '<b>%{customdata[0]}</b><br>30d: %{x:.1f}%<br>Sector: %{customdata[2]}<br>MCap: %{customdata[3]}<extra></extra>',
        xaxis: 'x2',
      },
    ];
  }, [coins]);

  // ══════════════════════════════════════════
  // GRAIN 23 — Performance Acceleration Analysis
  // ══════════════════════════════════════════
  const grain23 = useMemo(() => {
    const classify = coin => {
      const vals = [coin['1h'], coin['24h'], coin['7d'], coin['30d']];
      let acc = 0;
      for (let i = 1; i < vals.length; i++) {
        if (vals[i] > vals[i - 1]) acc++;
        else acc--;
      }
      if (acc >= 2)  return 'Accelerating';
      if (acc === 0) return 'Steady';
      if (acc <= -2) return 'Decelerating';
      return 'Reversal';
    };

    const cats   = ['Accelerating', 'Steady', 'Reversal', 'Decelerating'];
    const colors = { Accelerating: '#10b981', Steady: '#3b82f6', Reversal: '#f59e0b', Decelerating: '#f43f5e' };

    // Pick top 30 accelerating + top 30 decelerating for slope chart
    const classified = coins.map(c => ({ ...c, momentum: classify(c) }));
    const topAcc  = classified.filter(c => c.momentum === 'Accelerating')
      .sort((a, b) => b['30d'] - a['30d']).slice(0, 25);
    const topDec  = classified.filter(c => c.momentum === 'Decelerating')
      .sort((a, b) => a['30d'] - b['30d']).slice(0, 25);

    const makeTrace = (group, color, name) => group.map(c => ({
      type: 'scatter',
      mode: 'lines+markers',
      name,
      legendgroup: name,
      showlegend: false,
      x: ['1h', '24h', '7d', '30d'],
      y: [c['1h'], c['24h'], c['7d'], c['30d']],
      line: { color, width: 1.5, shape: 'spline' },
      marker: { color, size: 5 },
      opacity: 0.6,
      hovertemplate: `<b>${c['Coin Name']}</b><br>%{x}: %{y:.2f}%<extra></extra>`,
      text: c['Coin Name'],
    }));

    const accTraces = makeTrace(topAcc, '#10b981', 'Accelerating');
    const decTraces = makeTrace(topDec, '#f43f5e', 'Decelerating');

    // Add category summary trace
    const catCounts = {};
    cats.forEach(cat => catCounts[cat] = classified.filter(c => c.momentum === cat).length);

    return [
      ...accTraces,
      ...decTraces,
      {
        type: 'scatter', mode: 'lines', name: 'Accelerating (legend)',
        x: [], y: [], line: { color: '#10b981', width: 3 }, showlegend: true, legendrank: 1,
      },
      {
        type: 'scatter', mode: 'lines', name: 'Decelerating (legend)',
        x: [], y: [], line: { color: '#f43f5e', width: 3 }, showlegend: true, legendrank: 2,
      },
    ];
  }, [coins]);

  const btcVal = coins.find(c => c.Symbol === 'BTC');

  return (
    <section>
      <div className="section-header">
        <div className="section-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
          <TrendingUp size={18} color="white" />
        </div>
        <div>
          <h2 className="section-title">Performance Analysis</h2>
          <p className="section-desc">Grains 13–15, 23 · Consistency, correlation, momentum, and acceleration signals</p>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        <PlotlyChart
          data={grain13}
          layout={{
            ...getPlotlyLayout('Performance Consistency Classification', 'How many of the 4 timeframes are positive per coin', base),
            barmode: 'group',
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text: 'Consistency Category', font: { color: base?'#cbd5e1':'#374151', size: 12 } } },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text: 'Number of Coins', font: { color: base?'#cbd5e1':'#374151', size: 12 } } },
            yaxis2: { title: { text: 'Avg Market Cap ($)', font: { color: '#6366f1', size: 12 } }, overlaying: 'y', side: 'right', showgrid: false, tickfont: { color: '#6366f1' }, tickformat: '$,.0s' },
            legend: { orientation: 'h', y: 1.1, x: 0, font: { color: base?'#e2e8f0':'#1e293b' } },
            margin: { t: 80, r: 80, b: 70, l: 70 },
          }}
          grainNum={13}
          title="Performance Consistency"
          subtitle="All-Positive to All-Negative classification · Investment quality filter"
        />

        <PlotlyChart
          data={[
            ...grain14,
            btcVal ? {
              type: 'scatter', mode: 'lines', name: 'Perfect Correlation (y=x)',
              x: [btcVal['30d'], btcVal['30d']], y: [-200, 2000],
              line: { color: '#f43f5e', dash: 'dash', width: 1.5 }, showlegend: true, hoverinfo: 'skip',
            } : {},
          ].filter(t => t.type)}
          layout={{
            ...getPlotlyLayout('Bitcoin Correlation Index', 'How closely other coins follow BTC 30d performance', base),
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text: 'BTC 30d Change %', font: { color: base?'#cbd5e1':'#374151', size: 12 } } },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text: 'Coin 30d Change %', font: { color: base?'#cbd5e1':'#374151', size: 12 } } },
            legend: { orientation: 'h', y: 1.1, x: 0, font: { color: base?'#e2e8f0':'#1e293b' } },
          }}
          grainNum={14}
          title="Bitcoin Correlation Index"
          subtitle="X = BTC 30d performance · Y = coin 30d · Scatter around red line = decorrelation"
        />

        <PlotlyChart
          data={grain15}
          layout={{
            ...getPlotlyLayout('Top Gainers vs Top Losers (30d)', 'Top 25 gainers (green) vs Top 25 losers (red) this month', base),
            xaxis:  { ...getPlotlyLayout('','',base).xaxis, domain: [0.55, 1], title: { text: 'Top Gainers 30d %', font: { color: '#10b981', size: 12 } }, anchor: 'y' },
            xaxis2: { ...getPlotlyLayout('','',base).xaxis, domain: [0, 0.45], title: { text: 'Top Losers 30d %', font: { color: '#f43f5e', size: 12 } }, anchor: 'y2', autorange: 'reversed' },
            yaxis:  { ...getPlotlyLayout('','',base).yaxis, domain: [0, 1], tickfont: { size: 9 } },
            yaxis2: { ...getPlotlyLayout('','',base).yaxis, domain: [0, 1], tickfont: { size: 9 }, side: 'right' },
            showlegend: false,
            margin: { t: 80, r: 100, b: 50, l: 50 },
            height: 520,
          }}
          grainNum={15}
          title="Top Gainers vs Top Losers (30d)"
          subtitle="Top 25 gainers (right, green) · Top 25 losers (left, red)"
        />

        <PlotlyChart
          data={grain23}
          layout={{
            ...getPlotlyLayout('Performance Acceleration Analysis', 'Slope chart: 1h → 24h → 7d → 30d momentum trajectories', base),
            xaxis: { ...getPlotlyLayout('','',base).xaxis, title: { text: 'Time Period', font: { color: base?'#cbd5e1':'#374151', size: 12 } } },
            yaxis: { ...getPlotlyLayout('','',base).yaxis, title: { text: 'Performance (%)', font: { color: base?'#cbd5e1':'#374151', size: 12 } },
              zeroline: true, zerolinecolor: base?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.2)', zerolinewidth: 1.5 },
            legend: { orientation: 'h', y: 1.1, x: 0, font: { color: base?'#e2e8f0':'#1e293b' } },
            height: 520,
          }}
          grainNum={23}
          title="Performance Acceleration"
          subtitle="Green = accelerating momentum · Red = decelerating · Top 25 of each"
        />
      </div>
    </section>
  );
}

export default PerformanceAnalysis;
