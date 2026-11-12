import React, { useState, useEffect } from 'react';
import { Shield, Network, Terminal, CheckSquare, BarChart3, Play, RefreshCw, Cpu } from 'lucide-react';
import AttackGraph from './components/AttackGraph';
import LiveDecisionStream from './components/LiveDecisionStream';
import TriageQueue from './components/TriageQueue';
import CisoDashboard from './components/CisoDashboard';
import {
  fetchHealth,
  fetchTopology,
  triggerScan,
  fetchTriageFindings,
  updateTriageFinding,
  fetchCisoReport,
  subscribeToEvents
} from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('topology'); // topology | stream | triage | ciso
  const [topology, setTopology] = useState(null);
  const [events, setEvents] = useState([]);
  const [findings, setFindings] = useState([]);
  const [cisoReport, setCisoReport] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [modelInfo, setModelInfo] = useState({ model: 'gpt-6-luna', thinking_mode: 'xhigh', has_api_key: false });

  // Load initial data
  const loadData = async () => {
    try {
      const [topo, fnds, report, health] = await Promise.all([
        fetchTopology(),
        fetchTriageFindings(),
        fetchCisoReport(),
        fetchHealth().catch(() => null)
      ]);
      setTopology(topo);
      setFindings(fnds);
      setCisoReport(report);
      if (health && typeof health.is_scanning === 'boolean') {
        setIsScanning(health.is_scanning);
      }
      if (health && health.configured_llm) {
        setModelInfo(health.configured_llm);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to SSE telemetry stream
    const unsubscribe = subscribeToEvents(
      (event) => {
        setEvents((prev) => [...prev, event]);
        if (event.probe_type === 'SCAN_COMPLETE') {
          setIsScanning(false);
          fetchTriageFindings().then(setFindings);
          fetchCisoReport().then((rep) => {
            setCisoReport(rep);
            // Automatically navigate directly to the CISO dashboard to view analytics
            setTimeout(() => {
              setActiveTab('ciso');
            }, 1000);
          });
        } else if (event.probe_type === 'TOPOLOGY_UPLOAD') {
          // Uploading a manifest does not mean a probe scan is active
          setIsScanning(false);
        } else {
          // Active probing event
          setIsScanning(true);
          if (event.phase === 'DECISION' && event.finding_id) {
            fetchTriageFindings().then(setFindings);
          }
        }
      },
      (err) => {
        console.warn('SSE stream notice:', err);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleStartScan = async () => {
    if (!topology || !topology.services || topology.services.length === 0) {
      alert('Please upload or drag & drop a docker-compose.yml file first.');
      return;
    }
    setIsScanning(true);
    setActiveTab('stream');
    try {
      const res = await triggerScan();
      if (res.status === 'ERROR') {
        alert(res.message);
        setIsScanning(false);
        setActiveTab('topology');
      }
    } catch (err) {
      console.error('Failed to trigger scan:', err);
      setIsScanning(false);
    }
  };

  const handleUpdateFinding = async (findingId, updateData) => {
    try {
      await updateTriageFinding(findingId, updateData);
      const updatedList = await fetchTriageFindings();
      setFindings(updatedList);
      const updatedReport = await fetchCisoReport();
      setCisoReport(updatedReport);
    } catch (err) {
      console.error('Failed to update finding:', err);
    }
  };

  const pendingCount = findings.filter((f) => f.status === 'PENDING_REVIEW').length;
  const approvedCount = findings.filter((f) => f.status === 'APPROVED').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      {/* Top Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0.875rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
          }}>
            <Shield size={22} style={{ color: '#ffffff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              AegisAgent
              <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bae6fd', fontWeight: '700' }}>
                v1.0.0
              </span>
            </h1>
            <p style={{ fontSize: '11px', color: '#64748b' }}>
              Autonomous AppSec & LLM Red-Teaming Platform • Author: <strong style={{ color: '#334155' }}>Harsh Patel</strong>
            </p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setActiveTab('topology')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'topology' ? '#ffffff' : 'transparent',
              color: activeTab === 'topology' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'topology' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <Network size={14} />
            Attack Topology
          </button>

          <button
            onClick={() => setActiveTab('stream')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'stream' ? '#ffffff' : 'transparent',
              color: activeTab === 'stream' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'stream' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <Terminal size={14} />
            Agent Telemetry Stream
            {isScanning && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            )}
          </button>

          <button
            onClick={() => setActiveTab('triage')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'triage' ? '#ffffff' : 'transparent',
              color: activeTab === 'triage' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'triage' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <CheckSquare size={14} />
            HITL Triage Queue
            {pendingCount > 0 && (
              <span style={{
                background: '#fef3c7',
                color: '#b45309',
                padding: '1px 6px',
                borderRadius: '9999px',
                fontSize: '10px',
                fontWeight: '800',
                border: '1px solid #fde68a'
              }}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ciso')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'ciso' ? '#ffffff' : 'transparent',
              color: activeTab === 'ciso' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'ciso' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <BarChart3 size={14} />
            CISO Dashboard
            {approvedCount > 0 && (
              <span style={{
                background: '#fee2e2',
                color: '#b91c1c',
                padding: '1px 6px',
                borderRadius: '9999px',
                fontSize: '10px',
                fontWeight: '800',
                border: '1px solid #fca5a5'
              }}>
                {approvedCount}
              </span>
            )}
          </button>
        </nav>

        {/* Global Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={loadData}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#64748b',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            title="Refresh state"
          >
            <RefreshCw size={13} />
          </button>

          <button
            onClick={handleStartScan}
            disabled={isScanning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isScanning ? '#94a3b8' : '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '7px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              boxShadow: isScanning ? 'none' : '0 2px 8px rgba(2, 132, 199, 0.3)'
            }}
          >
            <Play size={13} fill={isScanning ? 'none' : '#ffffff'} />
            {isScanning ? 'Running Probes...' : 'Launch Scan'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
        {activeTab === 'topology' && (
          <AttackGraph
            topology={topology}
            onStartScan={handleStartScan}
            isScanning={isScanning}
            onTopologyUpdated={(newTopo) => {
              setTopology(newTopo);
              fetchTriageFindings().then(setFindings);
              fetchCisoReport().then(setCisoReport);
            }}
          />
        )}

        {activeTab === 'stream' && (
          <LiveDecisionStream
            events={events}
            isScanning={isScanning}
            onClearEvents={() => setEvents([])}
            onStartScan={handleStartScan}
            hasTopology={Boolean(topology && topology.services && topology.services.length > 0)}
            modelInfo={modelInfo}
          />
        )}

        {activeTab === 'triage' && (
          <TriageQueue
            findings={findings}
            onUpdateFinding={handleUpdateFinding}
          />
        )}

        {activeTab === 'ciso' && (
          <CisoDashboard report={cisoReport} />
        )}
      </main>
    </div>
  );
}
