import React, { useState, useRef } from 'react';
import { Network, Server, Cpu, ShieldAlert, Globe, Database, ArrowRight, Play, UploadCloud, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { uploadComposeFile } from '../api/client';

export default function AttackGraph({ topology, onStartScan, isScanning, onTopologyUpdated }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setUploadStatus(null);
    try {
      const result = await uploadComposeFile(file);
      if (result.status === 'SUCCESS' && result.topology) {
        setUploadStatus({
          type: 'success',
          message: `Loaded ${file.name}: ${result.topology.services.length} services mapped.`
        });
        if (onTopologyUpdated) {
          onTopologyUpdated(result.topology);
        }
      } else {
        setUploadStatus({
          type: 'error',
          message: result.error || 'Failed to parse uploaded manifest.'
        });
      }
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message: err.message || 'Network error while uploading compose file.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  if (!topology || !topology.services) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        Loading infrastructure topology...
      </div>
    );
  }

  const getServiceIcon = (type) => {
    switch (type) {
      case 'LLM_AGENT':
        return <Cpu size={24} style={{ color: '#db2777' }} />;
      case 'REST_API':
        return <Database size={24} style={{ color: '#0284c7' }} />;
      case 'WEB_PORTAL':
        return <Globe size={24} style={{ color: '#059669' }} />;
      case 'CLOUD_METADATA':
        return <Server size={24} style={{ color: '#d97706' }} />;
      case 'DIRECTORY_SERVICE':
        return <Network size={24} style={{ color: '#9333ea' }} />;
      default:
        return <Server size={24} style={{ color: '#64748b' }} />;
    }
  };

  const getTypeBadge = (type) => {
    const styles = {
      LLM_AGENT: { bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8' },
      REST_API: { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' },
      WEB_PORTAL: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
      CLOUD_METADATA: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
      DIRECTORY_SERVICE: { bg: '#faf5ff', text: '#7e22ce', border: '#f3e8ff' }
    }[type] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };

    return (
      <span style={{
        backgroundColor: styles.bg,
        color: styles.text,
        border: `1px solid ${styles.border}`,
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Interactive File Upload Banner */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragOver ? '#0284c7' : '#cbd5e1'}`,
          background: isDragOver ? '#f0f9ff' : '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          accept=".yml,.yaml"
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            padding: '12px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7'
          }}>
            <UploadCloud size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Upload Custom Architecture Manifest (docker-compose.yml)
              <span style={{ fontSize: '11px', background: '#0284c7', color: '#ffffff', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                Interactive Upload
              </span>
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Drag & drop any <code style={{ color: '#0284c7', background: '#f1f5f9', padding: '1px 4px', borderRadius: '4px' }}>.yml</code> or click to browse. The platform will automatically parse services, exposed ports, and attack surfaces.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            disabled={isUploading}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0284c7',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <FileText size={14} />
            {isUploading ? 'Parsing Manifest...' : 'Browse File'}
          </button>
        </div>
      </div>

      {/* Upload Feedback Message */}
      {uploadStatus && (
        <div style={{
          background: uploadStatus.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${uploadStatus.type === 'success' ? '#a7f3d0' : '#fca5a5'}`,
          color: uploadStatus.type === 'success' ? '#047857' : '#b91c1c',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '500'
        }}>
          {uploadStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{uploadStatus.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        padding: '1.25rem 1.5rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={22} style={{ color: '#0284c7' }} />
            Active Target Attack Topology
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            Active Manifest: <code style={{ color: '#0284c7', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>{topology.source_file}</code> — Subnet: <span style={{ color: '#0f172a', fontWeight: '600' }}>{topology.subnets[0]}</span> ({topology.services.length} services mapped)
          </p>
        </div>
        <button
          onClick={onStartScan}
          disabled={isScanning || topology.services.length === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: (isScanning || topology.services.length === 0) ? '#cbd5e1' : '#0284c7',
            color: (isScanning || topology.services.length === 0) ? '#64748b' : '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: (isScanning || topology.services.length === 0) ? 'not-allowed' : 'pointer',
            boxShadow: (isScanning || topology.services.length === 0) ? 'none' : '0 2px 8px rgba(2, 132, 199, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          <Play size={16} fill={(isScanning || topology.services.length === 0) ? 'none' : '#ffffff'} />
          {isScanning ? 'Scan in Progress...' : 'Launch Agentic Scan'}
        </button>
      </div>

      {/* Services Grid or Empty State */}
      {topology.services.length === 0 ? (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <Server size={36} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>
            No Target Services Mapped Yet
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '6px', maxWidth: '480px', margin: '6px auto 0 auto' }}>
            Drag & drop or upload your <code style={{ color: '#0284c7', background: '#f1f5f9', padding: '1px 4px', borderRadius: '4px' }}>docker-compose.yml</code> above to reconstruct the attack surface graph.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem'
        }}>
          {topology.services.map((svc) => (
            <div
              key={svc.name}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getServiceIcon(svc.target_type)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>{svc.name}</h3>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>host: {svc.hostname}</span>
                  </div>
                </div>
                {getTypeBadge(svc.target_type)}
              </div>

              {/* Network & Port details */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Internal IPv4:</span>
                  <span style={{ color: '#0284c7', fontFamily: 'monospace', fontWeight: '600' }}>{svc.ipv4_address || 'Dynamic'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Port Mapping:</span>
                  <span style={{ color: '#b45309', fontFamily: 'monospace', fontWeight: '600' }}>
                    {svc.host_port ? `${svc.host_port}:${svc.container_port || svc.host_port}` : 'Internal Only (SSRF Target)'}
                  </span>
                </div>
              </div>

              {/* Attack surfaces */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Target Attack Surfaces:
                </span>
                <ul style={{ listStyle: 'none', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {svc.attack_surfaces.map((surf, idx) => (
                    <li key={idx} style={{
                      fontSize: '12px',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ color: '#e11d48' }}>•</span> {surf}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
