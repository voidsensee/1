-- Postgres 15 / Supabase. penta spoof: юзеры+HWID, ключи 24 симв, активации, загрузки, конфиг, RLS.
-- Запуск: Supabase Dashboard -> SQL Editor -> вставить целиком -> Run.

-- ---------------------------------------------------------------- tables ----
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  hwid          text,
  hwid_bound_at timestamptz,
  hwid_resets   int not null default 0,
  role          text not null default 'user',      -- 'user' | 'admin'
  banned        boolean not null default false,
  ban_reason    text,
  plan          text not null default 'trial',     -- trial | lifetime | monthly
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  last_login    timestamptz
);

create table if not exists public.keys (
  id            uuid primary key default gen_random_uuid(),
  key           text unique not null,              -- 24 символа, A-Z0-9
  plan          text not null default 'trial',
  duration_days int  not null default 1,
  max_hwid_binds int not null default 1,
  used_by       uuid references public.profiles(id) on delete set null,
  used_at       timestamptz,
  bound_hwid    text,
  revoked       boolean not null default false,
  note          text,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table if not exists public.key_events (
  id         bigserial primary key,
  key_id     uuid references public.keys(id) on delete cascade,
  kind       text not null,        -- created | activated | revoked | hwid_reset
  detail     text,
  actor      uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.downloads (
  id         bigserial primary key,
  user_id    uuid references public.profiles(id) on delete cascade,
  version    text,
  hwid       text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.app_config (
  key   text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------- helpers -----
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function public.has_active_access()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.banned = false
      and (p.expires_at is null or p.expires_at > now())
  );
$$;

-- генератор ключа: 24 символа из A-Z0-9 (без похожих O/0/I/1 по флагу safe=true)
create or replace function public.gen_key(safe boolean default true)
returns text language sql volatile as $$
  select string_agg(substring(
    case when safe then 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
         else 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' end
    from floor(random() * (case when safe then 32 else 36 end) + 1)::int for 1), '')
  from generate_series(1, 24);
$$;

-- ------------------------------------------------------ auth -> profile ----
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------ активация 24-сим ключа ---
-- Атомарно: ключ не revoken, не использован (или тот же юзер + свободный слот бинда),
-- HWID пишется при первом входе, срок лицензии продлевается от max(now, expires_at).
create or replace function public.activate_key(p_key text, p_hwid text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_key   public.keys;
  v_base  timestamptz;
begin
  if v_uid is null then raise exception 'no session'; end if;
  if p_hwid is null or length(trim(p_hwid)) < 8 then raise exception 'HWID не прочитан'; end if;

  select * into v_key from public.keys
   where replace(upper(key), '-', '') = replace(upper(p_key), '-', '')
   limit 1;

  if v_key.id is null            then raise exception 'ключ не найден'; end if;
  if v_key.revoked               then raise exception 'ключ отозван'; end if;
  if v_key.used_by is not null and v_key.used_by <> v_uid then raise exception 'ключ уже активирован другим аккаунтом'; end if;
  if v_key.used_by = v_uid and v_key.bound_hwid is not null and v_key.bound_hwid <> p_hwid
     and v_key.max_hwid_binds <= 1 then raise exception 'ключ уже привязан к другому HWID'; end if;

  update public.keys set
    used_by = v_uid,
    used_at = coalesce(used_at, now()),
    bound_hwid = p_hwid
  where id = v_key.id;

  select case when p.expires_at is null or p.expires_at < now() then now() else p.expires_at end
    into v_base from public.profiles where id = v_uid;

  update public.profiles set
    hwid          = p_hwid,
    hwid_bound_at = coalesce(hwid_bound_at, now()),
    plan          = v_key.plan,
    expires_at    = v_base + make_interval(days => v_key.duration_days)
  where id = v_uid;

  insert into public.key_events (key_id, kind, detail, actor)
  values (v_key.id, 'activated', 'hwid=' || p_hwid, v_uid);

  return json_build_object('plan', v_key.plan,
    'expires_at', (select expires_at from public.profiles where id = v_uid));
end;
$$;

-- ------------------------------------------------------------ RLS ----------
alter table public.profiles   enable row level security;
alter table public.keys       enable row level security;
alter table public.key_events enable row level security;
alter table public.downloads  enable row level security;
alter table public.app_config enable row level security;

drop policy if exists prof_self on public.profiles;
create policy prof_self on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists prof_self_upd on public.profiles;
create policy prof_self_upd on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid())
              and banned = (select banned from public.profiles where id = auth.uid()));

drop policy if exists prof_admin_all on public.profiles;
create policy prof_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists keys_admin on public.keys;
create policy keys_admin on public.keys
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists keys_admin_read on public.keys;
create policy keys_admin_read on public.keys
  for select using (public.is_admin());

drop policy if exists ke_admin on public.key_events;
create policy ke_admin on public.key_events for select using (public.is_admin());

drop policy if exists ke_admin_ins on public.key_events;
create policy ke_admin_ins on public.key_events for insert with check (public.is_admin());

drop policy if exists dl_self on public.downloads;
create policy dl_self on public.downloads
  for insert to authenticated with check (user_id = auth.uid() and public.has_active_access());

drop policy if exists dl_admin on public.downloads;
create policy dl_admin on public.downloads for select using (public.is_admin());

drop policy if exists cfg_read on public.app_config;
create policy cfg_read on public.app_config for select to authenticated using (true);

drop policy if exists cfg_admin on public.app_config;
create policy cfg_admin on public.app_config for all
  using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------- seed ------
insert into public.app_config (key, value) values
  ('download_url',  ''),
  ('latest_version','1.0.0'),
  ('changelog',     'первый публичный билд: hwid / mac / edid / volume serial'),
  ('maintenance',   'false')
on conflict (key) do nothing;

-- Первый админ: после регистрации своего юзера выполни
--   update public.profiles set role='admin' where username='<твой ник>';
