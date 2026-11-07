import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Play, Pause, Trash2, Filter, AlertCircle, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function LiveDecisionStream({ events, isScanning, onClearEvents, onStartScan, hasTopology }) {
  const [isPaused, setIsPaused] = useState(false);
  const [filterPhase, setFilterPhase] = useState('ALL');
  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (!isPaused && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, isPaused]);

  const filteredEvents = events.filter((e) => {
    if (filterPhase === 'ALL') return true;
    return e.phase === filterPhase;
  });

  const getPhaseBadge = (phase) => {
    switch (phase) {
      case 'HYPOTHESIS':
        return { label: 'THOUGHT / HYPOTHESIS', bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' };
      case 'PROBE_EXECUTION':
        return { label: 'TOOL ACTION', bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' };
      case 'OBSERVATION':
        return { label: 'OBSERVATION', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
      case 'DECISION':
        return { label: 'AGENT VERDICT', bg: '#fef2f2', text: '#b91c1c', border: '#fca5a5' };
      default:
        return { label: 'RECON', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 180px)' }}>
      {/* Stream Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        padding: '0.875rem 1.25rem',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#0284c7'
          }}>
            <Cpu size={18} />
            <span>Model Engine:</span>
            <code style={{
              background: '#f5f3ff',
              color: '#6d28d9',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid #ddd6fe',
              fontFamily: 'monospace',
              fontWeight: '700'
            }}>
              gpt-6-luna [xhigh thinking]
            </code>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: '600',
            color: isScanning ? '#059669' : '#64748b'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isScanning ? '#10b981' : '#94a3b8',
              boxShadow: isScanning ? '0 0 6px #10b981' : 'none'
            }} />
            {isScanning ? 'LIVE PROBING ACTIVE' : 'STREAM IDLE'}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isScanning && hasTopology && onStartScan && (
            <button
              onClick={onStartScan}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Play size={13} fill="#ffffff" />
              Launch Scan
            </button>
          )}

          {/* Phase Filter */}
          <select
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            style={{
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Event Phases</option>
            <option value="RECON">Recon Only</option>
            <option value="HYPOTHESIS">Hypotheses / Thoughts</option>
            <option value="DECISION">Verdicts / Staged Defects</option>
          </select>

          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? 'Resume Scroll' : 'Pause Scroll'}
          </button>

          <button
            onClick={onClearEvents}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div style={{
        flex: 1,
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '12px',
        padding: '1.25rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        fontFamily: "'Fira Code', monospace"
      }}>
        {filteredEvents.length === 0 ? (
          <div style={{
            margin: 'auto',
            textAlign: 'center',
            color: '#94a3b8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Terminal size={32} />
            <p style={{ fontSize: '14px', fontWeight: '500' }}>No execution telemetry recorded yet.</p>
            <p style={{ fontSize: '12px' }}>Click "Launch Agentic Scan" to start the autonomous testing loop.</p>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const badge = getPhaseBadge(evt.phase);
            return (
              <div
                key={evt.event_id}
                style={{
                  background: '#ffffff',
                  border: `1px solid ${badge.border}`,
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}
              >
                {/* Event Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      backgroundColor: badge.bg,
                      color: badge.text,
                      border: `1px solid ${badge.border}`,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
                      {badge.label}
                    </span>
                    <span style={{ color: '#0284c7', fontSize: '13px', fontWeight: '700' }}>
                      [{evt.service}]
                    </span>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>
                      {evt.probe_type}
                    </span>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                    {evt.timestamp.split('T')[1]?.replace('Z', '')}
                  </span>
                </div>

                {/* Thought Stream */}
                {evt.thought && (
                  <div style={{
                    color: '#3b0764',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    background: '#faf5ff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    borderLeft: '4px solid #8b5cf6'
                  }}>
                    <span style={{ color: '#6d28d9', fontWeight: '700' }}>THOUGHT: </span>
                    {evt.thought}
                  </div>
                )}

                {/* Tool Action & Target */}
                {evt.action && (
                  <div style={{ fontSize: '12px', color: '#334155' }}>
                    <span style={{ color: '#0284c7', fontWeight: '700' }}>ACTION: </span>
                    {evt.action} <span style={{ color: '#64748b' }}>({evt.target_url})</span>
                  </div>
                )}

                {/* Observation */}
                {evt.observation && (
                  <div style={{
                    fontSize: '12px',
                    color: '#064e3b',
                    background: '#ecfdf5',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    borderLeft: '4px solid #10b981'
                  }}>
                    <span style={{ color: '#047857', fontWeight: '700' }}>OBSERVATION: </span>
                    {evt.observation}
                  </div>
                )}

                {/* Verdict / Finding Link */}
                {evt.decision && (
                  <div style={{
                    fontSize: '13px',
                    color: '#991b1b',
                    background: '#fef2f2',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    borderLeft: '4px solid #ef4444',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ color: '#b91c1c', fontWeight: '800' }}>DECISION: </span>
                      {evt.decision}
                    </div>
                    {evt.finding_id && (
                      <span style={{
                        background: '#dc2626',
                        color: '#ffffff',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '800'
                      }}>
                        {evt.finding_id}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
