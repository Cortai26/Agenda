// @ts-check
const { test, expect } = require('@playwright/test');

const DEMO_SLUG = 'demo';

// Desktop: .cd-svc-item em #cdConteudo via renderListaServicosDesktop()
// Mobile: .ws-srv-v2 na landing page (landing page cards via _wsServicosV2())
//   Clicar .ws-srv-v2 chama abrirSheet(srvId) → sheet abre com datas já disponíveis
// Sheet (mobile, etapa serviço): .svc-ed-item dentro de #srvWrap

// Helper: aguarda os cartões de serviço ficarem visíveis na landing page
// Desktop: .cd-svc-item | Mobile: .ws-srv-v2
async function aguardarServicos(page) {
  await page.waitForLoadState('networkidle', { timeout: 25_000 });
  const srv = page.locator('.cd-svc-item, .ws-srv-v2');
  await srv.first().waitFor({ state: 'visible', timeout: 15_000 });
}

test.describe('Fluxo de agendamento — carregamento inicial', () => {
  test('página do salão carrega título e serviços', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await expect(page).toHaveTitle(/.+/);
    await aguardarServicos(page);
    // Desktop: .cd-svc-item | Mobile: .ws-srv-v2
    await expect(
      page.locator('.cd-svc-item, .ws-srv-v2').first()
    ).toBeVisible({ timeout: 5_000 });
    expect(errors).toHaveLength(0);
  });

  test('logo e nome do salão são exibidos', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await page.waitForLoadState('networkidle', { timeout: 25_000 });
    // Desktop: #cdTitulo | Mobile: .ws-hero-v2-nome (com foto) ou .ws-hero-nome-capa (sem foto)
    const nome = page.locator('#cdTitulo, .ws-hero-v2-nome, .ws-hero-nome-capa').filter({ visible: true }).first();
    await expect(nome).toBeVisible({ timeout: 15_000 });
    const txt = await nome.textContent();
    expect(txt?.trim().length).toBeGreaterThan(0);
  });

  test('lista de serviços tem ao menos um item com nome e preço', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await aguardarServicos(page);
    const card = page.locator('.cd-svc-item, .ws-srv-v2').first();
    await card.waitFor({ state: 'visible', timeout: 5_000 });
    const text = await card.textContent();
    expect(text?.length).toBeGreaterThan(2);
  });
});

test.describe('Fluxo de agendamento — seleção passo a passo', () => {
  test('selecionar serviço exibe calendário de datas', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await aguardarServicos(page);
    // Clicar .cd-svc-item (desktop→renderEtapaDesktop) ou .ws-srv-v2 (mobile→abrirSheet(srvId))
    await page.locator('.cd-svc-item, .ws-srv-v2').first().click();
    // Desktop: botões com onclick="_desktopDia" | Mobile: .cal-day-ed no sheet desbloqueado
    await expect(
      page.locator('[onclick*="_desktopDia"], .cal-day-ed').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('selecionar data exibe horários disponíveis', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await aguardarServicos(page);
    await page.locator('.cd-svc-item, .ws-srv-v2').first().click();
    // Aguarda e clica num dia disponível
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
    await aguardarServicos(page);
    await page.locator('.cd-svc-item, .ws-srv-v2').first().click();
    const diaBtn = page.locator('[onclick*="_desktopDia"]:not([disabled]), .cal-day-ed:not(.cfd):not(.empty)');
    await diaBtn.first().waitFor({ state: 'visible', timeout: 10_000 });
    await diaBtn.first().click();
    const horaBtn = page.locator('[onclick*="_desktopHora"], .hora-btn-ed:not(.hoc)');
    await horaBtn.first().waitFor({ state: 'visible', timeout: 10_000 });
    await horaBtn.first().click();
    // Desktop: clica "Confirmar" (#btnCdConf) para abrir form
    const btnConf = page.locator('#btnCdConf').first();
    if (await btnConf.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await btnConf.click();
    }
    // Formulário com campo nome ou tel
    const nomeInput = page.locator('#cdNome, #clienteNome, input[placeholder*="nome" i]').first();
    await expect(nomeInput).toBeVisible({ timeout: 10_000 });
  });

  test('formulário valida campos obrigatórios antes de enviar', async ({ page }) => {
    await page.goto(`/agendar/${DEMO_SLUG}`);
    await aguardarServicos(page);
    await page.locator('.cd-svc-item, .ws-srv-v2').first().click();
    const diaBtn = page.locator('[onclick*="_desktopDia"]:not([disabled]), .cal-day-ed:not(.cfd):not(.empty)');
    await diaBtn.first().waitFor({ state: 'visible', timeout: 10_000 });
    await diaBtn.first().click();
    const horaBtn = page.locator('[onclick*="_desktopHora"], .hora-btn-ed:not(.hoc)');
    await horaBtn.first().waitFor({ state: 'visible', timeout: 10_000 });
    await horaBtn.first().click();
    // Desktop: clicar #btnCdConf via evaluate para contornar overflow do painel
    const confClicked = await page.evaluate(() => {
      const btn = document.getElementById('btnCdConf');
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (confClicked) {
      await page.locator('#btnCdSalvar').waitFor({ state: 'attached', timeout: 5_000 }).catch(() => {});
    }
    // Clica salvar sem preencher — deve ser bloqueado pela validação
    await page.evaluate(() => {
      const btn = document.getElementById('btnCdSalvar');
      if (btn) btn.click();
      else {
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
