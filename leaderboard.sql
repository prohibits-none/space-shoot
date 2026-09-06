-- Space Shoot global leaderboard for Supabase
-- Run this once in Supabase SQL Editor.

create table if not exists public.space_shoot_leaderboard (
    player_id uuid primary key references auth.users(id) on delete cascade,
    player_name text not null default 'Pilot',
    best_score integer not null default 0 check (best_score >= 0),
    updated_at timestamptz not null default now()
);

alter table public.space_shoot_leaderboard enable row level security;

drop policy if exists "Anyone can read leaderboard" on public.space_shoot_leaderboard;
create policy "Anyone can read leaderboard"
on public.space_shoot_leaderboard for select
using (true);

-- Clients cannot directly insert/update scores. They use the RPC below.
drop policy if exists "Users can insert own leaderboard row" on public.space_shoot_leaderboard;
drop policy if exists "Users can update own leaderboard row" on public.space_shoot_leaderboard;

create or replace function public.submit_space_shoot_score(
    p_player_name text,
    p_score integer
)
returns public.space_shoot_leaderboard
language plpgsql
security definer
set search_path = public
as $$
declare
    result public.space_shoot_leaderboard;
    safe_name text;
    safe_score integer;
begin
    if auth.uid() is null then
        raise exception 'Not authenticated';
    end if;

    safe_name := left(regexp_replace(coalesce(trim(p_player_name), 'Pilot'), '[^a-zA-Z0-9 _-]', '', 'g'), 18);
    if safe_name = '' then safe_name := 'Pilot'; end if;
    safe_score := greatest(coalesce(p_score, 0), 0);

    insert into public.space_shoot_leaderboard(player_id, player_name, best_score, updated_at)
    values (auth.uid(), safe_name, safe_score, now())
    on conflict (player_id) do update
    set player_name = excluded.player_name,
        best_score = greatest(public.space_shoot_leaderboard.best_score, excluded.best_score),
        updated_at = case when excluded.best_score > public.space_shoot_leaderboard.best_score then now() else public.space_shoot_leaderboard.updated_at end
    returning * into result;

    return result;
end;
$$;

grant execute on function public.submit_space_shoot_score(text, integer) to anon, authenticated;
grant select on public.space_shoot_leaderboard to anon, authenticated;
