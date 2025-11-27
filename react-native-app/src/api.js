import { API_BASE } from "./config";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Refresh the access token using the refresh token
async function refreshAccessToken() {
  const refresh = await AsyncStorage.getItem('refresh_token');
  if (!refresh) throw new Error("No refresh token available");

  const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh access token");
  }

  const data = await res.json();
  if (!data.access) throw new Error("Refresh response missing access token");

  // Store new access token
  await AsyncStorage.setItem('access_token', data.access);

  // If token rotation is enabled, store new refresh token
  if (data.refresh) {
    await AsyncStorage.setItem('refresh_token', data.refresh);
  }

  return data.access;
}

// Main API function
export async function api(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  let token = await AsyncStorage.getItem('access_token');

  const headers = { ...(opts.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Only set Content-Type if sending a non-FormData body
  if (opts.body && !(opts.body instanceof FormData) && !headers["Content-Type"]) {
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

  // If token expired, try refreshing and retrying once
  if (res.status === 401) {
    console.log("[API] Access token expired, attempting refresh...");
    try {
      token = await refreshAccessToken();
      headers["Authorization"] = `Bearer ${token}`;
      res = await fetch(url, { ...opts, headers }); // retry request
    } catch (e) {
      console.warn("[API] Refresh failed", e);
      throw e;
    }
  }

  const text = await res.text();
  console.log("[API] ←", res.status, text);

  if (!res.ok) throw new Error(`${res.status} ${text}`);

  try { 
    return JSON.parse(text); 
  } catch { 
    return text; 
  }
}

// import { API_BASE } from "./config";
// import AsyncStorage from '@react-native-async-storage/async-storage';

// async function refreshAccessToken() {
//   const refresh = await AsyncStorage.getItem('refresh_token');
//   if (!refresh) throw new Error("No refresh token available");

//   const res = await fetch(`${API_BASE}/token/refresh/`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ refresh }),
//   });

//   if (!res.ok) {
//     throw new Error("Failed to refresh access token");
//   }

//   const data = await res.json();
//   if (!data.access) throw new Error("Refresh response missing access token");

//   await AsyncStorage.setItem('access_token', data.access);
//   return data.access;
// }

// export async function api(path, opts = {}) {
//   const url = `${API_BASE}${path}`;
//   let token = await AsyncStorage.getItem('access_token');

//   const headers = { ...(opts.headers || {}) };
//   if (token) headers["Authorization"] = `Bearer ${token}`;

//   if (opts.body && !(opts.body instanceof FormData) && !headers["Content-Type"]) {
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

//   // if token expired, try refreshing and retrying once
//   if (res.status === 401) {
//     console.log("[API] Access token expired, attempting refresh...");
//     try {
//       token = await refreshAccessToken();
//       headers["Authorization"] = `Bearer ${token}`;
//       res = await fetch(url, { ...opts, headers }); // retry request
//     } catch (e) {
//       console.warn("[API] Refresh failed", e);
//       throw e;
//     }
//   }

//   const text = await res.text();
//   console.log("[API] ←", res.status, text);

//   if (!res.ok) throw new Error(`${res.status} ${text}`);

//   try { 
//     return JSON.parse(text); 
//   } catch { 
//     return text; 
//   }
// }

// export async function api(path, opts = {}) {
//   const url = `${API_BASE}${path}`;
//   const headers = { ...(opts.headers || {}) };

//   const token = await AsyncStorage.getItem('access_token');
//   if (token) {
//     headers["Authorization"] = `Bearer ${token}`;
//   }

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
