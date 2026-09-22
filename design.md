# Design System — OptiTurno PWA

## Overview

Este archivo define los principios de diseño que se aplican automáticamente al refactorizar las vistas de la PWA. Combina tres skills de diseño senior para lograr una interfaz de nivel producción.

## Skills Aplicados

### 1. Taste Skill — Criterio Visual Senior
**Ubicación**: `.agents/skills/taste-skill/SKILL.md`

**Principios clave**:
- Contraste óptimo (WCAG AA mínimo 4.5:1)
- Bordes sutiles usando tokens del sistema
- Sombras en hover/active, no decorativas
- Tipografía balanceada con jerarquía clara

**Aplicar en**:
- Selección de colores para texto y fondos
- Uso de borders en cards y contenedores
- Implementación de sombras en elementos interactivos
- Definición de tamaños de fuente y pesos

### 2. Impeccable Design — Cero Inconsistencias
**Ubicación**: `.agents/skills/impeccable-design/SKILL.md`

**Principios clave**:
- Paddings uniformes en escala de 0.25rem
- Grids perfectamente alineados con gaps consistentes
- Estados de componentes bien definidos (hover, active, focus, disabled)
- Sin valores arbitrarios fuera del sistema

**Aplicar en**:
- Revisión de todos los paddings en componentes
- Alineación de grids en vistas principales
- Implementación de estados completos en botones, inputs, cards
- Normalización de espaciados

### 3. Emil Kowalski UI Rules — Movimiento y Pulimento
**Ubicación**: `.agents/skills/emil-kowalski-ui-rules/SKILL.md`

**Principios clave**:
- Transiciones físicas naturales (ease-out para entradas)
- Microinteracciones rápidas (<200ms)
- Animaciones de presencia con spring dynamics
- Pulimento extremo en componentes interactivos

**Aplicar en**:
- Transiciones de hover y active en todos los botones
- Animaciones de entrada/salida en modales y drawers
- Feedback visual inmediato en interacciones
- Stagger animations en listas

## Flujo de Aplicación

Al refactorizar cualquier vista de `frontend/components/views/`:

1. **Revisar Taste Skill**: Verificar contraste, bordes, sombras y tipografía
2. **Revisar Impeccable Design**: Verificar paddings, grids y estados
3. **Revisar Emil Kowalski UI Rules**: Verificar transiciones, microinteracciones y animaciones
4. **Aplicar checklist combinado**: Usar la sección de verificación abajo

## Checklist de Verificación Combinado

### Visual (Taste Skill)
- [ ] Contraste de texto ≥ 4.5:1
- [ ] Bordes sutiles usando `border-border`
- [ ] Sombras solo en hover/active
- [ ] Jerarquía tipográfica consistente
- [ ] Colores semánticos (no hex directos)

### Consistencia (Impeccable Design)
- [ ] Todos los paddings son múltiplos de 0.25rem
- [ ] Grids alineados con gaps uniformes
- [ ] Botones con: hover, active, focus-visible, disabled
- [ ] Inputs con: hover, focus, disabled, placeholder
- [ ] Cards con hover state consistente
- [ ] Sin valores arbitrarios

### Movimiento (Emil Kowalski UI Rules)
- [ ] Transiciones < 200ms
- [ ] Hover states con ease-out
- [ ] Active states con scale feedback
- [ ] Focus rings visibles
- [ ] Animaciones de presencia en modales
- [ ] Stagger animations en listas

## Variables CSS para Animaciones

Agregar en `frontend/app/globals.css`:

```css
:root {
  /* Timing functions */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
  
  /* Durations */
  --duration-fast: 100ms;
  --duration-normal: 150ms;
  --duration-slow: 200ms;
  --duration-presence: 300ms;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

## Referencias Rápidas

| Skill | Archivo | Uso Principal |
|-------|---------|---------------|
| Taste Skill | `.agents/skills/taste-skill/SKILL.md` | Contraste, bordes, sombras, tipografía |
| Impeccable Design | `.agents/skills/impeccable-design/SKILL.md` | Paddings, grids, estados |
| Emil Kowalski UI Rules | `.agents/skills/emil-kowalski-ui-rules/SKILL.md` | Transiciones, microinteracciones, animaciones |

## Notas para el Agente

Al refactorizar vistas:
1. Leer los tres skills SKILL.md antes de empezar
2. Aplicar cada principio de forma secuencial
3. Ejecutar el checklist combinado al final
4. Verificar que no haya regresiones en otros componentes
5. Mantener consistencia con el resto de la aplicación
