// OriginalGrains.jsx — Grains 1-5 (original assignment grains)
import React, { useMemo } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { PlotlyChart } from '../components/PlotlyChart';
import { getPlotlyLayout, SECTOR_COLORS, formatCurrency, formatPct, formatNumber } from '../utils';

export function OriginalGrains({ coins, isDark }) {
  // --- PRECOMPUTED DATA ---
  const top50McapCoins  = useMemo(() => [...coins].sort((a, b) => b['Market Cap'] - a['Market Cap']).slice(0, 50), [coins]);
  const top100ForHeatmap = useMemo(() => [...coins].sort((a, b) => a.Rank - b.Rank).slice(0, 100), [coins]);
  const top50ForSupply  = useMemo(() => [...coins].sort((a, b) => a.Rank - b.Rank).slice(0, 50), [coins]);
  const top50ForRank    = useMemo(() => [...coins].sort((a, b) => a.Rank - b.Rank).slice(0, 50), [coins]);

  // ══════════════════════════════════════════
  // GRAIN 1 — Market Capitalization Treemap
  // ══════════════════════════════════════════
  const grain1 = useMemo(() => {
    const ids    = top50McapCoins.map(c => c.Symbol);
    const labels = top50McapCoins.map(c => `${c.Symbol}<br>$${(c['Market Cap']/1e9).toFixed(1)}B`);
    const parents= top50McapCoins.map(() => '');
    const values = top50McapCoins.map(c => c['Market Cap']);
    const text   = top50McapCoins.map(c => c['Coin Name']);
    const colors = top50McapCoins.map(c => Math.log10(Math.max(c['Market Cap'], 1)));

    return [{
      type: 'treemap',
      ids, labels, parents, values,
      text,
      customdata: top50McapCoins.map(c => [
        c['Coin Name'], formatCurrency(c['Market Cap']), formatCurrency(c.Price), c.Sector
      ]),
      hovertemplate: '<b>%{customdata[0]}</b><br>Market Cap: %{customdata[1]}<br>Price: %{customdata[2]}<br>Sector: %{customdata[3]}<extra></extra>',
      textinfo: 'label',
      marker: {
        colorscale: [
          [0, '#1e3a8a'], [0.3, '#2563eb'], [0.6, '#3b82f6'],
          [0.8, '#60a5fa'], [1, '#93c5fd']
        ],
        colors,
        showscale: true,
        colorbar: { title: 'Log(MCap)', thickness: 12 },
      },
      pathbar: { visible: false },
    }];
  }, [top50McapCoins]);

  // ══════════════════════════════════════════
  // GRAIN 2 — Liquidity & Volume Scatter (Log Scale)
  // ══════════════════════════════════════════
  const grain2 = useMemo(() => {
    const filteredCoins = coins.filter(c => c['Market Cap'] > 0 && c['24h Volume'] > 0);
    const sectorNames   = [...new Set(filteredCoins.map(c => c.Sector))];
    return sectorNames.map(sector => {
      const sc = filteredCoins.filter(c => c.Sector === sector);
      return {
        type: 'scatter',
        mode: 'markers',
        name: sector,
        x: sc.map(c => c['Market Cap']),
        y: sc.map(c => c['24h Volume']),
        text: sc.map(c => c['Coin Name']),
        marker: {
          color: SECTOR_COLORS[sector] || '#6366f1',
          size: 7,
          opacity: 0.75,
          line: { width: 0.5, color: 'rgba(255,255,255,0.3)' }
        },
        customdata: sc.map(c => [
          c['Coin Name'], formatCurrency(c['Market Cap']), formatCurrency(c['24h Volume']),
          (c['24h Volume']/c['Market Cap']*100).toFixed(2)+'%', c.Sector
        ]),
        hovertemplate: '<b>%{customdata[0]}</b><br>MCap: %{customdata[1]}<br>Volume: %{customdata[2]}<br>Vol/MCap: %{customdata[3]}<br>Sector: %{customdata[4]}<extra></extra>',
      };
    });
  }, [coins]);

  // ══════════════════════════════════════════
  // GRAIN 3 — Cross-Timeline Heatmap
  // ══════════════════════════════════════════
  const grain3 = useMemo(() => {
    const periods = ['1h', '24h', '7d', '30d'];
    const symbols = top100ForHeatmap.map(c => c.Symbol);
    const z       = periods.map(p => top100ForHeatmap.map(c => c[p] ?? 0));
    return [{
      type: 'heatmap',
      x: symbols,
      y: periods.map(p => `${p}%`),
      z,
      colorscale: [
        [0, '#dc2626'], [0.4, '#ef4444'], [0.5, '#f1f5f9'],
        [0.6, '#22c55e'], [1, '#15803d']
      ],
      zmid: 0,
      text: z.map(row => row.map(v => formatPct(v))),
      hovertemplate: 'Coin: %{x}<br>Period: %{y}<br>Change: %{z:.2f}%<extra></extra>',
      colorbar: { title: 'Change %', thickness: 12 },
    }];
  }, [top100ForHeatmap]);

  // ══════════════════════════════════════════
  // GRAIN 4 — Supply Saturation Side-by-Side Bar
  // ══════════════════════════════════════════
  const grain4 = useMemo(() => {
    const validCoins = top50ForSupply.filter(c => c['Total Supply'] > 0).slice(0, 30);
    return [
      {
        type: 'bar',
        name: 'Circulating Supply',
        x: validCoins.map(c => c.Symbol),
        y: validCoins.map(c => c['Circulating Supply']),
        marker: { color: '#3b82f6', opacity: 0.9, cornerradius: 3 },
        hovertemplate: '%{x}<br>Circ. Supply: %{y:,.0f}<extra></extra>',
      },
      {
        type: 'bar',
        name: 'Total Supply',
        x: validCoins.map(c => c.Symbol),
        y: validCoins.map(c => c['Total Supply']),
        marker: { color: '#6366f1', opacity: 0.45, cornerradius: 3 },
        hovertemplate: '%{x}<br>Total Supply: %{y:,.0f}<extra></extra>',
      },
    ];
  }, [top50ForSupply]);

  // ══════════════════════════════════════════
  // GRAIN 5 — Market Rank vs Volatility (Dual Axis)
  // ══════════════════════════════════════════
  const grain5 = useMemo(() => {
    return [
      {
        type: 'bar',
        name: '24h Change %',
        x: top50ForRank.map(c => c.Rank),
        y: top50ForRank.map(c => c['24h']),
        yaxis: 'y',
        marker: {
          color: top50ForRank.map(c => c['24h'] >= 0 ? '#10b981' : '#f43f5e'),
          opacity: 0.7,
          cornerradius: 2,
        },
        hovertemplate: 'Rank %{x}<br>24h: %{y:.2f}%<extra></extra>',
      },
      {
        type: 'scatter',
        mode: 'markers',
        name: '1h Change %',
        x: top50ForRank.map(c => c.Rank),
        y: top50ForRank.map(c => c['1h']),
        yaxis: 'y2',
        marker: {
          color: '#f59e0b',
          size: 8,
          symbol: 'diamond',
          line: { width: 1, color: 'rgba(255,255,255,0.4)' },
        },
        hovertemplate: 'Rank %{x}<br>1h: %{y:.2f}%<extra></extra>',
      },
    ];
  }, [top50ForRank]);

  const base = isDark;
  return (
    <section>
      <div className="section-header">
        <div className="section-icon"><BarChart3 size={18} color="white" /></div>
        <div>
          <h2 className="section-title">Original Analysis Grains</h2>
          <p className="section-desc">Grains 1–5 · Core market structure visualization</p>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <PlotlyChart
          data={grain1}
          layout={{
            ...getPlotlyLayout('Market Capitalization Distribution', 'Top 50 coins by market cap — size shows dominance', base, { margin: { t: 70, r: 20, b: 20, l: 20 } }),
          }}
          grainNum={1}
          title="Market Cap Treemap"
          subtitle="Top 50 · Size = Market Cap · Color = Capital magnitude"
        />

        <PlotlyChart
          data={grain2}
          layout={{
            ...getPlotlyLayout('Liquidity & Volume Analysis', 'Log-Log scale reveals true liquidity relationships', base),
            xaxis: {
              ...getPlotlyLayout('', '', base).xaxis,
              type: 'log',
              title: { text: 'Market Cap (log scale)', font: { color: base ? '#cbd5e1' : '#374151', size: 12 } },
              tickformat: '$,.0s',
            },
            yaxis: {
              ...getPlotlyLayout('', '', base).yaxis,
              type: 'log',
              title: { text: '24h Volume (log scale)', font: { color: base ? '#cbd5e1' : '#374151', size: 12 } },
              tickformat: '$,.0s',
            },
          }}
          grainNum={2}
          title="Liquidity & Volume Scatter"
          subtitle="All coins, log-log scale · Color = Sector"
        />

        <PlotlyChart
          data={grain3}
          layout={{
            ...getPlotlyLayout('Cross-Timeline Performance Heatmap', 'Top 100 coins · Red negative, Green positive', base),
            xaxis: { ...getPlotlyLayout('', '', base).xaxis, title: { text: 'Cryptocurrency Symbol' }, tickangle: -45 },
            yaxis: { ...getPlotlyLayout('', '', base).yaxis, title: { text: 'Time Period' } },
            margin: { t: 80, r: 60, b: 120, l: 70 },
          }}
          grainNum={3}
          title="Price Performance Heatmap"
          subtitle="Top 100 · 4 timeframes · Red = bearish, Green = bullish"
        />

        <PlotlyChart
          data={grain4}
          layout={{
            ...getPlotlyLayout('Supply Saturation Analysis', 'Circulating vs Total supply — top 30 coins', base),
            barmode: 'group',
            xaxis: { ...getPlotlyLayout('', '', base).xaxis, title: { text: 'Cryptocurrency' }, tickangle: -45 },
            yaxis: { ...getPlotlyLayout('', '', base).yaxis, title: { text: 'Token Supply' }, tickformat: '.2s' },
            margin: { t: 70, r: 20, b: 100, l: 70 },
          }}
          grainNum={4}
          title="Supply Saturation"
          subtitle="Circulating vs Total Supply · Top 30 coins"
        />

        <PlotlyChart
          data={grain5}
          layout={{
            ...getPlotlyLayout('Market Rank vs Volatility', '1h% (points) and 24h% (bars) across top 50', base),
            barmode: 'overlay',
            xaxis: { ...getPlotlyLayout('', '', base).xaxis, title: { text: 'Market Rank' } },
            yaxis: { ...getPlotlyLayout('', '', base).yaxis, title: { text: '24h Change %', font: { color: '#10b981' } } },
            yaxis2: {
              title: { text: '1h Change %', font: { color: '#f59e0b' } },
              overlaying: 'y',
              side: 'right',
              showgrid: false,
              tickfont: { color: '#f59e0b' },
              linecolor: '#f59e0b',
            },
            showlegend: true,
            legend: { orientation: 'h', y: 1.08, x: 0 },
            margin: { t: 80, r: 80, b: 60, l: 70 },
          }}
          grainNum={5}
          title="Rank vs Volatility (Dual Axis)"
          subtitle="Bars = 24h change · Diamonds = 1h change · Top 50 coins"
        />
      </div>
    </section>
  );
}

export default OriginalGrains;
