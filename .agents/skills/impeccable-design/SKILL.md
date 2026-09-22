---
name: impeccable-design
description: Cero inconsistencias en paddings, grids alineados y estados de componentes bien definidos (hover, active, focus, disabled). Aplicar al refactorizar vistas de la PWA.
---

# Impeccable Design — Cero Inconsistencias

## Overview

Lograr cero inconsistencias en el diseño: paddings uniformes, grids perfectamente alineados y estados de componentes bien definidos. Cada elemento debe sentirse intencional y parte de un sistema coherente.

## Principios Fundamentales

### 1. Paddings y Spacing Uniformes

- **Escala de espaciado**: Usar únicamente valores del sistema (`p-2`, `p-4`, `p-6`, etc.)
- **Consistencia por contexto**: Mismo padding para elementos del mismo nivel
- **Nesting limpio**: Padding interno consistente en componentes anidados

```tsx
// Correcto: Paddings uniformes
<Card className="p-4">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg">Título</CardTitle>
  </CardHeader>
  <CardContent className="pt-0">
    <p className="text-sm">Contenido</p>
  </CardContent>
</Card>

// Evitar: Paddings inconsistentes
<Card className="p-5">
  <CardHeader className="pb-3">
    <CardTitle className="text-lg">Título</CardTitle>
  </CardHeader>
  <CardContent className="pt-1">
    <p className="text-sm">Contenido</p>
  </CardContent>
</Card>
```

### 2. Grids Alineados

- **Alineación consistente**: Usar `grid` con gaps uniformes
- **Responsive limpio**: Breakpoints claros sin saltos bruscos
- **Alineación de items**: `items-center` o `items-start`, no mezclar en el mismo grid

```tsx
// Correcto: Grid alineado y consistente
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} className="p-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{item.name}</p>
          <p className="text-sm text-muted-foreground truncate">{item.description}</p>
        </div>
      </div>
    </Card>
  ))}
</div>

// Evitar: Grids desalineados
<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
  {items.map(item => (
    <Card key={item.id} className="p-5">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12" />
        <div>
          <p className="text-base font-semibold">{item.name}</p>
          <p className="text-xs text-gray-500">{item.description}</p>
        </div>
      </div>
    </Card>
  ))}
</div>
```

### 3. Estados de Componentes Definidos

Cada componente interactivo debe tener estados claros y consistentes:

#### Botones
```tsx
// Estados completos
<button className="
  bg-primary text-primary-foreground
  hover:bg-primary/90
  active:bg-primary/80
  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  disabled:opacity-50 disabled:pointer-events-none
  transition-colors
">
  Acción
</button>
```

#### Inputs
```tsx
// Estados completos
<input className="
  border border-input bg-background
  hover:border-ring
  focus:border-ring focus:ring-1 focus:ring-ring
  disabled:opacity-50 disabled:cursor-not-allowed
  placeholder:text-muted-foreground
  transition-colors
" />
```

#### Cards
```tsx
// Estados completos
<Card className="
  border border-border
  hover:border-ring hover:shadow-sm
  transition-all duration-200
  cursor-pointer
">
  ...
</Card>
```

### 4. Tabla de Estados Universal

| Estado | Visuales | Propiedades |
|--------|----------|-------------|
| **Default** | Borde sutil, color base | Normal |
| **Hover** | Borde más visible, sombra leve | `hover:` |
| **Active/Pressed** | Color ligeramente oscurecido | `active:` |
| **Focus** | Ring visible, contraste alto | `focus-visible:ring-2` |
| **Disabled** | Opacidad reducida, cursor | `disabled:opacity-50` |
| **Loading** | Spinner o skeleton | `animate-pulse` |

## Checklist de Consistencia

- [ ] Todos los paddings son múltiplos de 0.25rem
- [ ] Todos los gaps en grids son consistentes
- [ ] Todos los botones tienen: hover, active, focus-visible, disabled
- [ ] Todos los inputs tienen: hover, focus, disabled, placeholder
- [ ] Todos los cards tienen: hover state consistente
- [ ] No hay valores arbitrarios de padding/margin
- [ ] Breakpoints responsive son consistentes
- [ ] Alineación de items es uniforme en cada grid

## Aplicación en el Proyecto

Aplicar estos principios al refactorizar:
- `frontend/components/views/` — Revisar cada vista por inconsistencias
- `frontend/components/ui/` — Asegurar estados completos en componentes
- `frontend/lib/constants.tsx` — Definir valores de spacing si es necesario
