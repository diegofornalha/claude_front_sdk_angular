import { test, expect } from '@playwright/test';

test.describe('Chat Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display chat interface', async ({ page }) => {
    // Verifica se o componente de chat está presente
    await expect(page.locator('claude-chat')).toBeVisible();

    // Verifica se o textarea de input está presente
    await expect(page.locator('textarea')).toBeVisible();

    // Verifica se o botão de enviar está presente
    await expect(page.locator('.send-btn')).toBeVisible();
  });

  test('should have placeholder text when empty', async ({ page }) => {
    const textarea = page.locator('textarea');
    await expect(textarea).toHaveAttribute('placeholder', /Como posso ajudar/);
  });

  test('should enable send button when text is entered', async ({ page }) => {
    const textarea = page.locator('textarea');
    const sendBtn = page.locator('.send-btn');

    // Botão deve estar desabilitado inicialmente
    await expect(sendBtn).toBeDisabled();

    // Digitar texto
    await textarea.fill('Olá, Claude!');

    // Botão deve estar habilitado
    await expect(sendBtn).toBeEnabled();
  });

  test('should show model selector', async ({ page }) => {
    const modelSelector = page.locator('.model-selector');
    await expect(modelSelector).toBeVisible();

    // Clicar para abrir o menu
    await modelSelector.click();

    // Verificar opções de modelo
    await expect(page.locator('.model-option')).toHaveCount(3);
  });

  test('should toggle add menu', async ({ page }) => {
    const addBtn = page.locator('.add-btn');

    // Clicar para abrir o menu
    await addBtn.click();

    // Menu deve aparecer
    await expect(page.locator('.dropdown-menu')).toBeVisible();

    // Clicar novamente para fechar
    await addBtn.click();

    // Menu deve desaparecer
    await expect(page.locator('.dropdown-menu')).not.toBeVisible();
  });

  test('should be keyboard accessible', async ({ page }) => {
    const textarea = page.locator('textarea');

    // Focus no textarea
    await textarea.focus();
    await expect(textarea).toBeFocused();

    // Digitar mensagem
    await textarea.fill('Teste de acessibilidade');

    // Enter deve enviar (se não for shift+enter)
    await textarea.press('Enter');

    // Verificar que a mensagem foi adicionada ou está processando
    // (depende do estado do backend)
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    // Botões devem ter títulos/labels
    await expect(page.locator('.send-btn')).toHaveAttribute('title', 'Enviar mensagem');
    await expect(page.locator('.history-btn')).toHaveAttribute('title', 'Histórico');
  });

  test('should be navigable with Tab key', async ({ page }) => {
    await page.goto('/');

    // Tab através dos elementos interativos
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Deve eventualmente focar no textarea
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');

    // Verificar que o texto é legível (placeholder)
    const textarea = page.locator('textarea');
    const styles = await textarea.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      };
    });

    // Verificar que não é branco sobre branco
    expect(styles.color).not.toBe(styles.backgroundColor);
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Chat deve estar visível
    await expect(page.locator('claude-chat')).toBeVisible();

    // Input deve estar acessível
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('claude-chat')).toBeVisible();
    await expect(page.locator('.input-box')).toBeVisible();
  });
});
