const naija = require('naija-state-local-government');
const fs = require('fs');

const allStates = naija.states();
let output = `export interface StateData {\n  state: string;\n  senatorialDistricts: string[];\n  lgas: string[];\n}\n\n`;
output += `export const NIGERIA_JURISDICTIONS: StateData[] = [\n`;

for (const state of allStates) {
  const lgas = naija.lgas(state.state || state);
  const stateName = state.state ? state.state : state;
  const displayName = stateName === 'FCT' || stateName === 'Federal Capital Territory' ? 'FCT - Abuja' : `${stateName} State`;
  
  const districts = displayName === 'FCT - Abuja' 
    ? ['FCT Senatorial District'] 
    : [`${stateName} North Senatorial District`, `${stateName} Central Senatorial District`, `${stateName} South Senatorial District`];
    
  output += `  {\n`;
  output += `    state: "${displayName}",\n`;
  output += `    senatorialDistricts: ${JSON.stringify(districts)},\n`;
  output += `    lgas: ${JSON.stringify(lgas.lgas || lgas)}\n`;
  output += `  },\n`;
}
output += `];\n`;

// Create data directory if it doesn't exist
if (!fs.existsSync('../src/data')) {
  fs.mkdirSync('../src/data');
}
fs.writeFileSync('../src/data/jurisdictions.ts', output);
console.log('Successfully generated src/data/jurisdictions.ts');
