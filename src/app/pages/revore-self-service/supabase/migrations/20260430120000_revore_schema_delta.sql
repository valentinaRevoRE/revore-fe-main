-- ============================================================
-- MIGRATION: RevoRE Self-Service — Schema Delta
-- Aplica sobre: 20260430005902 + 20260430005933 (base de Lovable)
-- ============================================================

-- ── 1. developers: agregar columna script_arg ───────────────────────────────

ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS script_arg text NOT NULL DEFAULT '';

-- ── 2. report_types: renombrar `module` → `service` y ampliar check ─────────

-- Primero drop del check constraint auto-generado (nombre: tabla_columna_check)
ALTER TABLE public.report_types
  DROP CONSTRAINT IF EXISTS report_types_module_check;

-- Renombrar columna
ALTER TABLE public.report_types RENAME COLUMN module TO service;

-- Nuevo check con los 5 servicios (3 deshabilitados en UI, activos en BD)
ALTER TABLE public.report_types
  ADD CONSTRAINT report_types_service_check
  CHECK (service IN ('marketing','sales','estrategia','revenue_management','operaciones'));

-- ── 3. schedules: hacer next_run nullable (puede ser NULL cuando está pausado) ─

ALTER TABLE public.schedules
  ALTER COLUMN next_run DROP NOT NULL;

-- ── 4. Nueva tabla: developer_groups ────────────────────────────────────────
--
-- Almacena las sub-divisiones técnicas de developers que el backend Python
-- necesita para saber a qué script_arg llamar.
-- Actualmente solo GRUPO SAN CARLOS e Inverti tienen groups.

CREATE TABLE IF NOT EXISTS public.developer_groups (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id   uuid        NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  script_arg     text        NOT NULL,
  group_type     text        NOT NULL CHECK (group_type IN ('líder','proyecto')),
  display_order  integer     NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS developer_groups_developer_id_idx
  ON public.developer_groups(developer_id);

-- RLS
ALTER TABLE public.developer_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "developer_groups read"
  ON public.developer_groups FOR SELECT TO authenticated USING (true);

-- ── 5. schedules: agregar developer_group_id ────────────────────────────────

ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS developer_group_id uuid
  REFERENCES public.developer_groups(id) ON DELETE SET NULL;

-- ── 6. executions: agregar developer_group_id ───────────────────────────────

ALTER TABLE public.executions
  ADD COLUMN IF NOT EXISTS developer_group_id uuid
  REFERENCES public.developer_groups(id) ON DELETE SET NULL;
