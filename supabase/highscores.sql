-- Kipp – Online-Bestenliste (Supabase / PostgREST)
-- Im Supabase-Dashboard unter "SQL Editor" einfügen und ausführen.
-- Danach Project-URL und anon key in index.html bei ONLINE eintragen.

create table if not exists public.highscores (
  id         bigint generated always as identity primary key,
  board      text        not null check (char_length(board) between 1 and 40),
  name       text        not null check (name ~ '^[A-Z0-9-]{3}$'),
  score      integer     not null check (score between 1 and 100000000),
  lines      integer     not null check (lines between 0 and 1000000),
  created_at timestamptz not null default now()
);

create index if not exists highscores_board_score_idx
  on public.highscores (board, score desc, id asc);

alter table public.highscores enable row level security;

-- Jeder darf lesen und eintragen, niemand darf ändern oder löschen.
drop policy if exists "highscores read" on public.highscores;
create policy "highscores read"
  on public.highscores for select
  to anon, authenticated
  using (true);

drop policy if exists "highscores insert" on public.highscores;
create policy "highscores insert"
  on public.highscores for insert
  to anon, authenticated
  with check (true);

-- Nur die Spalten freigeben, die das Spiel braucht.
revoke all on public.highscores from anon, authenticated;
grant select (id, board, name, score, lines, created_at) on public.highscores to anon, authenticated;
grant insert (board, name, score, lines) on public.highscores to anon, authenticated;
