# Moving this app onto Supabase

The client keeps everything in `localStorage` today: one browser, one user, no
server. This is the plan for putting the same data in Postgres behind Supabase
Auth, in the shape a later import into Lovable can follow without redesigning
the app.

Nothing here is speculative about the app's data — every table below comes from
a key in `src/storage.ts` and a type in `src/data.ts`, `src/nitro.ts`,
`src/quests.ts` or `src/prefs.ts`.

## What is stored today

| localStorage key (`discord-ui:v4:`) | Type | Becomes |
| --- | --- | --- |
| `credentials` | `Credential[]` | `auth.users` (Supabase Auth) + `profiles` |
| `session` | `string \| null` | the Supabase session, in the client's memory |
| `account` | `Account` | `profiles` |
| `servers` | `Server[]` | `servers`, `categories`, `channels`, `roles`, `guild_emojis`, `invites`, `bans`, `audit_log` |
| `messages` | `Record<channelId, Message[]>` | `messages`, `attachments`, `reactions`, `polls`, `poll_votes` |
| `reads` | `Record<channelId, number>` | `channel_reads` |
| `prefs` | `Prefs` | `user_prefs` (one JSONB column, see below) |
| `theme` | `string` | `user_prefs.theme_id` |
| `scheduled` | `{id,key,text,at}[]` | `scheduled_messages` |
| `subscription` | `Subscription \| null` | `subscriptions` |
| `gifts` | `Gift[]` | `gifts` |
| `orbs` | `number` | `orb_ledger` (the balance is the sum, never a stored number) |
| `quests` | `Record<questId, QuestUserStatus>` | `quest_status` |
| — | — | `collectibles` (owned decorations; today they live on `Account.collectibles`) |
| — | — | `server_members` (implicit today: the signed-in user is in every server they made) |

## Auth

`src/auth.ts` salts and hashes a password with SubtleCrypto and keeps the hash
in the browser. **None of that survives the move.** Supabase Auth owns
passwords; the `credentials` key and every function that reads it are deleted
rather than ported — a client-side password hash is not a security boundary and
must not be shipped to a server-backed build.

- Sign-up: `supabase.auth.signUp({ email, password })`, then insert the
  `profiles` row (handle, display name, birthday) inside the same transaction
  via a `handle_new_user()` trigger on `auth.users`.
- The registration form's own rules stay client-side as they are: the username
  regex, the 13-year age gate, the "already taken" check (which becomes a
  `select` against `profiles.handle`, unique-indexed).
- `session` disappears. `supabase.auth.getSession()` / `onAuthStateChange`
  replace it, and `App.tsx`'s `screen` state keys off the session the same way.

## Schema

