// Script to update backend URLs to use centralized config
const fs = require('fs');
const path = require('path');

const files = [
  'app/admins/page.js',
  'app/Log-in/page.js', 
  'app/Sign-up/page.js',
  'app/reports/page.js',
  'app/assignedReports/page.js',
  'app/history/page.js',
  'app/general-settings/page.js'
];

const oldUrls = [
  '"https://aufondue-backend.kindisland-399ef298.southeastasia.azurecontainerapps.io/api"',
  '"https://aufonduebackend.kindisland-399ef298.southeastasia.azurecontainerapps.io/api"'
];

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add import if not present
    if (!content.includes('import { getBackendUrl }')) {
      // Find the last import statement
      const importRegex = /^import.*?from.*?;$/gm;
      const imports = content.match(importRegex);
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
        content = content.slice(0, lastImportIndex) + 
                 '\nimport { getBackendUrl } from "../config/api";' + 
                 content.slice(lastImportIndex);
      }
    }
    
    // Replace hardcoded URLs
    oldUrls.forEach(oldUrl => {
      const regex = new RegExp(`const\\s+backendUrl\\s*=\\s*${oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^;]*;`, 'g');
      content = content.replace(regex, 'const backendUrl = getBackendUrl();');
    });
    
    // Also handle inline URL usage
    oldUrls.forEach(oldUrl => {
      const globalRegex = new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(globalRegex, 'getBackendUrl()');
    });
    
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('Backend URL update complete!');