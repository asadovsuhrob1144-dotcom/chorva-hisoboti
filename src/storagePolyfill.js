// ---------------------------------------------------------------------------
// window.storage polyfill
// ---------------------------------------------------------------------------
// The original app was built for the Claude.ai "Artifacts" sandbox, which
// provides a built-in `window.storage` key/value API (get/set/delete/list).
// That API does not exist on a normal website, so once deployed on its own
// domain (e.g. Vercel) every call to window.storage would throw and crash
// the app with a blank/white screen.
//
// This file re-implements the same API on top of the browser's own
// localStorage, so the app keeps working once it's a real, standalone site.
//
// NOTE: localStorage is per-browser / per-device. The "shared" flag from the
// original API (meant to sync data across every user of the artifact) is
// kept only for interface-compatibility — it does NOT sync data between
// different computers or phones. Each device will have its own local data.
// ---------------------------------------------------------------------------

const PREFIX = "livestock-app-storage:";

function fullKey(key, shared) {
  return `${PREFIX}${shared ? "shared" : "personal"}:${key}`;
}

async function get(key, shared = false) {
  try {
    const raw = window.localStorage.getItem(fullKey(key, shared));
    if (raw === null) return null;
    return { key, value: raw, shared };
  } catch (e) {
    return null;
  }
}

async function set(key, value, shared = false) {
  try {
    window.localStorage.setItem(fullKey(key, shared), value);
    return { key, value, shared };
  } catch (e) {
    return null;
  }
}

async function del(key, shared = false) {
  try {
    window.localStorage.removeItem(fullKey(key, shared));
    return { key, deleted: true, shared };
  } catch (e) {
    return null;
  }
}

async function list(prefix = "", shared = false) {
  try {
    const searchPrefix = fullKey(prefix, shared);
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(searchPrefix)) {
        keys.push(k.slice(fullKey("", shared).length));
      }
    }
    return { keys, prefix, shared };
  } catch (e) {
    return null;
  }
}

if (typeof window !== "undefined" && !window.storage) {
  window.storage = { get, set, delete: del, list };
}
