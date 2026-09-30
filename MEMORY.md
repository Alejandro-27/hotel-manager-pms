# memory.md — Memoria del proyecto HotelManager PMS & POS

Documento de **estado dinámico** del proyecto. Complementa a `AGENTS.md` (convenciones/estructura estables): aquí solo el estado que cambia con el tiempo. Lo carga el agente al inicio de cada sesión (referenciado desde `AGENTS.md`).

---

## Protocolo de mantenimiento

- **Actualizar al final de cada tarea/sesión**: si cambió el estado git, conteos de tests, dependencias, decisiones o estructura, reflejarlo aquí.
- **Tras un commit**: mover lo pendiente a la sección "Log de cambios" si ya está resuelto.
- **Mantener este archivo corto** (< ~100 líneas): el log se poda a las ~8 entradas más recientes.
- Si algo pasa a ser **permanente** (convención/estructura), se mueve a `AGENTS.md` y se quita de aquí (evitar duplicación/drift).
- No duplicar lo que ya está en `AGENTS.md`.

## Snapshot actual

- Fecha: 2026-09-30 · Rama: `main` · Último commit: `c005a98` (fix: cambio del boton de 'Exportar' a 'Excel')
- Pendiente de commit (creado en esta sesión): este `memory.md` y la actualización de `AGENTS.md`, `frontend/AGENTS.md`, `README.md` (conteos de tests 35→39, export CSV→XLSX, estructura nueva).
- Código: working tree limpio a nivel de fuente (`next-env.d.ts` se revierte siempre tras `pnpm build`).

## Conteos verificados (fuentes: comandos de test)

| Recurso | Conteo | Fuente |
|---|---|---|
| Frontend | 39 tests | `pnpm test` |
| Backend | 20 tests | `pnpm test:api` (requiere PostgreSQL) |
| Bruno | 41 requests | `backend/bruno/` |

## Decisiones recientes (con su porqué)

- **XLSX en vez de CSV** para exportar informes (`write-excel-file@4.1.1`): csv no permite header formateado; se descartó exceljs (21MB + polyfills browser) y SheetJS free (sin estilos, npm desactualizado). Header con celdas combinadas A:D, fondos, números reales con formato `$#,##0` y fila Total.
- **PDF via `window.print()`** (patrón `.print-only`/portal a body), sin dependencias; se descartó jsPDF. Setea `document.title` antes de imprimir (nombre de archivo sugerido).
- **Factura en curso** en el backend: factura real durante la estancia, noches completas `checkIn→checkOut`, cargos del TPV sincronizados al instante (`syncInvoiceForReservation` en `billing/service.ts`, upsert en `pos/service.ts`).
- Botón de exportación se muestra como **"Excel"** (no "Exportar") — decisión del usuario.

## Convenciones operativas (no están en AGENTS.md)

- **Textos UI en español sin acentos** (ej. "Ocupacion", "Ultimo ano"); excepción: content editable libre.
- **Browser bridge roto** → no hay verificación visual automatizada; el usuario revisa en `pnpm dev`. Verificar con `tsc --noEmit` + `pnpm lint` + tests + `pnpm build`.
- `frontend/next-env.d.ts` es auto-generado: **revertir con `git checkout --`** antes de commitear si el build lo toca.
- GitHub Actions corre lint+typecheck+build+tests (frontend) y build+tests (backend contra PostgreSQL 16).
- Credenciales test backend: `admin@test.com` / `Password123!` (BD `hotel_manager_test`).

## Log de cambios recientes (podar lo viejo)

- `c005a98` fix: boton 'Exportar' → 'Excel'
- `f89ee01` feat: informes exportables en XLSX y PDF con header del hotel
- `b02394b` feat: exportacion PDF e header del hotel en informes
- `9fe2ef2` feat: factura en curso refleja los cargos del TPV al instante
- `7d664fd` feat: rediseño de facturas con Sheet lateral y voucher de una sola hoja al imprimir

## Gotchas técnicos aprendidos

- Node ICU (es-ES): septiembre abreviado = **"sept"** (no "sep"); usar `${Intl.DateTimeFormat('es-ES', …)}` verificando salida en Node.
- `write-excel-file`: tipar los rows como `Row[]` explícito cuando hay `...map()` en el literal (si no, TS ensancha `align` a `string`); `SheetOptions` es genérico (no anotar, dejar inferir). v4 browser **no usa Web Workers** (zipper async).
- `.print-only` ya está en `globals.css` (`display:none` fuera de @media print) — es el patrón para impresión.
- Backend: imports con `.js`; queries `(await db.select()...)[0]` (pg no tiene `.get()`).

## Checklist si algo cambia

Al tocar lo siguiente, actualizar estos ficheros/puntos:

- Conteos de tests → `AGENTS.md` raíz, `frontend/AGENTS.md`, `README.md`
- `lib/utils.ts` / `lib/export-report.ts` / `components/reports-print-doc.tsx` → descripciones de estructura en README/AGENTS
- Nuevo endpoint/colección → `backend/AGENTS.md` + Bruno (mantener sincronizado)
- Schema DB → regenerar migración + re-seed (advertencia ya en AGENTS.md)