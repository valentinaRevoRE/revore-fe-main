# RevoRE Self-Service

Herramienta interna para el equipo de RevoRE que permite generar reportes PPTX
on-demand y programar envíos automáticos.

---

## Arquitectura

```
Frontend Angular (este módulo)
  → Inserta filas en Supabase tabla `executions` con status='queued'
  → Hace polling de la fila para mostrar progreso
  → [TODO BACKEND] Descarga el PPTX desde el endpoint Python

Backend Python (Fly.io — repositorio separado, aún no existe)
  → Worker hace polling de Supabase cada 5 seg
  → Procesa queued: genera PPTX, llama Claude API, envía correo con Resend
  → Actualiza status en Supabase
  → Sirve endpoint de descarga del PPTX
```

---

## Variables de entorno

Las variables ya están configuradas en `src/environments/`:

| Variable | Descripción |
|---|---|
| `supabase.url` | URL del proyecto Supabase |
| `supabase.anonKey` | Anon key pública de Supabase (segura para commit) |
| `revore.allowedDomain` | Dominio permitido para acceso (`revore.mx`) |
| `revore.backendUrl` | URL del backend Python (placeholder hasta que exista) |

> **Nota:** La `anonKey` es la clave pública de Supabase. Está diseñada para ser
> incluida en el frontend. La seguridad real la proveen las políticas RLS de Supabase.

---

## Supabase — Cómo aplicar las migrations

El repo Angular no usa Supabase CLI directamente. Las migrations están en:

```
src/app/pages/revore-self-service/supabase/migrations/
```

### Opción A — Dashboard de Supabase (recomendada para desarrollo)

1. Entrar a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Seleccionar el proyecto `vzzrmuubkyrlmicsfzbe`
3. Ir a **SQL Editor**
4. Ejecutar los archivos en orden:
   - `20260430005902_58759f1a-18d1-4340-9751-a7eb769a954d.sql` ← base (ya aplicado)
   - `20260430005933_976d270d-bc23-411a-ae2d-fa2afcdda295.sql` ← seed base (ya aplicado)
   - `20260430120000_revore_schema_delta.sql` ← **aplicar este**
   - `20260430120001_revore_data_migration.sql` ← **aplicar este**

> Los dos primeros están en `.reference/lovable-reference/supabase/migrations/`

### Opción B — Supabase CLI

```bash
# Desde la raíz del repo
npx supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.vzzrmuubkyrlmicsfzbe.supabase.co:5432/postgres"
```

### Verificación post-aplicación

Ejecutar en el SQL Editor para confirmar:

```sql
-- 8 developers limpios
SELECT name, script_arg FROM public.developers ORDER BY name;

-- 6 developer_groups (3 GRUPO SAN CARLOS + 3 Inverti)
SELECT d.name as developer, g.name as grupo, g.script_arg, g.group_type
FROM public.developer_groups g
JOIN public.developers d ON d.id = g.developer_id
ORDER BY d.name, g.display_order;

-- report_types con columna service (no module)
SELECT service, name FROM public.report_types;

-- Columnas nuevas en executions y schedules
SELECT column_name FROM information_schema.columns
WHERE table_name IN ('executions','schedules')
  AND column_name = 'developer_group_id';
```

---

## Schema final de tablas

### `users`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | FK → auth.users |
| email | text unique | |
| full_name | text | |
| avatar_url | text | |
| role | text | default 'user' |
| last_login | timestamptz | |
| created_at | timestamptz | |

### `developers`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| name | text unique | Nombre visible en UI |
| script_arg | text | Argumento técnico para el backend Python |
| active | boolean | default true |
| created_at | timestamptz | |

### `developer_groups`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| developer_id | uuid FK | → developers |
| name | text | Nombre visible en UI |
| script_arg | text | Argumento técnico para el backend |
| group_type | text | `'líder'` o `'proyecto'` |
| display_order | integer | Orden en el select del wizard |
| created_at | timestamptz | |

