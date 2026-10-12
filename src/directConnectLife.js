import AsyncStorage from '@react-native-async-storage/async-storage';
import forge from 'node-forge';

const STORAGE_KEY_SESSION = '@connectlife_direct_session';

const API_KEY = '4_yhTWQmHFpZkQZDSV1uV-_A';
const LOGIN_URL = 'https://accounts.eu1.gigya.com/accounts.login';
const JWT_URL = 'https://accounts.eu1.gigya.com/accounts.getJWT';
const OAUTH_AUTHORIZE_URL = 'https://oauth.hijuconn.com/oauth/authorize';
const OAUTH_TOKEN_URL = 'https://oauth.hijuconn.com/oauth/token';

const CLIENT_ID = '5065059336212';
const CLIENT_SECRET = '07swfKgvJhC3ydOUS9YV_SwVz0i4LKqlOLGNUukYHVMsJRF1b-iWeUGcNlXyYCeK';
const REDIRECT_URI = 'https://api.connectlife.io/swagger/oauth2-redirect.html';

const GATEWAY_BASE_URL = 'https://clife-eu-gateway.hijuconn.com';
const GATEWAY_DEVICE_LIST_URL = `${GATEWAY_BASE_URL}/clife-svc/pu/get_device_status_list`;
const GATEWAY_UPDATE_URL = `${GATEWAY_BASE_URL}/device/pu/property/set`;

const GATEWAY_APP_ID = '47110565134383';
const GATEWAY_APP_SECRET = 'yOzhz6junYno-nmULM3Wr7PU_dpSZN22ZdluvVWZ4uW5ZwwG8fIGCHTbrhcnU-iv';
const GATEWAY_LANGUAGE_ID = '12';
const GATEWAY_TIMEZONE = '1.0';
const GATEWAY_VERSION = '5.0';
const GATEWAY_SIGN_SUFFIX = 'D9519A4B756946F081B7BB5B5E8D1197';

