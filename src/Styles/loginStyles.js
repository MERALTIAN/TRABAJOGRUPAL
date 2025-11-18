import { StyleSheet } from 'react-native';

const loginStyles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#ffffff', // White background
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2
  },

  header: {
    alignItems: 'center',
    marginBottom: 0
  },

  logo: {
    width: 100,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 0,
  },

  appName: {
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#444444', 
    textAlign: 'center', 
    marginBottom: 5
  },

  formCard: {
   width: '100%',
   maxWidth: 340,
   backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderRadius: 20, 
    padding: 28, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10
  },

  input: {
   borderWidth: 1, 
    borderColor: '#ccc', 
    padding: 15, 
    marginBottom: 15, 
    borderRadius: 10, 
    backgroundColor: '#fff',
    fontSize: 16
  },

  roleRow: {
    marginBottom: 20,
    alignItems: 'center'
  },

  roleLabel: {
   fontSize: 16, 
    fontWeight: '500',
    color: '#555',
    marginBottom: 6,
    padding: -4,
    textAlign: 'center'
  },

  roleOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 90,
    marginHorizontal: 10,
    marginVertical: 6,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1
  },

  roleOptionActive: {
    backgroundColor: '#0b60d9',
    borderColor: '#0b60d9',
    shadowColor: '#0b60d9',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3
  },

  roleText: {
    fontSize: 14, 
    paddingHorizontal: 10,
    color: '#333'
  },

  roleTextActive: {
    color: '#fff',
    fontWeight: '600'
  },


  rememberRow: { 
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center', 
    marginBottom: 0 
  },

  roleButtonsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },

   rememberText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#555'
  },

  loginButton: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3
  },

  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },

  guestButton: {
    backgroundColor: '#6c757d',
    marginTop: 15,
  },
  showPwdBtn: { position: 'absolute', right: 11, top: 8.5,color: '#0b60d9', fontWeight: '700', padding:1 },
});

export default loginStyles;
