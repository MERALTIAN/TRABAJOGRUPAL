import { collection, getDocs } from 'firebase/firestore';
import { db } from '../database/firebaseconfig.js';

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value.seconds && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export async function getIngresosMensuales(year) {
  // Devuelve [{ month: 'Ene', amount: 1234 }, ...]
  try {
    const q = collection(db, 'Factura');
    const snap = await getDocs(q);
    const months = new Array(12).fill(0);

    snap.docs.forEach(d => {
      const raw = d.data();
      const fecha = toDate(raw.Fecha) || toDate(raw.fecha) || toDate(raw.Fecha_Pago) || toDate(raw.createdAt);
      if (!fecha) return;
      const y = fecha.getFullYear();
      if (year && y !== year) return;
      const m = fecha.getMonth();
      const monto = Number(raw.Monto_Decimal ?? raw.monto ?? raw.Monto ?? raw.MontoDecimal ?? 0) || 0;
      months[m] += monto;
    });

    const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return months.map((amount, i) => ({ month: names[i], amount }));
  } catch (e) {
    console.error('getIngresosMensuales error', e);
    return [];
  }
}


export async function getEvolucionContratos(year) {
  // Devuelve [{ month: 'Ene', value: 12 }, ...] contando contratos por mes
  try {
    const snap = await getDocs(collection(db, 'Contrato'));
    const months = new Array(12).fill(0);

    snap.docs.forEach(d => {
      const raw = d.data();
      const fecha = toDate(raw.Fecha_Creacion) || toDate(raw.fechaCreacion) || toDate(raw.Fecha_Inicio) || toDate(raw.FechaInicio) || toDate(raw.createdAt);
      if (!fecha) return;
      const y = fecha.getFullYear();
      if (year && y !== year) return;
      const m = fecha.getMonth();
      months[m] += 1;
    });

    const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return months.map((value, i) => ({ month: names[i], value }));
  } catch (e) {
    console.error('getEvolucionContratos error', e);
    return [];
  }
}

// Total cobrado por agente en el año dado. Devuelve [{ agent: 'Nombre', total: 1234 }, ...]


// Cuenta de contratos por estado: activos, vencidos, pendientes
export async function getEstadoContratosCounts() {
  try {
    const snap = await getDocs(collection(db, 'Contrato'));
    const counts = { activos: 0, vencidos: 0, pendientes: 0 };

    snap.docs.forEach(d => {
      const raw = d.data();
      const estado = (raw.Estado || raw.estado || raw.EstadoContrato || raw.estadoContrato || '').toString().toLowerCase();
      if (estado.includes('vig') || estado.includes('activo')) counts.activos += 1;
      else if (estado.includes('venc') || estado.includes('vencido') || estado.includes('vencidos')) counts.vencidos += 1;
      else if (estado.includes('pend') || estado.includes('pendiente')) counts.pendientes += 1;
      else counts.activos += 1; // fallback
    });

    return counts;
  } catch (e) {
    console.error('getEstadoContratosCounts error', e);
    return { activos: 0, vencidos: 0, pendientes: 0 };
  }
}


// Clientes activos vs inactivos: considera activo si tiene al menos 1 contrato con estado activo
export async function getClientesActivosInactivos() {
  try {
    const clientesSnap = await getDocs(collection(db, 'Cliente'));
    const contratosSnap = await getDocs(collection(db, 'Contrato'));

    const totalClientes = clientesSnap.size;
    const clientesConContratoActivo = new Set();

    contratosSnap.docs.forEach(d => {
      const raw = d.data();
      const estado = (raw.Estado || raw.estado || '').toString().toLowerCase();
      if (estado.includes('vig') || estado.includes('activo')) {
        const clientId = raw.ClienteId || raw.Cliente || raw.Cliente_id || raw.ClienteID || null;
        if (clientId) clientesConContratoActivo.add(clientId.toString());
      }
    });

    const activos = clientesConContratoActivo.size;
    const inactivos = Math.max(0, totalClientes - activos);
    return { activos, inactivos };
  } catch (e) {
    console.error('getClientesActivosInactivos error', e);
    return { activos: 0, inactivos: 0 };
  }
}

// Pagos para scatter: devuelve [{ x: timestamp, y: amount, client: 'id or name' }, ...]
export async function getPagosScatter(limit = 200) {
  try {
    const snap = await getDocs(collection(db, 'Factura'));
    const arr = [];
    snap.docs.forEach(d => {
      const raw = d.data();
      const fecha = toDate(raw.Fecha) || toDate(raw.fecha) || toDate(raw.Fecha_Pago) || toDate(raw.createdAt);
      if (!fecha) return;
      const monto = Number(raw.Monto_Decimal ?? raw.monto ?? raw.Monto ?? raw.MontoDecimal ?? 0) || 0;
      const client = raw.ClienteId || raw.Cliente || raw.ClienteNombre || raw.ClienteNombre || null;
      arr.push({ x: fecha.getTime(), y: monto, client: client ? client.toString() : null });
    });
    // ordenar por fecha asc
    arr.sort((a, b) => a.x - b.x);
    return arr.slice(0, limit);
  } catch (e) {
    console.error('getPagosScatter error', e);
    return [];
  }
}

