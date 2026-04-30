-- ============================================================
-- MIGRATION: RevoRE Self-Service — Data Migration
-- Depende de: 20260430120000_revore_schema_delta.sql
--
-- OBJETIVO: Consolidar los 12 developers existentes (con duplicados)
-- en los 8 developers limpios que ve el usuario en la UI.
--
-- Antes (schema Lovable):          Después (schema final):
--   GrupoVEQ                    →    GrupoVEQ
--   Tare                        →    Tare
--   GRUPO SAN CARLOS 1          →    GRUPO SAN CARLOS  (+ groups)
--   GRUPO SAN CARLOS 2          →    (eliminado)
--   GRUPO SAN CARLOS 3          →    (eliminado)
--   Inverti_1                   →    Inverti           (+ groups)
--   Inverti_2                   →    (eliminado)
--   Inverti_3                   →    (eliminado)
--   Nova Habita                 →    Nova Habita
--   Gran ciudad                 →    Gran ciudad
--   OTACC                       →    OTACC
--   PROCSA-Data                 →    PROCSA-Data
-- ============================================================

-- ── 1. Actualizar script_arg para developers simples (1:1) ──────────────────

UPDATE public.developers SET script_arg = name
WHERE name IN ('GrupoVEQ','Tare','Nova Habita','Gran ciudad','OTACC','PROCSA-Data');

-- ── 2. Insertar developers consolidados ─────────────────────────────────────

-- GRUPO SAN CARLOS (script_arg placeholder; el backend usa developer_groups)
INSERT INTO public.developers (name, script_arg)
VALUES ('GRUPO SAN CARLOS','GRUPO SAN CARLOS 1')
ON CONFLICT (name) DO UPDATE SET script_arg = EXCLUDED.script_arg;

-- Inverti (script_arg placeholder; el backend usa developer_groups)
INSERT INTO public.developers (name, script_arg)
VALUES ('Inverti','Inverti_1')
ON CONFLICT (name) DO UPDATE SET script_arg = EXCLUDED.script_arg;

-- ── 3. Reasignar sub_projects de GRUPO SAN CARLOS ───────────────────────────
--
-- Los 3 developers originales tenían idénticas sub_proyectos (PANORAMA,
-- CELESTIA, PARQUES VALLARTA), por lo que existen 9 filas duplicadas.
-- Estrategia: conservar 1 set (las de GRUPO SAN CARLOS 1), eliminar el resto,
-- y reasignar al nuevo developer consolidado.

-- Borrar sub_projects duplicados (de GRUPO SAN CARLOS 2 y 3)
DELETE FROM public.sub_projects
WHERE developer_id IN (
  SELECT id FROM public.developers
  WHERE name IN ('GRUPO SAN CARLOS 2','GRUPO SAN CARLOS 3')
);

-- Reasignar sub_projects de GRUPO SAN CARLOS 1 al developer consolidado
UPDATE public.sub_projects
SET developer_id = (SELECT id FROM public.developers WHERE name = 'GRUPO SAN CARLOS')
WHERE developer_id = (SELECT id FROM public.developers WHERE name = 'GRUPO SAN CARLOS 1');

-- ── 4. Reasignar sub_projects de Inverti ────────────────────────────────────
--
-- Cada Inverti_X tenía 1 sub_project diferente, así que solo hay que
-- reasignar las 3 filas al developer consolidado.

UPDATE public.sub_projects
SET developer_id = (SELECT id FROM public.developers WHERE name = 'Inverti')
WHERE developer_id IN (
  SELECT id FROM public.developers
  WHERE name IN ('Inverti_1','Inverti_2','Inverti_3')
);

-- ── 5. Eliminar los developers duplicados ───────────────────────────────────
--
-- IMPORTANTE: ejecutar DESPUÉS de reasignar sub_projects y schedules/executions
-- para no violar FKs. En BD de desarrollo (solo seed, sin datos reales) es seguro.

DELETE FROM public.developers
WHERE name IN (
  'GRUPO SAN CARLOS 1','GRUPO SAN CARLOS 2','GRUPO SAN CARLOS 3',
  'Inverti_1','Inverti_2','Inverti_3'
);

-- ── 6. Seed developer_groups ────────────────────────────────────────────────

-- GRUPO SAN CARLOS → 3 líderes
INSERT INTO public.developer_groups (developer_id, name, script_arg, group_type, display_order)
SELECT
  d.id,
  g.name,
  g.script_arg,
  g.group_type::text,
  g.display_order::integer
FROM public.developers d
CROSS JOIN LATERAL (VALUES
  ('Líder 1', 'GRUPO SAN CARLOS 1', 'líder', 1),
  ('Líder 2', 'GRUPO SAN CARLOS 2', 'líder', 2),
  ('Líder 3', 'GRUPO SAN CARLOS 3', 'líder', 3)
) AS g(name, script_arg, group_type, display_order)
WHERE d.name = 'GRUPO SAN CARLOS';

-- Inverti → 3 proyectos
INSERT INTO public.developer_groups (developer_id, name, script_arg, group_type, display_order)
SELECT
  d.id,
  g.name,
  g.script_arg,
  g.group_type::text,
  g.display_order::integer
FROM public.developers d
CROSS JOIN LATERAL (VALUES
  ('ACORDIA',                 'Inverti_1', 'proyecto', 1),
  ('TORRE MÉDICA ACUEDUCTO',  'Inverti_2', 'proyecto', 2),
  ('XELOZIA',                 'Inverti_3', 'proyecto', 3)
) AS g(name, script_arg, group_type, display_order)
WHERE d.name = 'Inverti';

-- ── 7. Verificación post-migración ──────────────────────────────────────────
--
-- Ejecutar estas queries para confirmar que la migración quedó correcta:
--
--   SELECT name, script_arg FROM public.developers ORDER BY name;
--   -- Debe retornar 8 filas: GrupoVEQ, Gran ciudad, Grupo SAN CARLOS, Inverti,
--   --                         Nova Habita, OTACC, PROCSA-Data, Tare
--
--   SELECT d.name, g.name, g.script_arg, g.group_type
--   FROM public.developer_groups g
--   JOIN public.developers d ON d.id = g.developer_id
--   ORDER BY d.name, g.display_order;
--   -- Debe retornar 6 filas: 3 para GRUPO SAN CARLOS, 3 para Inverti
--
--   SELECT COUNT(*) FROM public.sub_projects;
--   -- Debe retornar 28 filas (3+3+3+3+2+4+2+4+2+2)
