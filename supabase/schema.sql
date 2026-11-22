-- =====================================================================
--  SIMPEL — Skema Database Supabase (PostgreSQL)
--  Mengikuti ERD: categories, events, criteria, users, submissions,
--  submission_members, submission_files, status_logs,
--  review_assignments, reviews, review_scores
--
--  Cara pakai: Supabase Dashboard → SQL Editor → paste → Run
-- =====================================================================

-- ---------- ENUM ----------
create type public.user_role as enum ('admin', 'peserta', 'juri');
create type public.event_status as enum ('draft', 'open', 'review', 'closed', 'announced');
create type public.submission_status as enum (
  'draft', 'submitted', 'desk_review', 'tidak_lolos', 'review', 'revisi', 'lolos', 'juara'
);

-- ---------- USERS (profil, terhubung ke auth.users) ----------
create table public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  nama        text not null,
  email       text not null unique,
  role        public.user_role not null default 'peserta',
  institusi   text,
  nim_nisn    text,
  no_hp       text,
  created_at  timestamptz not null default now()
);
-- password_hash dikelola oleh Supabase Auth (auth.users), tidak disimpan di sini.

-- ---------- CATEGORIES ----------
create table public.categories (
  id         bigint generated always as identity primary key,
  nama       text not null,
  deskripsi  text,
  is_active  boolean not null default true
);

-- ---------- EVENTS ----------
create table public.events (
  id           bigint generated always as identity primary key,
  category_id  bigint references public.categories (id) on delete set null,
  nama         text not null,
  tema         text not null,
  deskripsi    text,
  hadiah       text,
  deadline     date not null,
  max_halaman  int not null default 10,
  max_anggota  int not null default 3,
  status       public.event_status not null default 'draft',
  created_at   timestamptz not null default now()
);

-- ---------- CRITERIA ----------
create table public.criteria (
  id        bigint generated always as identity primary key,
  event_id  bigint not null references public.events (id) on delete cascade,
  nama      text not null,
  bobot     int not null check (bobot between 1 and 100)
);

-- ---------- SUBMISSIONS ----------
create table public.submissions (
  id            bigint generated always as identity primary key,
  event_id      bigint not null references public.events (id) on delete cascade,
  user_id       uuid not null references public.users (id) on delete cascade,
  judul         text not null,
  abstrak       text,
  kata_kunci    text,
  status        public.submission_status not null default 'draft',
  skor_akhir    numeric(5,2),
  submitted_at  timestamptz
);

create table public.submission_members (
  id             bigint generated always as identity primary key,
  submission_id  bigint not null references public.submissions (id) on delete cascade,
  nama           text not null,
  institusi      text,
  email          text,
  peran          text not null default 'Anggota'
);

create table public.submission_files (
  id             bigint generated always as identity primary key,
  submission_id  bigint not null references public.submissions (id) on delete cascade,
  jenis_berkas   text not null,
  file_path      text not null,
  versi          int not null default 1,
  uploaded_at    timestamptz not null default now()
);

create table public.status_logs (
  id             bigint generated always as identity primary key,
  submission_id  bigint not null references public.submissions (id) on delete cascade,
  status         public.submission_status not null,
  catatan        text,
  created_at     timestamptz not null default now()
);

-- ---------- PENILAIAN ----------
create table public.review_assignments (
  id             bigint generated always as identity primary key,
  submission_id  bigint not null references public.submissions (id) on delete cascade,
  juri_id        uuid not null references public.users (id) on delete cascade,
  status         text not null default 'pending',
  assigned_at    timestamptz not null default now(),
  unique (submission_id, juri_id)
);

create table public.reviews (
  id             bigint generated always as identity primary key,
  assignment_id  bigint not null unique references public.review_assignments (id) on delete cascade,
  total_skor     numeric(5,2),
  komentar       text,
  rekomendasi    text
);

create table public.review_scores (
  id           bigint generated always as identity primary key,
  review_id    bigint not null references public.reviews (id) on delete cascade,
  criteria_id  bigint not null references public.criteria (id) on delete cascade,
  skor         numeric(5,2) not null check (skor between 0 and 100),
  unique (review_id, criteria_id)
);

-- ---------- INDEX ----------
create index on public.events (category_id);
create index on public.criteria (event_id);
create index on public.submissions (event_id);
create index on public.submissions (user_id);
create index on public.submissions (status);
create index on public.status_logs (submission_id);
create index on public.review_assignments (juri_id);

-- =====================================================================
--  TRIGGER: buat profil otomatis saat user mendaftar (Supabase Auth)
--  Data dikirim dari form register via options.data
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, nama, email, institusi, nim_nisn, no_hp)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nama', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'institusi',
    new.raw_user_meta_data ->> 'nim_nisn',
    new.raw_user_meta_data ->> 'no_hp'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- TRIGGER: catat status_logs otomatis setiap status naskah berubah
