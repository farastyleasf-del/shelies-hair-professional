# Shelie's Hair Professional — Plan de Proyecto

> **Objetivo**: Tienda online con catálogo real de productos y servicios, sistema de reservas para el spa, pasarela de pago MercadoPago, y panel de administración con roles diferenciados.

---

## Estado actual del proyecto

### Lo que ya existe

| Módulo | Estado | Notas |
|--------|--------|-------|
| Tienda (catálogo + filtros) | ✅ Funcional | 8 productos reales del catálogo WEB.pdf con fotos propias |
| Detalle de producto | ✅ Funcional | Beneficios, ingredientes, FAQ por producto |
| Carrito + checkout | ✅ UI completa | Sin pasarela real — solo mock |
| Confirmación de pedido | ✅ UI completa | Número de orden generado en frontend |
| Rastreo de pedido | ✅ UI completa | Datos de demo en memoria |
| Página de servicios | ✅ Rediseñada | Premium con before/after slider, booking modal 5 pasos, calendario semanal, elección de estilista |
| Sistema de reservas (frontend) | ✅ Funcional | WhatsApp + Google Calendar + ICS Apple/Outlook |
| Chatbot RAG | ✅ Funcional | Detecta intents, recomienda productos/servicios |
| Panel admin — Dashboard | ✅ UI completa | KPIs, alertas, reportes — mock |
| Panel admin — Productos | ✅ CRUD real | Slide-over con todos los campos, imágenes, localStorage |
| Panel admin — Servicios | ✅ CRUD real | Slide-over con todos los campos, imágenes, localStorage |
| Panel admin — Inbox/Pedidos/Clientes/Equipo | ✅ UI completa | Mock data |
| Panel admin responsive | ✅ Funcional | Sidebar colapsable móvil, Inbox con tabs móvil |
| Política de privacidad | ✅ Publicado | Cumple requisitos Meta |
| Eliminación de datos | ✅ Publicado | Cumple requisitos Meta |
| Logo real | ✅ Aplicado | Unicornio Shelie's |
| Direcciones y teléfonos | ✅ Actualizados | Sede Sur, Norte, Bodega |
| **Base de datos PostgreSQL** | ✅ Conectada | Schema `shelies` en `evolutiondb` vía PgBouncer |
| **API Routes DB** | ✅ Funcional | `/api/products`, `/api/services`, `/api/appointments` con CRUD completo |

### Lo que NO existe todavía (deuda técnica)

| Área | Situación |
|------|-----------|
| Admin CRUD conectado a DB | Las páginas admin/productos y admin/servicios aún usan localStorage — pendiente conectar a `/api/*` |
| Autenticación real | Admin con credenciales hardcodeadas en layout.tsx — migrar a NextAuth/Clerk |
| Pago real | Formulario mock, sin integración MercadoPago |
| Reservas en DB | El booking modal guarda via WhatsApp, no en la tabla `appointments` |
| Correos transaccionales | No se envía ningún email |
| Roles de usuario reales | Solo hay una sesión mock "admin" y "colaborador" preview |
| `bbdd_shelies` en PgBouncer | La DB dedicada existe pero no está en la lista del pooler — ver nota abajo |
| Imágenes en storage | Las fotos están en `/public/images` — migrar a Supabase Storage o similar para producción |
| Videos | No integrados |

---

## Pila tecnológica actual

```
Next.js 14 (App Router) + TypeScript 5 + Tailwind CSS 3
React Context API (carrito, chat)
PostgreSQL 16 (pgadmin.asf.company:6432) · Schema: evolutiondb.shelies
Sin Auth real · Sin payments
```

### Infraestructura de base de datos

| Componente | Detalle |
|-----------|---------|
| **Servidor PostgreSQL** | `postgres:5432` (Docker interno en el servidor ASF) |
| **PgBouncer** | `pgadmin.asf.company:6432` — pooler de conexiones |
| **pgAdmin 4** | `https://pgadmin.asf.company` — interfaz web |
| **DB activa en la app** | `evolutiondb` · Schema `shelies` |
| **DB dedicada (pendiente)** | `bbdd_shelies` — existe en PostgreSQL, aún no en PgBouncer |
| **Credenciales** | `root` / ver `.env.local` |

#### Tablas creadas en `shelies`
| Tabla | Contenido | Registros seed |
|-------|-----------|----------------|
| `products` | Catálogo de productos | 8 productos |
| `services` | Servicios del spa | 8 servicios |
| `stylists` | Equipo de estilistas | 2 estilistas |
| `appointments` | Citas y reservas | vacía |
| `orders` | Pedidos de la tienda | vacía |
| `clients` | Base de clientes | vacía |
| `admin_users` | Usuarios del panel | vacía |