```sql
-- ---------------------------------------------------------------- profiles
create table profiles (
  id            uuid primary key references auth.users on delete cascade,
  handle        text not null unique check (handle ~ '^[a-z0-9._]{2,32}$'),
  display_name  text not null,
  pronouns      text not null default '',
  bio           text not null default '',
  status        text not null default 'online'
                  check (status in ('online','idle','dnd','invisible')),
  color         text not null default '#5865f2',
  custom_status text,
  custom_emoji  text,
  -- Discord's two-colour profile theme; null is the default dark card
  profile_theme text[2],
  banner_url    text,
  avatar_url    text,
  badges        text[] not null default '{}',
  decoration    text,               -- the collectible worn, -> collectibles.item_id
  nameplate     text,
  birthday      date not null,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------------ servers
create table servers (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references profiles on delete cascade,
  name         text not null,
  initials     text not null,
  color        text not null,
  icon_path    text,               -- storage object, not a data URL
  description  text,
  notify_level smallint not null default 1 check (notify_level between 0 and 2),
  boost_tier   smallint not null default 0 check (boost_tier between 0 and 3),
  created_at   timestamptz not null default now()
);

create table server_members (
  server_id uuid not null references servers on delete cascade,
  user_id   uuid not null references profiles on delete cascade,
  nickname  text,
  joined_at timestamptz not null default now(),
  primary key (server_id, user_id)
);

create table categories (
  id        uuid primary key default gen_random_uuid(),
  server_id uuid not null references servers on delete cascade,
  name      text not null,
  position  int  not null default 0
);

create type channel_kind as enum
  ('text','voice','announcement','stage','forum','media','rules');

create table channels (
  id              uuid primary key default gen_random_uuid(),
  server_id       uuid not null references servers on delete cascade,
  category_id     uuid references categories on delete set null,
  name            text not null,
  kind            channel_kind not null default 'text',
  topic           text,
  nsfw            boolean not null default false,
  slowmode        int not null default 0,     -- rateLimitPerUser, seconds
  position        int not null default 0,
  -- threads
  parent_id       uuid references channels on delete cascade,
  root_message_id uuid,
  archived        boolean not null default false
);

create table roles (
  id        uuid primary key default gen_random_uuid(),
  server_id uuid not null references servers on delete cascade,
  name      text not null,
  color     text,
  hoist     boolean not null default false,
  mentionable boolean not null default true,
  permissions bigint not null default 0,       -- Discord's permission bitfield
  position  int not null default 0
);

create table member_roles (
  server_id uuid not null references servers on delete cascade,
  user_id   uuid not null references profiles on delete cascade,
  role_id   uuid not null references roles on delete cascade,
  primary key (server_id, user_id, role_id)
);

create table guild_emojis (
  id        uuid primary key default gen_random_uuid(),
  server_id uuid not null references servers on delete cascade,
  name      text not null,
  code      text not null,
  image_path text
);

create table invites (
  code       text primary key,
  server_id  uuid not null references servers on delete cascade,
  channel_id uuid references channels on delete set null,
  created_by uuid references profiles on delete set null,
  uses       int not null default 0,
  max_uses   int,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table bans (
  server_id uuid not null references servers on delete cascade,
  user_id   uuid not null references profiles on delete cascade,
  reason    text not null default '',
  banned_at timestamptz not null default now(),
  primary key (server_id, user_id)
);

create table audit_log (
  id        uuid primary key default gen_random_uuid(),
  server_id uuid not null references servers on delete cascade,
  actor_id  uuid references profiles on delete set null,
  action    text not null,
  target    text not null,
  at        timestamptz not null default now()
);

-- ----------------------------------------------------------------- messages
create type message_type as enum
  ('default','reply','join','boost','pin','thread_started','call');

create table messages (
  id         uuid primary key default gen_random_uuid(),
  channel_id uuid not null references channels on delete cascade,
  author_id  uuid references profiles on delete set null,
  content    text not null default '',
  type       message_type not null default 'default',
  reply_to   uuid references messages on delete set null,
  thread_id  uuid references channels on delete set null,
  pinned     boolean not null default false,
  created_at timestamptz not null default now(),
  edited_at  timestamptz
);
create index on messages (channel_id, created_at desc);

create table attachments (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references messages on delete cascade,
  path        text not null,           -- storage object in the attachments bucket
  name        text not null,
  content_type text not null,
  size        bigint not null,
  width       int,
  height      int,
  spoiler     boolean not null default false
);

create table reactions (
  message_id uuid not null references messages on delete cascade,
  user_id    uuid not null references profiles on delete cascade,
  emoji      text not null,            -- shortcode or guild_emojis.id
  primary key (message_id, user_id, emoji)
);

create table polls (
  message_id uuid primary key references messages on delete cascade,
  question   text not null,
  multi      boolean not null default false,
  expires_at timestamptz
);

create table poll_options (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid not null references polls on delete cascade,
  label      text not null,
  emoji      text,
  position   int not null default 0
);

create table poll_votes (
  option_id uuid not null references poll_options on delete cascade,
  user_id   uuid not null references profiles on delete cascade,
  primary key (option_id, user_id)
);

-- ------------------------------------------------------- per-user, per-user
create table channel_reads (
  user_id    uuid not null references profiles on delete cascade,
  channel_id uuid not null references channels on delete cascade,
  last_read  timestamptz not null default now(),
  primary key (user_id, channel_id)
);

-- Prefs are a closed set the client owns end to end, and no query ever filters
-- on one, so they stay a single document rather than 40 columns that migrate
-- every time a setting is added.
create table user_prefs (
  user_id  uuid primary key references profiles on delete cascade,
  theme_id text not null default 'dark',
  prefs    jsonb not null default '{}'::jsonb
);

create table scheduled_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles on delete cascade,
  channel_id uuid not null references channels on delete cascade,
  text       text not null,
  send_at    timestamptz not null,
  sent_at    timestamptz
);
create index on scheduled_messages (send_at) where sent_at is null;

-- ----------------------------------------------------------- Nitro and Orbs
create table subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles on delete cascade,
  premium_type smallint not null,      -- Discord's PremiumType
  source       text not null check (source in ('purchase','gift')),
  interval     smallint not null check (interval in (1,2)),
  starts_at    timestamptz not null default now(),
  until        timestamptz not null
);
create index on subscriptions (user_id, until desc);

create table gifts (
  code        text primary key,
  buyer_id    uuid not null references profiles on delete cascade,
  tier        text not null check (tier in ('basic','nitro')),
  interval    smallint not null check (interval in (1,2)),
  created_at  timestamptz not null default now(),
  redeemed_by uuid references profiles on delete set null,
  redeemed_at timestamptz
);

-- The balance is never a column. Every grant and spend is a row, and the
-- balance is their sum — otherwise two tabs racing on "orbs = orbs - 1200"
-- hands out a decoration for free.
create table orb_ledger (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  delta   int not null,
  reason  text not null,               -- 'quest:<id>' | 'shop:<item>' | 'gift-promo'
  at      timestamptz not null default now()
);
create index on orb_ledger (user_id, at desc);

create view orb_balance as
  select user_id, coalesce(sum(delta), 0)::int as orbs
  from orb_ledger group by user_id;

create table quest_status (
  user_id      uuid not null references profiles on delete cascade,
  quest_id     text not null,
  enrolled_at  timestamptz,
  completed_at timestamptz,
  claimed_at   timestamptz,
  progress     jsonb not null default '{}'::jsonb,  -- Partial<Record<TaskType, TaskProgress>>
  primary key (user_id, quest_id)
);

create table collectibles (
  user_id  uuid not null references profiles on delete cascade,
  item_id  text not null,              -- src/shop.ts product id
  kind     text not null default 'decoration'
             check (kind in ('decoration','effect','nameplate','bundle')),
  bought_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
```

