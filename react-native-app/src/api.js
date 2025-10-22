import { API_BASE } from "./config";
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function api(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { ...(opts.headers || {}) };

  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Only set Content-Type if we actually send a (non-FormData) body
  if (opts.body && !(opts.body instanceof FormData) && headers["Content-Type"] == null) {
    headers["Content-Type"] = "application/json";
  }

  console.log("[API] →", url, { method: opts.method || "GET" });

  let res;
  try {
    res = await fetch(url, { ...opts, headers });
  } catch (err) {
    console.log("[API] NETWORK ERROR ←", err);
    throw new Error(`NETWORK ${err?.message || err}`);
  }

  const text = await res.text();
  console.log("[API] ←", res.status, text);

  if (!res.ok) throw new Error(`${res.status} ${text}`);

  try { return JSON.parse(text); } catch { return text; }
}
// import { API_BASE } from "./config";

// export async function api(path, opts = {}) {
//   const url = `${API_BASE}${path}`;
//   const headers = { ...(opts.headers || {}) };

//   // Only set Content-Type if we actually send a (non-FormData) body
//   if (opts.body && !(opts.body instanceof FormData) && headers["Content-Type"] == null) {
//     headers["Content-Type"] = "application/json";
//   }

//   console.log("[API] →", url, { method: opts.method || "GET" });

//   let res;
//   try {
//     res = await fetch(url, { ...opts, headers });
//   } catch (err) {
//     console.log("[API] NETWORK ERROR ←", err);
//     throw new Error(`NETWORK ${err?.message || err}`);
//   }

//   const text = await res.text();
//   console.log("[API] ←", res.status, text);

//   if (!res.ok) throw new Error(`${res.status} ${text}`);

//   try { return JSON.parse(text); } catch { return text; }
// }