#### Para activar `bbdd_shelies` en PgBouncer
Agregar en `/etc/pgbouncer/pgbouncer.ini` del servidor:
```ini
bbdd_shelies = host=postgres port=5432 dbname=bbdd_shelies
```
Luego recargar: `systemctl reload pgbouncer` o `kill -HUP <pid>`
Actualizar `DATABASE_URL` en `.env.local` y en el servidor de producción.

---

## Roadmap de desarrollo

Las fases están ordenadas por dependencias y valor de negocio.

---

### FASE 0 — Fundación técnica ✅ COMPLETADA PARCIALMENTE
> Base de datos conectada. Pendiente: autenticación real.

**0.1 Base de datos** ✅ COMPLETADO
- ~~Instalar y configurar Supabase~~ → Conectado a PostgreSQL propio en servidor ASF
- Tablas creadas: `products`, `services`, `stylists`, `appointments`, `orders`, `clients`, `admin_users`
- Datos seed migrados desde `data.ts` → tablas reales
- API Routes: `GET/POST /api/products`, `GET/POST /api/services`, `GET/POST /api/appointments`, `PATCH/DELETE` para ambos
- Archivos: `src/lib/db.ts`, `src/lib/db-products.ts`, `src/lib/db-services.ts`

**0.2 Autenticación con roles** ⏳ PENDIENTE
- Instalar NextAuth v5 o Clerk (recomendado Clerk por facilidad de roles)
- Roles: `admin` | `especialista` | `pedidos` | `atencion_cliente`
- Eliminar credenciales hardcodeadas del código fuente (`admin/layout.tsx`)
- Sesiones persistentes en cookies httpOnly

**0.3 Variables de entorno** ✅ COMPLETADO
```env
# .env.local — YA EXISTE
DATABASE_URL="postgresql://root:***@pgadmin.asf.company:6432/evolutiondb"
ADMIN_EMAIL="admin@shelie.com"
ADMIN_PASSWORD="shelie2026"

# Pendiente agregar:
NEXTAUTH_SECRET=
NEXTAUTH_URL=
MERCADOPAGO_ACCESS_TOKEN=       # Fase 4
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=  # Fase 4
RESEND_API_KEY=                 # Fase 3
EMAIL_FROM=notificaciones@shelies.com
```

**0.4 Conectar admin CRUD a la DB** ⏳ PENDIENTE
- `admin/productos` actualmente usa localStorage → conectar a `/api/products`
- `admin/servicios` actualmente usa localStorage → conectar a `/api/services`
- La API ya existe y funciona, solo falta actualizar los `fetch()` en las páginas admin

---

### FASE 1 — Catálogo real (imágenes, videos, datos correctos) ✅ COMPLETADA PARCIALMENTE

**1.1 Productos** ✅ COMPLETADO
- ~~Subir fotos reales de cada producto~~ → 8 productos con fotos propias en `/public/images/products/`
- Catálogo limpio: solo productos del PDF WEB (botox-capilar, tratamiento-reparador incluidos)
- Precios y descripciones correctas
- ⏳ Pendiente: videos demostrativos, migrar fotos a storage en la nube

**1.2 Servicios** ✅ COMPLETADO
- Fotos before/after reales mapeadas sin repetición (antes-1/2/3, resultado-1/2/3, aplicacion-1/2)
- Slider before/after interactivo en la página de servicios
- ⏳ Pendiente: videos de proceso, vincular estilistas por disponibilidad real

**1.3 Admin — Gestión de catálogo** ✅ COMPLETADO (UI)
- CRUD completo de productos: `/admin/productos` con slide-over panel, todos los campos
- CRUD completo de servicios: `/admin/servicios` con slide-over panel, todos los campos
- ⏳ Pendiente: conectar formularios admin a la DB (0.4 arriba)

---

### FASE 2 — Sistema de reservas ✅ COMPLETADA PARCIALMENTE
> Frontend completo. Pendiente: persistir citas en DB y gestión desde admin.

**Lo que ya existe:**
- Booking modal 5 pasos: servicio → estilista → fecha+hora → datos personales → confirmación
- Calendario semanal (Mar–Sáb, slots 9–12 y 14–17)
- Elección de estilista con foto y especialidades
- Integración WhatsApp pre-llenado + Google Calendar link + ICS (Apple/Outlook)
- Tabla `appointments` creada en DB con FK a services y stylists

