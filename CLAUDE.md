# Govern Web — Transparencia i dades publiques de Catalunya

Plataforma web interactiva per visualitzar dades de transparencia del sector public catala:
contractes, subvencions, salaris de carrecs, pressupostos, viatges, lobbies i una seccio de
casos de corrupcio amb dades agregades. Astro 5 (SSG) amb illes Preact, Tailwind 4, Chart.js
i D3. Funcional amb dades reals, en desenvolupament actiu.

**Killer feature**: El Detector — analisi automatica d'anomalies en contractacio publica.

Les convencions compartides (commits, TS strict, mobile-first, WCAG, com treballar amb mi)
son al CLAUDE.md arrel del workspace. Aqui nomes hi ha el propi d'aquest projecte.

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

## Node

Requereix Node >=22.12.0. Fes `nvm use` abans de res: agafa la versio del `.nvmrc`.

## El servidor MCP `govern`

`.mcp.json` declara un servidor MCP local que apunta a `../mcp-govern` (projecte germa,
Python, s'arrenca amb `uv`). Exposa ~49 tools sobre 45+ datasets: Socrata Catalunya, BDNS,
datos.gob.es, Open Data BCN, BOE, BORME, CENDOJ, INE, Banc d'Espanya.

**Fes-lo servir per explorar i validar dades abans d'escriure codi**: comprovar que un
dataset existeix, veure quins camps te de debo, contrastar una xifra o buscar sentencies.
Es molt mes fiable que suposar l'esquema d'un dataset Socrata. Per a la web en si, les
dades es segueixen llegint amb els clients de `src/lib/api/` en temps de build — el MCP es
eina de desenvolupament, no una dependencia del lloc.

Si el servidor no respon, comprova que `../mcp-govern` existeix i que `uv` esta instal·lat.

## Notes sobre les dades

- `src/data/casos-corrupcion.json` — **elaboracio propia, orientatiu**. 15 casos, 42
  persones. No ve de cap API oficial i no s'ha de presentar com a dada oficial.
- `src/data/datasets.ts` — els IDs dels datasets Socrata. Si un dataset canvia d'ID a
  l'origen, la pagina peta silenciosament amb zero resultats: es el primer lloc on mirar.
- `src/lib/api/socrata.ts` fa cache; les altres APIs (`bdns.ts`, `boe.ts`, `datosgob.ts`) no
  tenen el mateix tracte.
- El Detector analitza 10.000 contractes recents. Llindars de fraccionament: 15k€ serveis,
  40k€ obres. Concentracio: proveidors amb >30% dels contractes d'un organ.
  Implementat a `src/lib/analysis/`.
- `DataSourceBanner.astro` es **obligatori** a tota pagina que mostri dades: explica font,
  abast i com interpretar-les.

## Convencions de codi

- Components Astro en PascalCase, props tipades amb interface.
- Tailwind per als estils. **Excepcio**: dins de les illes Preact (`.tsx`) cal fer servir
  inline styles per al CSS critic — Tailwind 4 no genera les classes que nomes apareixen
  dins d'illes, i es perden en el build.

## Agents

10 agents a `.claude/agents/`: CEO, CTO, Frontend Dev, QA, UX Designer, UX Auditor, Product
Manager, Growth, Legal Advisor, Data Journalist. El CEO orquestra i delega. El Data
Journalist verifica les dades de corrupcio abans de publicar-les.

## Git

Branca principal: `master` (no `main`).
