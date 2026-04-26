#!/usr/bin/env node
// lint-articles.js — validates article HTML files for tsachi-lavia-law
// Checks: legal disclaimer, SEO meta, H1 count, semantic tags, indentation
'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Configuration ────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Acceptable Hebrew disclaimers — an article must include at least one of these
const REQUIRED_DISCLAIMERS = [
  'האמור במאמר זה אינו מהווה ייעוץ משפטי ואינו תחליף לייעוץ פרטני. המידע לצורכי הסברה כללית בלבד.',
  'מאמר זה נועד למטרות מידע כלליות בלבד ואינו מהווה ייעוץ משפטי, חוות-דעת משפטית, או יצירת יחסי עורך-דין/לקוח.',
];

// Minimum semantic HTML5 tags required (at least 2 distinct ones)
const SEMANTIC_TAGS = [
  'article', 'nav', 'header', 'footer',
  'section', 'main', 'aside', 'figure',
  'figcaption', 'time',
];

// ─── Checks ───────────────────────────────────────────────────────────────────

function checkDisclaimer(content, issues) {
  if (!REQUIRED_DISCLAIMERS.some(d => content.includes(d))) {
    issues.push(
      'DISCLAIMER  Missing or incorrect legal disclaimer.\n' +
      '            Expected one of:\n' +
      REQUIRED_DISCLAIMERS.map(d => '              - "' + d + '"').join('\n')
    );
  }
}

function checkSEO(content, filename, seenTitles, issues) {
  // <title> — must exist, be non-empty, and be unique across all articles
  const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titleMatch || titleMatch[1].trim() === '') {
    issues.push('SEO         Missing or empty <title>');
  } else {
    const title = titleMatch[1].trim();
    if (seenTitles.has(title)) {
      issues.push(
        `SEO         Duplicate <title> — same as "${seenTitles.get(title)}"\n` +
        `            Value: "${title}"`
      );
    } else {
      seenTitles.set(title, filename);
    }
  }

  // <meta name="description"> — must exist and exceed 50 chars
  const descMatch =
    content.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/i) ||
    content.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["'][^>]*>/i);

  if (!descMatch) {
    issues.push('SEO         Missing <meta name="description">');
  } else {
    const len = descMatch[1].trim().length;
    if (len <= 50) {
      issues.push(
        `SEO         <meta description> too short: ${len} chars (need > 50)`
      );
    }
  }

  // <h1> — must appear exactly once
  const h1Count = (content.match(/<h1[\s>]/gi) || []).length;
  if (h1Count === 0) {
    issues.push('SEO         No <h1> element found (need exactly 1)');
  } else if (h1Count > 1) {
    issues.push(
      `SEO         ${h1Count} <h1> elements found (need exactly 1)`
    );
  }
}

function checkStructure(content, issues) {
  // Semantic HTML5 tags
  const found = SEMANTIC_TAGS.filter(tag =>
    new RegExp(`<${tag}[\\s>]`, 'i').test(content)
  );
  if (found.length < 2) {
    issues.push(
      `STRUCTURE   Too few semantic HTML5 tags (found: ${found.length === 0 ? 'none' : found.join(', ')})\n` +
      `            Expected at least 2 of: ${SEMANTIC_TAGS.join(', ')}`
    );
  }

  const lines = content.split('\n');

  // Tab indentation
  const tabLines = lines
    .map((l, i) => ({ n: i + 1, line: l }))
    .filter(({ line }) => /^\t/.test(line));

  if (tabLines.length > 0) {
    const sample = tabLines.slice(0, 3).map(t => `line ${t.n}`).join(', ');
    const extra  = tabLines.length > 3 ? ` … (+${tabLines.length - 3} more)` : '';
    issues.push(
      `STRUCTURE   Tab indentation on ${tabLines.length} line(s): ${sample}${extra}\n` +
      '            Rule: use 2-space indentation, not tabs'
    );
  }

  // Odd indentation on HTML-tag lines (not multiples of 2)
  const oddLines = lines
    .map((l, i) => ({ n: i + 1, line: l }))
    .filter(({ line }) => {
      const m = line.match(/^( +)</);
      return m && m[1].length % 2 !== 0;
    });

  if (oddLines.length > 0) {
    const sample = oddLines.slice(0, 3).map(t => `line ${t.n}`).join(', ');
    const extra  = oddLines.length > 3 ? ` … (+${oddLines.length - 3} more)` : '';
    issues.push(
      `STRUCTURE   Non-2-space indentation on ${oddLines.length} HTML line(s): ${sample}${extra}\n` +
      '            Rule: every indent level = 2 spaces'
    );
  }
}

// ─── Runner ───────────────────────────────────────────────────────────────────

function lintFile(filePath, seenTitles) {
  const filename = path.basename(filePath);
  const content  = fs.readFileSync(filePath, 'utf8');
  const issues   = [];

  checkDisclaimer(content, issues);
  checkSEO(content, filename, seenTitles, issues);
  checkStructure(content, issues);

  return { filename, issues };
}

function main() {
  // Scan article-*.html files in the project root
  const files = fs.readdirSync(PROJECT_ROOT)
    .filter(f => /^article-.+\.html$/i.test(f))
    .sort()
    .map(f => path.join(PROJECT_ROOT, f));

  if (files.length === 0) {
    console.log('\nNo article-*.html files found in project root.\n');
    process.exit(0);
  }

  const seenTitles = new Map();
  const results    = files.map(f => lintFile(f, seenTitles));

  const PASS = '\x1b[32m✓\x1b[0m';
  const FAIL = '\x1b[31m✗\x1b[0m';
  const DIM  = '\x1b[2m';
  const RST  = '\x1b[0m';

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║     tsachi-lavia-law article lint    ║');
  console.log('╚══════════════════════════════════════╝\n');

  let totalIssues = 0;
  let failCount   = 0;

  results.forEach(({ filename, issues }) => {
    if (issues.length === 0) {
      console.log(`  ${PASS}  ${filename}`);
    } else {
      failCount++;
      totalIssues += issues.length;
      console.log(`  ${FAIL}  ${filename}  ${DIM}(${issues.length} issue${issues.length > 1 ? 's' : ''})${RST}`);
      issues.forEach(issue => {
        const lines = issue.split('\n');
        console.log(`       ${DIM}→${RST} ${lines[0]}`);
        lines.slice(1).forEach(l => console.log(`         ${DIM}${l}${RST}`));
      });
    }
  });

  console.log('\n' + '─'.repeat(45));
  console.log(
    `  Scanned: ${results.length} file(s)   ` +
    `\x1b[32mPassed: ${results.length - failCount}\x1b[0m   ` +
    (failCount > 0 ? `\x1b[31mFailed: ${failCount}\x1b[0m` : `Failed: 0`) +
    `   Total issues: ${totalIssues}`
  );
  console.log('─'.repeat(45) + '\n');

  if (failCount > 0) process.exit(1);
}

main();
