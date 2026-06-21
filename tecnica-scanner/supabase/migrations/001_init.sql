-- ============================================================
-- Tecnica Scanner — Database Schema
-- Run this in your Supabase SQL editor or via supabase db push
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles (extends auth.users) ──────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null default 'worker'
                check (role in ('worker','admin','manager')),
  full_name   text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  -- Enforce company domain
  if not (new.email ilike '%@tecnicagroup.hu') then
    raise exception 'Only @tecnicagroup.hu addresses may register.';
  end if;
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'worker');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Production Launches (Lancios) ──────────────────────────
create table public.lancios (
  id          serial primary key,
  n           integer not null,
  y           text not null,
  m           text not null,       -- model name
  c           text,                -- article code
  cc          text,                -- colour code
  col         text,                -- colour description
  pa          integer not null,    -- total pairs
  comm        text not null,       -- full commission string
  cn          text not null unique, -- commission number (5 digits)
  pdf_path    text,                -- Supabase Storage path for listafa PDF
  created_at  timestamptz default now()
);

alter table public.lancios enable row level security;

create policy "Authenticated users can read lancios"
  on public.lancios for select
  using (auth.role() = 'authenticated');

-- ─── Per-size pair counts ────────────────────────────────────
create table public.lancio_sizes (
  id      serial primary key,
  cn      text not null references public.lancios(cn) on delete cascade,
  mp      text not null,   -- mondopoint size (e.g. "26.5")
  qty     integer not null
);

alter table public.lancio_sizes enable row level security;

create policy "Authenticated users can read lancio sizes"
  on public.lancio_sizes for select
  using (auth.role() = 'authenticated');

-- ─── Assets ─────────────────────────────────────────────────
create table public.assets (
  id          text primary key,   -- e.g. PL-2287, CG-3301
  name        text not null,
  kind        text not null check (kind in ('Pallet','Cage','Machine','Location')),
  access      text not null default 'public' check (access in ('public','restricted')),
  status_key  text not null default 's_operational',
  tone        text not null default 'ok' check (tone in ('ok','info','attention','issue')),
  stage       text check (stage in ('injection','padprint','assembly','qc','packaging','warehouse')),
  zone        text,
  material    jsonb default '[]',
  process     jsonb default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  created_by  uuid references auth.users(id)
);

alter table public.assets enable row level security;

create policy "Public assets readable by all"
  on public.assets for select
  using (access = 'public');

create policy "Restricted assets readable by authenticated"
  on public.assets for select
  using (access = 'restricted' and auth.role() = 'authenticated');

create policy "Admins and managers can insert assets"
  on public.assets for insert
  with check (
    auth.role() = 'authenticated' and
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','manager'))
  );

create policy "Admins and managers can update assets"
  on public.assets for update
  using (
    auth.role() = 'authenticated' and
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','manager'))
  );

-- ─── Asset History ───────────────────────────────────────────
create table public.asset_history (
  id          uuid primary key default uuid_generate_v4(),
  asset_id    text not null references public.assets(id) on delete cascade,
  what        text not null,
  who         text not null,
  created_at  timestamptz default now()
);

alter table public.asset_history enable row level security;

create policy "Read history for accessible assets"
  on public.asset_history for select
  using (
    exists (
      select 1 from public.assets a
      where a.id = asset_id
        and (a.access = 'public' or auth.role() = 'authenticated')
    )
  );

create policy "Authenticated users can insert history"
  on public.asset_history for insert
  with check (auth.role() = 'authenticated');

-- ─── Work Orders ────────────────────────────────────────────
create table public.work_orders (
  id          text primary key,
  asset_id    text not null references public.assets(id) on delete cascade,
  title       text not null,
  status_key  text not null default 's_operational',
  tone        text not null default 'ok',
  created_at  timestamptz default now()
);

alter table public.work_orders enable row level security;

create policy "Work orders readable by authenticated"
  on public.work_orders for select
  using (auth.role() = 'authenticated');