**Pendiente completar:**

> **Módulo nuevo — Backend de reservas.** Es el corazón del negocio de spa.

**2.1 Modelo de datos de reservas**
```
Booking {
  id, clienteId, especialistaId, servicioId
  fecha, horaInicio, horaFin
  estado: pendiente | confirmada | completada | cancelada
  notas, createdAt
}

Specialist {
  id, userId, nombre, foto
  servicios[]         ← qué servicios puede realizar
  diasDisponibles[]   ← lunes-domingo
  horaInicio, horaFin ← jornada
  bloqueosEspeciales[]← vacaciones, descansos
}
```

**2.2 Calendario por especialista**
- Vista semanal de disponibilidad por cada colaborador
- Bloqueo automático de slots al confirmar reserva
- Gestión de jornada laboral (8am–6pm por default, configurable)
- Bloqueos manuales desde admin (vacaciones, ausencias)

**2.3 Flujo de reserva para el cliente**
1. Elige el servicio en `/servicios`
2. Selecciona fecha disponible (calendar picker)
3. Ve los especialistas disponibles en esa fecha/hora
4. Elige especialista (o "sin preferencia" → asignación automática)
5. Deja nombre, teléfono, email
6. Confirma → recibe email + WhatsApp de confirmación

**2.4 Páginas necesarias**
- `/reservas` — Landing de reservas con selector de servicio
- `/reservas/[servicioId]` — Calendario con disponibilidad
- `/reservas/confirmacion/[bookingId]` — Resumen y confirmación
- `/mis-reservas` — Historial del cliente (requiere auth o token)

**2.5 Admin — Calendario**
- Vista `/admin/reservas` con calendario semanal/mensual
- Filtro por especialista
- Crear/cancelar/reprogramar desde admin
- Indicador visual de ocupación del día

---

### FASE 3 — Correos transaccionales
> Necesita la reserva y el pedido reales para tener datos que enviar.

**Herramienta recomendada**: Resend (free tier 3,000 emails/mes, integración Next.js muy limpia)

**Emails a implementar**

| Trigger | Destinatario | Contenido |
|---------|-------------|-----------|
| Nueva reserva confirmada | Cliente | Fecha, hora, especialista, servicio, dirección sede, botón cancelar |
| Nueva reserva recibida | Spa (admin) | Mismos datos + teléfono cliente |
| Recordatorio 24h antes | Cliente | Resumen de la cita |
| Reserva cancelada | Cliente + Spa | Motivo, opción de reagendar |
| Pedido recibido | Cliente | Número de orden, resumen de productos, total |
| Pedido enviado | Cliente | Número de guía, empresa transportadora |
| Pedido entregado | Cliente | Confirmación + invitación a reseñar |

**Templates**
- HTML responsive con branding Shelie's (paleta vino/crema)
- Incluir logo, direcciones, teléfonos de contacto
- Footer con enlace a política de privacidad y datos

---

### FASE 4 — Integración MercadoPago
> Reemplaza el formulario mock con pago real.

**4.1 Métodos a activar**
- Tarjeta de crédito/débito (Visa, Mastercard)
- PSE (débito bancario colombiano)
- Nequi
- Efecty / Baloto (efectivo en puntos de pago)

**4.2 Flujo técnico**
```
Checkout → POST /api/orders/create-preference
         → MercadoPago crea preferencia → devuelve init_point
         → Redirigir al checkout de MercadoPago
         → MercadoPago hace webhook → POST /api/webhooks/mercadopago
         → Verificar firma del webhook
         → Actualizar estado del pedido en DB
         → Disparar email de confirmación
         → Redirigir a /confirmacion/[orderId]
```

**4.3 Consideraciones**
- Guardar `mp_payment_id` y `mp_preference_id` en el pedido
- Manejar los 3 estados: `approved`, `pending`, `rejected`
- Sandbox para pruebas antes de activar producción
- Configurar IPN (notificación instantánea) en el dashboard de MercadoPago

---

### FASE 5 — Módulo de usuario (cliente)
> Permitir que los clientes tengan cuenta propia.

**5.1 Registro y login del cliente**
- Email + contraseña o Google OAuth
- Sin duplicar con los roles de admin

**5.2 Mi cuenta**
- `/cuenta/mis-pedidos` — historial con estados y tracking
- `/cuenta/mis-reservas` — reservas activas y pasadas
- `/cuenta/perfil` — nombre, email, teléfono, dirección guardada
- `/cuenta/favoritos` — productos guardados

