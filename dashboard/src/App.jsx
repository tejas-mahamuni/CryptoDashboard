// App.jsx — Cryptocurrency Market Statistics Dashboard
// Main entry: layout, routing, global filters, theme management
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, PieChart, Layers,
  ShieldAlert, Activity, Database
} from 'lucide-react';
import { Topbar, KPISection } from './components/Header';
import { DatasetPanel } from './components/DatasetPanel';
import rawData from './data.json';
import './index.css';

// ----- Lazy-load heavy chart sections (PlotlyChart is synchronous via factory) ----
const OriginalGrains      = React.lazy(() => import('./sections/OriginalGrains'));
const SectorPriceAnalysis = React.lazy(() => import('./sections/SectorPriceAnalysis'));
const MarketStructure     = React.lazy(() => import('./sections/MarketStructure'));
const LiquidityRisk       = React.lazy(() => import('./sections/LiquidityRisk'));
const PerformanceAnalysis = React.lazy(() => import('./sections/PerformanceAnalysis'));
const SectorDeepDives     = React.lazy(() => import('./sections/SectorDeepDives'));

// ---- Tab Configuration ----
const TABS = [
  { id: 'overview',     label: 'Overview',        icon: Database,    grains: 'KPI' },
  { id: 'original',     label: 'Original Grains', icon: BarChart3,   grains: '1-5' },
  { id: 'sector',       label: 'Sector & Price',  icon: PieChart,    grains: '6-8' },
  { id: 'structure',    label: 'Market Structure',icon: Activity,    grains: '9,16,21-22,24' },
  { id: 'liquidity',    label: 'Liquidity & Risk',icon: ShieldAlert, grains: '10-12,17,25' },
  { id: 'performance',  label: 'Performance',     icon: TrendingUp,  grains: '13-15,23' },
  { id: 'deepdives',    label: 'Sector Deep-Dives',icon: Layers,     grains: '18-20' },
];

// ---- Sector Colors for filter toggles ----
const SECTOR_COLORS = {
  'Altcoin':              '#6366f1',
  'Infrastructure/L1/L2':'#3b82f6',
  'DeFi':                '#10b981',
  'Stablecoin':          '#f59e0b',
  'Memecoin':            '#f43f5e',
};

const ALL_SECTORS = Object.keys(SECTOR_COLORS);

function SectionFallback() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '50vh', gap: '14px', color: 'var(--text-tertiary)', fontSize: '0.9rem'
    }}>
      <div className="spinner" />
      Loading charts...
    </div>
  );
}

export default function App() {
  const [theme,            setTheme]     = useState('light');
  const [activeTab,        setActiveTab] = useState('overview');
  const [activeSectors,    setSectors]   = useState(new Set(ALL_SECTORS));

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  const isDark      = theme === 'dark';

  // Toggle sector filter
  const toggleSector = (sector) => {
    setSectors(prev => {
      const next = new Set(prev);
      if (next.has(sector)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(sector);
      } else {
        next.add(sector);
      }
      return next;
    });
  };

  // Filtered coins
  const coins = useMemo(() => {
    if (activeSectors.size === ALL_SECTORS.length) return rawData;
    return rawData.filter(c => activeSectors.has(c.Sector));
  }, [activeSectors]);

  // Page fade transition
  const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
  };

  return (
    <div className="app-shell">
      {/* Animated background blobs */}
      <div className="bg-blobs">
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
        <div className="bg-blob bg-blob-3" />
      </div>

      {/* Fixed topbar */}
      <Topbar
        theme={theme}
        onToggleTheme={toggleTheme}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={TABS}
      />

      {/* Main layout: sidebar + content */}
      <div className="main-layout">
        {/* Left Sidebar */}
        <aside className="sidebar">
          {/* Global Sector Filters */}
          <div className="filters-panel">
            <p className="filter-label">Filter by Sector</p>
            <div className="sector-toggle-group">
              {ALL_SECTORS.map(sector => (
                <button
                  key={sector}
                  className={`sector-toggle ${activeSectors.has(sector) ? 'active' : ''}`}
                  style={{
                    borderColor: SECTOR_COLORS[sector],
                    color: activeSectors.has(sector) ? 'white' : SECTOR_COLORS[sector],
                    backgroundColor: activeSectors.has(sector)
                      ? SECTOR_COLORS[sector]
                      : 'transparent',
                  }}
                  onClick={() => toggleSector(sector)}
                  title={sector}
                >
                  {sector.split('/')[0]}
                </button>
              ))}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              Showing {coins.length.toLocaleString()} of {rawData.length.toLocaleString()} coins
            </p>
          </div>

          {/* Dataset Properties + Viewer */}
          <DatasetPanel coins={rawData} />
        </aside>

        {/* Main content area */}
        <main className="content-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* ---- OVERVIEW ---- */}
              {activeTab === 'overview' && (
                <div>
                  <div style={{ marginBottom: '28px' }}>
                    <h1 style={{
                      margin: '0 0 4px',
                      fontSize: '1.8rem',
                      fontWeight: 900,
                      letterSpacing: '-0.5px',
                      color: 'var(--text-primary)',
                    }}>
                      Cryptocurrency Market Statistics Dashboard
                    </h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {rawData.length.toLocaleString()} cryptocurrencies · 13 data dimensions · 25 analytical grains
                    </p>
                  </div>
                  <KPISection coins={coins} />

                  {/* Quick insight cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px',
                    marginTop: '24px',
                  }}>
                    {TABS.slice(1).map(tab => (
                      <motion.div
                        key={tab.id}
                        className="chart-card"
                        style={{ cursor: 'pointer', padding: '20px' }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'var(--accent-blue)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <tab.icon size={18} color="white" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{tab.label}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Grains {tab.grains}</div>
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Click to explore →
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---- ORIGINAL GRAINS 1-5 ---- */}
              {activeTab === 'original' && (
                <Suspense fallback={<SectionFallback />}>
                  <OriginalGrains coins={coins} isDark={isDark} />
                </Suspense>
              )}

              {/* ---- SECTOR & PRICE 6-8 ---- */}
              {activeTab === 'sector' && (
                <Suspense fallback={<SectionFallback />}>
                  <SectorPriceAnalysis coins={coins} isDark={isDark} />
                </Suspense>
              )}

              {/* ---- MARKET STRUCTURE 9,16,21,22,24 ---- */}
              {activeTab === 'structure' && (
                <Suspense fallback={<SectionFallback />}>
                  <MarketStructure coins={coins} isDark={isDark} />
                </Suspense>
              )}

              {/* ---- LIQUIDITY & RISK 10,11,12,17,25 ---- */}
              {activeTab === 'liquidity' && (
                <Suspense fallback={<SectionFallback />}>
                  <LiquidityRisk coins={coins} isDark={isDark} />
                </Suspense>
              )}

              {/* ---- PERFORMANCE 13,14,15,23 ---- */}
              {activeTab === 'performance' && (
                <Suspense fallback={<SectionFallback />}>
                  <PerformanceAnalysis coins={coins} isDark={isDark} />
                </Suspense>
              )}

              {/* ---- SECTOR DEEP DIVES 18,19,20 ---- */}
              {activeTab === 'deepdives' && (
                <Suspense fallback={<SectionFallback />}>
                  <SectorDeepDives coins={coins} isDark={isDark} />
                </Suspense>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
