# Open Wearables — Setup y Demo

Guia para levantar el backend de Open Wearables (OW) y verificar la integracion con Gohan AI.

---

## 1. Requisitos

- Docker Desktop instalado y corriendo
- Git (para clonar el repo de OW)
- curl (para probar los endpoints)

---

## 2. Clonar el repo de Open Wearables

El repo de OW se clona como hermano del proyecto principal:

```bash
cd ~/  # o la carpeta donde tengas platanus-hack-26-ar-team-16
git clone https://github.com/nicokant/open-wearables.git
```

La estructura queda:

```
~/
├── platanus-hack-26-ar-team-16/   # Gohan AI
└── open-wearables/                # Backend de wearables
```

---

## 3. Configurar el .env del backend

```bash
cd open-wearables
cp backend/config/.env.example backend/config/.env
```

Editar `backend/config/.env` y cambiar estas lineas:

```env
# Desactivar Sentry (no lo necesitamos)
SENTRY_ENABLED=False

# Poner un SECRET_KEY unico. Generar con:
# python3 -c "import secrets; print(secrets.token_urlsafe(64))"
SECRET_KEY=<GENERAR-SECRET-KEY>

# Credenciales del admin (se crea automaticamente al iniciar).
# No usar valores compartidos ni commitear la password real.
ADMIN_EMAIL=<ADMIN-EMAIL>
ADMIN_PASSWORD=<GENERAR-PASSWORD-UNICO>
```

El resto de variables (providers OAuth, AWS, etc.) se dejan como estan — no las necesitamos para la demo.

---

## 4. Levantar Docker

```bash
cd open-wearables
docker compose up -d --build
```

Esto levanta 8 servicios:

| Servicio | Puerto | Descripcion |
|----------|--------|-------------|
| backend (API) | 8000 | API REST principal |
| frontend | 3000 | Panel admin de OW (opcional) |
| postgres | 5432 | Base de datos |
| redis | 6379 | Cola de tareas |
| celery-worker | — | Procesamiento async de datos |
| celery-beat | — | Tareas programadas |
| flower | 5555 | Monitor de Celery (opcional) |
| svix-server | 8071 | Webhooks |

Verificar que todo esta corriendo:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Todos los contenedores deben mostrar "Up".

---

## 5. Obtener la API Key

La API Key se genera desde el panel admin de OW.

### Opcion A: Via UI (panel admin)

1. Abrir http://localhost:3000
2. Login con el `ADMIN_EMAIL` / `ADMIN_PASSWORD` generados en el paso 3
3. Ir a Settings > Credentials
4. Crear una nueva API Key
5. Copiar la key (empieza con `sk-...`)

### Opcion B: Via curl

```bash
OW_ADMIN_EMAIL="<ADMIN-EMAIL>"
OW_ADMIN_PASSWORD="<ADMIN-PASSWORD>"

# 1. Obtener token de admin
TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "username=$OW_ADMIN_EMAIL" \
  --data-urlencode "password=$OW_ADMIN_PASSWORD" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "Token: $TOKEN"

# 2. Crear API Key
curl -s -X POST "http://localhost:8000/api/v1/api-keys" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "gohan-demo"}' | python3 -m json.tool
```

---

## 6. Configurar Gohan AI

La app de Gohan AI no debe recibir credenciales admin de Open Wearables en variables `EXPO_PUBLIC_*`.
Hasta que exista `ow-bridge`, la sincronizacion debe hacerse solo por scripts locales o por un backend de confianza.

```env
EXPO_PUBLIC_OW_HOST=http://localhost:8000
```

> **Android emulator**: la app reemplaza automaticamente `localhost` por `10.0.2.2` para que el emulador pueda alcanzar la maquina host.

---

## 7. Como funciona la integracion

### Flujo "Conectar Reloj"

1. El usuario aprieta "Conectar Reloj" en la tab Mas
2. La app debe llamar a un backend propio (`ow-bridge`) autenticado con el JWT del usuario
3. El backend obtiene el token admin de OW desde secrets server-side
4. El backend crea o busca el usuario OW y persiste el vinculo `profile_id <-> ow_user_id`
5. A partir de ahi la app consulta datos de salud pasando por ese backend

### Endpoints que debe usar el backend

