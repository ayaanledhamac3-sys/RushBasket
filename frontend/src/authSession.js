export function persistAuthSession(token, user) {
  localStorage.setItem('authToken', token);
  localStorage.setItem(
    'userData',
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || null,
    })
  );
  window.dispatchEvent(new Event('authStateChanged'));
}

export function getAuthToken() {
  return localStorage.getItem('authToken');
}

function parseJwtPayload(token) {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

export function hasValidSession() {
  const token = getAuthToken();
  if (!token) return false;

  const payload = parseJwtPayload(token);
  if (!payload?.exp) return false;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp > nowInSeconds;
}

export function clearAuthSession() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  window.dispatchEvent(new Event('authStateChanged'));
}
