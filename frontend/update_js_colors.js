import fs from 'fs';
import path from 'path';

const files = [
  path.join('c:', 'Users', 'PC', 'Desktop', 'bienestarUniversitario', 'frontend', 'src', 'utils', 'permissions.js'),
  path.join('c:', 'Users', 'PC', 'Desktop', 'bienestarUniversitario', 'frontend', 'src', 'pages', 'Dashboard.jsx')
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/#667eea/g, '#00acc9');
  content = content.replace(/#764ba2/g, '#80ba27');
  fs.writeFileSync(file, content, 'utf8');
}

console.log('JS colors updated successfully.');
