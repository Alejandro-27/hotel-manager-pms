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

- Fecha: 2026-10-02 · Rama: `main` · Último commit: `fd8888e` (validacion numerica en inputs)
- **Pendiente de commit**: parches de seguridad (sesiones refresh + lockout + CSRF Origin + integridad financiera), gating de registro, deps actualizadas y overrides de auditoría.
- Código fuente: `tsc` limpio en frontend y backend; lint frontend 0 errores / 6 warnings (baseline); `pnpm test` **54/54**; `pnpm test:api` **33/33**; `pnpm build` OK (Next 16.3.8).
- **Auditoría de dependencias**: `pnpm audit --prod` → 0 vulnerabilidades. En dev queda 1 moderada (`esbuild@0.18.20` vía `drizzle-kit`/`@esbuild-kit`; solo afecta al dev-server de esbuild, no se usa así). Resuelto con `overrides` en `pnpm-workspace.yaml` (pnpm v12 ya no lee `pnpm.overrides` de `package.json`).
- Revertidos los cambios **visuales** de la auditoría de 7 fases a petición del usuario: la estética previa queda intacta. Se conserva la funcionalidad (legal, settings, consentimientos) y atributos sin impacto (`aria-*`, foco).
- Browser bridge roto → verificación visual manual en `pnpm dev` (pendiente comprobar la CSP de producción, que solo aplica con `next build && next start`).

## Conteos verificados (fuentes: comandos de test)

| Recurso | Conteo | Fuente |
|---|---|---|
| Frontend | 54 tests | `pnpm test` |
| Backend | 33 tests | `pnpm test:api` (verificado 2026-10-02, 33/33) |
| Bruno | 46 requests | `backend/bruno/` |

## Decisiones recientes (con su porqué)

- **Sesiones refresh server-side** (`refresh_sessions`) con rotación obligatoria: cada `/api/auth/refresh` invalida el token usado y emite uno nuevo; logout y cambio de contraseña revocan todas. Cierra el agujero de refresh no revocable. El `jti` va **en el payload** (los tipos de `@fastify/jwt` no aceptan la opción `jwtid`).
- **Registro público cerrado por defecto** (`ALLOW_REGISTRATION=false`): el primer usuario (bootstrap, cuando no hay ninguno) siempre puede registrarse; el resto da 403. En dev queda abierto.
- **Lockout de login en memoria** (5 fallos → 15 min, por proceso; coherente con el store del rate-limit): suficiente para una sola instancia. Con varias réplicas necesita store compartido (Redis).
- **`TRUST_PROXY` desactivado por defecto** (antes se activaba en producción): tras un proxy real hay que ponerlo (`TRUST_PROXY=127.0.0.1` o CIDR) o el rate-limit comparte la IP del proxy. Es un `needs-validation` de despliegue.
- **CSRF por `Origin`**: hook `onRequest` que rechaza (403) métodos mutadores con `Origin` presente y no permitido. Complementa las cookies `httpOnly` + `sameSite`.
- **Integridad financiera**: `payInvoice` transaccional con `SELECT ... FOR UPDATE` y tope al saldo pendiente (400); `createReservation` transaccional con lock de habitación y comprobación de solapamiento inline (409); ventas TPV con precio y stock calculados en servidor (decremento atómico con guard, 409 si insuficiente) y `roomId` solo con `cargo_habitacion`; cancelar una reserva en `checkin` se bloquea (400) para no liberar una habitación ocupada.
- **Sin `@vercel/analytics`**: no era necesario para un PMS interno y no queremos terceros recebendo datos de uso.
- **Consentimientos sin persistencia**: `acceptTerms` y `acceptCancellationPolicy` se exigen en API y UI, pero no se guardan (decisión del usuario; evita migración y dado personal extra). Consecuencia: las páginas legales NO deben afirmar que el consentimiento queda registrado.
- **Datos fiscales en tabla `settings`** (fila única `main`) y no en `users`: es un solo negocio por instalación y así el informe/voucher leen de una fuente. `GET` es para cualquier autenticado, `PATCH` solo admin. La migración `0003` inserta la fila `main` para que instalaciones existentes no queden sin datos.
- **Campos de huésped opcionales** (`country`, `email`, `phone`): antes obligatorios y el frontend rellenaba datos ficticios (`XX`, `000000`). Ahora el schema acepta vacío o ausencia.
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

