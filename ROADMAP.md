# Shelie's Hair Studio — Roadmap y Problemas Detectados

> **Producción:** https://shelies.asf.company  
> **Stack:** Next.js 14 · Express · PostgreSQL · nginx · Docker  
> **Última revisión:** 31 de marzo de 2026

---

## 🔴 CRÍTICO — Seguridad

### C-01 · Contraseñas en texto plano
- `shelies2026` está hardcodeado en 6 archivos del código fuente.
- La columna `password_hash` en la DB almacena contraseñas en texto plano (sin bcrypt ni ningún hash).
- La contraseña se muestra visualmente en el formulario de login de estilistas.
- **Fix:** instalar `bcrypt` en el backend, hashear al crear/actualizar usuarios, comparar con `bcrypt.compare()` en el auth.

### C-02 · Backend sin middleware de autenticación
- La carpeta `backend/src/middleware/` está **vacía**.
- Todas las rutas (`/api/admin`, `/api/employees`, `/api/orders`, `/api/appointments`, etc.) son **públicas**: cualquier persona que conozca la URL puede leer, crear o eliminar datos sin estar autenticada.
- **Fix:** implementar JWT en el backend. El login devuelve un token; todas las rutas protegidas verifican `Authorization: Bearer <token>` en un middleware centralizado.

### C-03 · `pg` (PostgreSQL) y `@anthropic-ai/sdk` en el frontend
- El `package.json` del frontend incluye `pg` y `@anthropic-ai/sdk` como dependencias.
- Si alguna Server Component o API Route usa estas librerías, las credenciales de DB y la API key de Anthropic pueden quedar expuestas en el bundle del cliente.
- **Fix:** todas las queries de DB deben ir exclusivamente al backend Express. Si se necesita un Server Action, usar solo `fetch()` al backend, nunca `pg` directo.

### C-04 · Tokens y credenciales en `.env` en texto claro
- El `.env` del backend contiene el token de WhatsApp Business (Meta), el access token de MercadoPago y la URL de la DB con usuario/contraseña.
- Estos archivos no deben estar en el repositorio git.
- **Fix:** verificar `.gitignore` incluya `.env*` (excepto `.env.example`), rotar tokens si ya fueron expuestos.

---

## 🟠 IMPORTANTE — Funcionalidad

### F-01 · Módulo Admin (`/admin`) — requiere revisión completa
**Problemas detectados:**
- Sin protección real de rutas (cualquier URL `/admin/...` es accesible).
- La pantalla de login tiene un fallback hardcodeado que permite entrar si el servidor está caído.
- Algunos endpoints como `/api/admin/users` hacen `PATCH` con la URL `/api/admin/users?id=...` usando rutas relativas sin prefijo en algunos archivos (`admin/usuarios/page.tsx` línea 224 y 244).
- El diseño es inconsistente entre secciones.

**Lo que debe quedar:**
- Login con JWT real, token guardado en `httpOnly cookie` o `sessionStorage` con expiración.
- Todas las secciones protegidas por un middleware frontend que redirige a login si no hay token válido.
- Diseño unificado con la paleta de marca (vino `#5E0B2B`, dorado `#C9A46A`, fondo crema).
- Navegación lateral colapsable con iconos.

### F-02 · Reportes de personal dispersos — centralizar en un solo panel
**Estado actual:**
- Los reportes de adherencia de agentes están en `/admin/reportes`.
- Los turnos de estilistas están en `/admin/estilistas`.
- Las métricas de productividad de estilistas están en `/estilista/metricas` (solo la propia).
- No hay una vista unificada de todo el personal.

**Lo que debe quedar — `/admin/reportes` unificado:**
```
Tabs:
  [Agentes]      → adherencia diaria/semanal, sesiones, tiempo conectado
  [Estilistas]   → turnos, citas completadas, productividad, promedio por día
  [Comparativo]  → ranking de todo el equipo en un solo gráfico
  [Exportar]     → descarga CSV con el rango de fechas seleccionado
```

### F-03 · Nuevo módulo Especialistas con Pedidos (`/especialista`)
Similar al módulo `/estilista` pero orientado a la venta y seguimiento de pedidos de productos.

