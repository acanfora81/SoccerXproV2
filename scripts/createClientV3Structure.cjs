// scripts/createClientV3Structure.cjs
const fs = require("fs");
const path = require("path");

const dirs = [
  "client_v3/src/app/layout",
  "client_v3/src/design-system/ui",
  "client_v3/src/design-system/ds",
  "client_v3/src/lib/api",
  "client_v3/src/lib/hooks",
  "client_v3/src/lib/utils",
  "client_v3/src/features/players/pages",
  "client_v3/src/features/players/components",
  "client_v3/src/features/performance/pages",
  "client_v3/src/features/performance/components",
  "client_v3/src/features/contracts/pages",
  "client_v3/src/features/contracts/components",
  "client_v3/src/features/medical/pages",
  "client_v3/src/features/medical/components",
  "client_v3/src/features/market/pages",
  "client_v3/src/features/market/components",
  "client_v3/src/features/admin/pages",
  "client_v3/src/features/admin/components",
  "client_v3/src/features/security/pages",
  "client_v3/src/features/security/components",
  "client_v3/src/features/system/pages",
  "client_v3/src/features/system/components",
  "client_v3/src/styles",
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
  const keep = path.join(p, ".gitkeep");
  if (!fs.existsSync(keep)) fs.writeFileSync(keep, "");
}

function main() {
  let created = 0;
  for (const d of dirs) {
    ensureDir(d);
    created++;
  }

  // Documento guida struttura
  const doc = `# ClientV3 Structure (skeleton)
- app/layout: router, provider, layout (Sidebar/Topbar)
- design-system/ui: componenti shadcn-ui (auto-generati in seguito)
- design-system/ds: wrapper e componenti condivisi (Button, Card, Modal, DataTable, ...)
- lib/api: http client e SDK chiamate API
- lib/hooks: hook comuni (useToast, useConfirm, ecc.)
- lib/utils: utilità (cn, date, formattazioni)
- features/*: domini funzionali (players, performance, contracts, medical, market, admin, security, system)
- styles: tokens.css, globals.css (tema e reset) — li aggiungeremo nella prossima fase

> Nota: questo è solo lo scheletro. UI, tema e router verranno creati nella Fase B.
`;
  fs.writeFileSync("client_v3/STRUCTURE.md", doc, "utf8");

  console.log(`Created ${created} directories with .gitkeep files.`);
  console.log("Skeleton ready. Next: add Tailwind + tema + layout (Fase B).");
}

main();
