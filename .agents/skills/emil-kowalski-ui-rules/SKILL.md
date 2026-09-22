---
name: emil-kowalski-ui-rules
description: Transiciones físicas naturales, microinteracciones rápidas (<200ms), animaciones de presencia (spring dynamics) y pulimento extremo en componentes interactivos. Aplicar al refactorizar vistas de la PWA.
---

# Emil Kowalski UI Rules — Movimiento Físico y Pulimento

## Overview

Crear interfaces con movimiento natural y pulimento extremo. Las transiciones deben sentirse físicas, las microinteracciones deben ser rápidas (<200ms) y las animaciones de presencia deben usar spring dynamics para un feel orgánico.

## Principios Fundamentales

### 1. Transiciones Físicas Naturales

- **Easing curves realistas**: Usar `ease-out` para entradas, `ease-in` para salidas
- **Duración según contexto**: Hover < 150ms, Transiciones de estado 200ms, Animaciones de presencia 300ms
- **Propiedades correctas**: Solo animar `opacity`, `transform`, `background-color`, `border-color`

```tsx
// Correcto: Transiciones físicas
<button className="
  bg-primary text-primary-foreground
  hover:bg-primary/90
  active:bg-primary/80
  transition-all duration-150 ease-out
">
  Acción
</button>

// Correcto: Transición de presencia
<div className="
  animate-in fade-in-0 zoom-in-95
  duration-200 ease-out
">
  Contenido
</div>
```

### 2. Microinteracciones Rápidas (<200ms)

- **Hover states**: 100-150ms para feedback inmediato
- **Click feedback**: 100ms de reducción en scale
- **Toggle states**: 150ms para cambios de estado
- **Tooltips**: 150ms de delay antes de mostrar

```tsx
// Correcto: Microinteracciones rápidas
<button className="
  transition-all duration-150 ease-out
  hover:scale-[1.02]
  active:scale-[0.98]
">
  Botón con feedback
</button>

// Correcto: Toggle con animación suave
<Switch className="
  transition-colors duration-150
" />

// Evitar: Animaciones lentas
<button className="transition-all duration-500 ease-in-out">
  Botón lento
</button>
```

### 3. Animaciones de Presencia (Spring Dynamics)

- **Entradas**: `fade-in` + `slide-in-from-bottom` con spring
- **Salidas**: `fade-out` + `slide-out-to-top` con ease-in
- **Modales**: Scale + opacity con spring para feel orgánico
- **Listas**: Staggered animations para items

```tsx
// Correcto: Presencia con spring
<Dialog className="
  animate-in fade-in-0 zoom-in-95
  duration-200 ease-out
">
  <DialogContent className="
    data-[state=closed]:animate-out 
    data-[state=closed]:fade-out-0
    data-[state=closed]:zoom-out-95
    data-[state=closed]:slide-out-to-left-1/2
    data-[state=closed]:slide-out-to-top-[48%]
  ">
    ...
  </DialogContent>
</Dialog>

// Correcto: Lista con stagger
<div className="space-y-2">
  {items.map((item, i) => (
    <div 
      key={item.id}
      className="animate-in fade-in-0 slide-in-from-bottom-2"
      style={{ animationDelay: `${i * 50}ms` }}
    >
      {item.name}
    </div>
  ))}
</div>
```

### 4. Pulimento Extremo en Componentes Interactivos

#### Botones Premium
```tsx
<button className="
  relative overflow-hidden
  bg-primary text-primary-foreground
  hover:bg-primary/90
  active:bg-primary/80
  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  disabled:opacity-50 disabled:pointer-events-none
  transition-all duration-150 ease-out
  hover:shadow-sm active:shadow-none
  active:scale-[0.98]
">
  <span className="relative z-10">Acción</span>
</button>
```

#### Cards con Profundidad
```tsx
<Card className="
  border border-border
  hover:border-ring hover:shadow-md
  transition-all duration-200 ease-out
  cursor-pointer
  group
">
  <CardContent className="p-4">
    <div className="flex items-center gap-3">
      <div className="
        bg-primary/10 rounded-lg p-2
        group-hover:bg-primary/20
        transition-colors duration-150
      ">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-medium group-hover:text-primary transition-colors duration-150">
          Título
        </p>
        <p className="text-sm text-muted-foreground">Descripción</p>
      </div>
    </div>
  </CardContent>
</Card>
```

#### Inputs con Focus Premium
```tsx
<input className="
  w-full px-3 py-2
  border border-input bg-background
  hover:border-ring
  focus:border-ring focus:ring-2 focus:ring-ring/20
  disabled:opacity-50 disabled:cursor-not-allowed
  placeholder:text-muted-foreground
  transition-all duration-150 ease-out
" />
```

## Curvas de Animación Recomendadas

| Tipo | Duración | Easing | Uso |
|------|----------|--------|-----|
| **Hover** | 150ms | ease-out | Feedback inmediato |
| **Click** | 100ms | ease-in-out | Confirmación de acción |
| **Entrada** | 200ms | ease-out | Aparecer en pantalla |
| **Salida** | 150ms | ease-in | Desaparecer |
| **Presencia** | 200ms | ease-out | Modales, drawers |
| **Spring** | 300ms | spring | Animaciones orgánicas |

## Tailwind Classes para Animaciones

```css
/* Transiciones básicas */
transition-all duration-150 ease-out
transition-colors duration-150
transition-transform duration-150

/* Hover states */
hover:scale-[1.02]
hover:shadow-sm
hover:border-ring

/* Active states */
active:scale-[0.98]
active:shadow-none

/* Focus states */
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2

/* Presencia */
animate-in fade-in-0 zoom-in-95 duration-200
data-[state=closed]:animate-out data-[state=closed]:fade-out-0
```

## Checklist de Pulimento

- [ ] Todos los botones tienen: hover scale, active scale, focus ring
- [ ] Todos los inputs tienen: hover border, focus ring, transition
- [ ] Todos los cards tienen: hover border + shadow, group transitions
- [ ] Ninguna animación supera 200ms (excepto presencia)
- [ ] Transiciones usan ease-out para entradas
- [ ] Spring dynamics en modales y drawers
- [ ] Stagger animations en listas largas
- [ ] No hay parpadeo o saltos en transiciones

## Aplicación en el Proyecto

Aplicar estos principios al refactorizar:
- `frontend/components/views/` — Todas las vistas interactivas
- `frontend/components/ui/` — Componentes personalizados
- `frontend/app/globals.css` — Agregar variables de animación si es necesario
