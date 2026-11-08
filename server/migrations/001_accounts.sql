create table users (
  id uuid primary key default gen_random_uuid(),
  google_sub text not null unique,
  email text not null,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  -- null until the first save, so a new account takes the browser's map instead of wiping it
  first_saved_at timestamptz
);

-- the cookie holds the token, the table only its sha-256
create table sessions (
  token_hash bytea primary key,
  user_id uuid not null references users on delete cascade,
  expires_at timestamptz not null
);

create index sessions_by_user on sessions (user_id);

create table preferences (
  user_id uuid primary key references users on delete cascade,
  theme text,
  cover text,
  language text,
  updated_at timestamptz not null default now()
);

create type place_kind as enum ('country', 'state', 'city');

create type place_list as enum ('visited', 'wishlist');

-- countries use iso 3166-1 ('br'), states iso 3166-2 ('br-sp'), cities a geonames id ('geonames:3448439')
create table places (
  user_id uuid not null references users on delete cascade,
  kind place_kind not null,
  code text not null,
  country text not null,
  list place_list not null,
  position integer not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, code)
);

create index places_by_country on places (user_id, country);
