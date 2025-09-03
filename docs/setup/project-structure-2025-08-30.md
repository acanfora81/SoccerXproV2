# Struttura progetto aggiornata: 30/08/2025, 10:00:42

├── client
│   ├── public
│   │   └── vite.svg
│   ├── src
│   │   ├── assets
│   │   │   └── react.svg
│   │   ├── components
│   │   │   ├── analytics
│   │   │   │   ├── sections
│   │   │   │   │   └── CaricoVolumi.jsx
│   │   │   │   ├── Analytics.jsx
│   │   │   │   ├── AnalyticsAdvanced.jsx
│   │   │   │   ├── ComparePanel.jsx
│   │   │   │   ├── FiltersBar.jsx
│   │   │   │   ├── PerformancePlayersList.jsx
│   │   │   │   ├── PlayerDossier.jsx
│   │   │   │   ├── PlayerList.jsx
│   │   │   │   ├── ReportPreview.jsx
│   │   │   │   ├── Reports.jsx
│   │   │   │   └── TeamDashboard.jsx
│   │   │   ├── auth
│   │   │   │   └── LoginForm.jsx
│   │   │   ├── dashboard
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── layout
│   │   │   │   └── MainLayout.jsx
│   │   │   ├── performance
│   │   │   │   ├── ColumnMappingStep.jsx
│   │   │   │   ├── DataPreviewStep.jsx
│   │   │   │   ├── ImportWizard.jsx
│   │   │   │   └── PerformanceImport.jsx
│   │   │   ├── players
│   │   │   │   ├── PlayerFormModal.jsx
│   │   │   │   ├── PlayersList.jsx
│   │   │   │   └── PlayerStatistics.jsx
│   │   │   └── ui
│   │   │       ├── PageLoader.jsx
│   │   │       ├── segmented.css
│   │   │       ├── Segmented.jsx
│   │   │       └── ThemeToggle.jsx
│   │   ├── pages
│   │   │   └── performance
│   │   │       ├── PlayersDossier.jsx
│   │   │       └── PlayersList.jsx
│   │   ├── store
│   │   │   └── authStore.js
│   │   ├── styles
│   │   │   ├── analytics
│   │   │   │   ├── charts.css
│   │   │   │   ├── index.css
│   │   │   │   └── navigation.css
│   │   │   ├── sections
│   │   │   ├── analytics.css
│   │   │   ├── animations.css
│   │   │   ├── components.css
│   │   │   ├── dashboard.css
│   │   │   ├── forms.css
│   │   │   ├── global.css
│   │   │   ├── import-wizard.css
│   │   │   ├── index.css
│   │   │   ├── layout.css
│   │   │   ├── mapping.css
│   │   │   ├── performance-pages.css
│   │   │   ├── performance-players-list.css
│   │   │   ├── players.css
│   │   │   ├── statistics.css
│   │   │   ├── team-dashboard.css
│   │   │   ├── themes.css
│   │   │   ├── upload.css
│   │   │   ├── utilities.css
│   │   │   └── variables.css
│   │   ├── utils
│   │   │   └── http.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   └── vite.config.js
├── docs
│   ├── api
│   ├── architecture
│   └── setup
├── e2e
│   ├── fixtures
│   ├── support
│   │   └── page-objects
│   └── tests
│       ├── administration
│       ├── auth
│       ├── contracts
│       ├── integration
│       ├── market
│       ├── medical
│       └── players
├── infrastructure
├── scripts
│   ├── seed-first-team.cjs
│   └── seed-first-team.js
├── server
│   ├── prisma
│   │   ├── generated
│   │   │   └── client
│   │   │       ├── runtime
│   │   │       │   ├── edge-esm.js
│   │   │       │   ├── edge.js
│   │   │       │   ├── index-browser.d.ts
│   │   │       │   ├── index-browser.js
│   │   │       │   ├── library.d.ts
│   │   │       │   ├── library.js
│   │   │       │   ├── react-native.js
│   │   │       │   ├── wasm-compiler-edge.js
│   │   │       │   └── wasm-engine-edge.js
│   │   │       ├── client.d.ts
│   │   │       ├── client.js
│   │   │       ├── default.d.ts
│   │   │       ├── default.js
│   │   │       ├── edge.d.ts
│   │   │       ├── edge.js
│   │   │       ├── index-browser.js
│   │   │       ├── index.d.ts
│   │   │       ├── index.js
│   │   │       ├── package.json
│   │   │       ├── query_engine-windows.dll.node
│   │   │       ├── query_engine-windows.dll.node.tmp14832
│   │   │       ├── schema.prisma
│   │   │       ├── wasm.d.ts
│   │   │       └── wasm.js
│   │   ├── migrations
│   │   │   ├── 20250822092341_clean_start
│   │   │   │   └── migration.sql
│   │   │   ├── 20250823103148_add_preparatore_atletico_role
│   │   │   │   └── migration.sql
│   │   │   ├── 20250823105610_add_performance_data_table
│   │   │   │   └── migration.sql
│   │   │   ├── 20250823160818_add_teams_table
│   │   │   │   └── migration.sql
│   │   │   ├── 20250823161405_add_user_team_relation
│   │   │   │   └── migration.sql
│   │   │   ├── 20250823163259_add_player_team_relation
│   │   │   │   └── migration.sql
│   │   │   ├── 20250824094852_make_userprofile_teamid_required
│   │   │   │   └── migration.sql
│   │   │   └── migration_lock.toml
│   │   ├── seeds
│   │   └── schema.prisma
│   ├── src
│   │   ├── config
│   │   │   ├── database.js
│   │   │   └── redis.js
│   │   ├── constants
│   │   │   └── errors.js
│   │   ├── controllers
│   │   │   ├── auth.js
│   │   │   ├── performance.js
│   │   │   └── players.js
│   │   ├── events
│   │   ├── middleware
│   │   │   ├── auth.js
│   │   │   └── tenantContext.js
│   │   ├── models
│   │   ├── routes
│   │   │   ├── auth.js
│   │   │   ├── dashboard.js
│   │   │   ├── dashboard.js.backup
│   │   │   ├── performance.js
│   │   │   ├── players.js
│   │   │   └── test-auth.js
│   │   ├── services
│   │   ├── utils
│   │   │   ├── columnMapper.js
│   │   │   ├── dateParser.js
│   │   │   ├── gpsDeriver.example.js
│   │   │   ├── gpsDeriver.js
│   │   │   ├── permissions.js
│   │   │   ├── playerLookup.js
│   │   │   ├── README.md
│   │   │   └── tokenBlacklist.js
│   │   └── app.js
│   ├── tests
│   │   ├── fixtures
│   │   ├── integration
│   │   ├── unit
│   │   └── logout-security-test.js
│   ├── uploads
│   ├── assign-players-to-team.js
│   ├── debug-supabase.js
│   ├── jest.config.js
│   ├── package-lock.json
│   ├── package.json
│   ├── patch-assign-admin.js
│   ├── seed-vis-pesaro.js
│   └── test-env.js
├── src
│   ├── components
│   │   ├── administration
│   │   │   ├── components
│   │   │   └── modals
│   │   ├── auth
│   │   ├── common
│   │   │   ├── charts
│   │   │   ├── feedback
│   │   │   ├── forms
│   │   │   ├── modals
│   │   │   └── ui
│   │   ├── contracts
│   │   │   ├── components
│   │   │   └── modals
│   │   ├── layout
│   │   ├── market
│   │   │   ├── components
│   │   │   └── modals
│   │   ├── medical
│   │   │   ├── components
│   │   │   └── modals
│   │   └── players
│   │       ├── components
│   │       └── modals
│   ├── config
│   ├── constants
│   ├── hooks
│   │   ├── api
│   │   ├── forms
│   │   ├── ui
│   │   └── utils
│   ├── i18n
│   │   ├── hooks
│   │   ├── locales
│   │   └── utils
│   ├── pages
│   ├── router
│   ├── services
│   │   ├── api
│   │   ├── utils
│   │   └── validation
│   ├── store
│   │   ├── administration
│   │   ├── auth
│   │   ├── contracts
│   │   ├── market
│   │   ├── medical
│   │   ├── players
│   │   └── ui
│   ├── stories
│   │   ├── administration
│   │   ├── common
│   │   ├── contracts
│   │   ├── market
│   │   ├── medical
│   │   ├── players
│   │   └── themes
│   ├── styles
│   │   ├── common
│   │   ├── components
│   │   └── themes
│   ├── tests
│   │   ├── __mocks__
│   │   ├── components
│   │   ├── hooks
│   │   ├── services
│   │   ├── store
│   │   └── utils
│   ├── types
│   └── utils
│       ├── constants
│       ├── data
│       └── helpers
├── env.template
├── mock-players-performance.json
├── package-lock.json
├── package.json
├── project-structure.txt
├── README.md
├── Recap Lavoro Svolto.txt
├── STRUTTURA_PROGETTO.md
└── tree.js
