// API client wrapper for AegisAgent backend

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchTopology() {
  const res = await fetch(`${API_BASE}/topology`);
  return res.json();
}

export async function uploadComposeFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/topology/upload`, {
    method: 'POST',
    body: formData
  });
  return res.json();
}

export async function triggerScan() {
  const res = await fetch(`${API_BASE}/scan/start`, { method: 'POST' });
  return res.json();
}

export async function fetchTriageFindings(status) {
  const url = status ? `${API_BASE}/triage?status=${status}` : `${API_BASE}/triage`;
  const res = await fetch(url);
  return res.json();
}

export async function updateTriageFinding(findingId, updateData) {
  const res = await fetch(`${API_BASE}/triage/${findingId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  return res.json();
}

export async function fetchCisoReport() {
  const res = await fetch(`${API_BASE}/ciso/report`);
  return res.json();
}

export async function fetchSarifExport() {
  const res = await fetch(`${API_BASE}/ciso/sarif`);
  return res.json();
}

export function subscribeToEvents(onEvent, onError) {
  const eventSource = new EventSource(`${API_BASE}/scan/stream`);
  
  eventSource.addEventListener('agent_event', (e) => {
    try {
      const data = JSON.parse(e.data);
      onEvent(data);
    } catch (err) {
      console.error('Error parsing SSE event data:', err);
    }
  });

  eventSource.onerror = (err) => {
    if (onError) onError(err);
  };

  return () => {
    eventSource.close();
  };
}
