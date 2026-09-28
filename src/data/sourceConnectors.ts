// No upstream endpoints or credentials are configured in this application yet.
export const SOURCE_CONNECTORS = [
  { acronym: 'NUC', name: 'Nigerian Universities Commission (NUC)', description: 'University oversight and accreditation reference for higher education checks.' },
  { acronym: 'NPC', name: 'National Population Commission (NPC)', description: 'Source for birth registration and population records checks.' },
  { acronym: 'NIMC', name: 'National Identity Management Commission (NIMC)', description: 'Source for national identity records checks.' },
  { acronym: 'INEC', name: 'Independent National Electoral Commission (INEC)', description: 'Source for electoral registration and nomination records checks.' },
  { acronym: 'NYSC', name: 'National Youth Service Corps (NYSC)', description: 'Source for national service certificate checks.' },
  { acronym: 'WAEC', name: 'West African Examinations Council (WAEC)', description: 'Source for examination results and certificate checks.' },
].map(source => ({
  ...source, id: `conn_${source.acronym.toLowerCase()}`, status: 'NOT_CONFIGURED',
  tier: 'Authoritative source', protocol: 'Connection not configured',
  uptime: 'Not measured', avgLatency: 'Not measured', totalQueriesToday: 0,
}));

