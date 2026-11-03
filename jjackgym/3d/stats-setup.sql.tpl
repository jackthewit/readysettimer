-- ONLINE GYM 접속 통계 (Supabase SQL 편집기에서 한 번 실행)
-- 손님 브라우저는 gym_ping만 부를 수 있고, 표는 직접 읽거나 쓸 수 없다.
-- 통계는 관리자 열쇠가 있어야 gym_stats로 볼 수 있다. IP·이름은 남기지 않는다.

create table if not exists public.gym_visits (
  sid uuid primary key,                      -- 탭 하나가 열려 있는 동안의 방문
  vid text not null,                         -- 브라우저마다 무작위로 만든 방문자 번호
  started_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  shop text,
  mobile boolean,
  ref text,                                  -- 어디서 왔는지 (주소의 도메인만)
  reps int not null default 0,
  sets int not null default 0,
  work_sec int not null default 0,           -- 기구 위에서 보낸 시간(초)
  pt int not null default 0,                 -- PT 부른 횟수
  gest int not null default 0,               -- 몸짓 횟수
  stations text[] not null default '{}'      -- 써 본 기구
);
create index if not exists gym_visits_started on public.gym_visits (started_at);
create index if not exists gym_visits_seen on public.gym_visits (last_seen);
alter table public.gym_visits enable row level security;
revoke all on public.gym_visits from anon, authenticated;

create or replace function public.gym_ping(
  p_sid uuid, p_vid text, p_shop text, p_mobile boolean, p_ref text,
  p_reps int, p_sets int, p_work int, p_pt int, p_gest int, p_stations text[]
) returns void language plpgsql security definer set search_path = public as $$
declare st text[];
begin
  if p_sid is null or p_vid is null or length(p_vid) > 40 then return; end if;
  st := coalesce((select array_agg(left(x, 20)) from unnest(p_stations[1:60]) x), '{}');
  insert into gym_visits as v (sid, vid, shop, mobile, ref, reps, sets, work_sec, pt, gest, stations)
  values (p_sid, p_vid, left(p_shop, 20), p_mobile, left(p_ref, 80),
          least(greatest(coalesce(p_reps, 0), 0), 100000), least(greatest(coalesce(p_sets, 0), 0), 10000),
          least(greatest(coalesce(p_work, 0), 0), 86400), least(greatest(coalesce(p_pt, 0), 0), 10000),
          least(greatest(coalesce(p_gest, 0), 0), 100000), st)
  on conflict (sid) do update set
    last_seen = now(), shop = excluded.shop,
    reps = greatest(v.reps, excluded.reps), sets = greatest(v.sets, excluded.sets),
    work_sec = greatest(v.work_sec, excluded.work_sec), pt = greatest(v.pt, excluded.pt),
    gest = greatest(v.gest, excluded.gest), stations = excluded.stations
  where v.vid = excluded.vid and v.last_seen > now() - interval '12 hours';
end $$;

create or replace function public.gym_stats(p_key text, p_days int default 14)
returns json language plpgsql security definer set search_path = public as $$
declare r json; tz constant text := 'Asia/Seoul'; since timestamptz;
begin
  if encode(sha256(convert_to(coalesce(p_key, ''), 'UTF8')), 'hex') <> '__HASH__' then
    raise exception 'denied';
  end if;
  p_days := least(greatest(coalesce(p_days, 14), 1), 90);
  since := date_trunc('day', now() at time zone tz) at time zone tz - make_interval(days => p_days - 1);
  select json_build_object(
    'now', now(),
    'online', (select count(*) from gym_visits where last_seen > now() - interval '2 minutes'),
    'online_by_shop', (select coalesce(json_object_agg(coalesce(shop, '-'), n), '{}') from (
        select shop, count(*) n from gym_visits where last_seen > now() - interval '2 minutes' group by shop) s),
    'all_time', (select json_build_object('visitors', count(distinct vid), 'sessions', count(*), 'first', min(started_at)) from gym_visits),
    'daily', (select coalesce(json_agg(d order by d.day desc), '[]') from (
        select (started_at at time zone tz)::date as day,
          count(distinct vid) as visitors, count(*) as sessions,
          round(avg(extract(epoch from last_seen - started_at)) / 60.0, 1) as avg_min,
          round(sum(extract(epoch from last_seen - started_at)) / 3600.0, 1) as total_hours,
          sum(reps) as reps, round(sum(work_sec) / 60.0) as work_min, sum(pt) as pt_calls, sum(gest) as gestures,
          count(*) filter (where mobile) as mobile_sessions
        from gym_visits where started_at >= since group by 1) d),
    'peak', (select coalesce(json_agg(x order by x.day desc), '[]') from (
        select (b at time zone tz)::date as day, max(n) as peak,
          (array_agg(to_char(b at time zone tz, 'HH24:MI') order by n desc, b))[1] as at
        from (select b, (select count(*) from gym_visits v where v.started_at <= b and v.last_seen >= b) n
              from generate_series(date_trunc('hour', since), now(), interval '5 minutes') b) t
        group by 1) x),
    'new_visitors', (select count(*) from (select vid, min(started_at) f from gym_visits group by vid) a where a.f >= since),
    'return_visitors', (select count(*) from (select vid from gym_visits where started_at >= since
        group by vid having count(distinct (started_at at time zone tz)::date) > 1) a),
    'hours', (select coalesce(json_object_agg(h, n), '{}') from (
        select extract(hour from started_at at time zone tz)::int h, count(*) n
        from gym_visits where started_at >= since group by 1 order by 1) s),
    'shops', (select coalesce(json_object_agg(coalesce(shop, '-'), n), '{}') from (
        select shop, count(*) n from gym_visits where started_at >= since group by 1) s),
    'stations', (select coalesce(json_agg(json_build_object('id', id, 'n', n) order by n desc), '[]') from (
        select id, count(*) n from gym_visits, unnest(stations) id where started_at >= since group by 1 order by 2 desc limit 15) s),
    'refs', (select coalesce(json_agg(json_build_object('ref', ref, 'n', n) order by n desc), '[]') from (
        select coalesce(nullif(ref, ''), '(바로 들어옴)') ref, count(*) n from gym_visits where started_at >= since group by 1 order by 2 desc limit 10) s)
  ) into r;
  return r;
end $$;

revoke all on function public.gym_ping(uuid, text, text, boolean, text, int, int, int, int, int, text[]) from public;
revoke all on function public.gym_stats(text, int) from public;
grant execute on function public.gym_ping(uuid, text, text, boolean, text, int, int, int, int, int, text[]) to anon, authenticated;
grant execute on function public.gym_stats(text, int) to anon, authenticated;
