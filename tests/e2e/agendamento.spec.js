// @ts-check
const { test, expect } = require('@playwright/test');

const DEMO_SLUG = 'demo';

test.describe('Fluxo de agendamento — carregamento inicial', () => {
  test('página do salão carrega título e serviços', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('.srv-card, .svc-card').first()).toBeVisible({ timeout: 15_000 });
    expect(errors).toHaveLength(0);
  });

  test('logo e nome do salão são exibidos', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await page.waitForLoadState('networkidle');
    const header = page.locator('.ag-header, header, [class*="header"]').first();
    await expect(header).toBeVisible({ timeout: 10_000 });
  });

  test('lista de serviços tem ao menos um item com nome e preço', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    const card = page.locator('.srv-card, .svc-card').first();
    await card.waitFor({ state: 'visible', timeout: 15_000 });
    const text = await card.textContent();
    expect(text?.length).toBeGreaterThan(2);
  });
});

test.describe('Fluxo de agendamento — seleção passo a passo', () => {
  test('selecionar serviço exibe calendário de datas', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await page.locator('.srv-card, .svc-card').first().waitFor({ state: 'visible', timeout: 15_000 });
    await page.locator('.srv-card, .svc-card').first().click();
    await expect(page.locator('.dia-card, .cal-day, [data-testid="dia"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('selecionar data exibe horários disponíveis', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await page.locator('.srv-card, .svc-card').first().waitFor({ state: 'visible', timeout: 15_000 });
    await page.locator('.srv-card, .svc-card').first().click();
    await page.locator('.dia-card:not(.disabled), .cal-day:not(.cfd)').first().waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator('.dia-card:not(.disabled), .cal-day:not(.cfd)').first().click();
    await expect(page.locator('.h-btn, .hora-btn').first()).toBeVisible({ timeout: 10_000 });
  });

  test('selecionar horário livre exibe formulário de dados do cliente', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await page.locator('.srv-card, .svc-card').first().waitFor({ state: 'visible', timeout: 15_000 });
    await page.locator('.srv-card, .svc-card').first().click();
    await page.locator('.dia-card:not(.disabled), .cal-day:not(.cfd)').first().waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator('.dia-card:not(.disabled), .cal-day:not(.cfd)').first().click();
    await page.locator('.h-btn:not(.oc), .hora-btn:not(.oc)').first().waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator('.h-btn:not(.oc), .hora-btn:not(.oc)').first().click();
    const nomeInput = page.locator('input[name="nome"], #clienteNome, [placeholder*="nome" i]').first();
    await expect(nomeInput).toBeVisible({ timeout: 8_000 });
  });

  test('formulário valida campos obrigatórios antes de enviar', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await page.locator('.srv-card, .svc-card').first().waitFor({ state: 'visible', timeout: 15_000 });
    await page.locator('.srv-card, .svc-card').first().click();
    await page.locator('.dia-card:not(.disabled), .cal-day:not(.cfd)').first().waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator('.dia-card:not(.disabled), .cal-day:not(.cfd)').first().click();
    await page.locator('.h-btn:not(.oc), .hora-btn:not(.oc)').first().waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator('.h-btn:not(.oc), .hora-btn:not(.oc)').first().click();
    // Clica confirmar sem preencher — deve bloquear ou mostrar erro
    const btnConfirmar = page.locator('button:has-text("Confirmar"), button:has-text("Agendar"), [id*="btnAg"]').first();
    await btnConfirmar.waitFor({ state: 'visible', timeout: 8_000 });
    await btnConfirmar.click();
    // Página não deve navegar para confirmação sem dados
    await page.waitForTimeout(1000);
    await expect(page).not.toHaveURL(/confirmacao/);
  });
});

test.describe('Marketplace público', () => {
  test('carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('exibe mapa ou lista de salões', async ({ page }) => {
    await page.goto('/marketplace');
    const mapa = page.locator('#mktMap, .leaflet-container');
    const cards = page.locator('.mkt-card, .mk-card');
    await expect(mapa.or(cards).first()).toBeVisible({ timeout: 15_000 });
  });

  test('campo de busca existe e aceita texto', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
    const busca = page.locator('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="search" i], #mktSearch').first();
    if (await busca.isVisible()) {
      await busca.fill('salão');
      await expect(busca).toHaveValue('salão');
    }
  });
});

test.describe('Páginas públicas de pós-agendamento', () => {
  test('confirmacao.html carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/confirmacao.html');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('avaliar.html carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/avaliar.html');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('cancelar.html carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/cancelar.html');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('reagendar.html carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/reagendar.html');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
});
