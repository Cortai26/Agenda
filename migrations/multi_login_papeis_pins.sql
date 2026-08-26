-- ============================================================
-- MIGRATION: multi-login com papéis e PINs
-- Executar no Supabase SQL Editor (projeto acldrisohnjfekjxgmoh)
-- ============================================================

-- 1. Adicionar colunas na tabela profissionais
ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS pin_hash            text,
  ADD COLUMN IF NOT EXISTS papel               text DEFAULT 'profissional',
  ADD COLUMN IF NOT EXISTS pode_ver_financeiro boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS ultimo_acesso       timestamptz;

ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS comissao_pct numeric DEFAULT 100;

DO $$ BEGIN
  ALTER TABLE profissionais ADD CONSTRAINT profissionais_papel_check
    CHECK (papel IN ('admin', 'profissional', 'recepcao'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profissionais ADD CONSTRAINT profissionais_comissao_pct_check
    CHECK (comissao_pct >= 0 AND comissao_pct <= 100);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN profissionais.comissao_pct IS 'Percentual que o profissional recebe. 100 = recebe tudo.';
COMMENT ON COLUMN profissionais.pode_ver_financeiro IS 'Se true, vê faturamento líquido próprio. Recepção sempre false.';

-- 2. Índice para login rápido
CREATE INDEX IF NOT EXISTS idx_prof_login
  ON profissionais(salao_id, pin_hash) WHERE ativo = true;

-- 3. pgcrypto para bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 4. Definir/trocar PIN de um profissional
CREATE OR REPLACE FUNCTION definir_pin_profissional(
  p_profissional_id uuid,
  p_pin text
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$
BEGIN
  IF p_pin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'PIN deve ter exatamente 4 dígitos';
  END IF;
  UPDATE profissionais
  SET pin_hash = crypt(p_pin, gen_salt('bf', 8))
  WHERE id = p_profissional_id;
  RETURN FOUND;
END; $f$;

-- 5. Login: slug do salão + PIN → retorna sessão
CREATE OR REPLACE FUNCTION login_profissional(
  p_salao_slug text,
  p_pin text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$
DECLARE
  v_salao record;
  v_prof  record;
BEGIN
  SELECT id, nome, slug, plano INTO v_salao
  FROM saloes WHERE slug = lower(trim(p_salao_slug)) AND ativo = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Salão não encontrado');
  END IF;

  SELECT id, nome, papel, comissao_pct, pode_ver_financeiro, foto_url INTO v_prof
  FROM profissionais
  WHERE salao_id = v_salao.id
    AND ativo = true
    AND pin_hash IS NOT NULL
    AND pin_hash = crypt(p_pin, pin_hash)
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'PIN inválido');
  END IF;

  UPDATE profissionais SET ultimo_acesso = now() WHERE id = v_prof.id;

  RETURN jsonb_build_object(
    'ok', true,
    'salao', jsonb_build_object('id', v_salao.id, 'nome', v_salao.nome, 'slug', v_salao.slug, 'plano', v_salao.plano),
    'profissional', jsonb_build_object(
      'id', v_prof.id, 'nome', v_prof.nome, 'papel', v_prof.papel,
      'comissao_pct', v_prof.comissao_pct,
      'pode_ver_financeiro', v_prof.pode_ver_financeiro,
      'foto_url', v_prof.foto_url
    )
  );
END; $f$;

-- 6. Faturamento líquido do profissional (comissão aplicada)
CREATE OR REPLACE FUNCTION faturamento_profissional(
  p_profissional_id uuid,
  p_data_inicio date,
  p_data_fim date
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $f$
DECLARE v_comissao numeric; v_result jsonb;
BEGIN
  SELECT comissao_pct INTO v_comissao FROM profissionais WHERE id = p_profissional_id;
  IF v_comissao IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Profissional não encontrado');
  END IF;

  SELECT jsonb_build_object(
    'ok', true,
    'periodo', jsonb_build_object('inicio', p_data_inicio, 'fim', p_data_fim),
    'atendimentos', COUNT(*),
    'a_receber', ROUND(COALESCE(SUM(a.valor * v_comissao / 100.0), 0), 2),
    'comissao_pct', v_comissao
  ) INTO v_result
  FROM agendamentos a
  WHERE a.profissional_id = p_profissional_id
    AND a.data BETWEEN p_data_inicio AND p_data_fim
    AND a.status = 'concluido';
  RETURN v_result;
END; $f$;

-- 7. Marcar agendamento como concluído (pelo próprio profissional)
CREATE OR REPLACE FUNCTION profissional_marcar_concluido(
  p_ag_id uuid,
  p_profissional_id uuid
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$
BEGIN
  UPDATE agendamentos
  SET status = 'concluido'
  WHERE id = p_ag_id
    AND profissional_id = p_profissional_id
    AND status != 'cancelado';
  RETURN FOUND;
END; $f$;

-- 8. Inserir bloqueio de horário pelo profissional
CREATE OR REPLACE FUNCTION profissional_inserir_bloqueio(
  p_profissional_id uuid,
  p_salao_id uuid,
  p_data date,
  p_hora_inicio text,
  p_hora_fim text DEFAULT NULL,
  p_motivo text DEFAULT 'Bloqueado'
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$
DECLARE v_ok boolean;
BEGIN
  -- verifica que o profissional pertence ao salão
  SELECT EXISTS(
    SELECT 1 FROM profissionais WHERE id = p_profissional_id AND salao_id = p_salao_id AND ativo = true
  ) INTO v_ok;
  IF NOT v_ok THEN RETURN false; END IF;

  INSERT INTO bloqueios(profissional_id, data, hora_inicio, hora_fim, motivo)
  VALUES(p_profissional_id, p_data,
    p_hora_inicio::time, COALESCE(p_hora_fim, p_hora_inicio)::time + interval '30 min',
    p_motivo)
  ON CONFLICT DO NOTHING;
  RETURN true;
END; $f$;

-- 9. Seed: primeiro profissional de cada salão → papel 'admin'
UPDATE profissionais p
SET papel = 'admin', comissao_pct = 100, pode_ver_financeiro = true
WHERE p.id IN (
  SELECT DISTINCT ON (salao_id) id FROM profissionais
  WHERE ativo = true ORDER BY salao_id, criado_em
)
AND (p.papel IS NULL OR p.papel = 'profissional');
