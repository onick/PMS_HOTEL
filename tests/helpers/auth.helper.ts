import { Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper para crear un usuario de prueba y autenticarlo
 */
export async function createTestUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Helper para hacer login en el navegador
 */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Esperar a que redirija al dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

/**
 * Helper para hacer logout
 */
export async function logoutUser(page: Page) {
  await supabase.auth.signOut();
  await page.goto('/');
}

/**
 * Helper para limpiar usuarios de prueba
 */
export async function cleanupTestUser(userId: string) {
  // Nota: Requiere service role key para eliminar usuarios
  // En producción, usar Edge Function para esto
  await supabase.auth.admin.deleteUser(userId);
}
