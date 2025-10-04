# ClientV3 Structure (skeleton)
- app/layout: router, provider, layout (Sidebar/Topbar)
- design-system/ui: componenti shadcn-ui (auto-generati in seguito)
- design-system/ds: wrapper e componenti condivisi (Button, Card, Modal, DataTable, ...)
- lib/api: http client e SDK chiamate API
- lib/hooks: hook comuni (useToast, useConfirm, ecc.)
- lib/utils: utilità (cn, date, formattazioni)
- features/*: domini funzionali (players, performance, contracts, medical, market, admin, security, system)
- styles: tokens.css, globals.css (tema e reset) — li aggiungeremo nella prossima fase

> Nota: questo è solo lo scheletro. UI, tema e router verranno creati nella Fase B.
