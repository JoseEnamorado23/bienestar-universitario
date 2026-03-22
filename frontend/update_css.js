import fs from 'fs';
import path from 'path';

const targetFile = path.join('c:', 'Users', 'PC', 'Desktop', 'bienestarUniversitario', 'frontend', 'src', 'styles', 'index.css');

let css = fs.readFileSync(targetFile, 'utf8');

// Primary overlay colors
css = css.replace(/102,\s*126,\s*234/g, '0, 172, 201'); // Azul
css = css.replace(/118,\s*75,\s*162/g, '128, 186, 39'); // Verde Solidario

// Generic light-theme border/bg mapping (white -> black transparent overlays)
css = css.replace(/rgba\(255,\s*255,\s*255/g, 'rgba(0, 0, 0');

// Login page & component specific colors text
css = css.replace(/color:\s*white/g, 'color: var(--text-primary)');
css = css.replace(/#a3b3ff/g, '#00acc9');
css = css.replace(/#c9a3ff/g, '#80ba27');
css = css.replace(/border-top-color:\s*white/g, 'border-top-color: var(--accent-primary)');

fs.writeFileSync(targetFile, css, 'utf8');
console.log('CSS tokens updated globally.');
