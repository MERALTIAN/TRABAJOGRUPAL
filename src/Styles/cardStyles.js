import { StyleSheet } from 'react-native';



export const cardStyles = StyleSheet.create({
  // Estilo de la tarjeta principal
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 0.5,
    borderColor: 'transparent',
  },
  // Contenedor de la imagen 
  cardImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    width: '100%',
    height: 140,
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#f3f4f6'
  },
  placeholderText: {
    color: '#666',
  },
  cardBody: {
    padding: 12,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardPriceSmall: {
    fontWeight: '800',
    color: '#1e90ff',
  },
  // Cabecera de la tarjeta (Título y botón de expandir)
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000ff',
    flex: 1, // Permite que el título ocupe el espacio y haga wrap
  },
  ellipsisButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f7f8f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  // Contenedor de detalles expandidos
  expandedDetailsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  detailLabel: { 
    color: '#717171ff', 
    fontSize: 13,
  },
  detailValue: { 
    color: '#000000ff', 
    fontSize: 13, 
    fontWeight: '500',
    },
  // Fila de acciones (Botones)
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    flexWrap: 'wrap',
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginLeft: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  cardButtonText: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  // Botón de Eliminar
  deleteButton: {
    backgroundColor: '#ef4444',
    marginRight: 15,
  },
  deleteButtonText: {
    color: '#ffffffff',
    paddingRight: 4,
  },
  // Botón de Editar
  editButton: {
    backgroundColor: '#0ea5e9',
    paddingLeft: 18,
    paddingRight: 18,
    marginRight: 8,
  },
  editButtonText: {
    color: '#ffffff',
  },
  // Botón neutral (Vincular)
  neutralButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e6e9ee',
  },
  neutralButtonText: {
    color: '#111827',
    fontWeight: '700',
  },
  // Botón estilo 'desvincular' (texto rojo sobre fondo claro)
  unlinkButton: {
    backgroundColor: '#fff1f0',
    borderWidth: 1,
    borderColor: '#fde2e0',
  },
  unlinkButtonText: {
    color: '#ef4444',
    fontWeight: '700',
  },
});