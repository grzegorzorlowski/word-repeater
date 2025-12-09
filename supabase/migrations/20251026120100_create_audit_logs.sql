-- migration: create_audit_logs
-- purpose: create the audit_logs table for tracking user actions and system events
-- affected tables: audit_logs
-- special considerations:
--   - designed for time-series data with occurred_at timestamp
--   - user_id is nullable to support system-level actions
--   - prepared for future time-based partitioning (monthly)
--   - implements basic rls for authenticated users to view their own logs

-- create audit_logs table
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  occurred_at timestamptz not null default now()
);

-- add comments to table and columns
comment on table public.audit_logs is 'audit trail for user actions and system events';
comment on column public.audit_logs.id is 'unique identifier for the audit log entry';
comment on column public.audit_logs.user_id is 'references the user who triggered the action (null for system actions)';
comment on column public.audit_logs.action is 'description of the action that was logged';
comment on column public.audit_logs.occurred_at is 'timestamp when the action occurred (utc), used for partitioning';

-- create index on occurred_at for time-based queries and future partitioning
create index idx_audit_logs_occurred_at on public.audit_logs(occurred_at);

-- create index on user_id for filtering by user
create index idx_audit_logs_user_id on public.audit_logs(user_id) where user_id is not null;

-- create composite index for user-specific timeline queries
create index idx_audit_logs_user_occurred on public.audit_logs(user_id, occurred_at) where user_id is not null;

-- enable row level security
alter table public.audit_logs enable row level security;

-- rls policy: allow authenticated users to select their own audit logs
-- rationale: users should be able to view their own activity history
create policy "authenticated users can select own audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: allow service role to insert audit logs
-- rationale: audit logs should be created by the application/system, not directly by users
-- note: service_role bypasses rls by default, but this policy documents the intent
create policy "service role can insert audit logs"
  on public.audit_logs
  for insert
  to service_role
  with check (true);

-- rls policy: prevent users from updating audit logs
-- rationale: audit logs should be immutable for integrity
-- note: no update policy means no one can update (except service_role which bypasses rls)

-- rls policy: prevent users from deleting audit logs
-- rationale: audit logs should be permanent for compliance and auditing
-- note: no delete policy means no one can delete (except service_role which bypasses rls)

-- future enhancement: implement table partitioning
-- uncomment and modify when audit log volume grows significantly:
-- 
-- create table public.audit_logs_y2025m10 partition of public.audit_logs
--   for values from ('2025-10-01') to ('2025-11-01');
-- 
-- create table public.audit_logs_y2025m11 partition of public.audit_logs
--   for values from ('2025-11-01') to ('2025-12-01');
-- 
-- note: requires converting audit_logs to a partitioned table first:
-- alter table public.audit_logs partition by range (occurred_at);

