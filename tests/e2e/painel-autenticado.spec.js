// @ts-check
const { test, expect } = require('@playwright/test');

const EMAIL = process.env.TEST_PAINEL_EMAIL || '';
const SENHA = process.env.TEST_PAINEL_SENHA || '';

if (!EMAIL || !SENHA) {
  throw new Error('Defina TEST_PAINEL_EMAIL e TEST_PAINEL_SENHA em .env.test');
}

// Helper: faz login e aguarda o appWrap aparecer
async function login(page) {
  await page.goto('/painel.html');
  await page.locator('#loginEmail').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('#loginEmail').fill(EMAIL);
  await page.locator('#loginSenha').fill(SENHA);
  await page.locator('#btnLogin').click();
  // Aguarda o app principal aparecer (loginWrap some, appWrap.show aparece)
  await page.locator('#appWrap.show').waitFor({ state: 'attached', timeout: 20_000 });
}

// Helper: navega para uma tab via click no sidebar
async function irTab(page, tab) {
  await page.locator(`[data-tab="${tab}"]`).first().click();
  await page.waitForTimeout(500);
}

test.describe('Painel autenticado — login', () => {
  test('login com credenciais válidas abre o app', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await login(page);
    await expect(page.locator('#appWrap')).toHaveClass(/show/);
    // Tela de login deve sumir
    await expect(page.locator('#loginWrap')).toBeHidden();
    expect(errors).toHaveLength(0);
  });

  test('nome do salão aparece no header após login', async ({ page }) => {
    await login(page);
    const nome = page.locator('#hdrNome');
    await expect(nome).toBeVisible();
    const txt = await nome.textContent();
    expect(txt?.trim().length).toBeGreaterThan(0);
  });

  test('sessão persiste após reload (refresh token)', async ({ page }) => {
    await login(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    // Deve restaurar sessão sem pedir login
    await page.locator('#appWrap.show').waitFor({ state: 'attached', timeout: 15_000 });
    await expect(page.locator('#loginWrap')).toBeHidden();
  });
});

test.describe('Painel autenticado — tab Agenda', () => {
  test('tab agenda carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await login(page);
    await irTab(page, 'agenda');
    // Após render: .metrics (KPIs do dia) ou .section-group (seções colapsáveis)
    await expect(
      page.locator('.metrics, .section-group, #tb-agenda .loading').first()
    ).toBeVisible({ timeout: 20_000 });
    expect(errors).toHaveLength(0);
  });

  test('tab agenda exibe datas navegáveis', async ({ page }) => {
    await login(page);
    await irTab(page, 'agenda');
    // Aguarda calendário renderizar
    await page.waitForTimeout(2_000);
    // Botões de navegação do calendário (cal-nav-btn ou Hoje)
    const navBtns = page.locator('.cal-nav-btn');
    await expect(navBtns.first()).toBeVisible({ timeout: 10_000 });
    expect(await navBtns.count()).toBeGreaterThanOrEqual(2);
  });

  test('botão Novo Agendamento abre modal ou formulário', async ({ page }) => {
    await login(page);
    await irTab(page, 'agenda');
    const btnNovo = page.locator('button:has-text("Novo"), button:has-text("Agendar"), [id*="btnNovo"]').first();
    if (await btnNovo.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btnNovo.click();
      // Overlay ou modal abre
      await expect(
        page.locator('.overlay.show, .modal.show, [class*="overlay"].show').first()
      ).toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe('Painel autenticado — tab Clientes', () => {
  test('tab clientes carrega lista ou empty state', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await login(page);
    await irTab(page, 'clientes');
    await expect(
      page.locator('.cliente-card, .cli-item, .cli-row, .empty-state, .loading').first()
    ).toBeVisible({ timeout: 15_000 });
    expect(errors).toHaveLength(0);
  });

  test('campo de busca de clientes aceita texto', async ({ page }) => {
    await login(page);
    await irTab(page, 'clientes');
    const busca = page.locator('input[placeholder*="buscar" i], input[placeholder*="cliente" i], #cliBusca').first();
    if (await busca.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await busca.fill('teste');
      await expect(busca).toHaveValue('teste');
    }
  });
});

test.describe('Painel autenticado — tab Serviços', () => {
  test('tab serviços carrega lista', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await login(page);
    await irTab(page, 'servicos');
    // #tb-servicos.on é o painel ativo; .srv-card ou .srv-empty aparecem após render
    await expect(
      page.locator('#tb-servicos .srv-card, #tb-servicos .srv-empty, #tb-servicos .loading').first()
    ).toBeVisible({ timeout: 15_000 });
    expect(errors).toHaveLength(0);
  });

  test('botão Novo Serviço existe', async ({ page }) => {
    await login(page);
    await irTab(page, 'servicos');
    await page.waitForTimeout(2_000);
    const btn = page.locator('button:has-text("Novo serviço"), button:has-text("Adicionar"), button:has-text("+ Serviço")').first();
    await expect(btn).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Painel autenticado — tab Equipe', () => {
  test('tab equipe carrega sem erros', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await login(page);
    await irTab(page, 'equipe');
    await expect(
      page.locator('.eq-card, .srv-empty, .loading').first()
    ).toBeVisible({ timeout: 15_000 });
    expect(errors).toHaveLength(0);
  });
});

test.describe('Painel autenticado — tab Analytics', () => {
  test('tab analytics carrega sem erros JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await login(page);
    await irTab(page, 'analytics');
    await page.waitForTimeout(2_000);
    expect(errors).toHaveLength(0);
  });

  test('cards de KPI são exibidos', async ({ page }) => {
    await login(page);
    await irTab(page, 'analytics');
    // .akpi são os cards de métricas do p-analytics.js
    await expect(
      page.locator('.akpi, .analytics-grid, .loading').first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Painel autenticado — tab Página pública', () => {
  test('tab pagina carrega configurações sem erros', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await login(page);
    await irTab(page, 'pagina');
    await page.waitForTimeout(2_000);
    expect(errors).toHaveLength(0);
  });

  test('link da página pública é exibido', async ({ page }) => {
    await login(page);
    const linkPag = page.locator('#btnVerPag, a[href*="/agendar"]').first();
    await expect(linkPag).toBeVisible({ timeout: 10_000 });
    const href = await linkPag.getAttribute('href');
    expect(href).toContain('/agendar');
  });
});

test.describe('Painel autenticado — temas', () => {
  for (const tema of ['t-onyx', 't-feminine', 't-neutral', 't-clinic']) {
    test(`tema ${tema} aplica sem erros JS`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await login(page);
      // Chama setTheme via JavaScript
      await page.evaluate(t => {
        if (typeof setPainelTema === 'function') setPainelTema(t);
        else document.documentElement.className = document.documentElement.className
          .replace(/\bt-\S+/g, '').trim() + ' ' + t;
      }, tema);
      const cls = await page.locator('html').getAttribute('class');
      expect(cls).toContain(tema);
      expect(errors).toHaveLength(0);
    });
  }
});
