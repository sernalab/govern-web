# Quality — normalize, polish, optimize, harden

Comandos de mejora de calidad. Se aplican despues de un diagnostic.

---

## normalize

**Que hace:** Alinea el codigo/diseno con el design system y convenciones del proyecto.

**Que hacer:**
- Reemplazar valores hardcoded por tokens del design system (colores, spacing, tipografia)
- Unificar patrones inconsistentes (nombrado, estructura de componentes)
- Alinear con las convenciones de CLAUDE.md del proyecto
- Verificar que se usan los componentes UI existentes en vez de reinventar

**Combina con:** `clarify`, `adapt`

---

## polish

**Que hace:** Paso final antes de shipping. Detalles que separan "funciona" de "se siente bien".

**Que hacer:**
- Micro-interacciones: hover states, transitions, focus rings
- Spacing y alignment pixel-perfect
- Tipografia: line-height, letter-spacing, truncation
- Bordes, sombras, radios — consistencia en todo el componente
- Responsive: verificar que no se rompe en ningun breakpoint
- Dark/light mode si aplica

**Nota:** Polish NO es anadir features. Es refinar lo que ya existe.

---

## optimize

**Que hace:** Mejoras de rendimiento medibles.

**Que hacer:**
- Reducir bundle size (tree-shaking, lazy imports, dynamic imports)
- Optimizar imagenes (formatos modernos, srcset, lazy loading)
- Minimizar re-renders / recalculos innecesarios
- Preload/prefetch de recursos criticos
- Cacheo apropiado
- Medir antes y despues con metricas concretas

**Combina con:** `harden`

---

## harden

**Que hace:** Blindaje contra edge cases y errores.

**Que hacer:**
- Validaciones de input en boundaries (formularios, APIs, params)
- Manejo de estados de error (red, timeout, datos invalidos, vacios)
- Loading states y skeletons
- Null/undefined safety
- Limites de caracteres, overflow de texto
- Datos extremos (0, negativos, muy grandes, caracteres especiales)
- Offline/slow connection behavior

**Combina con:** `optimize`
