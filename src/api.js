import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  directLogin,
  directGetAppliances,
  directSendControl,
  hasDirectSession,
  clearSession,
  loadSavedSession,
} from './directConnectLife';

const STORAGE_KEY_SERVER_URL = '@hisense_ac_server_url';
const STORAGE_KEY_MODE = '@hisense_ac_connection_mode'; // 'direct' or 'custom_server'
const STORAGE_KEY_SAVED_EMAIL = '@hisense_ac_saved_email';

const DEFAULT_URL =
  Platform.OS === 'android' ? 'http://192.168.1.100:8080' : 'http://localhost:8080';

export async function getConnectionMode() {
  try {
    const mode = await AsyncStorage.getItem(STORAGE_KEY_MODE);
    if (mode === 'custom_server') return 'custom_server';
  } catch (e) {
    console.warn('Error reading mode:', e);
  }
  return 'direct'; // Default is 100% Direct Cloud (Serverless)!
}

export async function setConnectionMode(mode) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_MODE, mode);
  } catch (e) {
    console.warn('Error saving mode:', e);
  }
}

export async function getSavedEmail() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_SAVED_EMAIL);
    if (saved) return saved;
    const session = await loadSavedSession();
    return (session && session.username) || '';
  } catch (e) {
    return '';
  }
}

export async function getServerUrl() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_SERVER_URL);
    if (saved && saved.trim()) return saved.trim().replace(/\/+$/, '');
  } catch (e) {
    console.warn('Error reading server URL:', e);
  }
  return DEFAULT_URL;
}

export async function setServerUrl(url) {
  try {
    const cleanUrl = (url || '').trim().replace(/\/+$/, '');
    await AsyncStorage.setItem(STORAGE_KEY_SERVER_URL, cleanUrl);
    return cleanUrl;
  } catch (e) {
    console.warn('Error saving server URL:', e);
    return url;
  }
}

export async function checkAuthOrAppliances() {
  const mode = await getConnectionMode();

  if (mode === 'direct') {
    const hasSession = await hasDirectSession();
    if (!hasSession) {
      return { authenticated: false };
    }
    try {
      const appliances = await directGetAppliances();
      return { authenticated: true, appliances };
    } catch (err) {
      console.warn('Direct cloud check error:', err.message);
      if (
        err.message &&
        (err.message.includes('Sessão') ||
          err.message.includes('autentic') ||
          err.message.includes('expirada'))
      ) {
        return { authenticated: false };
      }
      return { authenticated: false, networkError: err.message };
    }
  }

  // Custom server mode fallback
  const base = await getServerUrl();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${base}/api/appliances`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.status === 401) {
      return { authenticated: false };
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Servidor indisponível`);
    }
    const data = await res.json();
    return { authenticated: true, appliances: data.appliances || [] };
  } catch (err) {
    if (err.message && err.message.includes('HTTP')) throw err;
    throw new Error(`Falha de rede ao conectar em ${base}: ${err.message || 'Sem conexão'}`);
  }
}

export async function login(username, password, serverUrl = null, forceDirect = true) {
  if (username) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_SAVED_EMAIL, username.trim());
    } catch (e) {}
  }

  const mode = forceDirect ? 'direct' : await getConnectionMode();

  if (mode === 'direct') {
    await setConnectionMode('direct');
    const apps = await directLogin(username.trim(), password.trim());
    return apps;
  }

  // Custom server mode
  if (serverUrl) {
    await setServerUrl(serverUrl);
  }
  const base = serverUrl ? serverUrl.trim().replace(/\/+$/, '') : await getServerUrl();

  let res;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    res = await fetch(`${base}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    throw new Error(
      `Falha de conexão com ${base}:\n${err.message}.\n\nCertifique-se de que o computador e o celular estão no mesmo Wi-Fi e use o IP local do computador.`
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Erro ${res.status}: Falha ao autenticar`);
  }
  return data.appliances || [];
}

export async function sendControlCommand(puid, properties) {
  const mode = await getConnectionMode();

  if (mode === 'direct') {
    return await directSendControl(puid, properties);
  }

  // Custom server mode
  const base = await getServerUrl();
  let res;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    res = await fetch(`${base}/api/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ puid, properties }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    throw new Error(`Falha ao enviar comando para ${base}: ${err.message}`);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Comando rejeitado pelo aparelho');
  }
  return data.appliances || [];
}

export async function logout() {
  await clearSession();
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_SAVED_EMAIL);
  } catch (e) {}
  const mode = await getConnectionMode();
  if (mode === 'custom_server') {
    try {
      const base = await getServerUrl();
      await fetch(`${base}/api/logout`, { method: 'POST' }).catch(() => {});
    } catch (e) {}
  }
}

export async function testConnection(customUrl = null) {
  const base = (customUrl || (await getServerUrl())).trim().replace(/\/+$/, '');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${base}/api/appliances`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.status === 200 || res.status === 401) {
      return { ok: true, status: res.status, url: base };
    }
    return { ok: false, error: `Servidor retornou HTTP ${res.status}`, url: base };
  } catch (err) {
    return {
      ok: false,
      error: `Não foi possível conectar em ${base}. Verifique o IP e porta.`,
      rawError: err.message,
      url: base,
    };
  }
}
