-- Helpers per ruoli (adatta alla tua auth)
create or replace function auth.team_id() returns text
language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb->>'teamId','');
$$;

create or replace function auth.has_any_role(check_roles text[]) returns boolean
language sql stable as $$
  with roles as (
    select coalesce(current_setting('request.jwt.claims', true)::jsonb->'roles','[]'::jsonb) as arr
  )
  select exists (
    select 1 from roles, jsonb_array_elements_text(arr) r(role)
    where r.role = any(check_roles)
  );
$$;

create or replace function auth.is_medical() returns boolean
language sql stable as $$ select auth.has_any_role(array['MEDICAL_ADMIN','DOCTOR','PHYSIO','NUTRITIONIST']); $$;

create or replace function auth.is_staff_safe() returns boolean
language sql stable as $$ select auth.has_any_role(array['ADMIN','DIRECTOR_SPORT','HEAD_COACH','ASSISTANT_COACH','TEAM_MANAGER','STAFF_BASE']); $$;

do $$
declare t text;
begin
  for t in
    select tablename from pg_tables where schemaname='public' and tablename in (
      'GDPRConfiguration','DataProcessingAgreement',
      'MedicalVault','MedicalVaultAccess',
      'MedicalConsent',
      'MedicalCase','MedicalDiagnosis','MedicalExamination','MedicalTreatment','MedicalDocument',
      'MedicalAccessLog','DataBreachRegister','GDPRRequest',
      'AnonymizedMedicalData','DataRetentionPolicy',
      'PlayerHealthProfile'
    )
  loop
    execute format('alter table public.%I enable row level security;', t);

    if t <> 'AnonymizedMedicalData' then
      execute format($pol$
        drop policy if exists %I_med_sel on public.%I;
        create policy %I_med_sel on public.%I
        for select using (auth.is_medical() and teamId::text = auth.team_id());
      $pol$, t, t, t, t);
    else
      execute format($pol$
        drop policy if exists %I_an_sel on public.%I;
        create policy %I_an_sel on public.%I
        for select using (teamId::text = auth.team_id() and (auth.is_medical() or auth.is_staff_safe()));
      $pol$, t, t, t, t);
    end if;

    execute format($pol$
      drop policy if exists %I_med_mod on public.%I;
      create policy %I_med_mod on public.%I
      for all using (auth.is_medical() and teamId::text = auth.team_id())
      with check (auth.is_medical() and teamId::text = auth.team_id());
    $pol$, t, t, t, t);
  end loop;
end$$;


