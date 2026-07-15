-- ════════════════════════════════════════════════════════════════
-- MIGRATION: push-admin secret + refresh tokens
-- Rodar no Supabase SQL Editor (Dashboard → SQL Editor)
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- PARTE 1: Triggers que chamam push-admin com autenticação
-- ────────────────────────────────────────────────────────────────
-- O secret é embutido nas funções SECURITY DEFINER (não exposto externamente).
-- IMPORTANTE: Se trocar o PUSH_ADMIN_SECRET, recriar as funções abaixo.

CREATE OR REPLACE FUNCTION notificar_admin_novo_agendamento()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _url    text := 'https://acldrisohnjfekjxgmoh.supabase.co/functions/v1/push-admin';
  _secret text := 'SEU_PUSH_ADMIN_SECRET_AQUI'; -- substitua pelo valor real antes de rodar
  _anon   text := 'SUA_SUPABASE_ANON_KEY_AQUI'; -- Settings → API → anon public
  _body   text;
  _sal    record;
  _srv    record;
BEGIN
  SELECT nome INTO _sal FROM saloes WHERE id = NEW.salao_id;
  SELECT nome INTO _srv FROM servicos WHERE id = NEW.servico_id;

  _body := json_build_object(
    'tipo',         'novo_agendamento',
    'salao_nome',   COALESCE(_sal.nome, ''),
    'cliente_nome', COALESCE(NEW.cliente_nome, ''),
    'servico_nome', COALESCE(_srv.nome, ''),
    'data',         NEW.data::text,
    'hora',         NEW.hora::text
  )::text;

  PERFORM net.http_post(
    url     := _url,
    body    := _body::jsonb,
    headers := json_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || _anon,
      'x-push-secret', _secret
    )::jsonb
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_notif_admin_novo_agendamento ON agendamentos;
CREATE TRIGGER tg_notif_admin_novo_agendamento
  AFTER INSERT ON agendamentos
  FOR EACH ROW EXECUTE FUNCTION notificar_admin_novo_agendamento();

CREATE OR REPLACE FUNCTION notificar_admin_novo_salao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _url    text := 'https://acldrisohnjfekjxgmoh.supabase.co/functions/v1/push-admin';
  _secret text := 'SEU_PUSH_ADMIN_SECRET_AQUI'; -- substitua pelo valor real antes de rodar
  _anon   text := 'SUA_SUPABASE_ANON_KEY_AQUI'; -- Settings → API → anon public
  _body   text;
BEGIN
  _body := json_build_object(
    'tipo',       'novo_salao',
    'salao_nome', NEW.nome,
    'salao_slug', NEW.slug,
    'plano',      COALESCE(NEW.plano, 'basico')
  )::text;

  PERFORM net.http_post(
    url     := _url,
    body    := _body::jsonb,
    headers := json_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || _anon,
      'x-push-secret', _secret
    )::jsonb
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_notif_admin_novo_salao ON saloes;
CREATE TRIGGER tg_notif_admin_novo_salao
  AFTER INSERT ON saloes
  FOR EACH ROW EXECUTE FUNCTION notificar_admin_novo_salao();


-- ────────────────────────────────────────────────────────────────
-- PARTE 2: Refresh tokens — eliminar senha do localStorage
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id    uuid NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  token       uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  expira_em   timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  usado_em    timestamptz,
  revogado    boolean NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token) WHERE NOT revogado;

ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service role only" ON refresh_tokens;
CREATE POLICY "service role only" ON refresh_tokens
  USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION criar_refresh_token(p_salao_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE _token uuid;
BEGIN
  UPDATE refresh_tokens
  SET revogado = true
  WHERE salao_id = p_salao_id AND revogado = false AND expira_em < now() + interval '1 day';

  INSERT INTO refresh_tokens (salao_id) VALUES (p_salao_id) RETURNING token INTO _token;
  RETURN _token;
END;
$$;

CREATE OR REPLACE FUNCTION usar_refresh_token(p_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _rt         record;
  _novo_token uuid;
BEGIN
  SELECT rt.*, s.id as sid, s.email, s.nome, s.slug, s.plano, s.status,
         s.trial_expira, s.tema, s.fonte, s.cancelamento_min,
         s.intervalo_slots, s.horario, s.is_demo
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
    'refresh_token',    _novo_token,
    'trial_expirado',   (_rt.status = 'trial' AND _rt.trial_expira IS NOT NULL AND _rt.trial_expira < now())
  );
END;
$$;

CREATE OR REPLACE FUNCTION revogar_refresh_tokens(p_salao_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE refresh_tokens SET revogado = true WHERE salao_id = p_salao_id AND revogado = false;
END;
$$;

CREATE OR REPLACE FUNCTION limpar_refresh_tokens_expirados()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE _n integer;
BEGIN
  DELETE FROM refresh_tokens WHERE expira_em < now() - interval '7 days';
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;