| Endpoint | Uso |
|----------|-----|
| `POST /api/v1/auth/login` | Obtener token admin |
| `GET /api/v1/users` | Listar usuarios OW |
| `POST /api/v1/users` | Crear usuario OW |
| `POST /api/v1/sdk/users/{id}/sync` | Pushear datos de salud |
| `GET /api/v1/users/{id}/summaries/activity?start_date=X&end_date=Y` | Consultar actividad |
| `GET /api/v1/users/{id}/summaries/sleep?start_date=X&end_date=Y` | Consultar sueno |
| `GET /api/v1/users/{id}/events/workouts?start_date=X&end_date=Y` | Consultar workouts |
| `GET /api/v1/users/{id}/summaries/data` | Resumen general de datos |

---

## 8. Simular datos de un reloj (sin dispositivo fisico)

Como no tenemos Apple Watch/Galaxy Watch para la demo, pusheamos datos simulados via curl.

### Paso 1: Obtener el user ID de OW

```bash
OW_ADMIN_EMAIL="<ADMIN-EMAIL>"
OW_ADMIN_PASSWORD="<ADMIN-PASSWORD>"

TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "username=$OW_ADMIN_EMAIL" \
  --data-urlencode "password=$OW_ADMIN_PASSWORD" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Listar usuarios — buscar el ID del usuario de Gohan
curl -s "http://localhost:8000/api/v1/users" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Copiar el `id` del usuario (UUID). Usarlo en los siguientes comandos como `$OW_USER_ID`.

### Paso 2: Pushear datos simulados

Reemplazar `$OW_USER_ID` y `$API_KEY` con los valores reales:

```bash
OW_USER_ID="PONER-UUID-ACA"
API_KEY="sk-PONER-API-KEY-ACA"