const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyyWrNG6q475HIHu7sMVu
vHof6vlgPeixmxa4EL/UsvVvHPz33NnWoQetQqit9TBNzUjMXw0KlY9PXM4iqHUU
U+dSyNDq1jZWIiJ2C2FccppswJtIKL3NRMFvT9PFh6NlP/4FUcQKojgKFbF7Kacc
JPKYHlwaO7qgoIjLxAHlSOXGpucJcOkPzT2EqsSVnW8sn8kenvNmghXDayhgxsh6
AyxK4kehJplEnmX/iYCfNoFXknGcLqFWYccgBz3fybvx30C/0IgU1980L8QsUAv5
esZmN8ugnbRgLRxKRlkQQLxQAiZMZdKTAx665YflT3YMHJvEFE8c2XFgoxHzSMc4
BwIDAQAB
-----END PUBLIC KEY-----`;

function generateRandStr() {
  try {
    const bytes = forge.random.getBytesSync(16);
    return forge.util.bytesToHex(bytes);
  } catch (e) {
    // Fallback: guaranteed safe in any JS environment
    let s = '';
    const hex = '0123456789abcdef';
    for (let i = 0; i < 32; i++) {
      s += hex[Math.floor(Math.random() * 16)];
    }
    return s;
  }
}

function signGatewayPayload(payload) {
  const keys = Object.keys(payload).filter((k) => k !== 'sign').sort();
  const unsignedItems = keys.map((key) => {
    let val = payload[key];
    if (typeof val === 'object' && val !== null) {
      val = JSON.stringify(val);
    }
    return `${key}=${val}`;
  });

  const fullStr = unsignedItems.join('&') + GATEWAY_SIGN_SUFFIX;
  const md = forge.md.sha256.create();
  md.update(fullStr, 'utf8');
  const digest = md.digest().bytes();

  const publicKey = forge.pki.publicKeyFromPem(PUBLIC_KEY_PEM);
  const encrypted = publicKey.encrypt(digest, 'RSAES-PKCS1-V1_5');
  return forge.util.encode64(encrypted);
}

// In-memory active session cache
let currentSession = null;

export async function loadSavedSession() {
  if (currentSession) return currentSession;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_SESSION);
    if (raw) {
      currentSession = JSON.parse(raw);
      return currentSession;
    }
  } catch (e) {
    console.warn('Error reading stored session:', e);
  }
  return null;
}

export async function saveSession(session) {
  currentSession = session;
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
  } catch (e) {
    console.warn('Error saving session:', e);
  }
}

export async function clearSession() {
  currentSession = null;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_SESSION);
  } catch (e) {
    console.warn('Error clearing session:', e);
  }
}

async function refreshAccessToken(session) {
  if (!session || !session.refreshToken) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const tokenParams = `client_id=${encodeURIComponent(CLIENT_ID)}&client_secret=${encodeURIComponent(CLIENT_SECRET)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&grant_type=refresh_token&refresh_token=${encodeURIComponent(session.refreshToken)}`;

  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    // If refresh token fails, try fresh login if we have saved credentials
    if (session.username && session.password) {
      return await directLogin(session.username, session.password);
    }
    throw new Error('Não foi possível renovar a sessão. Faça login novamente.');
  }

  session.accessToken = data.access_token;
  session.refreshToken = data.refresh_token || session.refreshToken;
  session.expiresAt = Date.now() + (parseInt(data.expires_in, 10) - 120) * 1000;
  await saveSession(session);
  return session;
}

async function ensureValidAccessToken() {
  let session = await loadSavedSession();
  if (!session || !session.accessToken) {
    throw new Error('Nenhuma sessão salva.');
  }

  // If token is about to expire within 90 seconds
  if (session.expiresAt && Date.now() >= session.expiresAt - 90000) {
    session = await refreshAccessToken(session);
  }

  return session.accessToken;
}

export async function directLogin(username, password) {
  // Step 1: Gigya Login
  const gigyaBody = `loginID=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&APIKey=${encodeURIComponent(API_KEY)}`;

  let gigyaRes;
  try {
    gigyaRes = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: gigyaBody,
    });
  } catch (err) {
    throw new Error(`Falha de conexão com os servidores ConnectLife: ${err.message}`);
  }

  const gigyaData = await gigyaRes.json().catch(() => ({}));
  if (gigyaData.errorCode) {
    if (gigyaData.errorCode === 403042) {
      throw new Error(
        'E-mail ou senha incorretos no ConnectLife.\n(Se sua conta foi criada via Google Login no app oficial, use "Esqueci minha senha" no app ConnectLife para definir uma senha direta).'
      );
    }
    if (gigyaData.errorCode === 206001) {
      throw new Error(
        'Termos pendentes. Abra o aplicativo oficial ConnectLife para aceitar os termos atualizados.'
      );
    }
    if (gigyaData.errorCode === 403120) {
      throw new Error(
        'Conta temporariamente bloqueada por excesso de tentativas. Aguarde cerca de 10 minutos.'
      );
    }
    throw new Error(`Erro Gigya (${gigyaData.errorCode}): ${gigyaData.errorMessage || 'Falha ao autenticar'}`);
  }

  const uid = gigyaData.UID;
  const loginToken = gigyaData.sessionInfo && gigyaData.sessionInfo.cookieValue;
  if (!uid || !loginToken) {
    throw new Error('Resposta de autenticação incompleta da Gigya.');
  }

  // Step 2: Gigya JWT
  const jwtBody = `APIKey=${encodeURIComponent(API_KEY)}&login_token=${encodeURIComponent(loginToken)}`;
  const jwtRes = await fetch(JWT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: jwtBody,
  });
  const jwtData = await jwtRes.json().catch(() => ({}));
  const idToken = jwtData.id_token;
  if (!idToken) {
    throw new Error('Falha ao obter JWT do ConnectLife.');
  }

  // Step 3: OAuth Authorize Code
  const authRes = await fetch(OAUTH_AUTHORIZE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      idToken: idToken,
      response_type: 'code',
      thirdType: 'CDC',
      thirdClientId: uid,
    }),
  });
  const authData = await authRes.json().catch(() => ({}));
  const code = authData.code;
  if (!code) {
    throw new Error('Falha na autorização OAuth do ConnectLife.');
  }

  // Step 4: OAuth Token Exchange
  const tokenBody = `client_id=${encodeURIComponent(CLIENT_ID)}&client_secret=${encodeURIComponent(CLIENT_SECRET)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&grant_type=authorization_code&code=${encodeURIComponent(code)}`;
  const tokenRes = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody,
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenData.access_token) {
    throw new Error('Falha ao gerar access_token do ConnectLife.');
  }

  const session = {
    username,
    password,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: Date.now() + (parseInt(tokenData.expires_in, 10) - 120) * 1000,
  };
  await saveSession(session);

  // Step 5: Fetch Devices
  return await directGetAppliances();
}

function formatRawAppliance(a) {
  return {
    puid: a.puid,
    deviceId: a.deviceId,
    name: a.deviceNickName || 'Ar Condicionado',
    room: a.roomName || 'Geral',
    type: a.deviceTypeName || 'airconditioner',
    typeCode: a.deviceTypeCode || '009',
    status: a.statusList || {},
  };
}

export async function directGetAppliances() {
  const token = await ensureValidAccessToken();
  const timestamp = String(Date.now());
  const randStr = generateRandStr();

  const reqPayload = {
    accessToken: token,
    appId: GATEWAY_APP_ID,
    appSecret: GATEWAY_APP_SECRET,
    languageId: GATEWAY_LANGUAGE_ID,
    randStr: randStr,
    timeStamp: timestamp,
    timezone: GATEWAY_TIMEZONE,
    version: GATEWAY_VERSION,
  };
  reqPayload.sign = signGatewayPayload(reqPayload);

  const qs = Object.keys(reqPayload)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(reqPayload[k])}`)
    .join('&');
  const fullUrl = `${GATEWAY_DEVICE_LIST_URL}?${qs}`;

  const res = await fetch(fullUrl, {
    headers: { 'User-Agent': 'connectlife/dev' },
  });

  const data = await res.json().catch(() => ({}));
  const gatewayResp = data.response;
  if (!gatewayResp) {
    throw new Error('Resposta inválida do gateway ConnectLife.');
  }

  // Token rejected? Try refresh once
  if (gatewayResp.errorCode === 100026) {
    const session = await loadSavedSession();
    await refreshAccessToken(session);
    return await directGetAppliances();
  }

  const list = gatewayResp.deviceList || [];
  return list.map(formatRawAppliance);
}