// Ingresos acumulados por mes (array de 12 meses) usando getIngresosMensuales
export async function getIngresosAcumulados(year) {
  try {
    const monthly = await getIngresosMensuales(year);
    let acc = 0;
    return monthly.map(m => {
      acc += Number(m.amount || 0);
      return { month: m.month, amount: acc };
    });
  } catch (e) {
    console.error('getIngresosAcumulados error', e);
    return [];
  }
}

// (Agent metrics removed)

// Costos y presupuesto: intenta leer colección 'Costos' si existe, sino retorna un ejemplo
export async function getCostsBreakdown() {
  try {
    const snap = await getDocs(collection(db, 'Costos'));
    if (!snap || snap.empty) {
      // ejemplo
      return { labels: ['Desarrollo','Pruebas','Hosting','Infra'], values: [12000, 3000, 4000, 6000] };
    }
    const labels = [];
    const values = [];
    snap.docs.forEach(d => {
      const raw = d.data();
      labels.push(raw.categoria || raw.nombre || d.id);
      values.push(Number(raw.monto || raw.valor || raw.cantidad || 0));
    });
    return { labels, values };
  } catch (e) {
    console.error('getCostsBreakdown error', e);
    return { labels: ['Desarrollo','Pruebas','Hosting','Infra'], values: [12000,3000,4000,6000] };
  }
}

// Cuenta de usuarios por rol (ej: Administrador, Agente, Cliente)
export async function getUsuariosPorRol() {
  try {
    const snap = await getDocs(collection(db, 'Usuario'));
    const counts = {};
    snap.docs.forEach(d => {
      const raw = d.data();
      const rol = (raw.rol || raw.Rol || raw.role || raw.Role || 'Sin rol').toString();
      counts[rol] = (counts[rol] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, count: counts[k] }));
  } catch (e) {
    console.error('getUsuariosPorRol error', e);
    return [];
  }
}

// Distribución / conteo de servicios registrados
export async function getDistribucionServicios() {
  try {
    const snap = await getDocs(collection(db, 'Servicio'));
    if (!snap || snap.empty) return [];
    const counts = {};
    snap.docs.forEach(d => {
      const raw = d.data();
      const name = (raw.nombre || raw.Nombre || raw.nombreServicio || raw.name || raw.titulo || d.id).toString();
      counts[name] = (counts[name] || 0) + 1;
    });
    const arr = Object.keys(counts).map(k => ({ name: k, count: counts[k] }));
    // ordenar por cantidad descendente
    arr.sort((a, b) => b.count - a.count);
    return arr;
  } catch (e) {
    console.error('getDistribucionServicios error', e);
    return [];
  }
}

// Conteo simple de facturas por estado: pagada, pendiente, vencida, otro
// Implementación para facturas por estado (pagada, pendiente, vencida, otro)
export async function getFacturasPorEstado() {
  try {
    const snap = await getDocs(collection(db, 'Factura'));
    const counts = { pagada: 0, pendiente: 0, vencida: 0, otro: 0 };
    snap.docs.forEach(d => {
      const raw = d.data();
      const estado = (raw.Estado || raw.estado || raw.EstadoPago || raw.estadoPago || raw.estado_factura || '').toString().toLowerCase();
      if (!estado) { counts.otro += 1; return; }
      if (estado.includes('pag')) counts.pagada += 1;
      else if (estado.includes('pend')) counts.pendiente += 1;
      else if (estado.includes('venc')) counts.vencida += 1;
      else counts.otro += 1;
    });
    return counts;
  } catch (e) {
    console.error('getFacturasPorEstado error', e);
    return { pagada:0, pendiente:0, vencida:0, otro:0 };
  }
}

// --- Contratos-based metrics
// Ingresos mensuales calculados a partir de la colección 'Contrato'
export async function getIngresosMensualesFromContratos(year) {
  try {
    const snap = await getDocs(collection(db, 'Contrato'));
    const months = new Array(12).fill(0);

    snap.docs.forEach(d => {
      const raw = d.data();
      const fecha = toDate(raw.Fecha_Creacion) || toDate(raw.fechaCreacion) || toDate(raw.FechaInicio) || toDate(raw.Fecha_Inicio) || toDate(raw.createdAt);
      if (!fecha) return;
      const y = fecha.getFullYear();
      if (year && y !== year) return;
      const m = fecha.getMonth();
      const monto = Number(raw.Monto ?? raw.monto ?? raw.Valor ?? raw.Total ?? raw.Precio ?? 0) || 0;
      months[m] += monto;
    });

    const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return months.map((amount, i) => ({ month: names[i], amount }));
  } catch (e) {
    console.error('getIngresosMensualesFromContratos error', e);
    return [];
  }
}

