import { StyleSheet } from "react-native";

const catalogoStyles = StyleSheet.create({

  app: {
    width: "103%",
    flex: 1,
    backgroundColor: "#f2f4f8"
  },

  header: {
    marginLeft: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerInner: {
    flexDirection: "row",
    justifyContent: "center",
  },
  tab: {
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 30,
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



  cardDescription: {
    marginTop: 2,
    color: "#5b6370",
    fontSize: 13
  },

  cardActions: {
    flexDirection: "row",
    marginTop: 10, alignItems: "center",
    justifyContent: "space-between"
  },

  detailBtn: {
    flex: 1,
    paddingVertical: 10.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e6eb",
    backgroundColor: "#203248",
    alignItems: "center",
    marginBottom: 12,
    marginRight: 15,
    marginLeft: 15,
  },
  detailBtnText: {
    fontWeight: "700",
    color: "#fff"
  },
  saveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e6eb",
    backgroundColor: "#203248",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
    marginTop: -10,
  },
  saveBtnText: {
    fontSize: 18,
  },

  // Empty
  empty: {
    padding: 30,
    alignItems: "center"
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 14
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.12)",
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
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
    color: "#0b1320"
  },
  modalClose: {
    padding: 6,
    borderRadius: 8
  },
  modalCloseText: {
    fontSize: 18,
    color: "#475569"
  },

  modalImageWrap: {
    backgroundColor: "#203248",
    height: 200, width: "100%"
  },
  modalImage: {
    width: "100%",
    height: "100%"
  },
  modalImagePlaceholder: {
    backgroundColor: "#eef3f8",
    height: 200,
    alignItems: "center",
    justifyContent: "center"
  },

  modalContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8
  },
  modalDescription: {
    color: "#475569",
    fontSize: 15,
    marginBottom: 8
  },

  features: {
    marginTop: 6,
    marginBottom: 8
  },
  featuresTitle: {
    fontWeight: "800",
    marginBottom: 8,
    color: "#0b1320"
  },
  featureItem: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "flex-start"
  },
  featureDot: {
    marginRight: 8,
    color: "#6b7280"
  },
  featureText: {
    color: "#374151",
    flex: 1
  },

  pricePanel: {
    marginTop: 6,
    marginBottom: 6
  },
  priceLabel: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 4
  },
  priceAmount: {
    fontWeight: "900",
    color: "#2563eb",
    fontSize: 20
  },

  modalFooter: {
    flexDirection: "row",
    padding: 12,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: "#eef1f4"
  },
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
  modalSaveText: {
    color: "#fff",
    fontWeight: "900"
  },
});

export default catalogoStyles;