create or replace function public.log_submission_status()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into public.status_logs (submission_id, status, catatan)
    values (new.id, new.status, 'Status diperbarui menjadi ' || new.status);
  end if;
  return new;
end;
$$;

create trigger on_submission_status_change
  after insert or update of status on public.submissions
  for each row execute function public.log_submission_status();

-- =====================================================================
--  HELPER ROLE
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_role()
returns public.user_role
language sql stable security definer set search_path = ''
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_juri_of(sub_id bigint)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.review_assignments
    where submission_id = sub_id and juri_id = auth.uid()
  );
$$;

-- =====================================================================
--  ROW LEVEL SECURITY
-- =====================================================================
alter table public.users              enable row level security;
alter table public.categories         enable row level security;
alter table public.events             enable row level security;
alter table public.criteria           enable row level security;
alter table public.submissions        enable row level security;
alter table public.submission_members enable row level security;
alter table public.submission_files   enable row level security;
alter table public.status_logs        enable row level security;
alter table public.review_assignments enable row level security;
alter table public.reviews            enable row level security;
alter table public.review_scores      enable row level security;

-- USERS
create policy "lihat profil sendiri / admin" on public.users
  for select using (id = auth.uid() or public.is_admin());
create policy "ubah profil sendiri" on public.users
  for update using (id = auth.uid()) with check (id = auth.uid() and role = public.my_role());  -- peserta tidak bisa menaikkan role sendiri
create policy "admin kelola users" on public.users
  for all using (public.is_admin());

-- CATEGORIES, EVENTS, CRITERIA: publik bisa baca, admin kelola
create policy "publik baca kategori" on public.categories for select using (true);
create policy "admin kelola kategori" on public.categories for all using (public.is_admin());

create policy "publik baca event" on public.events for select using (status <> 'draft' or public.is_admin());
create policy "admin kelola event" on public.events for all using (public.is_admin());

create policy "publik baca kriteria" on public.criteria for select using (true);
create policy "admin kelola kriteria" on public.criteria for all using (public.is_admin());

-- SUBMISSIONS
create policy "peserta lihat naskah sendiri" on public.submissions
  for select using (user_id = auth.uid() or public.is_admin() or public.is_juri_of(id));
create policy "peserta buat naskah" on public.submissions
  for insert with check (user_id = auth.uid());
create policy "peserta ubah draft sendiri" on public.submissions
  for update using (user_id = auth.uid() and status in ('draft', 'revisi'));
create policy "admin kelola naskah" on public.submissions
  for all using (public.is_admin());

-- ANAK SUBMISSIONS (members, files, logs)
create policy "akses anggota" on public.submission_members for all using (
  public.is_admin() or exists (select 1 from public.submissions s where s.id = submission_id and s.user_id = auth.uid())
);
create policy "akses berkas" on public.submission_files for all using (
  public.is_admin() or public.is_juri_of(submission_id)
  or exists (select 1 from public.submissions s where s.id = submission_id and s.user_id = auth.uid())
);
create policy "lihat log" on public.status_logs for select using (
  public.is_admin() or exists (select 1 from public.submissions s where s.id = submission_id and s.user_id = auth.uid())
);
create policy "admin kelola log" on public.status_logs for all using (public.is_admin());

-- PENILAIAN
create policy "admin kelola penugasan" on public.review_assignments for all using (public.is_admin());
create policy "juri lihat penugasan" on public.review_assignments for select using (juri_id = auth.uid());

create policy "admin kelola review" on public.reviews for all using (public.is_admin());
create policy "juri kelola review sendiri" on public.reviews for all using (
  exists (select 1 from public.review_assignments a where a.id = assignment_id and a.juri_id = auth.uid())
);
create policy "peserta lihat review naskahnya" on public.reviews for select using (
  exists (
    select 1 from public.review_assignments a
    join public.submissions s on s.id = a.submission_id
    where a.id = assignment_id and s.user_id = auth.uid()
  )
);

create policy "admin kelola skor" on public.review_scores for all using (public.is_admin());
create policy "juri kelola skor sendiri" on public.review_scores for all using (
  exists (
    select 1 from public.reviews r
    join public.review_assignments a on a.id = r.assignment_id
    where r.id = review_id and a.juri_id = auth.uid()
  )
);

-- =====================================================================
--  STORAGE: bucket privat untuk berkas naskah (path: {user_id}/{submission_id}/file.pdf)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('naskah', 'naskah', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

create policy "peserta upload ke folder sendiri" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'naskah' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "peserta/admin baca berkas" on storage.objects
  for select to authenticated
  using (bucket_id = 'naskah' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- =====================================================================
--  JADIKAN AKUN ADMIN (jalankan setelah mendaftar lewat website)
-- =====================================================================
-- update public.users set role = 'admin' where email = 'email-admin@contoh.com';
