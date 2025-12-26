export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',
  useDataManager: false, // COMPLETAMENTE DESHABILITADO - SOLO API REAL

  features: {
    persistentData: false, // DESHABILITADO
    realTimeUpdates: true,
    dataValidation: true,
    bulkOperations: true
  }
};