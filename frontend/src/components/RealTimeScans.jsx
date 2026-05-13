import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Radio, WifiOff, X } from 'lucide-react';
import { api } from '../services/api';

const RealTimeScans = () => {
  const [scans, setScans] = useState([]);
  const [scanValue, setScanValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSynced, setLastSynced] = useState('');
  const inputRef = useRef(null);

  const loadRecentScans = async () => {
    try {
      const response = await api.getFx9600RecentScans(6);
      setScans(Array.isArray(response) ? response : []);
      setError('');
      setLastSynced(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || 'Unable to reach the FX9600 reader feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentScans();
    const timer = setInterval(loadRecentScans, 5000);
    return () => clearInterval(timer);
  }, []);

  const addScan = async (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      await api.postFx9600Scan({
        tagCode: trimmed,
        readerName: 'Login bridge',
        scannedAt: new Date().toISOString(),
      });
      setScanValue('');
      if (inputRef.current) inputRef.current.value = '';
      await loadRecentScans();
    } catch (err) {
      setError(err.message || 'Failed to submit the scan to the FX9600 bridge.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    await addScan(scanValue || inputRef.current?.value || '');
  };

  const handleInputKeyDown = async (event) => {
    if (event.key === 'Enter') {
      await addScan(event.target.value);
    }
  };

  const formatStatus = (scan) => scan.status || (scan.resolved ? 'Matched' : 'Unknown tag');

  const formatReaderName = (scan) => scan.readerName || 'FX9600';

  const formatTagCode = (scan) => scan.tagCode || scan.id;

  const formatProductName = (scan) => scan.productName || 'Unregistered tag';

  const formatTimestamp = (scan) => {
    if (!scan.scannedAt) return 'Just now';

    const ts = new Date(scan.scannedAt);
    return Number.isNaN(ts.getTime()) ? 'Just now' : ts.toLocaleTimeString();
  };

  const formatBadgeClass = (scan) => (
    scan.resolved
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : 'bg-orange-50 text-orange-700 border-orange-100'
  );

  const formatAvatarClass = (scan) => (scan.resolved ? 'bg-brand-600' : 'bg-orange-500');

  const clearError = () => setError('');

  const isBusy = loading || saving;

  return (
    <div className="mt-6 w-full max-w-md">
      <div className="rounded-lg border border-gray-100 bg-white/60 p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-brand-600" />
            <div className="text-sm font-medium text-gray-700">Real-time Scans</div>
          </div>
          <div className="text-xs text-gray-400">Live • {scans.length}</div>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            ref={inputRef}
            value={scanValue}
            onChange={(e) => setScanValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Scan RFID / Enter EPC"
            className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Sending...' : 'Scan'}
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
          <span>{loading ? 'Syncing FX9600 feed...' : lastSynced ? `Last sync ${lastSynced}` : 'Waiting for reader data'}</span>
          {error ? (
            <button type="button" onClick={clearError} className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700">
              <WifiOff className="h-3.5 w-3.5" />
              Error
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="mt-2 rounded-md border border-orange-100 bg-orange-50 px-3 py-2 text-xs text-orange-700">
            {error}
          </div>
        ) : null}

        <div className="mt-3 max-h-40 overflow-auto">
          {isBusy && scans.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for scan data...
            </div>
          ) : scans.length === 0 ? (
            <div className="text-xs text-gray-400">No recent scans</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {scans.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-md ${formatAvatarClass(s)} text-white flex items-center justify-center font-medium`}>
                      {formatTagCode(s).slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">{formatProductName(s)}</div>
                      <div className="text-xs text-gray-400 font-mono">{formatTagCode(s)}</div>
                      <div className="text-[11px] text-gray-400">{formatReaderName(s)} • {formatTimestamp(s)}</div>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${formatBadgeClass(s)}`}>
                    {formatStatus(s)}
                  </span>
                  <button
                    onClick={() => setScans((prev) => prev.filter((p) => p.id !== s.id))}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeScans;
