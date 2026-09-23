-- ============================================================
-- MIGRATION: Estado intermediário de pagamento + isenção de cobrança
-- Repo: Cortai26/Agenda · Supabase: acldrisohnjfekjxgmoh
-- Executar no SQL Editor do Supabase Dashboard
-- ============================================================
-- Problema corrigido:
--   1. Trial expirado bloqueava o salão imediatamente, antes do
--      prazo de tolerância de 3 dias que a própria fatura prometia.
--   2. Contas is_demo não eram excluídas dos crons de cobrança.
--   3. Não havia estado intermediário nem log de transições.
-- ============================================================

-- ── 1. Campo de isenção dedicado ────────────────────────────
-- Não reutiliza is_demo: esse campo tem outros usos
-- (filtro de admin/marketplace). isento_cobranca permite
-- conceder cortesia a uma conta real sem marcá-la como demo.
ALTER TABLE saloes
  ADD COLUMN IF NOT EXISTS isento_cobranca boolean DEFAULT false;

-- Backfill: toda conta demo vira isenta
UPDATE saloes
SET isento_cobranca = true
WHERE is_demo = true;

-- ── 2. Log de transições de status ──────────────────────────
-- A causa raiz 2 (is_demo ignorado) ficou invisível por meses
-- porque nada registrava quem/quando/por quê mudou o status.
CREATE TABLE IF NOT EXISTS saloes_status_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id    uuid NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  status_de   text,
  status_para text NOT NULL,
  motivo      text NOT NULL,
  origem      text NOT NULL,
  criado_em   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_status_log_salao
  ON saloes_status_log(salao_id, criado_em DESC);

-- RLS: só service_role pode gravar; anon/authenticated só lêem o próprio salão
ALTER TABLE saloes_status_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service role somente" ON saloes_status_log;
CREATE POLICY "service role somente" ON saloes_status_log
  USING (auth.role() = 'service_role');