- (sin commit) seguridad: sesiones refresh + rotación/revocación, lockout login, CSRF Origin, integridad financiera (pagos/reservas/stock), gating registro, next 16.3.8 + fastify 5.12.5, overrides de auditoría
- `fd8888e` feat(frontend): validacion numerica en inputs con aviso inline
- `6c6d78b` feat: auditoria de 7 fases + legal, settings y consentimiento; reversión estética conservando accesibilidad; fix migración settings
- `726bfce` docs: memoria del proyecto + documentación actualizada
- `f89ee01` feat: informes exportables en XLSX y PDF con header del hotel
- `b02394b` feat: exportacion PDF e header del hotel en informes
- `9fe2ef2` feat: factura en curso refleja los cargos del TPV al instante
- `7d664fd` feat: rediseño de facturas con Sheet lateral y voucher de una sola hoja al imprimir

## Gotchas técnicos aprendidos

- Node ICU (es-ES): septiembre abreviado = **"sept"** (no "sep"); usar `${Intl.DateTimeFormat('es-ES', …)}` verificando salida en Node.
- `write-excel-file`: tipar los rows como `Row[]` explícito cuando hay `...map()` en el literal (si no, TS ensancha `align` a `string`); `SheetOptions` es genérico (no anotar, dejar inferir). v4 browser **no usa Web Workers** (zipper async).
- `.print-only` ya está en `globals.css` (`display:none` fuera de @media print) — es el patrón para impresión.
- Backend: imports con `.js`; queries `(await db.select()...)[0]` (pg no tiene `.get()`).
- `next/font/google` con Next 16: `Geist(...)` no expone `.variable`. **NO** poner `geist.className`/`geistMono.className` en el `<body>`: el body queda con `font-sans` y las consts se declaran sin usar (`_geist`/`_geistMono`) — aplicar la clase de la fuente en el body renderiza el sitio entero en Geist Mono (el orden de clases CSS, no del HTML, decide cuál gana).
- **Migraciones `.sql` generadas: no editarlas a mano sin validar.** `drizzle-kit generate` escribe `CREATE TABLE ...\n);` + `\n--> statement-breakpoint`. Al añadir statements a mano se puede perder el `);` y la migración falla en silencio: `src/index.ts` hace `migrate()` **antes** de `app.listen()`, así que el backend muere y **nada escucha en el 3001**; el navegador lo reporta como `CORS request did not succeed / Status code (null)`, que es conexión rechazada, no un problema de CORS. Diagnóstico: `ss -ltn | grep 3001` (vacío = caído) y `SELECT count(*) FROM drizzle.__drizzle_migrations` vs entradas del `_journal.json` (si falta una, la migración no corrió).
- `tsx watch` solo vigila `.ts`: editar un `.sql` de migración NO reinicia el backend; hay que relanzar `pnpm dev` para que el `migrate()` del arranque se ejecute.
- `tsc --noEmit` en frontend lee `.next/types/validator.ts`: si da errores raros de `Route`, borrar `.next` y reconstruir.
- Bruno: requests que validan bloqueo por rol usan `{{recepcionToken}}`, que rellena `auth/login-recepcion.bru`. Tras el cambio a cookies, `register/login/login-recepcion/refresh.bru` extraen el token desde `res.headers["set-cookie"]` (parseando `token=`), no de `res.body.token`.
- pnpm v12 **ignora `pnpm.overrides` en `package.json`**: los overrides de auditoría van en `pnpm-workspace.yaml` (sección `overrides:`). pnpm añade `minimumReleaseAgeExclude` solo al instalar versiones muy recientes.

## Checklist si algo cambia

Al tocar lo siguiente, actualizar estos ficheros/puntos:

- Conteos de tests → `AGENTS.md` raíz, `frontend/AGENTS.md`, `backend/AGENTS.md`, `README.md`
- `lib/utils.ts` / `lib/export-report.ts` / `components/reports-print-doc.tsx` → descripciones de estructura en README/AGENTS
- Nuevo endpoint/colección → `backend/AGENTS.md` + Bruno (mantener sincronizado)
- Schema DB → regenerar migración + re-seed (advertencia ya en AGENTS.md)