export async function directSendControl(puid, properties) {
  const token = await ensureValidAccessToken();
  const timestamp = String(Date.now());
  const randStr = generateRandStr();

  const reqPayload = {
    accessToken: token,
    appId: GATEWAY_APP_ID,
    appSecret: GATEWAY_APP_SECRET,
    languageId: GATEWAY_LANGUAGE_ID,
    randStr: randStr,
    timeStamp: timestamp,
    timezone: GATEWAY_TIMEZONE,
    version: GATEWAY_VERSION,
    puid: puid,
    properties: properties,
  };
  reqPayload.sign = signGatewayPayload(reqPayload);

  const res = await fetch(GATEWAY_UPDATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'connectlife/dev',
    },
    body: JSON.stringify(reqPayload),
  });

  const data = await res.json().catch(() => ({}));
  const gatewayResp = data.response;
  if (!gatewayResp) {
    throw new Error('Falha ao comunicar com a nuvem ConnectLife.');
  }

  if (gatewayResp.resultCode !== 0 && gatewayResp.resultCode !== '0') {
    if (gatewayResp.errorCode === 100026) {
      const session = await loadSavedSession();
      await refreshAccessToken(session);
      return await directSendControl(puid, properties);
    }
    throw new Error(`Comando rejeitado (${gatewayResp.errorCode}): ${gatewayResp.errorDesc || 'Erro no aparelho'}`);
  }

  // Small delay for cloud state reflection
  await new Promise((r) => setTimeout(r, 600));
  return await directGetAppliances();
}

export async function hasDirectSession() {
  const session = await loadSavedSession();
  return !!(session && session.accessToken);
}
