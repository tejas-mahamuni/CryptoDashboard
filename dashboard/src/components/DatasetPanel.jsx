import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, X, Download, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { SECTOR_COLORS, formatCurrency, formatPct, formatNumber } from '../utils';

const PAGE_SIZE = 100;

const COLUMNS = [
  { key: 'Rank',               label: '#',         numeric: true },
  { key: 'Coin Name',          label: 'Name',      numeric: false },
  { key: 'Symbol',             label: 'Symbol',    numeric: false },
  { key: 'Sector',             label: 'Sector',    numeric: false },
  { key: 'Price',              label: 'Price',     numeric: true,  fmt: formatCurrency },
  { key: '1h',                 label: '1h %',      numeric: true,  pct: true },
  { key: '24h',                label: '24h %',     numeric: true,  pct: true },
  { key: '7d',                 label: '7d %',      numeric: true,  pct: true },
  { key: '30d',                label: '30d %',     numeric: true,  pct: true },
  { key: '24h Volume',         label: 'Volume',    numeric: true,  fmt: formatCurrency },
  { key: 'Circulating Supply', label: 'Circ.Supply',numeric: true, fmt: formatNumber },
  { key: 'Total Supply',       label: 'Total Supply',numeric: true,fmt: formatNumber },
  { key: 'Market Cap',         label: 'Mkt Cap',  numeric: true,  fmt: formatCurrency },
];

function exportCSV(coins) {
  const header = COLUMNS.map(c => c.label).join(',');
  const rows = coins.map(coin =>
    COLUMNS.map(c => {
      const v = coin[c.key];
      if (typeof v === 'string') return `"${v}"`;
      return v ?? '';
    }).join(',')
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = 'CryptocurrencyData.csv'; a.click();
  URL.revokeObjectURL(url);
}

export function DatasetPanel({ coins }) {
  const [isOpen, setIsOpen] = useState(false);

  const sectorCounts = useMemo(() => {
    const counts = {};
    coins.forEach(c => { counts[c.Sector] = (counts[c.Sector] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [coins]);

  const columnTypes = {
    'Rank': 'Integer', 'Coin Name': 'String', 'Symbol': 'String',
    'Price': 'Float', '1h': 'Float', '24h': 'Float',
    '7d': 'Float', '30d': 'Float', '24h Volume': 'Float',
    'Circulating Supply': 'Float', 'Total Supply': 'Float',
    'Market Cap': 'Float', 'Sector': 'Category',
  };

  const memoryKB = Math.round(JSON.stringify(coins).length / 1024);

  return (
    <>
      {/* ---- Sidebar Panel ---- */}
      <div>
        <p className="panel-title">Dataset Properties</p>

        <div style={{ background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '16px' }}>
          {[
            ['Total Rows', coins.length.toLocaleString()],
            ['Total Columns', '13'],
            ['Memory Usage', `~${memoryKB} KB`],
            ['Missing Values', '0 (cleaned)'],
            ['Sectors', '5 categories'],
          ].map(([k, v]) => (
            <div className="dataset-info-row" key={k}>
              <span className="info-key">{k}</span>
              <span className="info-val">{v}</span>
            </div>
          ))}
        </div>

        <p className="panel-title">Column Types</p>
        <div style={{ background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '16px' }}>
          {Object.entries(columnTypes).map(([col, type]) => (
            <div className="dataset-info-row" key={col}>
              <span className="info-key" style={{ fontSize: '0.72rem' }}>{col}</span>
              <span className="info-val" style={{
                padding: '1px 8px', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700,
                background: type === 'String' || type === 'Category' ? 'rgba(99,102,241,0.15)' : 'rgba(59,130,246,0.15)',
                color: type === 'String' || type === 'Category' ? '#6366f1' : '#3b82f6',
              }}>
                {type}
              </span>
            </div>
          ))}
        </div>

        <p className="panel-title">Sector Distribution</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
          {sectorCounts.map(([sector, count]) => (
            <span
              key={sector}
              className="sector-badge"
              style={{ color: SECTOR_COLORS[sector] || '#6366f1' }}
            >
              <span className="sector-dot" />
              {sector.split('/')[0]}: {count}
            </span>
          ))}
        </div>

        <button className="view-dataset-btn" onClick={() => setIsOpen(true)}>
          <Database size={15} />
          View Complete Dataset
        </button>
      </div>

      {/* ---- Full Dataset Modal via Portal (escapes sidebar stacking context) ---- */}
      {createPortal(
        <AnimatePresence>
        {isOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">📊 Complete Dataset Viewer</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {coins.length.toLocaleString()} cryptocurrencies · 13 columns · Sortable &amp; Filterable
                  </p>
                </div>
                <button className="close-btn" onClick={() => setIsOpen(false)} title="Close">
                  <X size={16} />
                </button>
              </div>

              <DatasetTable coins={coins} onClose={() => setIsOpen(false)} />
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

function DatasetTable({ coins }) {
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [sortKey, setSortKey]   = useState('Rank');
  const [sortDir, setSortDir]   = useState('asc');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return coins.filter(c =>
      !q ||
      c['Coin Name'].toLowerCase().includes(q) ||
      c.Symbol.toLowerCase().includes(q) ||
      c.Sector.toLowerCase().includes(q)
    );
  }, [coins, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      const dir = sortDir === 'asc' ? 1 : -1;
      if (typeof va === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = useCallback((key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  }, [sortKey]);

  return (
    <div className="modal-body">
      <div className="modal-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 200 }}>
          <Search size={14} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
          <input
            className="search-input"
            placeholder="Search by name, symbol, or sector..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          {filtered.length.toLocaleString()} rows
        </span>
        <button className="export-btn" onClick={() => exportCSV(sorted)}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {col.label}
                    {sortKey === col.key
                      ? sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                      : null
                    }
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((coin, i) => (
              <tr key={i}>
                {COLUMNS.map(col => {
                  const raw = coin[col.key];
                  let display;
                  if (col.pct) {
                    display = <span className={raw >= 0 ? 'pct-positive' : 'pct-negative'}>{formatPct(raw)}</span>;
                  } else if (col.fmt) {
                    display = col.fmt(raw);
                  } else if (col.key === 'Sector') {
                    display = (
                      <span style={{
                        color: SECTOR_COLORS[raw] || '#6366f1',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}>
                        {raw}
                      </span>
                    );
                  } else {
                    display = raw;
                  }
                  return <td key={col.key}>{display}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span>Page {page} of {totalPages} · {sorted.length.toLocaleString()} results</span>
        <div className="pagination-btns">
          <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
          <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const p = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
            if (p < 1 || p > totalPages) return null;
            return (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                {p}
              </button>
            );
          })}
          <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
          <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
        </div>
      </div>
    </div>
  );
}
