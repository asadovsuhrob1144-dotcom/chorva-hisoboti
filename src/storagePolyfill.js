// ---------------------------------------------------------------------------
// window.storage — Supabase-backed implementation
// ---------------------------------------------------------------------------
// The original app was built for the Claude.ai "Artifacts" sandbox, which
// provides a built-in `window.storage` key/value API (get/set/delete/list).
// That API does not exist on a normal website. This file re-implements the
// same interface on top of a Supabase Postgres table, so data is stored in
// the cloud and is shared across every device/browser that opens the site.
//
// Required setup (see the accompanying instructions):
//   1. A Supabase project.
//   2. A table called "kv_store" with columns: key (text), shared (bool),
//      value (text), updated_at (timestamptz).
//   3. Two environment variables set at build time:
//        VITE_SUPABASE_URL
//        VITE_SUPABASE_ANON_KEY
// ---------------------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
let configError = null;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  configError =
    "Supabase sozlanmagan: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY muhit o'zgaruvchilari topilmadi.";
  // eslint-disable-next-line no-console
  console.error(configError);
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function get(key, shared = false) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("kv_store")
      .select("value")
      .eq("key", key)
      .eq("shared", shared)
      .maybeSingle();
    if (error || !data) return null;
    return { key, value: data.value, shared };
  } catch (e) {
    return null;
  }
}

async function set(key, value, shared = false) {
  if (!supabase) return null;
  try {
    const { error } = await supabase
      .from("kv_store")
      .upsert(
        { key, shared, value, updated_at: new Date().toISOString() },
        { onConflict: "key,shared" }
      );
    if (error) return null;
    return { key, value, shared };
  } catch (e) {
    return null;
  }
}

async function del(key, shared = false) {
  if (!supabase) return null;
  try {
    const { error } = await supabase
      .from("kv_store")
      .delete()
      .eq("key", key)
      .eq("shared", shared);
    if (error) return null;
    return { key, deleted: true, shared };
  } catch (e) {
    return null;
  }
}

async function list(prefix = "", shared = false) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("kv_store")
      .select("key")
      .eq("shared", shared)
      .like("key", `${prefix}%`);
    if (error || !data) return null;
    return { keys: data.map((r) => r.key), prefix, shared };
  } catch (e) {
    return null;
  }
}

if (typeof window !== "undefined" && !window.storage) {
  window.storage = { get, set, delete: del, list };
}
