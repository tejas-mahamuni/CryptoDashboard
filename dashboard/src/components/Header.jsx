// Header.jsx — Topbar + KPI Metric Tiles
import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, Activity, Layers,
  Award, Zap, BarChart2, Globe, Sun, Moon
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPct } from '../utils';

function KPITile({ label, value, sub, icon: Icon, accent, delay }) {
  return (
    <motion.div
      className="kpi-tile"
      style={{ '--tile-accent': accent }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    >
      <div className="kpi-icon" style={{ '--tile-accent': accent }}>
        <Icon size={18} color={accent} />
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </motion.div>
  );
}

export function KPISection({ coins }) {
  const totalMarketCap    = coins.reduce((a, c) => a + (c['Market Cap'] || 0), 0);
  const totalVolume       = coins.reduce((a, c) => a + (c['24h Volume'] || 0), 0);
  const avgPrice          = coins.filter(c => c.Price > 0).reduce((a, c) => a + c.Price, 0) / coins.filter(c => c.Price > 0).length;
  const numSectors        = new Set(coins.map(c => c.Sector)).size;
  const btc               = coins.find(c => c.Symbol === 'BTC');
  const btcDominance      = btc ? (btc['Market Cap'] / totalMarketCap * 100).toFixed(1) : 'N/A';

  // Top sector by avg 30d
  const sectorPerf = {};
  coins.forEach(c => {
    if (!sectorPerf[c.Sector]) sectorPerf[c.Sector] = [];
    sectorPerf[c.Sector].push(c['30d'] || 0);
  });
  const sectorAvgs     = Object.entries(sectorPerf).map(([s, vs]) => [s, vs.reduce((a,b)=>a+b,0)/vs.length]);
  const topSector      = sectorAvgs.sort((a,b)=>b[1]-a[1])[0];
  const mostVolatile   = sectorAvgs.sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]))[0];

  // Avg 24h performance
  const avg24h = coins.reduce((a, c) => a + (c['24h'] || 0), 0) / coins.length;

  const tiles = [
    {
      label: 'Total Cryptocurrencies',
      value: coins.length.toLocaleString(),
      sub: `${numSectors} sectors covered`,
      icon: Globe,
      accent: '#6366f1',
    },
    {
      label: 'Total Market Cap',
      value: formatCurrency(totalMarketCap),
      sub: `BTC dominance: ${btcDominance}%`,
      icon: DollarSign,
      accent: '#3b82f6',
    },
    {
      label: '24h Trading Volume',
      value: formatCurrency(totalVolume),
      sub: `Vol/MCap: ${(totalVolume/totalMarketCap*100).toFixed(2)}%`,
      icon: Activity,
      accent: '#10b981',
    },
    {
      label: 'Average Price',
      value: formatCurrency(avgPrice),
      sub: '(mean across all coins)',
      icon: BarChart2,
      accent: '#f59e0b',
    },
    {
      label: 'Avg 24h Change',
      value: formatPct(avg24h),
      sub: 'market-wide momentum',
      icon: TrendingUp,
      accent: avg24h >= 0 ? '#10b981' : '#f43f5e',
    },
    {
      label: 'Top Sector (30d)',
      value: topSector ? topSector[0].split('/')[0] : '—',
      sub: topSector ? `Avg ${formatPct(topSector[1])} (30d)` : '',
      icon: Award,
      accent: '#f59e0b',
    },
    {
      label: 'Most Volatile Sector',
      value: mostVolatile ? mostVolatile[0].split('/')[0] : '—',
      sub: mostVolatile ? `Avg ${formatPct(mostVolatile[1])} (30d)` : '',
      icon: Zap,
      accent: '#f43f5e',
    },
    {
      label: 'Total Dataset Columns',
      value: '13',
      sub: 'Rank · Price · Supply · Perf · Sector',
      icon: Layers,
      accent: '#14b8a6',
    },
  ];

  return (
    <div className="kpi-grid">
      {tiles.map((t, i) => (
        <KPITile key={t.label} {...t} delay={i * 0.05} />
      ))}
    </div>
  );
}

export function Topbar({ theme, onToggleTheme, activeTab, onTabChange, tabs }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-icon">
          <TrendingUp size={20} color="white" />
        </div>
        <div>
          <div className="brand-title">Crypto Market Dashboard</div>
          <div className="brand-subtitle">4,150 Assets · 25 Intelligence Grains</div>
        </div>
      </div>

      <nav className="topbar-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <tab.icon size={14} />
            {tab.label}
            <span className="tab-badge">{tab.grains}</span>
          </button>
        ))}
      </nav>

      <div className="topbar-actions">
        <motion.button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Toggle theme"
        >
          {theme === 'dark'
            ? <Sun size={18} />
            : <Moon size={18} />}
        </motion.button>
      </div>
    </header>
  );
}
