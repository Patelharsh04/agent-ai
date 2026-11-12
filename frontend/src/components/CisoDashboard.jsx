import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Award, FileSpreadsheet, Download, Clock, CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';
import { fetchSarifExport } from '../api/client';

export default function CisoDashboard({ report }) {
  const [downloading, setDownloading] = useState(false);

  if (!report) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        Loading executive CISO report...
      </div>
    );
  }

  const handleDownloadSarif = async () => {
    setDownloading(true);
    try {
      const data = await fetchSarifExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AegisAgent-SARIF-Report-${new Date().toISOString().split('T')[0]}.sarif`;
      a.click();
    } catch (err) {
      console.error('Failed to export SARIF:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AegisAgent-CISO-Report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#059669';
    if (score >= 60) return '#d97706';
    return '#dc2626';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
      {/* Top Banner / Executive Summary */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div>
          <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Executive Cybersecurity Briefing
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
            {report.title}
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            Author: <strong style={{ color: '#0f172a' }}>{report.author}</strong> • Generated: {report.generated_at.split('T')[0]} • Status: <span style={{ color: '#059669', fontWeight: '600' }}>Verified Defects Only</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDownloadJson}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Download size={14} />
            Export JSON
          </button>

          <button
            onClick={handleDownloadSarif}
            disabled={downloading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
            }}
          >
            <FileSpreadsheet size={14} />
            {downloading ? 'Exporting...' : 'Export SARIF v2.1.0'}
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px repeat(4, 1fr)', gap: '1rem' }}>
        {/* Posture Score */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
            Security Posture Score
          </span>
          <div style={{
            fontSize: '3rem',
            fontWeight: '900',
            color: getScoreColor(report.overall_posture_score),
            lineHeight: '1.1',
            margin: '8px 0'
          }}>
            {report.overall_posture_score}
            <span style={{ fontSize: '1.25rem', color: '#94a3b8' }}>/100</span>
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: '800',
            color: getScoreColor(report.overall_posture_score),
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '3px 8px',
            borderRadius: '4px'
          }}>
            {report.risk_level}
          </span>
        </div>

        {/* Severity Metrics */}
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '1.25rem' }}>
          <span style={{ fontSize: '12px', color: '#b91c1c', fontWeight: '700' }}>CRITICAL</span>
          <div style={{ fontSize: '2.25rem', fontWeight: '900', color: '#991b1b', marginTop: '6px' }}>
            {report.severity_breakdown.CRITICAL || 0}
          </div>
          <span style={{ fontSize: '11px', color: '#7f1d1d' }}>Requires immediate fix</span>
        </div>

        <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: '12px', padding: '1.25rem' }}>
          <span style={{ fontSize: '12px', color: '#c2410c', fontWeight: '700' }}>HIGH</span>
          <div style={{ fontSize: '2.25rem', fontWeight: '900', color: '#9a3412', marginTop: '6px' }}>
            {report.severity_breakdown.HIGH || 0}
          </div>
          <span style={{ fontSize: '11px', color: '#7c2d12' }}>Sprint priority (0-7d)</span>
        </div>

        <div style={{ background: '#fefce8', border: '1px solid #fde047', borderRadius: '12px', padding: '1.25rem' }}>
          <span style={{ fontSize: '12px', color: '#a16207', fontWeight: '700' }}>MEDIUM</span>
          <div style={{ fontSize: '2.25rem', fontWeight: '900', color: '#854d0e', marginTop: '6px' }}>
            {report.severity_breakdown.MEDIUM || 0}
          </div>
          <span style={{ fontSize: '11px', color: '#713f12' }}>Scheduled fix (8-30d)</span>
        </div>

        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '1.25rem' }}>
          <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: '700' }}>TRIAGE AUDIT</span>
          <div style={{ fontSize: '2.25rem', fontWeight: '900', color: '#075985', marginTop: '6px' }}>
            {report.approved_findings_count}
            <span style={{ fontSize: '1rem', color: '#64748b' }}>/{report.total_findings_staged}</span>
          </div>
          <span style={{ fontSize: '11px', color: '#0284c7' }}>{report.rejected_findings_count} False Positives</span>
        </div>
      </div>

      {/* Compliance & Standards Matrix */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem' }}>
          Regulatory & Industry Security Compliance Matrix
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {Object.entries(report.owasp_llm_compliance).map(([standard, status]) => {
            const isFailed = status.includes('FAILED');
            return (
              <div
                key={standard}
                style={{
                  background: isFailed ? '#fef2f2' : '#ecfdf5',
                  border: `1px solid ${isFailed ? '#fca5a5' : '#a7f3d0'}`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{standard}</h4>
                  <p style={{ fontSize: '12px', color: isFailed ? '#b91c1c' : '#047857', marginTop: '2px', fontWeight: '600' }}>{status}</p>
                </div>
                {isFailed ? (
                  <AlertOctagon size={22} style={{ color: '#dc2626' }} />
                ) : (
                  <CheckCircle2 size={22} style={{ color: '#059669' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Prioritized Remediation Roadmap */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <Clock size={20} style={{ color: '#0284c7' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>
            Prioritized CISO Remediation Roadmap (Effort vs. Impact)
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {report.remediation_roadmap.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '13px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              No active security defects detected. Remediation roadmap items will populate dynamically after a scan completes.
            </div>
          ) : (
            report.remediation_roadmap.map((item) => (
            <div
              key={item.priority}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                display: 'grid',
                gridTemplateColumns: '140px 1fr 180px',
                gap: '1rem',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{
                  background: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'inline-block'
                }}>
                  {item.timeframe}
                </span>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>
                  Priority #{item.priority}
                </span>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{item.title}</h4>
                <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: '1.4' }}>{item.description}</p>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  {item.affected_services.map((svc) => (
                    <span key={svc} style={{ fontSize: '10px', background: '#ffffff', color: '#0284c7', padding: '1px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '600' }}>
                      {svc}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ color: '#64748b' }}>Effort: <strong style={{ color: '#0f172a' }}>{item.effort}</strong></span>
                <span style={{ color: '#64748b' }}>Impact: <strong style={{ color: '#0284c7' }}>{item.impact}</strong></span>
              </div>
            </div>
          )))}
        </div>
      </div>
    </div>
  );
}
