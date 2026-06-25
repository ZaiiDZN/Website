const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const portfolioPagePath = path.join(repoRoot, 'architecture-portfolio.html');
const sensitivePdfPath = path.join(repoRoot, 'images', 'architecture-portfolio', 'portfolio.pdf');
const publicSourceFiles = [
    'architecture-portfolio.html',
    'projects.html',
    'script.js'
];

const portfolioHtml = fs.readFileSync(portfolioPagePath, 'utf8');

assert(
    !fs.existsSync(sensitivePdfPath),
    'Sensitive architecture portfolio PDF must not be committed as a public asset.'
);

for (const relativePath of publicSourceFiles) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert(
        !source.includes('images/architecture-portfolio/portfolio.pdf'),
        `${relativePath} must not link to the sensitive architecture portfolio PDF.`
    );
}

assert(
    !/<(?:iframe|embed|object)\b/i.test(portfolioHtml),
    'Architecture portfolio page must not directly embed a PDF viewer.'
);

assert(
    /contact\.html/.test(portfolioHtml),
    'Architecture portfolio page should route requests through the contact page.'
);

console.log('architecture portfolio exposure checks passed');
