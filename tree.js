// scripts/tree.js
// si lancia con: npm run update:tree
import fs from "fs";
import path from "path";

const ignore = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  ".turbo",
  ".cache"
];

function listDir(dir, prefix = "", depth = 0, maxDepth = 6) {
  if (depth > maxDepth) return "";

  const files = fs.readdirSync(dir).filter(
    (f) => !ignore.includes(f) && !f.startsWith(".")
  );

  files.sort((a, b) => {
    const aIsDir = fs.statSync(path.join(dir, a)).isDirectory();
    const bIsDir = fs.statSync(path.join(dir, b)).isDirectory();
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  let output = "";
  files.forEach((file, i) => {
    const fullPath = path.join(dir, file);
    const isDir = fs.statSync(fullPath).isDirectory();
    const connector = i === files.length - 1 ? "└── " : "├── ";

    output += prefix + connector + file + "\n";
    if (isDir) {
      const newPrefix = prefix + (i === files.length - 1 ? "    " : "│   ");
      output += listDir(fullPath, newPrefix, depth + 1, maxDepth);
    }
  });

  return output;
}

const projectRoot = process.cwd();
const structure = listDir(projectRoot);

const now = new Date().toLocaleString("it-IT");
const header = `# Struttura progetto aggiornata: ${now}\n\n`;

fs.writeFileSync("project-structure.txt", header + structure);
console.log("✅ Struttura aggiornata in project-structure.txt");
