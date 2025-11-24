export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',
  useDataManager: true, // Flag para usar DataManager persistente
  mockData: false, // Flag para datos mock locales
  features: {
    persistentData: true,
    realTimeUpdates: true,
    dataValidation: true,
    bulkOperations: true
  }
};