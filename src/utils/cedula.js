export const CEDULA_REGEX = /^\d{3}-\d{6}-\d{4}[A-Za-z]$/;

export function validateCedula(value) {
  if (!value) return false;
  const v = String(value).trim();
  return CEDULA_REGEX.test(v);
}

// Normalize input to the expected format when possible:
// removes non-alphanumeric, uppercases, then groups into 3-6-4+letter -> "121-261204-1001F"
export function formatCedula(raw) {
  if (!raw) return '';
  let s = String(raw).toUpperCase();
  // keep only alphanumerics
  s = s.replace(/[^0-9A-Z]/g, '');
  // need at least 14 characters (3+6+4+1)
  if (s.length < 14) return raw.toUpperCase();
  const a = s.slice(0, 3);
  const b = s.slice(3, 9);
  const c = s.slice(9, 13);
  const d = s.slice(13, 14);
  return `${a}-${b}-${c}${d}`;
}
