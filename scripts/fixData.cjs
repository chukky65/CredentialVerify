const fs = require('fs');
const path = require('path');

const typesPath = path.join(__dirname, '../src/types.ts');
let typesContent = fs.readFileSync(typesPath, 'utf8');

// Add is_demo?: boolean; to all major interfaces
const interfacesToUpdate = [
  'UserAccount',
  'Candidate',
  'VerificationCase',
  'SourceCheck',
  'DiscrepancyItem',
  'AuditLogEvent',
  'CandidateRFI',
  'StatutoryRule'
];

interfacesToUpdate.forEach(intf => {
  const regex = new RegExp(`export interface ${intf} \\{`);
  typesContent = typesContent.replace(regex, `export interface ${intf} {\n  is_demo?: boolean;`);
});

fs.writeFileSync(typesPath, typesContent);
console.log('Updated types.ts');

const mockPath = path.join(__dirname, '../src/services/mockData.ts');
let mockContent = fs.readFileSync(mockPath, 'utf8');

// Standardize jurisdiction
mockContent = mockContent.replace(/jurisdiction: '.*?'/g, "jurisdiction: 'Pacifica National'");

// Replace PAC- with CAND-
mockContent = mockContent.replace(/referenceCode: 'PAC-/g, "referenceCode: 'CAND-");

// Add is_demo: true to records. 
// The easiest way is to add it after id: '...' or similar.
mockContent = mockContent.replace(/id: '(.*?)',/g, "id: '$1',\n    is_demo: true,");

fs.writeFileSync(mockPath, mockContent);
console.log('Updated mockData.ts');