**5.3 Ventajas de tener cuenta**
- Checkout más rápido (datos pre-llenados)
- Ver historial de compras
- Cancelar/reagendar citas directamente

---

### FASE 6 — Panel admin con roles reales

Actualmente el panel admin tiene toda la UI construida pero sin datos reales ni roles. Esta fase lo conecta todo.

**6.1 Rol Admin**
- Acceso completo a todos los módulos
- Gestión de usuarios y roles
- Configuración global (horarios, sede, precios envío)
- Reportes completos con exportación a Excel/CSV

**6.2 Rol Especialista**
- Solo ve su propio calendario
- Ve sus reservas del día/semana
- Puede marcar una cita como completada
- No accede a pedidos ni configuración

**6.3 Rol Pedidos**
- Ve y gestiona todos los pedidos
- Actualiza estado: pagado → empacado → enviado → entregado
- Ingresa número de guía
- No accede a reservas ni configuración

**6.4 Rol Atención al cliente**
- Ve conversaciones del chat (inbox)
- Responde desde el panel (integración WhatsApp Business API — futuro)
- Ve datos del cliente y sus pedidos/reservas
- No accede a configuración ni reportes financieros

---

## Paleta de colores oficial

La identidad visual de Shelie's se construye sobre esta paleta. Todos los componentes nuevos deben respetar estos tonos y sus combinaciones.

| Token | Hex | Nombre sugerido | Uso principal |
|-------|-----|-----------------|---------------|
| `blush-light` | `#FFF0F5` | Rosa blanco | Fondos de sección, cards en hover, backgrounds suaves |
| `blush` | `#FFCBE9` | Rosa pálido | Bordes sutiles, badges, chips de filtro inactivos |
| `rosa` | `#FF70BA` | Rosa vibrante | Botones secundarios, highlights, íconos activos, gradientes |
| `fucsia` | `#D93879` | Fucsia intenso | Color de acento principal, CTAs, precios, links activos |
| `vino` | `#5E0B2B` | Vino profundo | Color primario de marca, navbar, footers, botones principales |

### Combinaciones recomendadas

```
Fondo principal    →  #FFF0F5  (blush-light)
Texto sobre fondo  →  #5E0B2B  (vino)  o  #1a1a1a

Botón primario     →  bg #5E0B2B  · texto blanco
Botón secundario   →  bg #FF70BA  · texto #5E0B2B
Botón outline      →  borde #D93879  · texto #D93879

Cards              →  bg blanco  · borde #FFCBE9  · sombra vino muy suave
Badges / chips     →  bg #FFCBE9  · texto #5E0B2B
Precio / destacado →  texto #D93879  (fucsia)
Gradiente hero     →  from #FFF0F5  to #FFCBE9
Gradiente CTA      →  from #D93879  to #5E0B2B
```

### Colores complementarios que combinan

Estos tonos neutrales y dorados acompañan bien la paleta principal:

| Rol | Color | Uso |
|-----|-------|-----|
| Blanco puro | `#FFFFFF` | Fondos de cards, inputs |
| Gris texto | `#4A4A4A` | Cuerpo de texto |
| Gris suave | `#F5F5F5` | Separadores, fondos alternos |
| Dorado | `#C9A46A` | Detalles premium, estrellas de rating, iconos especiales |
| Negro suave | `#1A1A1A` | Títulos sobre fondos claros |

### Implementación en Tailwind

Actualizar `tailwind.config.ts` para incluir los nuevos tokens:

```ts
colors: {
  "blush-light": "#FFF0F5",
  "blush":       "#FFCBE9",
  "rosa":        "#FF70BA",
  "fucsia":      "#D93879",
  "vino":        "#5E0B2B",   // reemplaza el vino actual #8B3A4A
  "dorado":      "#C9A46A",
  "crema":       "#FAF7F4",   // mantener
  "carbon":      "#121212",   // mantener
  "humo":        "#6B6B6B",   // mantener
}
```

> ⚠️ El `vino` actual en el código es `#8B3A4A`. Reemplazarlo por `#5E0B2B` como parte de la actualización de UI.

---

## Consideraciones técnicas adicionales

