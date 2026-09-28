const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (full.endsWith('.jsx') || full.endsWith('.js')) {
      results.push(full);
    }
  });
  return results;
}

const hooks = ['useState', 'useEffect', 'useMemo', 'useCallback', 'useRef', 'useContext', 'useReducer', 'useId'];
const files = walk('./src');
let foundErrors = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  hooks.forEach(hook => {
    const hookRegex = new RegExp(`(?<!React\\.)\\b${hook}\\s*\\(`, 'g');
    if (hookRegex.test(content)) {
      const importNamedRegex = new RegExp(`import\\s+[^;]*\\b${hook}\\b[^;]*from\\s+['"][^'"]+['"]`);
      const importNamespaceRegex = /import\s+\*\s+as\s+React\s+from/;
      const constDestructRegex = new RegExp(`const\\s*\\{[^}]*\\b${hook}\\b[^}]*\\}\\s*=\\s*React`);
      
      const isImported = importNamedRegex.test(content) || importNamespaceRegex.test(content) || constDestructRegex.test(content);
      if (!isImported) {
        console.error(`🚨 ERROR in ${file}: "${hook}" is used but NOT imported!`);
        foundErrors++;
      }
    }
  });
});

if (foundErrors === 0) {
  console.log('✅ All hooks are properly imported across the entire codebase!');
} else {
  console.log(`❌ Found ${foundErrors} missing hook imports!`);
}
