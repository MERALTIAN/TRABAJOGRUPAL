import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  FlatList,
  Image,
  Alert 
} from "react-native";
import UserAutocomplete from './UserAutocomplete';
import { validateCedula, formatCedula } from '../utils/cedula';
import { db } from "../database/firebaseconfig";
import { safeUpdateDoc } from '../utils/firestoreUtils';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from "expo-file-system";

const ModalEditar = ({ 
  visible, 
  onClose, 
  item, 
  collection, 
  collectionName, // legacy prop name support
  fields, 
  onUpdate,
  title 
}) => {
  const [formData, setFormData] = useState({});
  const [imagen, setImagen] = useState(null);

  useEffect(() => {
    if (item) {
      setFormData(item);
      setImagen(item.Imagen || null);
    }
  }, [item]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const seleccionarImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Se necesitan permisos para acceder a la galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true, // Importante: obtener la imagen en Base64
    });

    if (!result.canceled) {
      // Guardamos la imagen en Base64 directamente
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImagen(base64Image);
      setFormData(prev => ({
        ...prev,
        Imagen: base64Image
      }));
    }
  };

  const handleSave = async () => {
    try {
      const dataToUpdate = { ...formData };
      // If editing a Cedula field, validate & normalize before saving
      if (dataToUpdate.Cedula !== undefined) {
        const ced = String(dataToUpdate.Cedula || '').toUpperCase();
        const formatted = formatCedula(ced);
        if (!validateCedula(formatted)) {
          Alert.alert('Cédula inválida', 'Formato esperado: 121-261204-1001F');
          return;
        }
        dataToUpdate.Cedula = formatted;
      }
      if (imagen) {
        dataToUpdate.Imagen = imagen;
      }
      // Support either `collection` or legacy `collectionName` prop
      const coll = collection || collectionName;

      // Validate collection and item id before calling Firestore
      if (!coll || typeof coll !== 'string') {
        console.warn('ModalEditar: missing or invalid collection name', coll);
        Alert.alert('Error', 'Nombre de colección inválido. Operación cancelada.');
        return;
      }

      if (!item || !item.id) {
        console.warn('ModalEditar: missing item id, cannot update', item);
        Alert.alert('Error', 'ID del elemento faltante. Operación cancelada.');
        return;
      }

      try {
        await safeUpdateDoc(coll, item.id, dataToUpdate);
      } catch (e) {
        console.error('ModalEditar safeUpdateDoc error', e);
        Alert.alert('Error', 'No se pudo actualizar el registro (helper).');
        return;
      }
      onUpdate();
      onClose();
      Alert.alert('Éxito', 'Registro actualizado correctamente');
    } catch (error) {
      console.error("Error al actualizar:", error);
      Alert.alert('Error', 'No se pudo actualizar el registro');
    }
  };

  const renderField = (field) => {
    const { key, label, type, keyboardType } = field;
    
    if (type === 'image') {
      return (
        <View key={key} style={styles.fieldContainer}>
          <Text style={styles.label}>{label}</Text>
          <TouchableOpacity style={styles.imageButton} onPress={seleccionarImagen}>
            <Text style={styles.imageButtonText}>📷 Seleccionar Imagen</Text>
          </TouchableOpacity>
          {imagen && (
            <Image source={{ uri: imagen }} style={styles.imagePreview} />
          )}
        </View>
      );
    }

    // special render for user selector fields
    if (type === 'usuario' || key === 'UsuarioId' || key === 'Usuario') {
      // derive role from collection if possible
      const coll = collection || collectionName || '';
      let roleForPicker = 'Cliente';
      if (coll.toLowerCase().includes('agente')) roleForPicker = 'Agente';
      else if (coll.toLowerCase().includes('cliente')) roleForPicker = 'Cliente';

      // build a selectedUser object from formData if present
      const initialSelected = formData['UsuarioId'] ? { id: formData['UsuarioId'], Usuario: formData['UsuarioNombre'] || formData['Usuario'] } : null;

      return (
        <View key={key} style={styles.fieldContainer}>
          <Text style={styles.label}>{label}</Text>
          <UserAutocomplete role={field.role || roleForPicker} selectedUser={initialSelected} onSelect={(u) => {
            // set both UsuarioId and UsuarioNombre in formData
            handleInputChange('UsuarioId', u.id);
            handleInputChange('UsuarioNombre', u.Usuario || u.Nombre || '');
          }} />
          {formData['UsuarioNombre'] ? (
            <Text style={{ marginTop: 8, color: '#0b60d9', fontWeight: '700' }}>Usuario seleccionado: {formData['UsuarioNombre']}</Text>
          ) : null}
        </View>
      );
    }

    return (
      <View key={key} style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={styles.input}
          value={formData[key]?.toString() || ''}
          onChangeText={(value) => handleInputChange(key, value)}
          keyboardType={keyboardType || 'default'}
          secureTextEntry={type === 'password'}
        />
      </View>
    );
  };

  // If the item contains an Items array (e.g., a Contrato), render a read-only list
  const renderItemsList = () => {
    if (!formData || !Array.isArray(formData.Items) || formData.Items.length === 0) return null;
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Servicios/Modelos en este contrato</Text>
        {formData.Items.map((it, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{it.nombre || it.Nombre || it.Modelo || it.id}</Text>
              <Text style={styles.itemMeta}>{(it.tipo || '').toString()} • C$ {it.precio ?? '-'}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            style={styles.modalContent}
            data={fields}
            keyExtractor={(f) => f.key || f.label || String(Math.random())}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            renderItem={({ item }) => renderField(item)}
          />

          {renderItemsList()}

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Actualizar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  modalContent: {
    padding: 20,
  },
  selectedRow: { marginTop: 6, padding: 8, backgroundColor: '#f0f8ff', borderRadius: 8 },
  selectedLabel: { fontSize: 12, color: '#0b60d9', fontWeight: '700' },
  selectedName: { fontSize: 15, color: '#023047', fontWeight: '800', marginTop: 4 },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  imageButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  imageButtonText: {
    color: 'white',
    fontSize: 16,
  },
  imagePreview: {
    width: 150,
    height: 100,
    borderRadius: 5,
    marginTop: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  itemRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  itemName: { fontSize: 15, fontWeight: '700', color: '#12323b' },
  itemMeta: { fontSize: 13, color: '#666', marginTop: 4 },
});

export default ModalEditar;
