# Govern Web — Transparencia i dades publiques de Catalunya

## Contexto de Negocio
Plataforma web interactiva per visualitzar dades de transparencia del sector public catala. Inclou contractes publics, subvencions, salaris de carrecs, pressupostos i una seccio de casos de corrupcio amb dades agregades.

**Posicionament**: Catalunya-first. Les dades principals venen de Transparencia Catalunya (Socrata). Les dades d'Espanya (BDNS) son complementaries.

**Killer feature**: El Detector — analisi automatica d'anomalies en contractacio publica.

**Estado actual**: Funcional amb dades reals. En desenvolupament actiu.

## Decisions estrategiques

### Catalunya-first
- Dades principals: Socrata (analisi.transparenciacatalunya.cat) — NOMES Catalunya
- Dades complementaries: BDNS (subvencions nacionals) — unica font estatal amb API funcional
- NO hi ha equivalent Socrata per a tota Espanya
- NO expandir a contractes/salaris nacionals (no existeixen APIs unificades)

### Corrupcio — sense noms individuals
- **MAI mostrar noms de persones** en la seccio de corrupcio
- Mostrar nomes dades agregades (total implicats, condemnats, investigats)
- Les dades de corrupcio son d'elaboracio propia (JSON manual) — NO son d'una API oficial
- Disclaimer obligatori en totes les pagines de corrupcio
- Pagines de perfil de persona (`/corrupcio/persones/`) ELIMINADES permanentment
- Futur: scrapear casos-aislados.com + verificar amb CENDOJ

## Preferencies de Treball
- **Pregunta abans d'assumir** en decisions arquitectoniques
- **No sobre-ingenieris** - solucions simples primer
- **Rebutja idees dolentes** encara que siguin meves
- **Digues "no ho se"** en lloc d'inventar
- **Fes la feina sense preguntar** per tasques clares

## Stack
- **Framework**: Astro 5.x (SSG + illes interactives amb Preact)
- **Estilos**: Tailwind CSS 4.x
- **Charts**: Chart.js (bar, doughnut, line) + D3.js (treemap, mapa, network, timeline)
- **Illes interactives**: Preact (DataExplorer, SalaryComparator, charts)
- **TypeScript**: strict mode
- **Node**: >=22.12.0 (`.nvmrc` amb 22)

## Comandes
```bash
nvm use                # Activa Node 22 des de .nvmrc
npm run dev            # Dev server
npm run build          # Build produccio
npm run preview        # Preview build
```

## Arquitectura
```
govern-web/
├── src/
│   ├── components/
│   │   ├── ui/           # Button, Card, Badge, StatCard, DataSourceBanner, LegalDisclaimer
│   │   ├── layout/       # Header, Footer
│   │   ├── charts/       # BarChart, DoughnutChart, LineChart, BudgetTreemap, SpainMap, CorruptionNetwork, Timeline
│   │   └── sections/     # Hero, RecentActivity, DataExplorer, SalaryComparator, AnomalyCard
│   ├── layouts/
│   │   └── DefaultLayout.astro
│   ├── lib/
│   │   ├── api/
│   │   │   └── socrata.ts       # Client Socrata amb cache
│   │   ├── analysis/            # Detectors d'anomalies
│   │   │   ├── fraccionament.ts # Contractes dividits sota llindar
│   │   │   └── concentracio.ts  # Proveidors amb >30% contractes
│   │   ├── data-fetcher.ts      # Funcions de fetch per al dashboard
│   │   ├── types.ts             # Interficies TypeScript
│   │   └── utils.ts             # Formatadors (moneda, dates, numeros)
│   ├── pages/
│   │   ├── index.astro           # Dashboard principal
│   │   ├── contractes/           # Explorador de contractes
│   │   ├── subvencions/          # Explorador de subvencions
│   │   ├── salaris/              # Retribucions carrecs publics
│   │   ├── pressupostos/         # Pressupostos Generalitat
│   │   ├── corrupcio/
│   │   │   ├── index.astro       # Dashboard corrupcio (sense noms)
│   │   │   └── casos/[slug].astro # Detall cas (sense noms)
│   │   ├── detector/
│   │   │   ├── index.astro       # Dashboard anomalies
│   │   │   └── metodologia.astro # Metodologia
│   │   └── espanya/
│   │       ├── index.astro       # Hub dades estatals
│   │       └── subvencions/      # BDNS subvencions
│   ├── data/
│   │   ├── datasets.ts           # IDs dels datasets Socrata
│   │   └── casos-corrupcion.json # Dades curades manualment (ORIENTATIU)
│   └── styles/
│       └── global.css
├── .claude/
│   └── agents/                   # 10 agents (CEO, CTO, QA, UX, Legal, Data Journalist, etc.)
└── docs/                         # Outputs dels agents
```

## Fonts de dades

| Font | Tipus | Dades | Fiabilitat |
|------|-------|-------|------------|
| Socrata (Catalunya) | API REST (SODA) | Contractes, subvencions, salaris, pressupostos, viatges, lobbies | OFICIAL |
| BDNS (Hisenda) | API REST | Subvencions nacionals | OFICIAL |
| casos-corrupcion.json | JSON estatic | 15 casos, 42 persones (sense noms mostrats) | ELABORACIO PROPIA — orientatiu |

## Components clau

### DataExplorer.tsx (Preact)
Taula interactiva amb cerca, paginacio, popup de detall i export CSV.
- Suporta Socrata i BDNS com a data sources
- Popup amb tots els camps del registre (click a fila)
- Title tooltip en cel·les truncades
- Boto CSV que enllaca directament al endpoint `.csv` de Socrata

### DataSourceBanner.astro
Banner informatiu amb font, abast i notes sobre com interpretar les dades.
Obligatori en totes les pagines que mostren dades.

### El Detector
Analitza 10.000 contractes recents per detectar:
- **Fraccionament**: contractes dividits sota llindars (15k€ serveis, 40k€ obres)
- **Concentracio**: proveidors amb >30% dels contractes d'un organ

## Convencions de Codi

### TypeScript
- Strict mode obligatori
- No usar `any` — tipar tot
- Interficies sobre types

### Components Astro
- PascalCase
- Props tipades amb interface
- Tailwind per estils, scoped nomes si necessari
- Inline styles per CSS critic en components Preact (Tailwind 4 no genera classes dins illes)

## Agents
10 agents a `.claude/agents/`: CEO, CTO, Frontend Dev, QA, UX Designer, UX Auditor, Product Manager, Growth, Legal Advisor, Data Journalist.

El CEO orquestra i delega als altres. El Data Journalist verifica dades de corrupcio.

---

## Git
- Branch: `master`
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