> Solo GRUPO SAN CARLOS e Inverti tienen groups.
> El frontend muestra el select de grupo solo si el developer tiene groups.

### `sub_projects`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| developer_id | uuid FK | → developers |
| name | text | |
| created_at | timestamptz | |

### `report_types`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| service | text | `marketing`, `sales`, `estrategia`, `revenue_management`, `operaciones` |
| name | text | |
| description | text | |
| created_at | timestamptz | |

### `schedules`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| developer_id | uuid FK | |
| sub_project_id | uuid FK nullable | |
| developer_group_id | uuid FK nullable | → developer_groups |
| report_type_id | uuid FK | |
| frequency | text | `weekly` o `monthly` |
| day_of_week | integer | 0–6 (para weekly) |
| day_of_month | integer | 1–28 (para monthly) |
| hour | integer | 0–23 |
| timezone | text | default `America/Mexico_City` |
| start_date | date | |
| end_date | date nullable | NULL = sin fecha de fin |
| recipients | jsonb | array de emails |
| active | boolean | |
| next_run | timestamptz nullable | |
| created_by | uuid FK | → users |
| created_at | timestamptz | |

### `executions`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| schedule_id | uuid FK nullable | NULL si es manual |
| developer_id | uuid FK | |
| sub_project_id | uuid FK nullable | |
| developer_group_id | uuid FK nullable | → developer_groups |
| report_type_id | uuid FK | |
| triggered_by | text | `manual` o `scheduled` |
| triggered_by_user | uuid FK nullable | → users |
| recipients | jsonb | array de emails |
| status | text | `queued` → `generating` → `enriching` → `sending` → `completed` / `failed` |
| file_url | text nullable | URL del PPTX generado |
| error_message | text nullable | |
| date_range_start | date nullable | |
| date_range_end | date nullable | |
| created_at | timestamptz | |
| completed_at | timestamptz nullable | |

---

## Lógica de developers consolidados

```
UI muestra:           Backend Python recibe (script_arg):
─────────────────     ──────────────────────────────────
GRUPO SAN CARLOS  →   developer_groups.script_arg
  └ Líder 1       →     "GRUPO SAN CARLOS 1"
  └ Líder 2       →     "GRUPO SAN CARLOS 2"
  └ Líder 3       →     "GRUPO SAN CARLOS 3"

Inverti           →   developer_groups.script_arg
  └ ACORDIA       →     "Inverti_1"
  └ TORRE MÉDICA  →     "Inverti_2"
  └ XELOZIA       →     "Inverti_3"

GrupoVEQ          →   developers.script_arg = "GrupoVEQ"
Tare              →   developers.script_arg = "Tare"
(demás)           →   developers.script_arg = name (1:1)
```

El frontend guarda `developer_id` + `developer_group_id` (nullable) en
`executions` y `schedules`. El backend Python lee esos IDs y hace la
traducción a `script_arg` por su cuenta.

---

## Cómo agregar el acceso al módulo en el menú global

El acceso a `/revore` está disponible por URL directa. Cuando el equipo apruebe
integrarlo al menú principal de `revo-fe`, agregar en el componente del menú
privado (`src/app/pages/private/shared/components/menu/`):

```html
<a routerLink="/revore" routerLinkActive="active">
  RevoRE Self-Service
</a>
```

---

## Fases de desarrollo

| Fase | Estado | Descripción |
|---|---|---|
| 1 — Setup | ✅ | @supabase/supabase-js, environments, SupabaseService, types, módulo base |
| 2 — Migrations | ✅ | SQL delta: script_arg, service rename, developer_groups |
| 3 — Auth | ⏳ | Botón Google en login, callback, RevoreAuthGuard, access-denied |
| 4 — Layout | ⏳ | Sidebar + header internos del módulo |
| 5 — Pantallas | ⏳ | Dashboard, Generar (wizard), Programaciones, Historial |
| 6 — Polishing | ⏳ | Empty states, loading, error handling, responsive |
