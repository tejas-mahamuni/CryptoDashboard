// PlotlyChart.jsx — Direct Plotly.react() + macOS-style minimize/maximize controls
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Plotly from 'plotly.js-dist-min';
import { PLOTLY_CONFIG } from '../utils';

export function PlotlyChart({ data, layout, grainNum, title, subtitle, fullWidth = false, height = 420 }) {
  const containerRef    = useRef(null);
  const maxContainerRef = useRef(null);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  // ---- Render in normal card ----
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !data || minimized || maximized) return;

    Plotly.react(el, data, layout, { ...PLOTLY_CONFIG, responsive: true })
      .catch(err => console.warn('Plotly render error:', err));

    const ro = new ResizeObserver(() => { try { Plotly.Plots.resize(el); } catch (_) {} });
    ro.observe(el);
    return () => {
      ro.disconnect();
      try { Plotly.purge(el); } catch (_) {}
    };
  }, [data, layout, minimized, maximized]);

  // ---- Render in maximized overlay ----
  useEffect(() => {
    const el = maxContainerRef.current;
    if (!el || !data || !maximized) return;

    const maxLayout = {
      ...layout,
      height: Math.max(window.innerHeight - 180, 400),
      margin: { ...(layout.margin || {}), t: 60 },
    };
    Plotly.react(el, data, maxLayout, { ...PLOTLY_CONFIG, responsive: true })
      .catch(err => console.warn('Plotly maximized render error:', err));

    const ro = new ResizeObserver(() => { try { Plotly.Plots.resize(el); } catch (_) {} });
    ro.observe(el);
    return () => {
      ro.disconnect();
      try { Plotly.purge(el); } catch (_) {}
    };
  }, [data, layout, maximized]);

  // Close maximized on Escape
  useEffect(() => {
    if (!maximized) return;
    const handler = (e) => { if (e.key === 'Escape') setMaximized(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [maximized]);

  const toggleMinimize = useCallback(() => setMinimized(m => !m), []);
  const openMaximize   = useCallback(() => setMaximized(true),    []);
  const closeMaximize  = useCallback(() => setMaximized(false),   []);

  return (
    <>
      {/* ---- Normal Chart Card ---- */}
      <div className={`chart-card ${fullWidth ? 'full-width' : ''}`}>
        {/* macOS window controls */}
        <div className="chart-win-controls">
          <button
            className="ctrl-dot ctrl-red"
            onClick={toggleMinimize}
            title={minimized ? 'Restore chart' : 'Minimize chart'}
          />
          <button
            className="ctrl-dot ctrl-yellow"
            title="Pinned"
            style={{ cursor: 'default' }}
          />
          <button
            className="ctrl-dot ctrl-green"
            onClick={openMaximize}
            title="Maximize chart"
          />
          {minimized && (
            <span className="ctrl-hint">minimized — click <span style={{ color: '#ff5f57' }}>●</span> to restore</span>
          )}
        </div>

        {grainNum !== undefined && <div className="grain-badge">GRAIN #{grainNum}</div>}
        {title    && <p className="chart-title">{title}</p>}
        {subtitle && <p className="chart-subtitle">{subtitle}</p>}

        {!minimized && (
          <div
            ref={containerRef}
            style={{ width: '100%', height: `${height}px`, marginTop: '14px' }}
          />
        )}
      </div>

      {/* ---- Maximized Full-Screen Overlay (Portal — escapes stacking context) ---- */}
      {maximized && createPortal(
        <div className="chart-max-overlay" role="dialog" aria-modal="true">
          <div className="chart-max-topbar">
            <div className="chart-win-controls">
              <button
                className="ctrl-dot ctrl-red"
                onClick={closeMaximize}
                title="Restore (Esc)"
              />
              <button
                className="ctrl-dot ctrl-yellow"
                title="Pinned"
                style={{ cursor: 'default' }}
              />
              <button
                className="ctrl-dot ctrl-green"
                title="Already maximized"
                style={{ opacity: 0.35, cursor: 'default' }}
              />
            </div>
            {grainNum !== undefined && (
              <span className="grain-badge" style={{ marginLeft: 8 }}>GRAIN #{grainNum}</span>
            )}
            <span className="chart-max-title">{title}</span>
            <button className="chart-max-esc-hint" onClick={closeMaximize}>
              Press Esc or click ● to restore
            </button>
          </div>

          {subtitle && (
            <p style={{ margin: '0 24px 8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {subtitle}
            </p>
          )}

          <div
            ref={maxContainerRef}
            style={{ flex: 1, width: '100%', minHeight: 0, paddingBottom: '8px' }}
          />
        </div>,
        document.body
      )}
    </>
  );
}
