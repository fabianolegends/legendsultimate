-- Regras configuráveis do Race Engine por etapa.
-- Mantém os valores atuais como padrão para etapas existentes.

alter table public.stages
  add column if not exists route_tolerance_m integer not null default 120,
  add column if not exists auto_validate_max_off_route_percent numeric(5,2) not null default 5.00,
  add column if not exists review_max_off_route_percent numeric(5,2) not null default 20.00,
  add column if not exists max_continuous_off_route_km numeric(7,3) not null default 1.500,
  add column if not exists auto_validate_min_checkpoint_ratio numeric(5,4) not null default 0.9500,
  add column if not exists review_min_checkpoint_ratio numeric(5,4) not null default 0.8000;

alter table public.stages
  drop constraint if exists stages_route_tolerance_m_check,
  add constraint stages_route_tolerance_m_check check (route_tolerance_m between 20 and 500),
  drop constraint if exists stages_auto_validate_min_coverage_check,
  add constraint stages_auto_validate_min_coverage_check check (auto_validate_min_coverage between 0 and 100),
  drop constraint if exists stages_review_min_coverage_check,
  add constraint stages_review_min_coverage_check check (review_min_coverage between 0 and 100),
  drop constraint if exists stages_auto_max_off_route_check,
  add constraint stages_auto_max_off_route_check check (auto_validate_max_off_route_percent between 0 and 100),
  drop constraint if exists stages_review_max_off_route_check,
  add constraint stages_review_max_off_route_check check (review_max_off_route_percent between 0 and 100),
  drop constraint if exists stages_max_continuous_off_route_check,
  add constraint stages_max_continuous_off_route_check check (max_continuous_off_route_km between 0.1 and 50),
  drop constraint if exists stages_auto_checkpoint_ratio_check,
  add constraint stages_auto_checkpoint_ratio_check check (auto_validate_min_checkpoint_ratio between 0 and 1),
  drop constraint if exists stages_review_checkpoint_ratio_check,
  add constraint stages_review_checkpoint_ratio_check check (review_min_checkpoint_ratio between 0 and 1);
