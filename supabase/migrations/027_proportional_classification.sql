-- Legends Race Engine: alinha a persistência à fórmula proporcional oficial.
--
-- Pontos = 100 × (melhor tempo válido da categoria ÷ tempo válido do atleta)
--          × coeficiente da etapa

alter table public.stage_results
  alter column base_points type numeric(10,2) using round(base_points::numeric, 2),
  alter column base_points set default 0,
  alter column weighted_points type numeric(10,2) using round(weighted_points::numeric, 2),
  alter column weighted_points set default 0,
  alter column points_penalty type numeric(10,2) using round(points_penalty::numeric, 2),
  alter column points_penalty set default 0;

alter table public.stage_results
  add column if not exists scoring_formula_version text;

alter table public.stage_results
  alter column scoring_formula_version set default 'proportional_v1';

-- Corrige os coeficientes do evento oficial já criado pela migration 024.
-- Etapas publicadas permanecem intocadas para preservar resultados históricos.
update public.stages as stage
set
  classification_weight = case stage.stage_number
    when 1 then 1.15
    when 2 then 1.00
    when 3 then 1.20
    when 4 then 0.65
  end,
  updated_at = now()
from public.events as event
where stage.event_id = event.id
  and event.slug = 'legends-bike-race-2027'
  and stage.stage_number between 1 and 4
  and coalesce(stage.results_published, false) = false;

alter table public.stage_results
  drop constraint if exists stage_results_scoring_formula_version_check,
  add constraint stage_results_scoring_formula_version_check
    check (scoring_formula_version is null or scoring_formula_version = 'proportional_v1');

comment on column public.stage_results.base_points is
  'Pontuação proporcional antes do coeficiente da etapa, com base máxima de 100 pontos.';
comment on column public.stage_results.weighted_points is
  'Pontuação proporcional após coeficiente da etapa e eventual penalidade, com duas casas decimais.';
comment on column public.stage_results.scoring_formula_version is
  'Versão da fórmula usada no cálculo. Registros antigos permanecem nulos até novo recálculo.';
