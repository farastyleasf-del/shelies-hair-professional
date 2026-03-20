# WhatsApp Business API — Integración Shelies

## Arquitectura

```
Cliente WhatsApp
      │ mensaje entrante
      ▼
Meta Cloud API
      │ POST webhook
      ▼
backend/  →  /api/whatsapp/webhook   (recibe y guarda en DB)
      │
      │ admin responde en Inbox
      ▼
backend/  →  /api/whatsapp/send      (envía por Meta API)
      │
      ▼
Cliente WhatsApp  ← mensaje enviado
```

## Variables de entorno (backend/.env)

| Variable | Descripción | Dónde obtenerla |
|---|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Token permanente de Meta | Meta Business Manager → WhatsApp → API Setup |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número registrado | Misma pantalla de API Setup |
| `WHATSAPP_VERIFY_TOKEN` | Token que tú defines para verificar el webhook | Lo inventas tú, debe coincidir con el registrado en Meta |

## Configuración en Meta Business Manager

1. Ir a **Meta for Developers** → Tu App → **WhatsApp** → **Configuración**
2. En **Webhooks** hacer clic en **Editar**
3. Ingresar:
   - **URL del webhook**: `https://TU_DOMINIO/api/whatsapp/webhook`
   - **Token de verificación**: el valor de `WHATSAPP_VERIFY_TOKEN`
4. Hacer clic en **Verificar y guardar**
5. Suscribir el campo: **messages**

## Endpoints del backend

### `GET /api/whatsapp/webhook`
Meta llama esto para verificar que el webhook es tuyo.
Responde con el challenge si el token coincide.

### `POST /api/whatsapp/webhook`
Meta envía aquí cada mensaje entrante.
Guarda automáticamente en `shelies.wa_conversations` y `shelies.wa_messages`.

### `POST /api/whatsapp/send`
```json
{ "phone": "573001234567", "text": "Hola, ¿en qué te ayudo?", "agentName": "María" }
```
Envía un mensaje real por la API de Meta y lo guarda en DB como `outbound`.

### `GET /api/whatsapp/conversations`
Lista todas las conversaciones activas ordenadas por fecha.

### `GET /api/whatsapp/conversations?id=573001234567`
Retorna una conversación específica con todos sus mensajes.

### `PATCH /api/whatsapp/conversations`
```json
{ "id": "573001234567", "action": "read" }             // marcar como leído
{ "id": "573001234567", "action": "status", "status": "en_atencion" }
{ "id": "573001234567", "action": "assign", "assignedTo": "María" }
```

### `POST /api/whatsapp/test?force=true`
Inserta mensajes de prueba en DB (sin tocar Meta).
```json
{ "all": true }   // inserta 5 conversaciones demo
```

## Base de datos (PostgreSQL — schema shelies)

### `shelies.wa_conversations`
| Columna | Tipo | Descripción |
|---|---|---|
| id | VARCHAR(50) PK | Número de teléfono (wa_id) |
| contact_name | VARCHAR(255) | Nombre del contacto |
| contact_phone | VARCHAR(50) | Teléfono |
| status | VARCHAR(50) | nuevo / en_atencion / espera_cliente / cerrado |
| unread | INT | Mensajes sin leer |
| last_message | TEXT | Último mensaje |
| last_message_at | TIMESTAMPTZ | Fecha del último mensaje |
| assigned_to | VARCHAR(255) | Agente asignado |

### `shelies.wa_messages`
| Columna | Tipo | Descripción |
|---|---|---|
| id | VARCHAR(255) PK | ID del mensaje (Meta o generado) |
| conversation_id | VARCHAR(50) FK | Teléfono del contacto |
| direction | VARCHAR(20) | inbound / outbound |
| sender_name | VARCHAR(255) | Nombre de quien envió |
| text | TEXT | Contenido del mensaje |
| status | VARCHAR(50) | received / sent / delivered / read |
| wa_timestamp | BIGINT | Timestamp de Meta (epoch) |

## Reglas importantes de Meta (para no bajar el número)

1. **Ventana de 24h**: solo puedes enviar mensajes libres dentro de las 24h después de que el cliente escribió. Después debes usar Templates aprobados.
2. **No spam**: nunca envíes mensajes masivos no solicitados.
3. **Calidad del número**: Meta puntúa la calidad. Muchos bloqueos bajan la puntuación → pueden suspender el número.
4. **Templates**: para mensajes fuera de la ventana de 24h, ir a Meta Business Manager → WhatsApp → Message Templates.

## Flujo del Inbox admin

1. Admin va a `/admin/inbox`
2. Pestaña WhatsApp muestra conversaciones reales (polling cada 5s)
3. Al abrir una conversación se cargan los mensajes y se marca como leído
4. Admin escribe en el input y presiona Enviar → llama `POST /api/whatsapp/send`
5. El mensaje aparece inmediatamente (optimistic update) y se confirma desde DB

## Estructura de archivos

```
backend/
├── src/
│   ├── index.ts                    ← Express app principal
│   ├── routes/
│   │   ├── whatsapp.ts             ← Webhook + send + conversations + test
│   │   ├── appointments.ts         ← Citas
│   │   ├── adminUsers.ts           ← Usuarios del panel + auth
│   │   ├── services.ts             ← Servicios
│   │   └── products.ts             ← Productos
│   └── lib/
│       ├── db.ts                   ← Pool PostgreSQL
│       ├── whatsapp-db.ts          ← CRUD wa_conversations + wa_messages
│       ├── admin-users-db.ts       ← CRUD admin_users
│       ├── db-services.ts          ← Servicios DB
│       └── db-products.ts          ← Productos DB
├── .env                            ← Variables reales (NO subir a git)
├── .env.example                    ← Plantilla sin secretos
└── package.json

frontend/
├── src/
│   ├── app/
│   │   ├── admin/inbox/            ← Inbox con WhatsApp real
│   │   ├── admin/usuarios/         ← Gestión de agentes
│   │   └── admin/perfil/           ← Perfil del agente
│   └── lib/
│       └── api.ts                  ← Helper apiUrl() para apuntar al backend
├── .env.local                      ← NEXT_PUBLIC_API_URL=http://localhost:3001
└── package.json
```
