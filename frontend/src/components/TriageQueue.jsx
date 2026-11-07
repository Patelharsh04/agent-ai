import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Sliders, FileCode, Check, AlertTriangle, MessageSquare } from 'lucide-react';

export default function TriageQueue({ findings, onUpdateFinding }) {
  const [selectedFindingId, setSelectedFindingId] = useState(findings[0]?.id || null);
  const [cvssOverride, setCvssOverride] = useState(null);
  const [notes, setNotes] = useState('');

  const selectedFinding = findings.find((f) => f.id === selectedFindingId) || findings[0];

  const handleSelectFinding = (finding) => {
    setSelectedFindingId(finding.id);
    setCvssOverride(finding.analyst_cvss_score || finding.machine_cvss_score);
    setNotes(finding.analyst_notes || '');
  };

  const handleApprove = () => {
    if (!selectedFinding) return;
    onUpdateFinding(selectedFinding.id, {
      status: 'APPROVED',
      analyst_cvss_score: cvssOverride,
      analyst_notes: notes
    });
  };

  const handleReject = () => {
    if (!selectedFinding) return;
    onUpdateFinding(selectedFinding.id, {
      status: 'REJECTED',
      analyst_cvss_score: cvssOverride,
      analyst_notes: notes || 'Rejected by security analyst as false positive / acceptable risk.'
    });
  };

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return { bg: '#fef2f2', text: '#b91c1c', border: '#fca5a5' };
      case 'HIGH':
        return { bg: '#fff7ed', text: '#c2410c', border: '#fdba74' };
      case 'MEDIUM':
        return { bg: '#fefce8', text: '#a16207', border: '#fde047' };
      default:
        return { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span style={{ color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>APPROVED</span>;
      case 'REJECTED':
        return <span style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fca5a5', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>FALSE POSITIVE</span>;
      default:
        return <span style={{ color: '#a16207', background: '#fefce8', border: '1px solid #fde047', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>PENDING TRIAGE</span>;
    }
  };

  if (!findings || findings.length === 0) {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '3rem',
        textAlign: 'center',
        color: '#64748b',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <ShieldAlert size={36} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>No Raw Findings in Triage Queue</h3>
        <p style={{ fontSize: '0.875rem', marginTop: '6px' }}>Run an agent scan to stage automated detections for manual audit.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.25rem', height: 'calc(100vh - 180px)' }}>
      {/* Findings Sidebar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
          Staged Detections ({findings.length})
        </h3>
        {findings.map((f) => {
          const isSelected = f.id === (selectedFinding?.id || '');
          const sev = getSeverityStyle(f.severity);
          return (
            <div
              key={f.id}
              onClick={() => handleSelectFinding(f)}
              style={{
                background: isSelected ? '#f0f9ff' : '#ffffff',
                border: `1px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                transition: 'all 0.15s',
                boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.15)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  backgroundColor: sev.bg,
                  color: sev.text,
                  border: `1px solid ${sev.border}`,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '700'
                }}>
                  {f.severity} ({f.analyst_cvss_score || f.machine_cvss_score})
                </span>
                {getStatusBadge(f.status)}
              </div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', lineHeight: '1.3' }}>
                {f.title}
              </h4>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Service: <strong style={{ color: '#0284c7' }}>{f.service}</strong>
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Review Pane */}
      {selectedFinding && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#0284c7', fontSize: '12px', fontWeight: '800', fontFamily: 'monospace' }}>
                  {selectedFinding.id}
                </span>
                <span style={{ color: '#64748b', fontSize: '12px' }}>• {selectedFinding.cwe_id}</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                {selectedFinding.title}
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
                {selectedFinding.owasp_category}
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleReject}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  border: '1px solid #fca5a5',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <XCircle size={14} />
                Mark False Positive
              </button>
              <button
                onClick={handleApprove}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                }}
              >
                <CheckCircle size={14} />
                Approve for CISO Report
              </button>
            </div>
          </div>

          {/* Description */}
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px' }}>Impact Description</h4>
            <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>{selectedFinding.description}</p>
          </div>

          {/* CVSS Calculator & Adjuster */}
          <div style={{
            background: '#f1f5f9',
            padding: '1.25rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} style={{ color: '#0284c7' }} />
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>CVSS Score Calibration (Analyst Audit)</h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>Machine Score: <strong style={{ color: '#b45309' }}>{selectedFinding.machine_cvss_score}</strong></span>
                <span style={{ color: '#64748b' }}>Audited Score: <strong style={{ color: '#0284c7', fontSize: '15px' }}>{(cvssOverride || selectedFinding.machine_cvss_score).toFixed(1)}</strong></span>
              </div>
            </div>

            <input
              type="range"
              min="0.0"
              max="10.0"
              step="0.1"
              value={cvssOverride || selectedFinding.machine_cvss_score}
              onChange={(e) => setCvssOverride(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
              Vector: {selectedFinding.cvss_vector}
            </span>
          </div>

          {/* Evidence Inspector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={16} style={{ color: '#0284c7' }} />
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Raw HTTP & Canary Evidence</h4>
            </div>

            {selectedFinding.canary_token && (
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '600'
              }}>
                <Check size={16} />
                <span>Canary Token Verified: <code style={{ fontWeight: '800' }}>{selectedFinding.canary_token}</code></span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Probing Request Payload</span>
                <pre style={{
                  background: '#f8fafc',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '11px',
                  color: '#0369a1',
                  overflowX: 'auto',
                  maxHeight: '180px'
                }}>
                  {JSON.stringify(selectedFinding.evidence_request, null, 2)}
                </pre>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Target Response Output</span>
                <pre style={{
                  background: '#f8fafc',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '11px',
                  color: '#047857',
                  overflowX: 'auto',
                  maxHeight: '180px'
                }}>
                  {JSON.stringify(selectedFinding.evidence_response, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Remediation */}
          <div style={{ background: '#ecfdf5', border: '1px solid #10b981', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '11px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>Recommended Engineering Remediation</h4>
            <pre style={{ fontSize: '12px', color: '#064e3b', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: '1.4' }}>
              {selectedFinding.remediation}
            </pre>
          </div>

          {/* Analyst Notes */}
          <div>
            <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Analyst Triage Notes & Justification:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record operational context, rationale for CVSS adjustment, or validation remarks..."
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#0f172a',
                fontSize: '12px',
                minHeight: '60px',
                outline: 'none'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
