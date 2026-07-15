// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Painel — tela de login', () => {
  test('página de login renderiza sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/painel.html');
    await expect(page.locator('#loginWrap, .login-wrap, [data-testid="login"]').first()).toBeVisible({ timeout: 10_000 });
    expect(errors).toHaveLength(0);
  });

  test('formulário de login existe e aceita input', async ({ page }) => {
    await page.goto('/painel.html');
    const emailInput = page.locator('input[type="email"], input[name="email"], #loginEmail').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('credenciais inválidas mostram mensagem de erro', async ({ page }) => {
    await page.goto('/painel.html');
    const emailInput = page.locator('input[type="email"], #loginEmail').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
    await emailInput.fill('invalido@teste.com');
    const passInput = page.locator('input[type="password"], #loginSenha').first();
    await passInput.fill('senhaerrada123');
    await page.locator('button[type="submit"], #btnLogin').first().click();
    await expect(page.locator('.erro, .error, [data-testid="login-error"]').first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Admin — tela de login', () => {
  test('página admin renderiza sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/admin.html');
    await expect(page.locator('.login-wrap, .login-card, [data-testid="admin-login"]').first()).toBeVisible({ timeout: 10_000 });
    expect(errors).toHaveLength(0);
  });
});