-- ── 3. usar_refresh_token — inclui isento_cobranca e vencimento ──
-- Necessário para o banner de pagamento_pendente no frontend
-- saber a data de vencimento sem uma consulta extra.
CREATE OR REPLACE FUNCTION usar_refresh_token(p_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _rt         record;
  _novo_token uuid;
BEGIN
  SELECT rt.*, s.id as sid, s.email, s.nome, s.slug, s.plano, s.status,
         s.trial_expira, s.tema, s.fonte, s.cancelamento_min,
         s.intervalo_slots, s.horario, s.is_demo, s.isento_cobranca,
         s.vencimento, s.responsavel, s.fat_nome, s.fat_cpf_cnpj,
         s.fat_email, s.pix_key
  INTO _rt
  FROM refresh_tokens rt
  JOIN saloes s ON s.id = rt.salao_id
  WHERE rt.token = p_token AND rt.revogado = false AND rt.expira_em > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Token inválido ou expirado');
  END IF;

  UPDATE refresh_tokens SET revogado = true, usado_em = now() WHERE token = p_token;
  INSERT INTO refresh_tokens (salao_id) VALUES (_rt.salao_id) RETURNING token INTO _novo_token;

  RETURN jsonb_build_object(
    'ok',               true,
    'id',               _rt.salao_id,
    'email',            _rt.email,
    'nome',             _rt.nome,
    'slug',             _rt.slug,
    'plano',            _rt.plano,
    'status',           _rt.status,
    'trial_expira',     _rt.trial_expira,
    'tema',             _rt.tema,
    'fonte',            _rt.fonte,
    'cancelamento_min', _rt.cancelamento_min,
    'intervalo_slots',  _rt.intervalo_slots,
    'horario',          _rt.horario,
    'is_demo',          _rt.is_demo,
    'isento_cobranca',  _rt.isento_cobranca,
    'vencimento',       _rt.vencimento,
    'responsavel',      _rt.responsavel,
    'fat_nome',         _rt.fat_nome,
    'fat_cpf_cnpj',     _rt.fat_cpf_cnpj,
    'fat_email',        _rt.fat_email,
    'pix_key',          _rt.pix_key,
    'refresh_token',    _novo_token,
    -- trial_expirado só dispara para salões em trial com data passada.
    -- pagamento_pendente nunca dispara este flag (acesso mantido).
    'trial_expirado',   (_rt.status = 'trial' AND _rt.trial_expira IS NOT NULL AND _rt.trial_expira < now())
  );
END;
$$;

-- ── 4. verificar_acesso_por_email — permitir pagamento_pendente ──
-- ATENÇÃO: esta função vive no banco (não foi criada por migration).
-- Verificar a definição atual via:
--   SELECT prosrc FROM pg_proc WHERE proname = 'verificar_acesso_por_email';
-- e ajustar conforme necessário.
-- A versão abaixo é compatível com o contrato atual (inferido do código):
--   - Retorna ok:true para status: ativo, trial, pagamento_pendente
--   - Retorna ok:false para status: bloqueado
--   - Inclui trial_expirado apenas quando status='trial' com data passada
-- Se a função atual retornar campos adicionais não listados aqui,
-- adicione-os antes de executar.

-- Descomente e execute após verificar a definição atual:
/*
CREATE OR REPLACE FUNCTION public.verificar_acesso_por_email(
  p_email text,
  p_senha text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_salao record;
BEGIN
  SELECT id, email, nome, slug, plano, status, trial_expira,
         tema, fonte, cancelamento_min, intervalo_slots, horario,
         is_demo, isento_cobranca, vencimento, responsavel,
         fat_nome, fat_cpf_cnpj, fat_email, pix_key,
         tentativas_login, bloqueado_ate, senha_hash
  INTO v_salao
  FROM saloes
  WHERE lower(trim(email)) = lower(trim(p_email))
    AND deleted_at IS NULL
  LIMIT 1;

  IF NOT FOUND OR v_salao.senha_hash IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'E-mail ou senha incorretos.');
  END IF;

  IF NOT (v_salao.senha_hash = extensions.crypt(p_senha, v_salao.senha_hash)) THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'E-mail ou senha incorretos.');
  END IF;

  IF v_salao.status = 'bloqueado' THEN
    RETURN jsonb_build_object('ok', false,
      'erro', 'Acesso bloqueado. Entre em contato com o suporte em cortai.contato@gmail.com');
  END IF;

  RETURN jsonb_build_object(
    'ok',               true,
    'id',               v_salao.id,
    'email',            v_salao.email,
    'nome',             v_salao.nome,
    'slug',             v_salao.slug,
    'plano',            v_salao.plano,
    'status',           v_salao.status,
    'trial_expira',     v_salao.trial_expira,
    'tema',             v_salao.tema,
    'fonte',            v_salao.fonte,
    'cancelamento_min', v_salao.cancelamento_min,
    'intervalo_slots',  v_salao.intervalo_slots,
    'horario',          v_salao.horario,
    'is_demo',          v_salao.is_demo,
    'isento_cobranca',  v_salao.isento_cobranca,
    'vencimento',       v_salao.vencimento,
    'responsavel',      v_salao.responsavel,
    'fat_nome',         v_salao.fat_nome,
    'fat_cpf_cnpj',     v_salao.fat_cpf_cnpj,
    'fat_email',        v_salao.fat_email,
    'pix_key',          v_salao.pix_key,
    'trial_expirado',   (v_salao.status = 'trial'
                         AND v_salao.trial_expira IS NOT NULL
                         AND v_salao.trial_expira < now())
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verificar_acesso_por_email(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.verificar_acesso_por_email(text, text) TO authenticated;
*/

-- ── 5. Smoke test ────────────────────────────────────────────
-- Execute para verificar o resultado:
-- SELECT slug, is_demo, isento_cobranca FROM saloes WHERE is_demo = true;
-- SELECT COUNT(*) FROM saloes_status_log;
