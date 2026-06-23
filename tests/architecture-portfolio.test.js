const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const pagePath = path.join(repoRoot, 'architecture-portfolio.html');
const pdfPath = path.join(repoRoot, 'images', 'architecture-portfolio', 'portfolio.pdf');

const pageHtml = fs.readFileSync(pagePath, 'utf8');

assert(
  !fs.existsSync(pdfPath),
  'Sensitive architecture portfolio PDF must not be committed as a public asset.'
);

assert(
  !pageHtml.includes('images/architecture-portfolio/portfolio.pdf'),
  'Architecture portfolio page must not link directly to the private PDF.'
);

assert(
  !/<iframe\b/i.test(pageHtml),
  'Architecture portfolio page must not embed a public PDF viewer.'
);

assert(
  /available upon request/i.test(pageHtml),
  'Architecture portfolio page should direct visitors to request portfolio access.'
);

console.log('Architecture portfolio privacy checks passed.');
