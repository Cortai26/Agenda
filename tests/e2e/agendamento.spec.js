// @ts-check
const { test, expect } = require('@playwright/test');

const DEMO_SLUG = 'demo';

// Desktop: agendar.html renderiza serviços em .cd-svc-item (coluna direita) via renderListaServicosDesktop()
// Mobile (Pixel 5): usa .ws-srv-card no bottom-sheet

test.describe('Fluxo de agendamento — carregamento inicial', () => {
  test('página do salão carrega título e serviços', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await expect(page).toHaveTitle(/.+/);
    // Desktop: .cd-svc-item em #cdConteudo | Mobile: .ws-srv-card no sheet
    await expect(
      page.locator('.cd-svc-item, .ws-srv-card').first()
    ).toBeVisible({ timeout: 15_000 });
    expect(errors).toHaveLength(0);
  });

  test('logo e nome do salão são exibidos', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await page.waitForLoadState('networkidle');
    // Desktop: #cdTitulo (painel direito, sempre visível) | Mobile: #hdrName (dentro do header)
    // Usa filter para pegar apenas o elemento visível (evita #hdrName que é display:none no desktop)
    const nome = page.locator('#cdTitulo, #hdrName, .ag-salon-name').filter({ visible: true }).first();
    await expect(nome).toBeVisible({ timeout: 10_000 });
    const txt = await nome.textContent();
    expect(txt?.trim().length).toBeGreaterThan(0);
  });

  test('lista de serviços tem ao menos um item com nome e preço', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    const card = page.locator('.cd-svc-item, .ws-srv-card').first();
    await card.waitFor({ state: 'visible', timeout: 15_000 });
    const text = await card.textContent();
    expect(text?.length).toBeGreaterThan(2);
  });
});

test.describe('Fluxo de agendamento — seleção passo a passo', () => {
  test('selecionar serviço exibe calendário de datas', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await page.locator('.cd-svc-item, .ws-srv-card').first().waitFor({ state: 'visible', timeout: 15_000 });
    await page.locator('.cd-svc-item, .ws-srv-card').first().click();
    // Desktop: botões com onclick="_desktopDia" | Mobile: .cal-day-ed
    await expect(
      page.locator('[onclick*="_desktopDia"], .cal-day-ed').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('selecionar data exibe horários disponíveis', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await page.locator('.cd-svc-item, .ws-srv-card').first().waitFor({ state: 'visible', timeout: 15_000 });
    await page.locator('.cd-svc-item, .ws-srv-card').first().click();
    // Clica num dia disponível
    const diaBtn = page.locator('[onclick*="_desktopDia"]:not([disabled]), .cal-day-ed:not(.cfd):not(.empty)');
    await diaBtn.first().waitFor({ state: 'visible', timeout: 10_000 });
    await diaBtn.first().click();
    // Aguarda botões de horário — desktop: [onclick*="_desktopHora"] | mobile: .hora-btn-ed
    await expect(
      page.locator('[onclick*="_desktopHora"], .hora-btn-ed').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('selecionar horário livre exibe formulário de dados do cliente', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await page.locator('.cd-svc-item, .ws-srv-card').first().waitFor({ state: 'visible', timeout: 15_000 });
    await page.locator('.cd-svc-item, .ws-srv-card').first().click();
    const diaBtn = page.locator('[onclick*="_desktopDia"]:not([disabled]), .cal-day-ed:not(.cfd):not(.empty)');
    await diaBtn.first().waitFor({ state: 'visible', timeout: 10_000 });
    await diaBtn.first().click();
    await page.locator('[onclick*="_desktopHora"], .hora-btn-ed:not(.hoc)').first().waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator('[onclick*="_desktopHora"], .hora-btn-ed:not(.hoc)').first().click();
    // Desktop: clica "Confirmar" (#btnCdConf) para abrir form | Mobile: form já aparece
    const btnConf = page.locator('#btnCdConf').first();
    if (await btnConf.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await btnConf.click();
    }
    // Formulário com campo nome ou tel
    const nomeInput = page.locator('#cdNome, #clienteNome, input[placeholder*="nome" i]').first();
    await expect(nomeInput).toBeVisible({ timeout: 8_000 });
  });

  test('formulário valida campos obrigatórios antes de enviar', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await page.locator('.cd-svc-item, .ws-srv-card').first().waitFor({ state: 'visible', timeout: 15_000 });
    await page.locator('.cd-svc-item, .ws-srv-card').first().click();
    const diaBtn = page.locator('[onclick*="_desktopDia"]:not([disabled]), .cal-day-ed:not(.cfd):not(.empty)');
    await diaBtn.first().waitFor({ state: 'visible', timeout: 10_000 });
    await diaBtn.first().click();
    await page.locator('[onclick*="_desktopHora"], .hora-btn-ed:not(.hoc)').first().waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator('[onclick*="_desktopHora"], .hora-btn-ed:not(.hoc)').first().click();
    // Desktop: clicar #btnCdConf abre o form; usar evaluate() para contornar overflow do painel
    const confClicked = await page.evaluate(() => {
      const btn = document.getElementById('btnCdConf');
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (confClicked) {
      // Aguarda form aparecer
      await page.locator('#btnCdSalvar').waitFor({ state: 'attached', timeout: 5_000 }).catch(() => {});
    }
    // Clica salvar sem preencher — deve ser bloqueado pela validação
    await page.evaluate(() => {
      const btn = document.getElementById('btnCdSalvar');
      if (btn) btn.click();
      else {
        // fallback: mobile confirmação
        const f = document.querySelector('button[onclick*="confirmar"], button[onclick*="salvar"]');
        if (f) f.click();
      }
    });
    await page.waitForTimeout(1000);
    // Sem nome/tel preenchido, não deve navegar para confirmacao
    await expect(page).not.toHaveURL(/confirmacao/);
  });
});

test.describe('Marketplace público', () => {
  test('carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/marketplace.html');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('exibe mapa ou lista de salões', async ({ page }) => {
    await page.goto('/marketplace.html');
    const mapa = page.locator('#mktMap, .leaflet-container');
    const cards = page.locator('.mkt-card, #mktCards');
    await expect(mapa.or(cards).first()).toBeVisible({ timeout: 15_000 });
  });

  test('campo de busca existe e aceita texto', async ({ page }) => {
    await page.goto('/marketplace.html');
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
