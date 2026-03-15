# Diagnostic — audit, critique

Comandos de evaluacion. Siempre son el primer paso antes de aplicar cualquier mejora.

---

## audit

**Que hace:** Auditoria tecnica de calidad. Busca problemas objetivos y medibles.

**Que evaluar:**
- Accesibilidad (WCAG 2.1, contraste, alt texts, focus, landmarks)
- Performance (bundle size, lazy loading, renders innecesarios, Core Web Vitals)
- SEO (meta tags, structured data, canonical, Open Graph)
- Seguridad (validaciones, sanitizacion, RGPD compliance)
- Consistencia con design system (tokens, espaciado, tipografia)

**Output esperado:** Lista priorizada de hallazgos con severidad (critico/alto/medio/bajo).

**Lleva a:** `normalize`, `harden`, `optimize`, `adapt`, `clarify`

---

## critique

**Que hace:** Review de UX y diseno. Evalua la experiencia subjetiva del usuario.

**Que evaluar:**
- Flujo de usuario: es intuitivo? hay fricciones innecesarias?
- Jerarquia visual: el ojo va donde debe ir?
- Consistencia: se siente parte del mismo producto?
- Tono: el diseno comunica lo que la marca quiere?
- Estados: vacios, error, loading, exito — estan todos cubiertos?
- Mobile: la experiencia movil es igual de buena?

**Output esperado:** Feedback estructurado: que funciona bien, que no, que mejorar y por que.

**Lleva a:** `polish`, `distill`, `bolder`, `quieter`
