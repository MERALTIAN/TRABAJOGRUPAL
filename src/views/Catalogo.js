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
import { collection, onSnapshot, getDocs, query, where, addDoc, doc, getDoc } from "firebase/firestore";
import { safeUpdateDoc, safeDeleteDoc } from '../utils/firestoreUtils.js';
import catalogoStyles from "../Styles/catalogoStyles.js";
import { cardStyles } from "../Styles/cardStyles.js";
import { Feather } from '@expo/vector-icons';


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
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.Nombre || item.Modelo}
          </Text>
          <Text style={styles.cardPriceSmall}>{formatoDinero(item.Precio || item.Monto)}</Text>
        </View>

        <Text style={styles.cardDescription} numberOfLines={3}>
          {descripcion}
        </Text>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.detailBtn}
            activeOpacity={0.85}
            onPress={() => onDetails({ tipo: type, data: item })}
          >
            <Text style={styles.detailBtnText}>Ver detalles</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveBtn}
            activeOpacity={0.85}
            onPress={() => onSave(item, type)}
          >
                <Feather name="save" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function Catalogo({ user }) {
  const [contratos, setContratos] = useState([]);
  const [contratoPickerVisible, setContratoPickerVisible] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [pendingTipo, setPendingTipo] = useState(null);
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

      // Find the client ID from the 'Cliente' collection using the user's ID
      let clientId = null;
      if (user.id) {
        const qCliente = query(collection(db, 'Cliente'), where('UsuarioId', '==', user.id));
        const snapCliente = await getDocs(qCliente);
        if (!snapCliente.empty) {
          clientId = snapCliente.docs[0].id;
        }
      }

      const price = Number(item.Monto ?? item.Precio ?? 0) || 0;

      // Buscar todos los contratos del cliente y mostrar selector siempre
      let contratosCliente = [];
      if (clientId) {
        try {
          const q = query(collection(db, 'Contrato'), where('ClienteId', '==', clientId));
          const snap = await getDocs(q);
          contratosCliente = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
          console.error('Error buscando contratos del cliente:', e);
        }
      }

      // Mostrar modal con todos los contratos (si no tiene, el modal permitirá crear uno nuevo)
      setContratos(contratosCliente);
      setPendingItem(item);
      setPendingTipo(tipo);
      setContratoPickerVisible(true);
      return;
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

  const createNewContractFromPending = async () => {
    try {
      if (!pendingItem) return;
      // Try to resolve clientId again (in case user data changed)
      let clientId = null;
      if (user && user.id) {
        const qCliente = query(collection(db, 'Cliente'), where('UsuarioId', '==', user.id));
        const snapCliente = await getDocs(qCliente);
        if (!snapCliente.empty) clientId = snapCliente.docs[0].id;
      }
      const price = Number(pendingItem.Monto ?? pendingItem.Precio ?? 0) || 0;
      const payload = {
        ClienteId: clientId,
        Fecha_Inicio: new Date().toISOString().slice(0,10),
        Monto: price,
        Estado: 'Pendiente',
        Items: [{ id: pendingItem.id, tipo: pendingTipo, nombre: pendingItem.Nombre || pendingItem.Modelo || '', precio: price }],
        CuotaMonto: Math.round(price * 0.05) || price,
        Cuotas: Math.max(1, Math.ceil(price / (Math.round(price * 0.05) || price))),
        CuotasRestantes: Math.max(1, Math.ceil(price / (Math.round(price * 0.05) || price)))
      };
      const ref = await addDoc(collection(db, "Contrato"), payload);
      // borrar item del catálogo
      try {
        const col = pendingTipo === 'servicio' ? 'Servicio' : 'Modelo';
        await safeDeleteDoc(col, pendingItem.id);
      } catch (e) {
        console.error('No se pudo borrar item del catálogo tras crear contrato:', e);
      }
      alert('Contrato creado y artículo guardado correctamente.');
    } catch (e) {
      console.error('Error creando contrato desde modal:', e);
      alert('Error al crear contrato.');
    } finally {
      setContratoPickerVisible(false);
      setPendingItem(null);
      setPendingTipo(null);
      setContratos([]);
    }
  };

  // addToContract already exists below; ensure it's hoisted: (it is declared later)

  const addToContract = async (contractId, item, tipo) => {
    try {
      if (!contractId) return;
      const docRef = doc(db, 'Contrato', contractId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        alert('Contrato no encontrado');
        return;
      }
      const existing = { id: snap.id, ...snap.data() };
      const price = Number(item.Monto ?? item.Precio ?? 0) || 0;
      const newMonto = (Number(existing.Monto || 0) || 0) + price;
      const cuotaPorUnidad = Math.round(newMonto * 0.05) || newMonto;
      const cuotas = Math.max(1, Math.ceil(newMonto / cuotaPorUnidad));
      const updatedItems = Array.isArray(existing.Items) ? [...existing.Items] : [];
      updatedItems.push({ id: item.id, tipo, nombre: item.Nombre || item.Modelo || '', precio: price });
      const updateObj = { Monto: newMonto, Items: updatedItems, CuotaMonto: cuotaPorUnidad, Cuotas: cuotas, CuotasRestantes: cuotas };
      await safeUpdateDoc('Contrato', contractId, updateObj);

      // borrar item del catálogo después de guardar
      try {
        const col = tipo === 'servicio' ? 'Servicio' : 'Modelo';
        await safeDeleteDoc(col, item.id);
      } catch (e) {
        console.error('No se pudo borrar item del catálogo:', e);
      }

      alert('Contrato actualizado y artículo guardado correctamente.');
    } catch (e) {
      console.error('addToContract error', e);
      alert('Error al guardar en el contrato seleccionado');
    } finally {
      setContratoPickerVisible(false);
      setPendingItem(null);
      setPendingTipo(null);
      setContratos([]);
    }
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
      {/* Modal picker para seleccionar contrato cuando el cliente tiene varios (o ninguno) */}
      <SafeModal visible={contratoPickerVisible} animationType="slide" transparent onRequestClose={() => setContratoPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { width: Math.min(720, width - 24) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona el contrato</Text>
              <TouchableOpacity onPress={() => setContratoPickerVisible(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <ScrollView>
                {contratos && contratos.length > 0 ? (
                  contratos.map((c) => (
                    <TouchableOpacity key={c.id} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }} onPress={() => addToContract(c.id, pendingItem, pendingTipo)}>
                      <Text style={{ fontWeight: '700' }}>{c.Cliente || c.ClienteNombre || c.ClienteId || ('Contrato ' + c.id)}</Text>
                      <Text>Estado: {String(c.Estado || c.estado || 'Pendiente')}</Text>
                      <Text>Inicio: {String(c.Fecha_Inicio || c.FechaInicio || '').slice(0,10)}</Text>
                      <Text>Monto: C$ {c.Monto ?? '-'}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={{ padding: 12 }}>
                    <Text style={{ marginBottom: 12 }}>No se encontraron contratos para este cliente.</Text>
                    <TouchableOpacity style={[styles.modalSave, { alignSelf: 'flex-start' }]} onPress={createNewContractFromPending}>
                      <Text style={styles.modalSaveText}>Crear nuevo contrato y guardar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setContratoPickerVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalCancel, { backgroundColor: '#007bff' }]} onPress={createNewContractFromPending}>
                <Text style={[styles.modalCancelText, { color: '#fff' }]}>Crear nuevo contrato</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeModal>
    </View>
  );
}

const styles = StyleSheet.create({
  ...catalogoStyles,
  app: { ...catalogoStyles.app, flex: 1, backgroundColor: '#fff' },
  ...cardStyles,
});
