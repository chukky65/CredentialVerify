import React, { useState } from 'react';
import { SOURCE_CONNECTORS } from '../../data/sourceConnectors';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  Database,
  ExternalLink,
} from 'lucide-react';

export const SourceChecksScreen: React.FC = () => {
  const { addToast } = useApp();
  const [testingConnectorId, setTestingConnectorId] = useState<string | null>(null);

  const connectors = SOURCE_CONNECTORS;

  const handleTestPing = async (_id: string, name: string) => {
    addToast(name + ': connection is not configured. No health query was sent.', 'warning');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#17202A]">Authoritative Source Connectors</h2>
          <p className="text-xs text-[#5B6777] mt-0.5">
            Authoritative sources for credential checks. Connections must be configured before health measurements are available.
          </p>
        </div>

        <button
          type="button"
          onClick={() => addToast('These six source connections are not configured. No health queries were sent.', 'warning')}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Diagnostic Health Ping All</span>
        </button>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connectors.map((conn) => (
          <div
            key={conn.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#17324D] bg-slate-100 px-2 py-0.5 rounded">
                      {conn.acronym}
                    </span>
                    <StatusBadge status={conn.status} size="sm" />
                  </div>
                  <h3 className="font-bold text-sm text-[#17202A] mt-1.5">{conn.name}</h3>
                </div>
              </div>

              <p className="text-xs text-[#5B6777] leading-relaxed">{conn.description}</p>

              <div className="p-3 bg-[#F5F7FA] rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-xs font-tabular">
                <div>
                  <span className="text-slate-500 block text-[10px]">Tier Classification:</span>
                  <span className="font-semibold text-[#17202A]">{conn.tier}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Average Latency:</span>
                  <span className="font-bold text-[#17202A]">{conn.avgLatency}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">24h Availability:</span>
                  <span className="font-semibold text-[#237A57]">{conn.uptime}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Queries Processed Today:</span>
                  <span className="font-bold text-[#17202A]">{conn.totalQueriesToday}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 truncate max-w-[200px]">
                {conn.protocol}
              </span>
              <button
                type="button"
                onClick={() => handleTestPing(conn.id, conn.name)}
                disabled={testingConnectorId === conn.id}
                className="px-3 py-1.5 text-xs font-semibold text-[#17324D] bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1.5 disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${testingConnectorId === conn.id ? 'animate-spin' : ''}`} />
                <span>{testingConnectorId === conn.id ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
