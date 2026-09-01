-- ============================================================
-- MIGRATION: corrigir fluxos de reset de senha
-- Executar no Supabase SQL Editor (projeto acldrisohnjfekjxgmoh)
-- ============================================================
-- 1. self_reset_senha_email  — substitui self_reset_senha(slug+tel)
--    por email+tel (campo que o usuário conhece)
-- 2. admin_set_senha         — admin reseta senha com bcrypt
--    (substitui o PATCH direto com SHA-256 que estava errado)
-- ============================================================

-- 1. RPC de auto-recuperação por e-mail + telefone
CREATE OR REPLACE FUNCTION public.self_reset_senha_email(p_email text, p_telefone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_salao   RECORD;
  v_tel_inp text;
  v_tel_db  text;
BEGIN
  v_tel_inp := regexp_replace(p_telefone, '\D', '', 'g');

  SELECT id, slug, responsavel, telefone
  INTO v_salao
  FROM saloes
  WHERE lower(trim(email)) = lower(trim(p_email))
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_salao.id IS NULL THEN
    RETURN jsonb_build_object('ok', false,
      'erro', 'E-mail não encontrado. Verifique e tente novamente.');
  END IF;

  -- Valida telefone só se o salão tiver um cadastrado
  v_tel_db := regexp_replace(COALESCE(v_salao.telefone, ''), '\D', '', 'g');
  IF v_tel_db <> '' AND v_tel_db <> v_tel_inp THEN
    RETURN jsonb_build_object('ok', false,
      'erro', 'Telefone não confere com o cadastro.');
  END IF;

  RETURN jsonb_build_object('ok', true, 'slug', v_salao.slug, 'nome', v_salao.responsavel);
END;
$$;

GRANT EXECUTE ON FUNCTION public.self_reset_senha_email(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.self_reset_senha_email(text, text) TO authenticated;


-- 2. RPC de reset pelo admin — usa bcrypt (correto), requer auth Supabase
CREATE OR REPLACE FUNCTION public.admin_set_senha(p_slug text, p_nova_senha text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  -- Exige que o chamador seja o admin autenticado via Supabase Auth
  IF auth.email() IS NULL OR auth.email() != 'cortai.contato@gmail.com' THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Sem permissão');
  END IF;

  IF length(trim(p_nova_senha)) < 6 THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Senha deve ter pelo menos 6 caracteres');
  END IF;

  UPDATE saloes
  SET senha_hash     = extensions.crypt(p_nova_senha, extensions.gen_salt('bf', 10)),
      tentativas_login = 0,
      bloqueado_ate  = NULL,
      updated_at     = now()
  WHERE slug = p_slug
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Salão não encontrado');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Só authenticated (admin logado) pode chamar esta função
GRANT EXECUTE ON FUNCTION public.admin_set_senha(text, text) TO authenticated;
