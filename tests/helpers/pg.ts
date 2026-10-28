// An in-process Postgres (pglite) with the real migrations applied, for tests
// of the rules that live in the database. Supabase's own pieces are stubbed:
// the anon and authenticated roles, the auth schema (users, identities and
// auth.uid()) and the extensions schema.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

export async function createMigratedDb(): Promise<PGlite> {
  const db = new PGlite({ extensions: { btree_gist, pgcrypto } });
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create schema extensions;
    -- The columns Supabase's auth.users has that the seed fills in.
    create table auth.users (
      instance_id uuid,
      id uuid primary key,
      aud text,
      role text,
      email text unique,
      encrypted_password text,
      email_confirmed_at timestamptz,
      raw_app_meta_data jsonb,
      raw_user_meta_data jsonb,
      created_at timestamptz,
      updated_at timestamptz,
      confirmation_token text,
      recovery_token text,
      email_change_token_new text,
      email_change text
    );
    create table auth.identities (
      id uuid primary key,
      user_id uuid not null references auth.users (id) on delete cascade,
      provider_id text not null,
      identity_data jsonb not null,
      provider text not null,
      last_sign_in_at timestamptz,
      created_at timestamptz,
      updated_at timestamptz,
      unique (provider_id, provider)
    );
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth, public, extensions to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create extension btree_gist with schema extensions;
    create extension pgcrypto with schema extensions;
  `);
  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) await db.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
  return db;
}

// Runs a query as a signed-in user, with row level security on.
export async function asUser<T = Record<string, unknown>>(
  db: PGlite,
  user: string,
  sql: string
): Promise<T[]> {
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub', '${user}', false);`
  );
  try {
    return (await db.query<T>(sql)).rows;
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

// The error message a query as that user raises, or an empty string.
export async function errorAsUser(db: PGlite, user: string, sql: string): Promise<string> {
  try {
    await asUser(db, user, sql);
  } catch (error) {
    return (error as { message: string }).message;
  }
  return "";
}
