import React, { useState } from 'react';
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

  const [connectors, setConnectors] = useState([
    {
      id: 'conn_nadc',
      name: 'National Academic Degree Clearinghouse (NADC)',
      acronym: 'NADC',
      tier: 'Tier 1 Certified Statutory Registry',
      protocol: 'REST / OAuth2 Mutual TLS',
      endpoint: 'https://api.nadc.gov.pac/v3/credentials/verify',
      status: 'HEALTHY',
      uptime: '99.98%',
      avgLatency: '342ms',
      lastPing: '2026-08-26 11:28 UTC',
      totalQueriesToday: 142,
      successRate: '99.3%',
      description: 'Official national central clearinghouse for accredited higher education degrees, graduation dates, and honorary titles.',
    },
    {
      id: 'conn_bar',
      name: 'Supreme Judicial Bar of Pacifica Registry API',
      acronym: 'PAC_BAR',
      tier: 'Tier 1 Statutory Registry',
      protocol: 'JSON-RPC / Webhook Handshake',
      endpoint: 'https://registry.pacifica-bar.org/api/attorneys/roll',
      status: 'HEALTHY',
      uptime: '100%',
      avgLatency: '210ms',
      lastPing: '2026-08-26 11:29 UTC',
      totalQueriesToday: 48,
      successRate: '100%',
      description: 'Official roll of certified legal practitioners, bar admission dates, disciplinary history, and active good standing certificates.',
    },
    {
      id: 'conn_nrcs',
      name: 'National Civil Status & Population Register',
      acronym: 'NRCS',
      tier: 'Tier 1 Sovereign Identity Register',
      protocol: 'SOAP / WSDL Encrypted Gateway',
      endpoint: 'https://nrcs.gov.pac/soap/identity/v2',
      status: 'HEALTHY',
      uptime: '99.95%',
      avgLatency: '185ms',
      lastPing: '2026-08-26 11:27 UTC',
      totalQueriesToday: 215,
      successRate: '99.8%',
      description: 'Central civil registration ledger verifying statutory citizenship by birth or naturalization, legal name changes, and birth dates.',
    },
    {
      id: 'conn_police',
      name: 'National Police Criminal Record & Clearances Gateway',
      acronym: 'NPCG',
      tier: 'Tier 1 Law Enforcement Index',
      protocol: 'REST / Mutual TLS Bearer',
      endpoint: 'https://clearance.police.gov.pac/api/v1/certificates',
      status: 'HEALTHY',
      uptime: '99.82%',
      avgLatency: '410ms',
      lastPing: '2026-08-26 11:25 UTC',
      totalQueriesToday: 89,
      successRate: '98.9%',
      description: 'Statutory background and non-conviction clearance register for candidate electoral security prerequisite filings.',
    },
    {
      id: 'conn_tax',
      name: 'Department of Revenue Tax Compliance Gateway',
      acronym: 'DOR_TAX',
      tier: 'Tier 1 Revenue Register',
      protocol: 'REST / HMAC-SHA256 Token',
      endpoint: 'https://gateway.revenue.gov.pac/v2/taxpayer/status',
      status: 'OFFLINE',
      uptime: '94.20%',
      avgLatency: 'Timeout',
      lastPing: '2026-08-26 11:29 UTC (Failed)',
      totalQueriesToday: 32,
      successRate: '71.8%',
      description: 'Public integrity asset filing verification and statutory tax clearance certificate validator.',
    },
    {
      id: 'conn_archives',
      name: 'National Historical Archives Document Gateway',
      acronym: 'ARCHIVES',
      tier: 'Tier 2 Supplemental Archive',
      protocol: 'OpenSearch Document Interface',
      endpoint: 'https://archives.gov.pac/search/historical/filings',
      status: 'DEGRADED',
      uptime: '96.50%',
      avgLatency: '8.2s',
      lastPing: '2026-08-26 11:24 UTC',
      totalQueriesToday: 15,
      successRate: '88.0%',
      description: 'Supplemental archive for historical naturalization documents, land deed records, and gazette notices older than 30 years.',
    },
  ]);

  const handleTestPing = async (id: string, name: string) => {
    setTestingConnectorId(id);
    await new Promise((r) => setTimeout(r, 600));
    setTestingConnectorId(null);
    if (id === 'conn_tax') {
      addToast(`Connector [${name}] ping failed: Connection refused (HTTP 503 Service Unavailable).`, 'error');
    } else {
      addToast(`Connector [${name}] responded in 214ms. Diagnostic handshake certified.`, 'success');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#17202A]">Authoritative Source Connectors</h2>
          <p className="text-xs text-[#5B6777] mt-0.5">
            Real-time telemetry, cryptographic keys, and connectivity health of government registry APIs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => addToast('All source health pings dispatched.', 'info')}
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