-- ─── Documents (files in Supabase Storage "documents" bucket) ─
create table public.documents (
  id            uuid primary key default uuid_generate_v4(),
  asset_id      text not null references public.assets(id) on delete cascade,
  name          text not null,
  category      text not null default 'spec'
                  check (category in ('drawing','spec','quality','safety','instruction')),
  storage_path  text not null,  -- path inside "documents" bucket
  file_size     text,
  created_at    timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Documents readable by authenticated"
  on public.documents for select
  using (auth.role() = 'authenticated');

-- ─── Material Registrations ──────────────────────────────────
create table public.registrations (
  id              uuid primary key default uuid_generate_v4(),
  material_id     text not null references public.assets(id),
  location_id     text not null references public.assets(id),
  registered_by   uuid references auth.users(id),
  registered_at   timestamptz default now()
);

alter table public.registrations enable row level security;

create policy "Registrations readable by authenticated"
  on public.registrations for select
  using (auth.role() = 'authenticated');

create policy "Authenticated workers can register"
  on public.registrations for insert
  with check (auth.role() = 'authenticated');

-- ─── Batch Job Orders ────────────────────────────────────────
create table public.jobs (
  id          text primary key,  -- e.g. JO-4471
  customer    text not null,
  job_date    text not null,
  items       jsonb not null default '[]',
  created_at  timestamptz default now()
);

alter table public.jobs enable row level security;

create policy "Jobs readable by authenticated"
  on public.jobs for select
  using (auth.role() = 'authenticated');

-- ─── Batch Print Runs ────────────────────────────────────────
create table public.batch_runs (
  id              uuid primary key default uuid_generate_v4(),
  job_id          text references public.jobs(id),
  part_type       text not null check (part_type in ('scafo','gambetto')),
  cage_capacity   integer not null default 48,
  printed_by      uuid references auth.users(id),
  printed_at      timestamptz default now()
);

alter table public.batch_runs enable row level security;

create policy "Batch runs readable by authenticated"
  on public.batch_runs for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert batch runs"
  on public.batch_runs for insert
  with check (auth.role() = 'authenticated');

-- ─── Seed: Lancios ───────────────────────────────────────────
insert into public.lancios (n,y,m,c,cc,col,pa,comm,cn,pdf_path) values
  (100, '2025','MACH1 LV 130 TD2','101C04 G0','381','ICON ORANGE',750,'TSKB 2025 10562 AA','10562','uploads/Lancio 100.PDF'),
  (200, '2025','MACH1 LV 105 W TD2','201C06 G0','L6D','IRIDESC.GREEN/GOLD',1000,'TSKB 2025 10952 AA','10952','uploads/Lancio 200.PDF'),
  (300, '2025','MACH BOA MV 110','101G56 G0','741','BLACK/RED',1469,'TSKB 2025 11182 AA','11182','uploads/Lancio 300.PDF'),
  (400, '2025','SPEEDMACHINE 3 85 W BOA (GW)','050Q22 00','4A2','NERO/BIANCO/ROSA',1489,'TSKB 2025 11898 AA','11898','uploads/Lancio 400.PDF'),
  (500, '2025','MACH1 LV 120 TD2','101C06 G0','40D','DARK PROGR.GREEN',1039,'TSKB 2025 12322 AA','12322','uploads/Lancio 500.PDF'),
  (600, '2025','HF 85 W (GW)','050K13 01','4F5','NERO/VERDE/ACQUA',1500,'TSKB 2025 12863 AA','12863','uploads/Lancio_600_700.PDF'),
  (800, '2026','PRO MACHINE 3 130 S (GW)','050D00 00','4Y5','CAMO NERO',594,'TSKB 2026 00013 AA','00013','uploads/Lancio 800.PDF'),
  (900, '2026','PRO MACHINE 3 120 (GW)','050D06 00','688','GRIGIO/NERO/ROSSO',1000,'TSKB 2026 00472 AA','00472','uploads/Lancio 900.PDF'),
  (1000,'2026','PRO MACHINE 3 130 (GW)','050D02 00','N96','NERO/GRIGIO/ROSSO',1007,'TSKB 2026 01042 AA','01042','uploads/Lancio 1000.PDF'),
  (1100,'2026','HF 120 (GW)','050K06 01','M99','ANTRACITE/NERO/ROSSO',1000,'TSKB 2026 01568 AA','01568','uploads/lancio1100_2026_1.PDF'),
  (1100,'2026','PRO MACHINE 3 130 S (GW)','050D00 00','4Y5','CAMO NERO',620,'TSKB 2026 01541 AA','01541','uploads/lancio1100_2026_2.PDF'),
  (1100,'2026','MACH BOA HV 110 X','101973 G5','606','BLACK/ORANGE',800,'TSKB 2026 02013 AA','02013','uploads/lancio1100_2026_3.PDF'),
  (1200,'2026','DOBERMANN 5 RD-93(EXTRA STIFF)','050A06 01','100','NERO',225,'TSKB 2026 02108 AA','02108','uploads/lancio1200_2026.PDF'),
  (1300,'2026','DOBERMANN 5 96 (MEDIUM)','050A22 01','100','NERO',700,'TSKB 2026 02733 AA','02733','uploads/Lancio 1300.PDF'),
  (1400,'2026','SPEEDMACHINE 3 130 (GW)','050G14 00','7T1','NERO/ANTRACITE/ROSSO',1000,'TSKB 2026 03473 AA','03473','uploads/3473.PDF'),
  (1400,'2026','THE CRUISE 120 (GW)','050640 03','N96','NERO/GRIGIO/ROSSO',656,'TSKB 2026 03565 AA','03565','uploads/3565.PDF'),
  (1400,'2026','SPEEDMACHINE 3 130 (GW) SHELL','050X20 00','7T1','NERO/ANTRACITE/ROSSO',14,'TSKB 2026 04147 AA','04147','uploads/4147.PDF'),
  (1400,'2026','PRO MACHINE 3 130 S (GW)','050D00 00','4Y5','CAMO NERO',600,'TSKB 2026 03457 AA','03457','uploads/Lancio 1400.PDF');

-- ─── Seed: Lancio sizes ──────────────────────────────────────
insert into public.lancio_sizes (cn,mp,qty) values
  ('10562','24.5',30),('10562','25.5',222),('10562','26.0',25),('10562','26.5',473),
  ('10952','22.5',48),('10952','23.5',175),('10952','24.0',20),('10952','24.5',291),('10952','25.0',22),('10952','25.5',279),('10952','26.0',13),('10952','26.5',127),('10952','27.5',25),
  ('11182','25.5',132),('11182','26.0',26),('11182','26.5',310),('11182','27.0',45),('11182','27.5',387),('11182','28.0',49),('11182','28.5',311),('11182','29.0',28),('11182','29.5',145),('11182','30.5',36),
  ('11898','22.5',96),('11898','23.5',336),('11898','24.5',509),('11898','25.5',422),('11898','26.5',126),
  ('12322','24.5',31),('12322','25.5',192),('12322','26.5',384),('12322','27.5',432),
  ('12863','23.0',15),('12863','23.5',206),('12863','24.0',32),('12863','24.5',429),('12863','25.0',50),('12863','25.5',459),('12863','26.0',30),('12863','26.5',249),('12863','27.5',30),
  ('00013','24.5',39),('00013','25.5',77),('00013','26.5',125),('00013','27.5',173),('00013','28.5',108),('00013','29.5',72),
  ('00472','24.5',29),('00472','25.5',125),('00472','26.5',240),('00472','27.5',288),('00472','28.5',252),('00472','29.5',66),
  ('01042','24.5',29),('01042','25.5',77),('01042','26.5',221),('01042','27.5',240),('01042','28.5',274),('01042','29.5',130),('01042','30.5',36),
  ('01568','24.0',3),('01568','24.5',26),('01568','25.0',5),('01568','25.5',72),('01568','26.0',10),('01568','26.5',163),('01568','27.0',20),('01568','27.5',259),('01568','28.0',20),('01568','28.5',220),('01568','29.0',12),('01568','29.5',132),('01568','30.0',8),('01568','30.5',42),('01568','31.0',8),
  ('01541','23.5',20),('01541','24.5',29),('01541','25.5',80),('01541','26.5',125),('01541','27.5',186),('01541','28.5',36),('01541','29.5',108),('01541','30.5',36),
  ('02013','26.5',91),('02013','27.0',10),('02013','27.5',211),('02013','28.0',6),('02013','28.5',232),('02013','29.0',5),('02013','29.5',161),('02013','30.5',58),('02013','31.5',17),('02013','32.5',9),
  ('02108','24.5',17),('02108','25.5',37),('02108','26.5',44),('02108','27.5',63),('02108','28.5',42),('02108','29.5',22),
  ('02733','22.5',30),('02733','23.5',64),('02733','24.5',126),('02733','25.5',161),('02733','26.5',159),('02733','27.5',110),('02733','28.5',50),
  ('03473','24.5',25),('03473','25.5',20),('03473','26.5',172),('03473','27.5',340),('03473','28.5',230),('03473','29.5',145),('03473','30.0',3),('03473','30.5',60),('03473','31.0',5),
  ('03565','26.5',172),('03565','27.5',159),('03565','28.5',127),('03565','29.5',127),('03565','30.5',26),('03565','31.0',4),('03565','31.5',28),('03565','32.0',4),('03565','32.5',9),
  ('04147','25.5',1),('04147','26.5',2),('04147','27.5',3),('04147','28.5',4),('04147','29.5',3),('04147','30.5',1),
  ('03457','22.5',20),('03457','25.5',45),('03457','26.5',170),('03457','27.5',135),('03457','28.5',175),('03457','29.5',30),('03457','30.5',25);

-- ─── Seed: Demo Jobs ─────────────────────────────────────────
insert into public.jobs (id,customer,job_date,items) values
  ('JO-4471','Decathlon FR','18 Jun 2026','[
    {"model":"Mach1 LV 130","size":"27.5","qty":24},
    {"model":"Mach1 LV 130","size":"28.0","qty":30},
    {"model":"Mach1 LV 130","size":"28.5","qty":30},
    {"model":"Mach1 MV 120","size":"27.0","qty":18},
    {"model":"Mach1 MV 120","size":"27.5","qty":18},
    {"model":"Cochise 110","size":"29.0","qty":12}
  ]'),
  ('JO-4480','Sport2000 DE','17 Jun 2026','[
    {"model":"Speedmachine 3 100","size":"26.5","qty":20},
    {"model":"Speedmachine 3 100","size":"27.0","qty":20},
    {"model":"Speedmachine 3 100","size":"27.5","qty":16},
    {"model":"Speedmachine 3 100","size":"28.0","qty":14}
  ]');

-- ─── Seed: Demo Assets ───────────────────────────────────────
insert into public.assets (id,name,kind,access,status_key,tone,stage,zone,material,process) values
  ('PL-2287','Mach1 LV Boot Shells','Pallet','public','s_inProduction','info','padprint','Pad-print cell 2 · Hall A',
    '[{"k":"Product","v":"Mach1 LV 130"},{"k":"Composition","v":"PU / Polyolefin blend"},{"k":"Supplier","v":"BASF Elastollan®"},{"k":"Colour","v":"Black / Orange · RAL 2009"},{"k":"Hardness","v":"62 Shore D"},{"k":"Lot","v":"B-2241"},{"k":"Quantity","v":"480 pcs"},{"k":"Net weight","v":"612 kg"}]',
    '[{"k":"Ink system","v":"Marabu Tampastar TPR"},{"k":"Colours","v":"2 — white, orange"},{"k":"Pad shore","v":"A22 soft"},{"k":"Cure","v":"Air dry · 20 min"},{"k":"Cycle time","v":"14 s/pc"}]'),
  ('CG-3301','Mach1 LV 130 · 28.0','Cage','public','s_inProduction','info','packaging','Staging area A',
    '[{"k":"Job order","v":"JO-4471"},{"k":"Customer","v":"Decathlon FR"},{"k":"Model","v":"Mach1 LV 130"},{"k":"Size","v":"28.0"},{"k":"Quantity","v":"30 pcs"}]','[]'),
  ('CG-3302','Cochise 110 · 29.0','Cage','public','s_inProduction','info','packaging','— (unassigned)',
    '[{"k":"Job order","v":"JO-4471"},{"k":"Customer","v":"Decathlon FR"},{"k":"Model","v":"Cochise 110"},{"k":"Size","v":"29.0"},{"k":"Quantity","v":"12 pcs"}]','[]'),
  ('CNC-07','CNC Mill #07','Machine','restricted','s_maintenanceDue','attention',null,'Hall A · Machining bay · Cell 3',
    '[{"k":"Model","v":"Haas VF-4SS"},{"k":"Asset no.","v":"HU-MC-0712"},{"k":"Runtime","v":"18,420 h"},{"k":"Last service","v":"04 Apr 2026"}]','[]'),
  ('LOC-T1-RAMPA','Rampa T1 csarnok','Location','public','s_operational','ok',null,'T1 csarnok',
    '[{"k":"Csarnok","v":"T1"},{"k":"Típus","v":"Rampa / Fogadóterület"},{"k":"Kapacitás","v":"12 raklap"}]','[]'),
  ('LOC-T1-RAKTAR','T1 raktár','Location','public','s_operational','ok',null,'T1 csarnok · Raktár',
    '[{"k":"Csarnok","v":"T1"},{"k":"Típus","v":"Raktár"},{"k":"Kapacitás","v":"80 raklap"},{"k":"Foglalt","v":"54 / 80"}]','[]'),
  ('LOC-T2-RAMPA','Rampa T2 csarnok','Location','public','s_operational','ok',null,'T2 csarnok',
    '[{"k":"Csarnok","v":"T2"},{"k":"Típus","v":"Rampa / Fogadóterület"},{"k":"Kapacitás","v":"12 raklap"}]','[]'),
  ('LOC-T2-RAKTAR','T2 raktár','Location','public','s_attention','attention',null,'T2 csarnok · Raktár',
    '[{"k":"Csarnok","v":"T2"},{"k":"Típus","v":"Raktár"},{"k":"Kapacitás","v":"80 raklap"},{"k":"Foglalt","v":"78 / 80"}]','[]'),
  ('LOC-T3-RAMPA','Rampa T3 csarnok','Location','public','s_operational','ok',null,'T3 csarnok',
    '[{"k":"Csarnok","v":"T3"},{"k":"Típus","v":"Rampa / Fogadóterület"},{"k":"Kapacitás","v":"8 raklap"}]','[]'),
  ('LOC-T3-RAKTAR','T3 raktár','Location','public','s_operational','ok',null,'T3 csarnok · Raktár',
    '[{"k":"Csarnok","v":"T3"},{"k":"Típus","v":"Raktár"},{"k":"Kapacitás","v":"60 raklap"},{"k":"Foglalt","v":"31 / 60"}]','[]'),
  ('LOC-INCOMPLETE','Incomplete raktár','Location','restricted','s_attention','attention',null,'Incomplete raktár',
    '[{"k":"Típus","v":"Incomplete / Visszatartott"},{"k":"Kapacitás","v":"40 raklap"},{"k":"Foglalt","v":"12 / 40"}]','[]'),
  ('LOC-SUPERMARKET','Plasztika Szupermarket','Location','public','s_operational','ok',null,'Plasztika Szupermarket',
    '[{"k":"Típus","v":"Szupermarket / Összekészítés"},{"k":"Sorok","v":"8"},{"k":"Kapacitás","v":"160 féle komponens"}]','[]'),
  ('LOC-SZABASZAT','Szabászati raktár','Location','public','s_operational','ok',null,'Szabászati raktár',
    '[{"k":"Típus","v":"Anyagraktár"},{"k":"Kapacitás","v":"50 raklap"},{"k":"Foglalt","v":"22 / 50"}]','[]');

insert into public.asset_history (asset_id,what,who) values
  ('PL-2287','Pad printing started','Pad-print cell 2'),
  ('PL-2287','Injection moulding completed','Injection line 2'),
  ('CG-3301','Cage packed & label printed','Packaging'),
  ('CG-3302','Cage packed & label printed','Packaging'),
  ('CNC-07','Power on / warm-up cycle','Shift A'),
  ('CNC-07','Preventive service completed','L. Bianchi'),
  ('LOC-T1-RAMPA','Szállítmány fogadva','Logisztika'),
  ('LOC-T1-RAKTAR','Készletszámlálás elvégezve','A. Tóth');

insert into public.work_orders (id,asset_id,title,status_key,tone) values
  ('WO-1184','CNC-07','Spindle bearing inspection','s_maintenanceDue','attention'),
  ('WO-1190','CNC-07','Coolant filter replacement','s_operational','ok');
