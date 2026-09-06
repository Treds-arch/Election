create table if not exists app_config (
  id smallint primary key default 1,
  title text not null,
  pin text not null,
  candidates jsonb not null default '[]'::jsonb,
  target integer,
  use_pair boolean not null default false,
  is_open boolean not null default true,
  published boolean not null default false,
  device_lock boolean not null default false,
  finalized boolean not null default false,
  rev integer not null default 0,
  created_at bigint,
  constraint app_config_single_row check (id = 1)
);

create table if not exists votes (
  nim text primary key,
  candidate_id text not null,
  nama text not null,
  ts bigint not null
);

create table if not exists device_votes (
  candidate_set_hash text not null,
  device_key text not null,
  ts bigint not null,
  primary key (candidate_set_hash, device_key)
);