curl -s -X POST "http://localhost:8000/api/v1/sdk/users/$OW_USER_ID/sync" \
  -H "X-Open-Wearables-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "provider": "apple",
  "sdkVersion": "1.0.0",
  "syncTimestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
  "data": {
    "records": [
      {
        "id": "sim-steps-001",
        "type": "STEP_COUNT",
        "value": 8432,
        "unit": "count",
        "startDate": "'$(date -u -d "today 06:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT06:00:00Z)'",
        "endDate": "'$(date -u -d "today 22:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT22:00:00Z)'",
        "source": {"appId": "com.apple.health", "deviceManufacturer": "Apple", "deviceModel": "Watch7", "deviceName": "Apple Watch", "deviceType": "watch"}
      },
      {
        "id": "sim-hr-001",
        "type": "HEART_RATE",
        "value": 72,
        "unit": "bpm",
        "startDate": "'$(date -u -d "today 08:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT08:00:00Z)'",
        "endDate": "'$(date -u -d "today 08:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT08:00:00Z)'",
        "source": {"appId": "com.apple.health", "deviceManufacturer": "Apple", "deviceModel": "Watch7", "deviceName": "Apple Watch", "deviceType": "watch"}
      },
      {
        "id": "sim-hr-002",
        "type": "HEART_RATE",
        "value": 145,
        "unit": "bpm",
        "startDate": "'$(date -u -d "today 18:30" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT18:30:00Z)'",
        "endDate": "'$(date -u -d "today 18:30" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT18:30:00Z)'",
        "source": {"appId": "com.apple.health", "deviceManufacturer": "Apple", "deviceModel": "Watch7", "deviceName": "Apple Watch", "deviceType": "watch"}
      },
      {
        "id": "sim-rhr-001",
        "type": "RESTING_HEART_RATE",
        "value": 58,
        "unit": "bpm",
        "startDate": "'$(date -u -d "today 06:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT06:00:00Z)'",
        "endDate": "'$(date -u -d "today 06:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT06:00:00Z)'",
        "source": {"appId": "com.apple.health", "deviceManufacturer": "Apple", "deviceModel": "Watch7", "deviceName": "Apple Watch", "deviceType": "watch"}
      },
      {
        "id": "sim-cal-001",
        "type": "ACTIVE_CALORIES_BURNED",
        "value": 487,
        "unit": "kcal",
        "startDate": "'$(date -u -d "today 06:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT06:00:00Z)'",
        "endDate": "'$(date -u -d "today 22:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT22:00:00Z)'",
        "source": {"appId": "com.apple.health", "deviceManufacturer": "Apple", "deviceModel": "Watch7", "deviceName": "Apple Watch", "deviceType": "watch"}
      },
      {
        "id": "sim-dist-001",
        "type": "DISTANCE",
        "value": 6200,
        "unit": "m",
        "startDate": "'$(date -u -d "today 06:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT06:00:00Z)'",
        "endDate": "'$(date -u -d "today 22:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT22:00:00Z)'",
        "source": {"appId": "com.apple.health", "deviceManufacturer": "Apple", "deviceModel": "Watch7", "deviceName": "Apple Watch", "deviceType": "watch"}
      }
    ],
    "sleep": [
      {
        "id": "sim-sleep-deep-001",
        "parentId": "sim-sleep-session-001",
        "stage": "deep",
        "startDate": "'$(date -u -d "yesterday 23:30" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT23:30:00Z)'",
        "endDate": "'$(date -u -d "today 01:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT01:00:00Z)'",
        "source": {"appId": "com.apple.health", "deviceManufacturer": "Apple", "deviceModel": "Watch7", "deviceName": "Apple Watch", "deviceType": "watch"}
      },
      {
        "id": "sim-sleep-rem-001",
        "parentId": "sim-sleep-session-001",
        "stage": "rem",
        "startDate": "'$(date -u -d "today 01:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT01:00:00Z)'",
        "endDate": "'$(date -u -d "today 02:30" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT02:30:00Z)'",
        "source": {"appId": "com.apple.health", "deviceManufacturer": "Apple", "deviceModel": "Watch7", "deviceName": "Apple Watch", "deviceType": "watch"}
      },
      {
        "id": "sim-sleep-light-001",
        "parentId": "sim-sleep-session-001",
        "stage": "light",
        "startDate": "'$(date -u -d "today 02:30" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT02:30:00Z)'",
        "endDate": "'$(date -u -d "today 05:30" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT05:30:00Z)'",
        "source": {"appId": "com.apple.health", "deviceManufacturer": "Apple", "deviceModel": "Watch7", "deviceName": "Apple Watch", "deviceType": "watch"}
      },
      {
        "id": "sim-sleep-rem-002",
        "parentId": "sim-sleep-session-001",
        "stage": "rem",
        "startDate": "'$(date -u -d "today 05:30" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT05:30:00Z)'",
        "endDate": "'$(date -u -d "today 06:30" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT06:30:00Z)'",
        "source": {"appId": "com.apple.health", "deviceManufacturer": "Apple", "deviceModel": "Watch7", "deviceName": "Apple Watch", "deviceType": "watch"}
      }
    ],
    "workouts": [
      {
        "id": "sim-workout-001",
        "type": "strength_training",
        "startDate": "'$(date -u -d "today 17:00" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT17:00:00Z)'",
        "endDate": "'$(date -u -d "today 18:15" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT18:15:00Z)'",
        "title": "Fuerza - Tren Superior",
        "source": {"appId": "com.apple.health", "deviceManufacturer": "Apple", "deviceModel": "Watch7", "deviceName": "Apple Watch", "deviceType": "watch"},
        "statistics": [
          {"type": "ACTIVE_CALORIES_BURNED", "value": 380, "unit": "kcal"},
          {"type": "HEART_RATE", "value": 128, "unit": "bpm"}
        ]
      }
    ]
  }
}'
```

Respuesta exitosa: `{"status_code": 202, "response": "Import task queued successfully", ...}`

Los datos se procesan de forma asincrona via Celery. Tardan 1-2 segundos.

### Paso 3: Verificar que los datos se guardaron

```bash
OW_ADMIN_EMAIL="<ADMIN-EMAIL>"
OW_ADMIN_PASSWORD="<ADMIN-PASSWORD>"

TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "username=$OW_ADMIN_EMAIL" \
  --data-urlencode "password=$OW_ADMIN_PASSWORD" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

OW_USER_ID="PONER-UUID-ACA"
TODAY=$(date +%Y-%m-%d)
TOMORROW=$(date -d "+1 day" +%Y-%m-%d 2>/dev/null || date -v+1d +%Y-%m-%d)

echo "=== Resumen general ==="
curl -s "http://localhost:8000/api/v1/users/$OW_USER_ID/summaries/data" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== Actividad de hoy ==="
curl -s "http://localhost:8000/api/v1/users/$OW_USER_ID/summaries/activity?start_date=$TODAY&end_date=$TOMORROW" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== Sueno ==="
curl -s "http://localhost:8000/api/v1/users/$OW_USER_ID/summaries/sleep?start_date=$TODAY&end_date=$TOMORROW" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== Workouts ==="
curl -s "http://localhost:8000/api/v1/users/$OW_USER_ID/events/workouts?start_date=$TODAY&end_date=$TOMORROW" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Datos que deberias ver

