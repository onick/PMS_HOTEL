import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";

console.log('🚀 SOLARIS PMS - Iniciando aplicación...');
console.log('📍 Root element:', document.getElementById("root"));

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('❌ Error: No se encontró el elemento #root');
  throw new Error('Root element not found');
}

console.log('✅ Root element encontrado, montando React...');

try {
  createRoot(rootElement).render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <App />
    </ThemeProvider>
  );
  console.log('✅ Aplicación montada correctamente');
} catch (error) {
  console.error('❌ Error montando la aplicación:', error);
  throw error;
}