### Seguridad
- Las credenciales hardcodeadas en `admin/layout.tsx` son un riesgo grave — migrar a NextAuth/Clerk en Fase 0
- El endpoint `/api/orders` no valida ni autentica — cualquiera puede crear pedidos falsos
- El webhook de MercadoPago debe validar la firma HMAC antes de procesar
- Usar `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor (nunca exponer al cliente)

### Imágenes y media
- Las imágenes actuales son páginas de PDF renderizadas — funcionan pero no son óptimas
- Para producción: subir fotos reales a Supabase Storage o Cloudinary
- Habilitar `next/image` con los dominios correctos en `next.config.js`
- Considerar WebP para mejor performance

### SEO
- Las páginas de producto no tienen metadata dinámica — agregar `generateMetadata()` en `tienda/[slug]/page.tsx`
- Agregar `sitemap.xml` y `robots.txt`
- Structured data (JSON-LD) para productos y servicios (Google Shopping)

### Performance
- El carrito usa React Context — si crece, migrar a Zustand
- La data de productos se importa directo en cliente — mover a Server Components + DB queries
- Lazy loading de imágenes del catálogo ya usa `next/image`, mantener esto

### Chatbot
- El RAG engine es 100% local (sin IA real) — funciona bien para FAQs cerradas
- Si se quiere respuestas más naturales: integrar Claude API con contexto del catálogo
- El endpoint `/api/chat` ya existe como placeholder para esto

### Dominio y despliegue
- Recomendado: Vercel (gratis para proyectos Next.js, CI/CD automático)
- Base de datos: Supabase (free tier incluye 500MB + 2GB bandwidth)
- Emails: Resend (free tier 3,000/mes)
- Medios: Supabase Storage o Cloudinary (free tier generoso)

---

## Orden de implementación recomendado

```
FASE 0 (Base de datos + Auth)     ← PRIMERO, todo depende de esto
  └─ FASE 1 (Catálogo real)       ← En paralelo o inmediatamente después
       └─ FASE 2 (Reservas)       ← Segundo módulo más importante
            └─ FASE 3 (Emails)    ← Sale natural de reservas + pedidos
                 └─ FASE 4 (MercadoPago)  ← Tienda lista para vender
                      └─ FASE 5 (Cuenta cliente)
                           └─ FASE 6 (Admin con roles reales)
```

---

## Resumen de trabajo por fase

| Fase | Descripción | Complejidad | Prioridad |
|------|-------------|-------------|-----------|
| 0 | DB + Auth + ENV | Alta | 🔴 Crítica |
| 1 | Catálogo real (fotos, videos) | Media | 🔴 Alta |
| 2 | Sistema de reservas | Alta | 🔴 Alta |
| 3 | Correos transaccionales | Media | 🟡 Media |
| 4 | MercadoPago | Alta | 🔴 Alta |
| 5 | Cuenta de cliente | Media | 🟡 Media |
| 6 | Admin roles reales | Alta | 🟡 Media |

---

---

## Historial de cambios

### Marzo 2026 — Sprint 3
- **Base de datos conectada**: PostgreSQL 16 en servidor ASF. Schema `shelies` en `evolutiondb` vía PgBouncer (puerto 6432). DB dedicada `bbdd_shelies` creada y pendiente de agregar a PgBouncer.
- **Tablas creadas**: `products`, `services`, `stylists`, `appointments`, `orders`, `clients`, `admin_users` con seed de datos iniciales.
- **API Routes**: `GET/POST /api/products`, `GET/POST /api/services`, `GET/POST /api/appointments`, `PATCH/DELETE` para productos y servicios. Verificado: 8 productos retornados correctamente.
- **Capa de datos**: `src/lib/db.ts` (Pool + helpers `query` / `queryOne`), `src/lib/db-products.ts`, `src/lib/db-services.ts`.
- **Variables de entorno**: `.env.local` creado con `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- **Admin responsive**: Sidebar se colapsa en móvil por defecto, se expande en desktop. Inbox con tabs móvil (Chats / Mensaje / Cliente).
- **Tienda**: Catálogo limpiado a 8 productos reales del PDF. Botox Capilar y Tratamiento Reparador Intensivo agregados.
- **Admin CRUD**: Páginas `admin/productos` y `admin/servicios` con CRUD completo (localStorage). `admin/catalogo` redirige a productos.
- **Servicios rediseñados**: Before/after slider, booking modal 5 pasos, calendario Mar–Sáb, elección de estilista, WhatsApp + Google Calendar + ICS.

### Febrero 2026 — Sprint 2
- Chatbot RAG funcional
- Panel admin UI completo (mock data)
- Carrito y checkout UI
- Política de privacidad y eliminación de datos

### Enero 2026 — Sprint 1
- Setup inicial Next.js 14 + Tailwind
- Tienda con filtros y detalle de producto
- Página de servicios v1

---

*Última actualización: 13 marzo 2026*
*Proyecto: Shelie's Siempre Bellas — spa-ecommerce Next.js 14 + PostgreSQL*
