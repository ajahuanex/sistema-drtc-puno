export const environment = {
  production: true,
  apiUrl: 'https://api.drtc-puno.gob.pe', // URL de producción
  useDataManager: false, // En producción usar base de datos real

  features: {
    persistentData: true,
    realTimeUpdates: true,
    dataValidation: true,
    bulkOperations: true
  }
};