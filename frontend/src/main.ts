import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Inicialización simplificada y robusta
async function startApp() {
  try {
    const app = await bootstrapApplication(AppComponent, appConfig);
    // console.log removed for production
    return app;
  } catch (error) {
    console.error('❌ Error iniciando aplicación:', error);
    // Mostrar mensaje de error al usuario
    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
          <h2 style="color: #d32f2f;">Error al cargar la aplicación</h2>
          <p>Por favor, recarga la página o contacta al administrador.</p>
          <button onclick="location.reload()" style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Recargar página
          </button>
        </div>
      </div>
    `;
    throw error;
  }
}

// Iniciar la aplicación
startApp();
