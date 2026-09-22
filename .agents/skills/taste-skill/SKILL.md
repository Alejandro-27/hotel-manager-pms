---
name: taste-skill
description: Criterio visual Senior para UI. Contraste óptimo, refinamiento de bordes, sombras sutiles y tipografía balanceada. Aplicar al refactorizar vistas de la PWA.
---

# Taste Skill — Criterio Visual Senior

## Overview

Aplicar un criterio visual de nivel senior en cada componente y vista. El objetivo es lograr interfaces con contraste óptimo, refinamiento en bordes, sombras sutiles y tipografía balanceada que transmitan profesionalismo y claridad.

## Principios Fundamentales

### 1. Contraste Óptimo

- **Texto sobre fondo**: Mínimo 4.5:1 para texto normal, 3:1 para texto grande (WCAG AA)
- **Elementos interactivos**: El contraste entre estado normal y hover debe ser perceptible pero sutil
- **Jerarquía por contraste**: Usar variaciones de peso y opacidad, no solo tamaño

```tsx
// Correcto: Contraste WCAG AA cumplido
<span className="text-foreground">Texto principal</span>
<span className="text-muted-foreground">Texto secundario</span>

// Evitar: Texto con contraste insuficiente
<span className="text-gray-400 on-white">Texto ilegible</span>
```

### 2. Refinamiento de Bordes

- **Bordes sutiles**: Usar `border-border` en lugar de colores fuertes
- **Border-radius consistente**: Seguir la escala del proyecto (`--radius`)
- **Separación visual**: Bordes solo cuando son necesarios para agrupar contenido

```tsx
// Correcto: Borde sutil y consistente
<div className="border border-border rounded-lg">...</div>

// Evitar: Bordes gruesos o colores llamativos
<div className="border-2 border-primary rounded-2xl">...</div>
```

### 3. Sombras Sutiles

- **Profundidad mínima**: Sombras que sugieran elevación sin competir con el contenido
- **Sombras en estado hover**: Para elementos interactivos, no decorativas
- **Consistencia**: Misma escala de sombras en toda la aplicación

```tsx
// Correcto: Sombra sutil en hover
<button className="shadow-sm hover:shadow-md transition-shadow">
  Acción
</button>

// Evitar: Sombras excesivas
<div className="shadow-2xl shadow-primary/20">...</div>
```

### 4. Tipografía Balanceada

- **Jerarquía clara**: h1 → título de página, h2 → sección, h3 → subsección
- **Pesos consistentes**: `font-semibold` para títulos, `font-medium` para énfasis
- **Espaciado entre líneas**: `leading-tight` para títulos, `leading-normal` para cuerpo
- **Tamaños en escala**: No usar valores arbitrarios fuera de la escala

```tsx
// Correcto: Tipografía balanceada
<h1 className="text-2xl font-semibold tracking-tight">Título Principal</h1>
<h2 className="text-lg font-medium text-foreground">Sección</h2>
<p className="text-sm text-muted-foreground leading-relaxed">Cuerpo de texto</p>

// Evitar: Tipografía inconsistente
<h1 className="text-3xl font-bold text-primary">Título</h1>
<h2 className="text-xl font-light">Sección</h2>
```

## Checklist de Revisión Visual

- [ ] Contraste de texto ≥ 4.5:1 para contenido normal
- [ ] Bordes sutiles usando tokens del sistema (`border-border`)
- [ ] Sombras aplicadas solo en hover/active, no decorativas
- [ ] Jerarquía tipográfica consistente (h1 → h2 → h3 → body → small)
- [ ] Espaciado en escala (múltiplos de 0.25rem)
- [ ] Colores semánticos en lugar de hex directos
- [ ] Estados visuales claros para todos los componentes interactivos

## Aplicación en el Proyecto

Aplicar estos principios al refactorizar:
- `frontend/components/views/` — Todas las vistas principales
- `frontend/components/ui/` — Componentes personalizados
- `frontend/app/globals.css` — Variables de tema si es necesario