## Row Level Security

RLS on **every** table, with no `using (true)` anywhere. Two helpers carry most
of it:

```sql
create function is_member(s uuid) returns boolean language sql stable security definer as $$
  select exists (select 1 from server_members m
                 where m.server_id = s and m.user_id = auth.uid())
$$;

create function can_admin(s uuid) returns boolean language sql stable security definer as $$
  select exists (select 1 from servers g
                 where g.id = s and g.owner_id = auth.uid())
$$;
```

| Table | select | insert / update / delete |
| --- | --- | --- |
| `profiles` | anyone signed in (a profile popout is public) | `id = auth.uid()` |
| `servers` | `is_member(id)` | insert: `owner_id = auth.uid()`; update/delete: `can_admin(id)` |
| `server_members` | `is_member(server_id)` | insert self on a valid invite, or `can_admin`; delete self (leave) or `can_admin` (kick) |
| `categories`, `channels`, `roles`, `guild_emojis`, `invites`, `bans`, `audit_log` | `is_member(server_id)` | `can_admin(server_id)` |
| `messages` | `is_member((select server_id from channels where id = channel_id))` | insert: author is `auth.uid()` and a member; update/delete: author, or `can_admin` for delete |
| `attachments`, `reactions`, `polls`, `poll_options` | via the parent message's policy | author of the parent message; `reactions` insert/delete: `user_id = auth.uid()` |
| `poll_votes` | member of the poll's server | `user_id = auth.uid()` |
| `channel_reads`, `user_prefs`, `scheduled_messages`, `quest_status`, `collectibles` | `user_id = auth.uid()` | `user_id = auth.uid()` |
| `subscriptions`, `orb_ledger` | `user_id = auth.uid()` | **no client writes** — service role only |
| `gifts` | `buyer_id = auth.uid() or redeemed_by = auth.uid()` | insert/redeem through an RPC, never directly |

