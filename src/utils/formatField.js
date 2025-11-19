export default function formatField(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    try {
      // common readable fields
      if (v.Nombre || v.nombre) return v.Nombre || v.nombre;
      if (v.id) return v.id;
      if (v.ClienteId) return v.ClienteId;
      // Timestamps
      if (typeof v.toDate === 'function') return v.toDate().toLocaleString();
      if (v.seconds && typeof v.seconds === 'number') return new Date(v.seconds * 1000).toLocaleString();
      // fallback to compact json
      return JSON.stringify(v);
    } catch (e) {
      return '';
    }
  }
  return String(v);
}
