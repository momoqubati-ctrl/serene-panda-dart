const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components');

const replacements = [
  { search: /\bbg-white\b/g, replace: "bg-card" },
  { search: /\bbg-slate-50\b/g, replace: "bg-muted" },
  { search: /\btext-slate-900\b/g, replace: "text-foreground" },
  { search: /\btext-slate-800\b/g, replace: "text-foreground" },
  { search: /\btext-slate-700\b/g, replace: "text-foreground" },
  { search: /\btext-slate-600\b/g, replace: "text-muted-foreground" },
  { search: /\btext-slate-500\b/g, replace: "text-muted-foreground" },
  { search: /\btext-slate-400\b/g, replace: "text-muted-foreground" },
  { search: /\bborder-slate-100\b/g, replace: "border-border" },
  { search: /\bborder-slate-200\b/g, replace: "border-border" },
  { search: /\bborder-slate-50\b/g, replace: "border-border/50" }
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const { search, replace } of replacements) {
        if (search.test(content)) {
          content = content.replace(search, replace);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(dir);
console.log("Done!");
