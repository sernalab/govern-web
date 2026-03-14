# Govern Web — Transparencia y datos públicos de España

## Contexto de Negocio
Plataforma web interactiva para visualizar datos de transparencia del gobierno español y catalán. Incluye contratos públicos, subvenciones, salarios de cargos, presupuestos y una sección dedicada a casos de corrupción con datos judiciales.

**Estado actual:** Proyecto nuevo, estructura inicial.

## Preferencias de Trabajo
- **Pregunta antes de asumir** en decisiones arquitectónicas o cuando haya múltiples enfoques válidos
- **No sobre-ingenierices** - soluciones simples primero, solo añadir complejidad cuando sea necesario
- **Rechaza ideas malas** aunque sean mías - prefiero honestidad técnica a complacencia
- **Di "no sé"** cuando no sepas algo en lugar de inventar
- **Haz el trabajo sin preguntar** para tareas claras, pero pregunta si vas a borrar/reestructurar código significativo

## Stack
- **Framework**: Astro 5.x (SSG + islas interactivas)
- **Estilos**: Tailwind CSS 4.x
- **Charts**: Chart.js o D3.js (por decidir)
- **Mapas**: Leaflet (por decidir)
- **TypeScript**: strict mode
- **Hosting**: Netlify (por decidir)

## Comandos
```bash
npm run dev            # Dev server
npm run build          # Build producción
npm run preview        # Preview build
```

## Arquitectura
```
govern-web/
├── src/
│   ├── components/
│   │   ├── ui/           # Button, Card, Badge, Table, SearchBar
│   │   ├── layout/       # Header, Footer, Sidebar
│   │   ├── charts/       # Gráficos interactivos (islas React/Svelte)
│   │   └── sections/     # Hero, StatsOverview, DataExplorer
│   ├── layouts/
│   │   └── DefaultLayout.astro
│   ├── lib/
│   │   ├── api/          # Clients para APIs públicas
│   │   │   ├── socrata.ts       # Transparencia Catalunya
│   │   │   ├── bdns.ts          # Subvenciones nacionales
│   │   │   ├── datosgob.ts      # Catálogo datos.gob.es
│   │   │   └── cgpj.ts          # CGPJ estadísticas judiciales
│   │   ├── scrapers/     # Scrapers para fuentes sin API
│   │   │   └── casos-aislados.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── index.astro           # Dashboard principal
│   │   ├── contratos/
│   │   │   └── index.astro       # Explorador de contratos
│   │   ├── subvenciones/
│   │   │   └── index.astro       # Explorador de subvenciones
│   │   ├── salarios/
│   │   │   └── index.astro       # Salarios de cargos públicos
│   │   ├── presupuestos/
│   │   │   └── index.astro       # Presupuestos
│   │   └── corrupcion/
│   │       ├── index.astro       # Dashboard de corrupción
│   │       ├── casos/
│   │       │   └── [slug].astro  # Detalle de caso
│   │       └── personas/
│   │           └── [slug].astro  # Perfil de persona
│   ├── data/                     # Datos cacheados/estáticos
│   └── styles/
│       └── global.css
├── public/
│   └── images/
├── docs/                         # Outputs de agentes
├── astro.config.mjs
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Fuentes de datos

| Fuente | Tipo | Datos | Auth |
|--------|------|-------|------|
| Socrata (Catalunya) | API REST (SODA) | Contratos, subvenciones, salarios, lobbies, viajes | No |
| BDNS (Hacienda) | API REST | Subvenciones nacionales con beneficiarios | No |
| datos.gob.es | API REST | Catálogo 113k+ datasets nacionales | No |
| CGPJ | Web + PC-AXIS | Estadísticas judiciales, repositorio corrupción | No |
| casos-aislados.com | Scraping HTML | 589 casos corrupción, 3.850 implicados | No |

## Sección Corrupción — Consideraciones legales
- Solo mostrar datos de **sentencias firmes** para personas condenadas
- Diferenciar claramente: **investigado** vs **acusado** vs **condenado**
- Citar siempre la fuente judicial (CENDOJ, CGPJ)
- Datos de casos-aislados.com como fuente secundaria, siempre contrastada
- Incluir disclaimer legal visible en todas las páginas de corrupción
- Cargos públicos tienen menor protección de datos (jurisprudencia TC)
- Derecho al olvido: respetar resoluciones AEPD si las hubiere

## Convenciones de Código

### TypeScript
- Strict mode obligatorio
- No usar `any` - tipar todo
- Interfaces sobre types cuando sea posible

### Componentes Astro
- Nombrado PascalCase
- Props tipadas con interface
- Tailwind para estilos, scoped solo si necesario

## Git
- Branch: `main`
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
