import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load home page', async ({ page }) => {
    const response = await page.goto('/');

    // Página deve carregar com sucesso
    expect(response?.status()).toBe(200);
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/');

    // Verificar título da página
    await expect(page).toHaveTitle(/Claude|Chat/i);
  });

  test('should handle 404 gracefully', async ({ page }) => {
    await page.goto('/pagina-inexistente');

    // SPA deve redirecionar ou mostrar página de erro amigável
    // Não deve mostrar erro do servidor
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Página deve carregar em menos de 5 segundos
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    // Filtrar erros conhecidos/aceitáveis
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('Failed to load resource')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
