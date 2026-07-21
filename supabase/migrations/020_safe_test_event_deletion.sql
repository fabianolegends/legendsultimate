-- Legends Core
-- Migration 020: allow safe deletion of test events without mutating immutable audit history.
--
-- Audit and backup rows intentionally retain the deleted event UUID as historical evidence.
-- A foreign key with ON DELETE SET NULL would update those immutable rows and is therefore
-- incompatible with the prevent_admin_audit_mutation trigger.

alter table if exists public.admin_operation_audit
  drop constraint if exists admin_operation_audit_event_id_fkey;

alter table if exists public.backup_exports
  drop constraint if exists backup_exports_event_id_fkey;

comment on column public.admin_operation_audit.event_id is
  'Historical event UUID. Deliberately not a foreign key so immutable audit rows survive test-event deletion unchanged.';

comment on column public.backup_exports.event_id is
  'Historical event UUID. Deliberately not a foreign key so backup records survive test-event deletion unchanged.';