**Actividad:**
- 8,432 pasos
- 6,200m de distancia
- 487 kcal activas
- HR: avg 108, max 145, min 72 bpm

**Sueno (7 horas):**
- Deep: 90 min
- REM: 150 min
- Light: 180 min
- Eficiencia: 100%

**Workout:**
- strength_training, 75 min (17:00 a 18:15)

---

## 9. Tipos de metricas soportados

### Records (metricas de salud)

Los tipos mas comunes para la demo:

| Tipo | Unidad | Descripcion |
|------|--------|-------------|
| `STEP_COUNT` | count | Pasos |
| `HEART_RATE` | bpm | Frecuencia cardiaca |
| `RESTING_HEART_RATE` | bpm | FC en reposo |
| `ACTIVE_CALORIES_BURNED` | kcal | Calorias activas |
| `DISTANCE` | m | Distancia recorrida |
| `WEIGHT` | kg | Peso corporal |
| `BODY_FAT` | % | Porcentaje de grasa |
| `VO2_MAX` | mL/kg/min | VO2 maximo |
| `OXYGEN_SATURATION` | % | SpO2 |

### Fases de sueno

| Fase | Descripcion |
|------|-------------|
| `deep` | Sueno profundo |
| `rem` | Sueno REM |
| `light` | Sueno liviano |
| `awake` | Despierto |
| `in_bed` | En cama (sin dormir) |

### Tipos de workout

| Tipo | Descripcion |
|------|-------------|
| `strength_training` | Pesas / fuerza |
| `running` | Correr |
| `cycling` | Bicicleta |
| `swimming` | Natacion |
| `hiit` | HIIT |
| `yoga` | Yoga |
| `walking` | Caminar |
| `other` | Otro |

### Providers soportados

| Provider | Uso |
|----------|-----|
| `apple` | Apple Watch / HealthKit |
| `google` | Google Health Connect |
| `samsung` | Samsung Health / Galaxy Watch |

---

## 10. Schema del sync request

```json
{
  "provider": "apple",
  "sdkVersion": "1.0.0",
  "syncTimestamp": "2026-05-10T00:00:00Z",
  "data": {
    "records": [
      {
        "id": "unique-id",
        "type": "STEP_COUNT",
        "value": 8432,
        "unit": "count",
        "startDate": "2026-05-09T06:00:00Z",
        "endDate": "2026-05-09T22:00:00Z",
        "source": {
          "appId": "com.apple.health",
          "deviceManufacturer": "Apple",
          "deviceModel": "Watch7",
          "deviceName": "Apple Watch",
          "deviceType": "watch"
        }
      }
    ],
    "sleep": [
      {
        "id": "unique-id",
        "parentId": "session-id",
        "stage": "deep",
        "startDate": "2026-05-08T23:30:00Z",
        "endDate": "2026-05-09T01:00:00Z",
        "source": { "..." : "..." }
      }
    ],
    "workouts": [
      {
        "id": "unique-id",
        "type": "strength_training",
        "startDate": "2026-05-09T17:00:00Z",
        "endDate": "2026-05-09T18:15:00Z",
        "title": "Nombre del workout",
        "source": { "..." : "..." },
        "statistics": [
          {"type": "ACTIVE_CALORIES_BURNED", "value": 380, "unit": "kcal"}
        ]
      }
    ]
  }
}
```

Campos requeridos del request raiz: `provider`, `sdkVersion`, `syncTimestamp`.
Todo dentro de `data` es opcional — podes mandar solo records, solo sleep, solo workouts, o cualquier combinacion.

---

## 11. Troubleshooting

### "Field required" al consultar summaries
Los endpoints de summaries necesitan `start_date` y `end_date` como query params. No usar `?date=`.

### records_saved: 0 en sync run
El evento `apple_batch_processing_complete` reporta 0, pero es un bug del reporte. Verificar con el evento `apple_sdk_import_complete` que muestra el conteo real, o consultar `/summaries/data`.

### Docker no levanta
- Verificar que Docker Desktop este corriendo
- Verificar que los puertos 8000, 5432, 6379 no esten ocupados
- Si falla postgres: `docker compose down -v` y volver a levantar (esto borra los datos)

### IDs duplicados al re-pushear
Si se pushea con los mismos `id` de records, el backend los ignora (idempotente). Para pushear datos nuevos, cambiar los IDs.

### La app en Android no conecta
Verificar que OW_HOST sea `http://localhost:8000` en `.env.local`. La app reemplaza automaticamente `localhost` por `10.0.2.2` para el emulador de Android.