// Total cobrado por agente calculado a partir de la colección 'Contrato'
export async function getCobrosPorAgenteFromContratos(year) {
  try {
    const snap = await getDocs(collection(db, 'Contrato'));
    const byAgent = {};
    snap.docs.forEach(d => {
      const raw = d.data();
      const fecha = toDate(raw.Fecha_Creacion) || toDate(raw.fechaCreacion) || toDate(raw.createdAt);
      if (!fecha) return;
      if (year && fecha.getFullYear() !== year) return;
      const agent = (raw.Agente || raw.agente || raw.AgenteCobrador || raw.Cobrador || 'Sin agente').toString();
      const monto = Number(raw.Monto ?? raw.monto ?? raw.Total ?? raw.Valor ?? 0) || 0;
      if (!byAgent[agent]) byAgent[agent] = { agent, total: 0, count: 0 };
      byAgent[agent].total += monto;
      byAgent[agent].count += 1;
    });
    const arr = Object.keys(byAgent).map(k => byAgent[k]);
    arr.sort((a,b) => b.total - a.total);
    return arr;
  } catch (e) {
    console.error('getCobrosPorAgenteFromContratos error', e);
    return [];
  }
}

// Reporte: historial de pagos por cliente
export async function getPagosPorCliente() {
  try {
    const snap = await getDocs(collection(db, 'Factura'));
    const entries = [];
    const byClient = {};

    snap.docs.forEach(d => {
      const raw = d.data();
      const fecha = toDate(raw.Fecha) || toDate(raw.fecha) || toDate(raw.Fecha_Pago) || toDate(raw.createdAt);
      if (!fecha) return;
      const monto = Number(raw.Monto_Decimal ?? raw.monto ?? raw.Monto ?? raw.MontoDecimal ?? 0) || 0;
      const metodo = raw.MetodoPago || raw.Metodo || raw.MedioPago || raw.PaymentMethod || '';
      const estado = raw.Estado || raw.estado || raw.EstadoPago || raw.estadoPago || '';
      const client = raw.ClienteNombre || raw.Cliente || raw.ClienteId || raw.ClienteID || raw.Cliente_id || 'Sin cliente';

      const clientKey = client ? client.toString() : 'Sin cliente';
      entries.push({ client: clientKey, date: fecha.toISOString(), amount: monto, method: metodo?.toString?.() || '', status: estado?.toString?.() || '' });

      if (!byClient[clientKey]) byClient[clientKey] = { client: clientKey, total: 0, count: 0 };
      byClient[clientKey].total += monto;
      byClient[clientKey].count += 1;
    });

    const summary = Object.keys(byClient).map(k => byClient[k]);
    // ordenar por total descendente
    summary.sort((a, b) => b.total - a.total);
    return { entries, summary };
  } catch (e) {
    console.error('getPagosPorCliente error', e);
    return { entries: [], summary: [] };
  }
}

// Reporte: ventas por servicio (cantidad y total generado)
// (getVentasPorServicioReporte removed)

// Cobros por agente calculados a partir de la colección 'Factura' o 'Cobro'
export async function getCobrosPorAgente(year) {
  try {
    // intentaremos leer colección 'Cobro' primero, si no existe leer 'Factura'
    let snap = await getDocs(collection(db, 'Cobro'));
    if (!snap || snap.empty) snap = await getDocs(collection(db, 'Factura'));
    const byAgent = {};
    snap.docs.forEach(d => {
      const raw = d.data();
      const fecha = toDate(raw.Fecha) || toDate(raw.fecha) || toDate(raw.Fecha_Pago) || toDate(raw.createdAt);
      if (!fecha) return;
      if (year && fecha.getFullYear() !== year) return;
      const agent = (raw.Agente || raw.agente || raw.AgenteCobrador || raw.Cobrador || raw.CobradorNombre || raw.Cobrador_Nombre || 'Sin agente').toString();
      const monto = Number(raw.Monto_Decimal ?? raw.monto ?? raw.Monto ?? raw.Total ?? 0) || 0;
      if (!byAgent[agent]) byAgent[agent] = { agent, total: 0, count: 0 };
      byAgent[agent].total += monto;
      byAgent[agent].count += 1;
    });
    const arr = Object.keys(byAgent).map(k => byAgent[k]);
    arr.sort((a,b) => b.total - a.total);
    return arr;
  } catch (e) {
    console.error('getCobrosPorAgente error', e);
    return [];
  }
}

// Reporte: actividad de agentes cobradores (cantidad de cobros + total recolectado)
// (getCobrosPorAgenteReporte removed)