Three things must not be client-writable, because the client cannot be trusted
about its own money:

- `orb_ledger` — quests pay out and the shop charges through
  `security definer` RPCs (`claim_quest(quest_id)`, `buy_collectible(item_id)`)
  that check the quest is actually complete and the balance actually covers the
  price, then insert the ledger row and the `collectibles` row together.
- `subscriptions` — granted by `redeem_gift(code)` or by a payment webhook.
- `gifts.redeemed_by` — `redeem_gift(code)` sets it in one statement
  (`update gifts set redeemed_by = auth.uid() where code = $1 and redeemed_by is null returning *`),
  so a code cannot be redeemed twice.

## Realtime

Discord is a live client; three subscriptions cover what this app shows:

```ts
supabase.channel(`channel:${channelId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'messages',
      filter: `channel_id=eq.${channelId}` }, onMessage)
  .subscribe()
```

- `messages` filtered by `channel_id` — the message list, edits, deletes.
- `channels` / `categories` filtered by `server_id` — the sidebar.
- Presence (`channel.track({ status })`) for the member list's online dots and
  for voice-channel occupancy, which is presence-shaped rather than a table.

Enable the publication for `messages`, `reactions`, `channels`, `categories`
only. Everything else is polled or read on navigation.

## Storage

Two buckets replace the data URLs the app writes today:

| Bucket | Holds | Policy |
| --- | --- | --- |
| `attachments` | message uploads | insert: a member of the message's server; read: same; path `<server_id>/<channel_id>/<uuid>` |
| `avatars` | profile pictures, banners, server icons, custom emoji | insert/update: the owner; read: public |

`Attachment.url` (a `data:` URL today) becomes `attachments.path`, resolved with
`createSignedUrl` for private buckets or `getPublicUrl` for `avatars`.

Collectible artwork is **not** user data — decorations stay vendored in the
bundle under `src/assets/decorations`, and `src/shop.ts` stays a generated file.
Nothing about the Shop's catalogue belongs in Postgres; only what a user *owns*
does.

## What changes in the client

The app already funnels every read and write through `load()` / `save()` in
`src/storage.ts` and a single `useState` per key in `App.tsx`. That is the seam:

1. Add `src/repo/*.ts` — one module per aggregate (`servers`, `messages`,
   `profile`, `nitro`, `quests`, `shop`), each exporting the same shapes
   `src/data.ts` already declares, so no component's props change.
2. `load(K.x, …)` becomes `await repo.x.list()`; `save(K.x, v)` becomes the
   matching `insert`/`update`. The validators in `storage.ts` stay — they now
   guard a network response instead of a browser value, which is the same job.
3. Keep `localStorage` as the offline cache, not the source of truth: write the
   last good response under the same versioned keys so a reload paints
   immediately, then reconcile.
4. `uid()` (a client-side id) gives way to database defaults; the optimistic
   insert keeps a temporary id until the row comes back.

Do these in the order above — profiles and auth first, then servers/channels,
then messages, then the Nitro/Quests/Shop economy, which is the only part
needing server-side RPCs. Each step is independently shippable: a table that
has not been migrated yet still reads from `localStorage`.
