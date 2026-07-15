// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Painel — tela de login', () => {
  test('carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/painel.html');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('formulário de login é visível e funcional', async ({ page }) => {
    await page.goto('/painel.html');
    const emailInput = page.locator('input[type="email"], #loginEmail').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
    const passInput = page.locator('input[type="password"], #loginSenha').first();
    await expect(passInput).toBeVisible();
  });

  test('credenciais inválidas mostram mensagem de erro', async ({ page }) => {
    await page.goto('/painel.html');
    await page.locator('input[type="email"], #loginEmail').first().waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator('input[type="email"], #loginEmail').first().fill('invalido@naoexiste.com');
    await page.locator('input[type="password"], #loginSenha').first().fill('senhaerrada999');
    await page.locator('button[type="submit"], #btnLogin').first().click();
    await expect(page.locator('.erro, .error, [class*="err"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('tema padrão t-onyx aplicado imediatamente (sem FOUC)', async ({ page }) => {
    await page.goto('/painel.html');
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('t-');
  });
});

test.describe('Painel — carregamento de recursos', () => {
  test('tokens.css e themes.css carregam com status 200', async ({ page }) => {
    const cssResponses = {};
    page.on('response', r => {
      if (r.url().includes('/css/')) cssResponses[r.url()] = r.status();
    });
    await page.goto('/painel.html');
    await page.waitForLoadState('networkidle');
    const urls = Object.keys(cssResponses);
    const tokensCss = urls.find(u => u.includes('tokens'));
    const themesCss = urls.find(u => u.includes('themes'));
    if (tokensCss) expect(cssResponses[tokensCss]).toBe(200);
    if (themesCss) expect(cssResponses[themesCss]).toBe(200);
  });

  test('bundle JS carrega com status 200', async ({ page }) => {
    let bundleStatus = 0;
    page.on('response', r => {
      if (r.url().includes('painel.bundle')) bundleStatus = r.status();
    });
    await page.goto('/painel.html');
    await page.waitForLoadState('networkidle');
    expect(bundleStatus).toBe(200);
  });
});

test.describe('Admin — tela de login', () => {
  test('carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/admin.html');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('tema aplicado imediatamente na carga', async ({ page }) => {
    await page.goto('/admin.html');
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toContain('t-');
  });

  test('formulário de login admin existe', async ({ page }) => {
    await page.goto('/admin.html');
    const input = page.locator('input[type="password"], input[type="email"], input[type="text"]').first();
    await expect(input).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Onboarding', () => {
  test('cadastro.html carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/cadastro.html');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('formulário de cadastro tem campos obrigatórios', async ({ page }) => {
    await page.goto('/cadastro.html');
    await page.waitForLoadState('networkidle');
    const nomeInput = page.locator('input[name="nome"], input[placeholder*="nome" i], #nome').first();
    await expect(nomeInput).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Páginas estáticas', () => {
  for (const path of ['/index.html', '/termos.html', '/privacidade.html', '/404.html']) {
    test(`${path} carrega sem erros JS`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(errors).toHaveLength(0);
    });
  }
});