**Funcionalidades requeridas:**
- Login con `nombre.apellido` + contraseña compartida (mismo patrón que estilistas).
- **Dashboard:** resumen del día — pedidos pendientes, en proceso, entregados.
- **Pedidos:** listado de pedidos asignados con detalle, estado y timeline de seguimiento.
  - Estados: `nuevo → confirmado → en preparación → listo → entregado → cancelado`
  - El especialista puede avanzar el estado desde su módulo.
- **Catálogo rápido:** ver productos con stock para responder consultas.
- **Turno:** mismo patrón que estilistas — timer, inicio/fin de turno.
- **Métricas:** pedidos completados, valor total vendido, promedio por turno.

**Tablas DB necesarias:**
```sql
bbdd_shelies.specialists        -- similar a employees, cargo = 'especialista'
bbdd_shelies.specialist_shifts  -- similar a stylist_shifts
```

**Rutas frontend:** `/especialista`, `/especialista/pedidos`, `/especialista/catalogo`, `/especialista/metricas`  
**Rutas backend:** `/api/specialist/...`

### F-04 · HC → Estilistas visibles en la página de servicios
**Problema actual:**
- En `/servicios`, la selección de estilista no está sincronizada con el HC real del backend.
- Los nombres/fotos mostrados son datos estáticos o no coinciden con los empleados activos de la tabla `bbdd_shelies.employees`.

**Lo que debe quedar:**
- Al agendar un servicio, el selector de estilista debe obtener dinámicamente la lista de `GET /api/employees?cargo=estilista&status=activo`.
- Las 9 estilistas activas del HC deben aparecer con su nombre real:
  - Angie Melisa Orozco Ramirez
  - Angie Tatiana Infante Torres
  - Cindy Milena Cardenas Obando
  - Deisy Carolina Ducon Niño
  - Derly Adriana Perez Rodriguez
  - Francy Camila Benavides Suarez
  - Gilliane Samantha Quiroga Cañon
  - Nicol Dayana Beltran Neuta
  - Yenifer Cogollo Chaparro
- Si una estilista está inactiva en la DB, **no debe aparecer** en la selección.
- Cada estilista debe poder tener una foto de perfil (campo `avatar_url` pendiente en la tabla `employees`).

---

## 🟡 MEJORAS — Deuda técnica y diseño

### D-01 · Archivos "God File" (>400 líneas)
Deben dividirse en componentes más pequeños y reutilizables:

| Archivo | Líneas | Acción |
|---|---|---|
| `agente/page.tsx` | 1,111 | Extraer `InboxPanel`, `ConversationList`, `MessageComposer`, `QuickReplies` |
| `admin/inbox/page.tsx` | 1,106 | Extraer los mismos componentes que agente (comparten lógica) |
| `servicios/page.tsx` | 883 | Extraer `ServiceCard`, `ServiceModal`, `BookingForm`, `StylistSelector` |
| `admin/productos/page.tsx` | 679 | Extraer `ProductForm`, `ProductTable` |
| `rag-engine.ts` | 552 | Separar `knowledge-base.ts`, `intent-detector.ts`, `response-builder.ts` |
| `estilista/layout.tsx` | 529 | Extraer `LoginEstilista`, `EstilistaShell`, `ShiftTimer` a archivos propios |

### D-02 · Diseño del panel admin — unificar y mejorar
- Paleta inconsistente entre secciones (algunos usan clases Tailwind, otros inline styles).
- Tablas sin paginación real (cargan todo de una vez).
- Formularios sin validación visual (solo `alert()`).
- **Fix:** crear un `design-system.ts` con tokens de color, componentes base (`Table`, `Modal`, `Form`, `Badge`) reutilizables en todas las secciones admin.

### D-03 · Sin tests
- No existe ningún `*.test.ts` / `*.spec.ts` en todo el proyecto.
- **Mínimo recomendado:** tests de integración para los endpoints críticos (`/api/admin/auth`, `/api/orders`, `/api/appointments`).

