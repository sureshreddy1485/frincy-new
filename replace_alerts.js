const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules')) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('frontend');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('CustomAlert.alert') && !content.includes('import { CustomAlert }') && !file.includes('AlertProvider.tsx')) {
    const parts = file.split(path.sep);
    const depth = parts.length - 2;
    let relativePath = '';
    if (depth === 0) relativePath = './src/providers/AlertProvider';
    else if (depth === 1) relativePath = '../src/providers/AlertProvider';
    else if (depth === 2) relativePath = '../../src/providers/AlertProvider';
    else if (depth === 3) relativePath = '../../../src/providers/AlertProvider';
    else relativePath = '../../src/providers/AlertProvider';

    const importStatement = `import { CustomAlert } from '${relativePath}';\n`;
    
    const importMatch = content.match(/import .* from '.*';/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      content = content.replace(lastImport, lastImport + '\n' + importStatement);
    } else {
      content = importStatement + content;
    }
    fs.writeFileSync(file, content);
    console.log('Fixed imports', file);
  }
});
