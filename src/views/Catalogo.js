import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  LayoutAnimation,
  ScrollView,
  FlatList,
  useWindowDimensions,
} from "react-native";
import SafeModal from '../Components/SafeModal';
import formatField from '../utils/formatField';
import { db } from "../database/firebaseconfig.js";
import { collection, onSnapshot, getDocs, query, where } from "firebase/firestore";
import { safeUpdateDoc } from '../utils/firestoreUtils';

/**
 * Cambio visual completo (manteniendo la lógica):
 * - Tabs superiores (Ataúdes / Servicios)
 * - Tarjetas modernas con imagen, título, descripción corta, precio y acciones
 * - Modal grande estilo "ventana web" con imagen grande, características y caja de precio
 * - Animación simple con LayoutAnimation al cambiar tab
 * - Iconos con emoji (compatibles sin dependencias). Si querés iconos vectoriales instalamos react-native-vector-icons.
 *
 * NO se modificó: listeners de Firestore, estructura de payload, ni guardarEnContrato.
 */

// Nota: en la Nueva Arquitectura de RN la llamada a
// UIManager.setLayoutAnimationEnabledExperimental es un no-op y lanza un warning.
// Para evitar ese warning lo comentamos. Si usas una versión antigua de RN
// y quieres habilitarlo, puedes descomentar la siguiente línea.
// if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

