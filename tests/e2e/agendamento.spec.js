// @ts-check
const { test, expect } = require('@playwright/test');

// Demo salon slug that exists in prod
const DEMO_SLUG = 'demo';

test.describe('Fluxo de agendamento público', () => {
  test('página do salão carrega e exibe serviços', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await expect(page).toHaveTitle(/Agenda/i);
    // Aguardar seção de serviços renderizar
    await expect(page.locator('.srv-card, .svc-card, [data-testid="servico"]').first()).toBeVisible({ timeout: 15_000 });
  });

  test('seleção de serviço avança para escolha de data', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    const primeiroServico = page.locator('.srv-card, .svc-card').first();
    await primeiroServico.waitFor({ state: 'visible', timeout: 15_000 });
    await primeiroServico.click();
    // Etapa de data deve aparecer
    await expect(page.locator('.dia-card, .cal-day, [data-testid="dia"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('seleção de data avança para escolha de horário', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    const servico = page.locator('.srv-card, .svc-card').first();
    await servico.waitFor({ state: 'visible', timeout: 15_000 });
    await servico.click();
    const dia = page.locator('.dia-card:not(.disabled), .cal-day:not(.cfd)').first();
    await dia.waitFor({ state: 'visible', timeout: 10_000 });
    await dia.click();
    // Horários devem aparecer
    await expect(page.locator('.h-btn, .hora-btn, [data-testid="hora"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('confirmar agendamento mostra formulário de cliente', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    const servico = page.locator('.srv-card, .svc-card').first();
    await servico.waitFor({ state: 'visible', timeout: 15_000 });
    await servico.click();
    const dia = page.locator('.dia-card:not(.disabled), .cal-day:not(.cfd)').first();
    await dia.waitFor({ state: 'visible', timeout: 10_000 });
    await dia.click();
    const hora = page.locator('.h-btn:not(.oc), .hora-btn:not(.oc)').first();
    await hora.waitFor({ state: 'visible', timeout: 10_000 });
    await hora.click();
    // Campo de nome deve estar visível
    await expect(page.locator('input[name="nome"], #clienteNome, [placeholder*="nome"]').first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Marketplace público', () => {
  test('marketplace carrega com mapa e cards', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(page).toHaveTitle(/marketplace|salões|agenda/i);
    // Mapa Leaflet ou cards devem aparecer
    await expect(page.locator('#mktMap, .mkt-card, .mk-card').first()).toBeVisible({ timeout: 15_000 });
  });
});
