#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'src');
const exts = new Set(['.tsx', '.ts']);
const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (exts.has(path.extname(entry.name))) {
      const content = fs.readFileSync(full, 'utf8');
  // Disallow arbitrary COLOR values in className (e.g., bg-[#123456], text-[rgb(...)]).
      const regex = /className\s*=\s*(?:"([^"]*)"|'([^']*)'|{`([\s\S]*?)`})/g;
      let match;
      while ((match = regex.exec(content))) {
        const cls = match[1] || match[2] || match[3] || '';
        if (/(?:bg|text|border|from|via|to|shadow)-\[/i.test(cls) && /\[(?:#|rgb|hsl)/i.test(cls)) {
          violations.push({ file: full, line: content.slice(0, match.index).split('\n').length, snippet: cls.trim().slice(0, 120) });
        }
      }
    }
  }
}

if (fs.existsSync(ROOT)) walk(ROOT);

if (violations.length) {
  console.error(`\nStyle Lint: Encontrado(s) ${violations.length} uso(s) de valores arbitrários do Tailwind (padrão da Landing bloqueia).`);
  for (const v of violations) {
    console.error(`- ${path.relative(process.cwd(), v.file)}:${v.line}\n  className ~> ${v.snippet}`);
  }
  console.error('\nUse tokens de tema (p.ex. text-primary-400) ou classes do DS (ds-*, btn-*).');
  process.exit(1);
} else {
  console.log('Style Lint: PASS (sem valores arbitrários em className).');
}
