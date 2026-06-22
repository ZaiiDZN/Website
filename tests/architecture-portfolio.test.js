const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoRoot = path.resolve(__dirname, '..');
const portfolioPdfPath = path.join(repoRoot, 'images', 'architecture-portfolio', 'portfolio.pdf');
const architecturePage = fs.readFileSync(path.join(repoRoot, 'architecture-portfolio.html'), 'utf8');
const projectsPage = fs.readFileSync(path.join(repoRoot, 'projects.html'), 'utf8');

assert.strictEqual(
    fs.existsSync(portfolioPdfPath),
    false,
    'Architecture portfolio PDF must not be publicly shipped from the site'
);

assert(
    !/portfolio\.pdf/i.test(architecturePage),
    'Architecture portfolio page must not directly reference a public PDF asset'
);

assert(
    !/<iframe\b/i.test(architecturePage),
    'Architecture portfolio page must not embed a PDF viewer'
);

assert(
    /href="architecture-portfolio\.html"/.test(projectsPage),
    'Projects page should route portfolio visitors to the safe request-access page'
);

assert(
    /href="contact\.html"/.test(architecturePage),
    'Safe portfolio page should provide a contact path for requesting access'
);

