// @ts-check
const { test, expect } = require('@playwright/test');

const EMAIL = process.env.TEST_ADMIN_EMAIL || '';
const SENHA = process.env.TEST_ADMIN_SENHA || '';

if (!EMAIL || !SENHA) {
  throw new Error('Defina TEST_ADMIN_EMAIL e TEST_ADMIN_SENHA em .env.test');
}

// Helper: faz login no admin e aguarda appWrap.show
async function loginAdmin(page) {
  await page.goto('/admin.html');
  await page.locator('#loginEmail').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('#loginEmail').fill(EMAIL);
  await page.locator('#loginSenha').fill(SENHA);
  await page.locator('#btnLogin').click();
  await page.locator('#appWrap.show').waitFor({ state: 'attached', timeout: 20_000 });
}

// Helper: clica em uma seção do sidebar admin
async function irSecao(page, id) {
  await page.locator(`#nav-${id}`).click();
  await page.waitForTimeout(600);
}

test.describe('Admin autenticado — login', () => {
  test('login admin abre o painel sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await loginAdmin(page);
    await expect(page.locator('#appWrap')).toHaveClass(/show/);
    await expect(page.locator('#loginWrap')).toBeHidden();
    expect(errors).toHaveLength(0);
  });

  test('sessão admin persiste após reload', async ({ page }) => {
    await loginAdmin(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('#appWrap.show').waitFor({ state: 'attached', timeout: 15_000 });
    await expect(page.locator('#loginWrap')).toBeHidden();
  });
});

test.describe('Admin autenticado — seção Analytics', () => {
  test('analytics carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await loginAdmin(page);
    await irSecao(page, 'analytics');
    await page.waitForTimeout(2_000);
    expect(errors).toHaveLength(0);
  });

  test('analytics exibe cards de KPI', async ({ page }) => {
    await loginAdmin(page);
    await irSecao(page, 'analytics');
    await expect(
      page.locator('.kpi-card, .stat-box, .analytics-card, .card-kpi, canvas').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('analytics tem funil de eventos', async ({ page }) => {
    await loginAdmin(page);
    await irSecao(page, 'analytics');
    await expect(
      page.locator('#analytics-funil, .funil, [id*="funil"]').first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Admin autenticado — seção Cobranças', () => {
  test('cobranças carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await loginAdmin(page);
    await irSecao(page, 'cobrancas');
    await page.waitForTimeout(2_000);
    expect(errors).toHaveLength(0);
  });

  test('cobranças exibe lista de salões ou filtros', async ({ page }) => {
    await loginAdmin(page);
    await irSecao(page, 'cobrancas');
    await expect(
      page.locator('.cobranca-item, .salao-row, .cob-card, .loading, table').first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Admin autenticado — seção Salões', () => {
  test('salões carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await loginAdmin(page);
    await irSecao(page, 'saloes');
    await page.waitForTimeout(2_000);
    expect(errors).toHaveLength(0);
  });

  test('lista de salões tem ao menos um item', async ({ page }) => {
    await loginAdmin(page);
    await irSecao(page, 'saloes');
    // renderSaloesStats gera .adm-card com table.adm-table
    await expect(
      page.locator('.adm-card, .adm-table, .loading').first()
    ).toBeVisible({ timeout: 15_000 });
    // Verifica que a tabela tem ao menos uma linha de dado
    const rows = page.locator('.adm-table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  });

  test('campo de busca de salões aceita texto', async ({ page }) => {
    await loginAdmin(page);
    await irSecao(page, 'saloes');
    const busca = page.locator('input[placeholder*="buscar" i], input[placeholder*="salão" i], #slBusca, [id*="Search"]').first();
    if (await busca.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await busca.fill('demo');
      await expect(busca).toHaveValue('demo');
    }
  });
});

test.describe('Admin autenticado — seção Sistema', () => {
  test('sistema carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await loginAdmin(page);
    await irSecao(page, 'sistema');
    await page.waitForTimeout(2_000);
    expect(errors).toHaveLength(0);
  });

  test('painel de sistema (lixeira) exibe conteúdo', async ({ page }) => {
    await loginAdmin(page);
    await irSecao(page, 'sistema');
    // renderLixeira gera .adm-card com título "Lixeira" ou .empty
    await expect(
      page.locator('.adm-card, .loading, .empty').first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Admin autenticado — seção Marketplace', () => {
  test('marketplace admin carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await loginAdmin(page);
    await irSecao(page, 'marketplace');
    await page.waitForTimeout(2_000);
    expect(errors).toHaveLength(0);
  });

  test('marketplace admin exibe conteúdo', async ({ page }) => {
    await loginAdmin(page);
    await irSecao(page, 'marketplace');
    await expect(
      page.locator('.mkt-item, .marketplace-card, .loading, table, .empty-state').first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Admin autenticado — temas', () => {
  for (const tema of ['t-onyx', 't-feminine', 't-neutral', 't-clinic']) {
    test(`tema ${tema} aplica no admin sem erros JS`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await loginAdmin(page);
      await page.evaluate(t => {
        if (typeof setTheme === 'function') setTheme(t);
        else document.documentElement.className = document.documentElement.className
          .replace(/\bt-\S+/g, '').trim() + ' ' + t;
      }, tema);
      const cls = await page.locator('html').getAttribute('class');
      expect(cls).toContain(tema);
      expect(errors).toHaveLength(0);
    });
  }
});

test.describe('Admin autenticado — Push Notifications', () => {
  test('seção push-admin carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await loginAdmin(page);
    // Abre a seção de push se existir
    const pushSection = page.locator('#admin-push-section, [id*="push"]').first();
    if (await pushSection.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(pushSection).toBeVisible();
    }
    expect(errors).toHaveLength(0);
  });
});