const formatoDinero = (v) => {
  const n = Number(v || 0);
  return `C$ ${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
};

const CardItem = ({ item, onDetails, onSave, type }) => {
  const descripcion =
    item.Descripcion && item.Descripcion.length > 100
      ? item.Descripcion.slice(0, 100) + "..."
      : item.Descripcion || item.Color || item.Medida || "";

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.imageWrap}
        activeOpacity={0.9}
        onPress={() => onDetails({ tipo: type, data: item })}
      >
        {item.Imagen ? (
          <Image source={{ uri: item.Imagen }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Text style={styles.placeholderText}>Sin imagen</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.Nombre || "Sin título"}</Text>
        <Text style={styles.cardDescription}>{descripcion}</Text>
        <Text style={styles.cardPrice}>{formatoDinero(item.Precio)}</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => onSave(item)}
        >
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function Catalogo({ user }) {
  const [servicios, setServicios] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [tab, setTab] = useState("servicios"); // 'servicios' | 'modelos'
  const { width } = useWindowDimensions();

  useEffect(() => {
    const unsubServicios = onSnapshot(collection(db, "Servicio"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setServicios(data);
    }, async (error) => {
      console.error('onSnapshot Servicio failed, falling back to getDocs:', error);
      try {
        const snap = await getDocs(collection(db, 'Servicio'));
        setServicios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error('getDocs fallback failed for Servicio:', e); }
    });

    const unsubModelos = onSnapshot(collection(db, "Modelo"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setModelos(data);
    }, async (error) => {
      console.error('onSnapshot Modelo failed, falling back to getDocs:', error);
      try {
        const snap = await getDocs(collection(db, 'Modelo'));
        setModelos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error('getDocs fallback failed for Modelo:', e); }
    });

    return () => {
      try { unsubServicios(); } catch (e) {}
      try { unsubModelos(); } catch (e) {}
    };
  }, []);

  const guardarEnContrato = async (item, tipo) => {
    try {
      if (!user || user.rol === "Invitado") {
        return alert("Debes iniciar sesión como cliente para guardar en un contrato.");
      }
      const price = Number(item.Monto ?? item.Precio ?? 0) || 0;
      const clientId = user.clientId || user.id || null;

      // Buscar contrato abierto del cliente (Estado distinto de 'Pagado'). Si no existe, crear uno nuevo.
      let existing = null;
      if (clientId) {
        try {
          const q = query(collection(db, 'Contrato'), where('ClienteId', '==', clientId));
          const snap = await getDocs(q);
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          existing = docs.find(d => !(d.Estado || '').toString().toLowerCase().includes('pag')) || null;
        } catch (e) {
          console.error('Error buscando contratos existentes del cliente:', e);
        }
      }

      if (existing) {
        // Actualizar contrato existente: sumar monto y agregar item al listado
        try {
          const newMonto = (Number(existing.Monto || 0) || 0) + price;
          // recalcular cuota: 5% del total
          const cuotaPorUnidad = Math.round(newMonto * 0.05) || newMonto;
          const cuotas = Math.max(1, Math.ceil(newMonto / cuotaPorUnidad));
          const updatedItems = Array.isArray(existing.Items) ? [...existing.Items] : [];
          updatedItems.push({ id: item.id, tipo, nombre: item.Nombre || item.Modelo || '', precio: price });
          const updateObj = { Monto: newMonto, Items: updatedItems, CuotaMonto: cuotaPorUnidad, Cuotas: cuotas, CuotasRestantes: cuotas };
          await safeUpdateDoc('Contrato', existing.id, updateObj);
          alert('Contrato actualizado: monto y items sumados correctamente.');
        } catch (e) {
          console.error('Error actualizando contrato existente:', e);
          alert('Error al actualizar el contrato.');
        }
      } else {
        // Crear nuevo contrato con el item
        try {
          const payload = {
            ClienteId: clientId,
            Fecha_Inicio: new Date().toISOString().slice(0,10),
            Monto: price,
            Estado: 'Pendiente',
            Items: [{ id: item.id, tipo, nombre: item.Nombre || item.Modelo || '', precio: price }],
            CuotaMonto: Math.round(price * 0.05) || price,
            Cuotas: Math.max(1, Math.ceil(price / (Math.round(price * 0.05) || price))),
            CuotasRestantes: Math.max(1, Math.ceil(price / (Math.round(price * 0.05) || price)))
          };
          const { addDoc, collection } = await import("firebase/firestore");
          await addDoc(collection(db, "Contrato"), payload);
          alert("Guardado en contrato correctamente.");
        } catch (err) {
          console.error('Error creando nuevo contrato desde catálogo:', err);
          alert('Error al crear contrato.');
        }
      }

      // marcar como usado en el catálogo (usado:true) para preservar historial
      try {
        const col = tipo === 'servicio' ? 'Servicio' : 'Modelo';
        await safeUpdateDoc(col, item.id, { usado: true });
      } catch (e) {
        console.error('No se pudo marcar item como usado en el catálogo:', e);
      }
    } catch (err) {
      console.error("Error guardando en contrato", err);
      alert("Error al guardar");
    }
  };

  const cambiarTab = (t) => {
    try {
      if (typeof LayoutAnimation !== 'undefined' && LayoutAnimation && LayoutAnimation.configureNext && LayoutAnimation.Presets) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
    } catch (e) {
      // LayoutAnimation not available in this environment/version — ignore
      console.warn('LayoutAnimation not available:', e);
    }
    setTab(t);
  };

  // Render del modal con detalles
  const renderDetalle = () => {
    if (!detalle) return null;
    const item = detalle.data;
    const tipo = detalle.tipo;
    const nombre = tipo === "servicio" ? item.Nombre : item.Nombre || item.Modelo;
    const descripcion = tipo === "servicio"
      ? item.Descripcion
      : item.Color || item.Descripcion || "";
    const precio = tipo === "servicio" ? item.Monto : item.Precio || item.Monto;

    // Normalizar características
    let features = [];
    if (Array.isArray(item.Caracteristicas) && item.Caracteristicas.length) {
      features = item.Caracteristicas;
    } else if (typeof item.Caracteristicas === "string" && item.Caracteristicas.trim()) {
      features = item.Caracteristicas.split(/\r?\n|,|•/).map(s => s.trim()).filter(Boolean);
    } else {
      const possible = [];
      if (item.Material) possible.push(`Material: ${item.Material}`);
      if (item.Herrajes) possible.push(`Herrajes: ${item.Herrajes}`);
      if (item.Medida) possible.push(`Dimensiones: ${item.Medida}`);
      if (possible.length) features = possible;
    }

    return (
      <SafeModal animationType="fade" transparent visible={!!detalle} onRequestClose={() => setDetalle(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { width: Math.min(720, width - 24) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formatField(nombre)}</Text>
              <TouchableOpacity onPress={() => setDetalle(null)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {item.Imagen ? (
              <View style={styles.modalImageWrap}>
                <Image source={{ uri: item.Imagen }} style={styles.modalImage} resizeMode="cover" />
              </View>
            ) : (
              <View style={styles.modalImagePlaceholder}>
                <Text style={styles.placeholderText}>Sin imagen</Text>
              </View>
            )}

            <ScrollView style={styles.modalContent}>
              {descripcion ? <Text style={styles.modalDescription}>{formatField(descripcion)}</Text> : null}

              {features.length > 0 && (
                <View style={styles.features}>
                  <Text style={styles.featuresTitle}>Características:</Text>
                  {features.map((f, i) => (
                    <View key={i} style={styles.featureItem}>
                      <Text style={styles.featureDot}>•</Text>
                      <Text style={styles.featureText}>{formatField(f)}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.pricePanel}>
                <Text style={styles.priceLabel}>Precio</Text>
                <Text style={styles.priceAmount}>{formatoDinero(precio)}</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setDetalle(null)}>
                <Text style={styles.modalCancelText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={() => {
                  guardarEnContrato(item, tipo);
                  setDetalle(null);
                }}
              >
                <Text style={styles.modalSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
  </SafeModal>
    );
  };

  const data = tab === "servicios" ? servicios : modelos;

  return (
    <View style={styles.app}>
      {/* Cabecera / Tabs */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity
            style={[styles.tab, tab === "modelos" ? styles.tabActive : styles.tabInactive]}
            onPress={() => cambiarTab("modelos")}
          >
            <Text style={[styles.tabText, tab === "modelos" && styles.tabTextActive]}>Ataúdes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, tab === "servicios" ? styles.tabActive : styles.tabInactive]}
            onPress={() => cambiarTab("servicios")}
          >
            <Text style={[styles.tabText, tab === "servicios" && styles.tabTextActive]}>Servicios</Text>
          </TouchableOpacity>
        </View>
      </View>

      {data && data.length ? (
        <FlatList
          data={data}
          renderItem={({ item }) => (
            <CardItem item={item} onDetails={setDetalle} onSave={guardarEnContrato} type={tab === "servicios" ? "servicio" : "modelo"} />
          )}
          keyExtractor={(it) => it.id}
          contentContainerStyle={styles.listContainer}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No hay elementos por mostrar</Text>
        </View>
      )}

      {renderDetalle()}
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: "#f4f7fb" },

  header: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f4f7fb",
    borderBottomWidth: 1,
    borderBottomColor: "#eef1f4",
  },
  headerInner: {
    flexDirection: "row",
    justifyContent: "center",
  },
  tab: {
    minWidth: 120,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "#203248",
    borderColor: "#203248",
  },
  tabInactive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6e9ee",
  },
  tabText: {
    color: "#374151",
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#fff",
  },

  listContainer: {
    padding: 12,
    paddingBottom: 30,
  },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    marginVertical: 10,
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  imageWrap: {
    width: 120,
    height: 120,
    backgroundColor: "#eef3f8",
    justifyContent: "center",
    alignItems: "center",
  },
  cardImage: { width: "100%", height: "100%" },
  cardImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#eef3f8",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { color: "#9aa4b2", fontSize: 13 },

  cardBody: { flex: 1, padding: 12, justifyContent: "space-between" },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#0b1320", flex: 1, marginRight: 8 },
  cardPriceSmall: { color: "#2563eb", fontWeight: "800", fontSize: 13 },

  cardDescription: { marginTop: 6, color: "#5b6370", fontSize: 13 },

  cardActions: { flexDirection: "row", marginTop: 10, alignItems: "center", justifyContent: "space-between" },
  detailBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e6eb",
    backgroundColor: "#fff",
    alignItems: "center",
    marginRight: 10,
  },
  detailBtnText: { fontWeight: "700", color: "#2b3946" },
  saveBtn: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#eef3f8",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { fontSize: 18 },

  // Empty
  empty: { padding: 30, alignItems: "center" },
  emptyText: { color: "#6b7280", fontSize: 14 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    maxHeight: "92%",
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalTitle: { flex: 1, fontSize: 20, fontWeight: "900", color: "#0b1320" },
  modalClose: { padding: 6, borderRadius: 8 },
  modalCloseText: { fontSize: 18, color: "#475569" },

  modalImageWrap: { backgroundColor: "#203248", height: 200, width: "100%" },
  modalImage: { width: "100%", height: "100%" },
  modalImagePlaceholder: { backgroundColor: "#eef3f8", height: 200, alignItems: "center", justifyContent: "center" },

  modalContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },
  modalDescription: { color: "#475569", fontSize: 15, marginBottom: 8 },

  features: { marginTop: 6, marginBottom: 8 },
  featuresTitle: { fontWeight: "800", marginBottom: 8, color: "#0b1320" },
  featureItem: { flexDirection: "row", marginBottom: 6, alignItems: "flex-start" },
  featureDot: { marginRight: 8, color: "#6b7280" },
  featureText: { color: "#374151", flex: 1 },

  pricePanel: { marginTop: 6, marginBottom: 6 },
  priceLabel: { color: "#6b7280", fontSize: 12, marginBottom: 4 },
  priceAmount: { fontWeight: "900", color: "#2563eb", fontSize: 20 },

  modalFooter: { flexDirection: "row", padding: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: "#eef1f4" },
  modalCancel: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#eef3f8",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalCancelText: { color: "#1f2937", fontWeight: "800" },
  modalSave: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#203248",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalSaveText: { color: "#fff", fontWeight: "900" },
});