### D-04 · Vulnerabilidades en dependencias
```
Frontend: 2 moderate + 7 high (npm audit)
eslint@8.57 — deprecado, usar ESLint 9+
```
Ejecutar `npm audit fix` en `/frontend`.

### D-05 · `next.config.js` duplicado en la raíz `/spa`
- Existe un `next.config.js` en la raíz que no tiene `src/app` y hace fallar `npm run build` desde `/spa`.
- **Fix:** eliminar `/spa/next.config.js` y `/spa/package.json` si no se usan, o convertirlos en un monorepo con workspaces.

### D-06 · `console.log` en producción
- 42 ocurrencias de `console.log/error` en código de producción (backend + frontend).
- **Fix:** usar un logger estructurado (`pino` o `winston`) en el backend, eliminar logs de frontend que no sean errores reales.

---

## 📋 Backlog priorizado

| # | Tarea | Prioridad | Módulo |
|---|---|---|---|
| 1 | Hashear contraseñas con bcrypt | 🔴 Crítico | Backend |
| 2 | Implementar JWT + middleware de auth | 🔴 Crítico | Backend + Frontend |
| 3 | Sacar `pg` del frontend | 🔴 Crítico | Frontend |
| 4 | Verificar `.gitignore` para `.env` | 🔴 Crítico | Infra |
| 5 | Centralizar reportes de personal en `/admin/reportes` | 🟠 Importante | Admin |
| 6 | Arreglar y unificar módulo Admin completo | 🟠 Importante | Admin |
| 7 | Construir módulo Especialistas con Pedidos | 🟠 Importante | Nueva feature |
| 8 | Sincronizar HC con selector de estilistas en `/servicios` | 🟠 Importante | Servicios |
| 9 | Mejorar diseño admin con design system unificado | 🟡 Mejora | Admin |
| 10 | Romper God Files en componentes | 🟡 Mejora | Frontend |
| 11 | `npm audit fix` en frontend | 🟡 Mejora | Frontend |
| 12 | Eliminar `next.config.js` raíz | 🟡 Mejora | Infra |
| 13 | Agregar tests de integración | 🟡 Mejora | Testing |
| 14 | Reemplazar console.log por logger estructurado | 🟡 Mejora | Backend |

---

## 🏗 Arquitectura actual

```
/spa
├── backend/          Express API (Node 20) → puerto 3001
│   ├── src/routes/   adminUsers, appointments, employees, orders,
│   │                 payments, products, quotes, services, stylist,
│   │                 uploads, whatsapp, contact
│   └── src/lib/      db, admin-users-db, db-products, db-services,
│                     employees-db, stylist-db, whatsapp-db
│
├── frontend/         Next.js 14 App Router
│   └── src/app/
│       ├── /                  Tienda pública + chatbot RAG
│       ├── /servicios         Reserva de citas + selector estilista
│       ├── /tienda            Catálogo productos
│       ├── /checkout          Pago MercadoPago
│       ├── /admin/**          Panel administración
│       ├── /agente            Módulo Call Center (inbox WhatsApp)
│       ├── /estilista/**      Módulo Estilistas
│       └── /especialista/**   ← PENDIENTE DE CONSTRUIR
│
└── nginx.conf        Reverse proxy: /api → backend, / → Next.js
```

### Tablas DB actuales (`bbdd_shelies`)
```
admin_users         employees           agent_sessions
appointments        orders              order_items
products            services            service_stylists
quotes              contacts            stylist_slots
stylist_shifts      stylist_workflow
```

### Tablas DB pendientes
```
specialists         → cargo = 'especialista', mismo patrón que employees
specialist_shifts   → turnos de especialistas
```

---

## 🚀 Notas de despliegue

- **Docker Compose:** `docker-compose.shelie_spa.yml`
- **Red proxy:** red Docker externa `proxy` (Traefik o nginx externo del servidor ASF)
- **Backend expuesto:** puerto `5015:3001` en el host
- **Frontend:** solo expone `3000` internamente, nginx lo sirve
- **Uploads:** volumen `./uploads:/app/uploads` en el contenedor backend
- **Variables de entorno producción:** `.env` en la raíz del proyecto (nunca en git)
