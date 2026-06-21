const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const architecturePagePath = path.join(root, 'architecture-portfolio.html');
const projectsPagePath = path.join(root, 'projects.html');
const publicPdfPath = path.join(root, 'images', 'architecture-portfolio', 'portfolio.pdf');

const architecturePage = fs.readFileSync(architecturePagePath, 'utf8');
const projectsPage = fs.readFileSync(projectsPagePath, 'utf8');

assert(
    !fs.existsSync(publicPdfPath),
    'architecture portfolio PDF must not be publicly served'
);

assert(
    !architecturePage.includes('portfolio.pdf'),
    'architecture page must not link to the removed PDF'
);

assert(
    !architecturePage.includes('<iframe'),
    'architecture page must not embed a PDF viewer'
);

assert(
    architecturePage.includes('href="contact.html"'),
    'architecture page should direct visitors to request the portfolio'
);

assert(
    projectsPage.includes('href="architecture-portfolio.html"'),
    'projects page should keep linking to the contact-gated architecture page'
);

console.log('architecture portfolio privacy checks passed');
