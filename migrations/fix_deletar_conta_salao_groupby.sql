-- ============================================================
-- MIGRATION: fix erro 42803 (grouping_error) em deletar_conta_salao
-- Rodar no Supabase SQL Editor (projeto acldrisohnjfekjxgmoh)
-- ============================================================
-- O RPC original fazia GROUP BY s.id mas selecionava s.auth_user_id
-- sem incluí-la no agrupamento. Recriamos a função do zero sem GROUP BY.

CREATE OR REPLACE FUNCTION deletar_conta_salao(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $f$
DECLARE
  v_nome  text;
  v_ags   bigint := 0;
  v_profs bigint := 0;
  v_srvs  bigint := 0;
BEGIN
  SELECT nome INTO v_nome FROM saloes WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Salão não encontrado');
  END IF;

  -- Contar (sem GROUP BY — cada SELECT é independente)
  SELECT COUNT(*) INTO v_ags   FROM agendamentos  WHERE salao_id = p_id;
  SELECT COUNT(*) INTO v_profs FROM profissionais  WHERE salao_id = p_id;
  SELECT COUNT(*) INTO v_srvs  FROM servicos       WHERE salao_id = p_id;

  -- 1. Tabelas que referenciam profissionais do salão
  DELETE FROM bloqueios
    WHERE profissional_id IN (SELECT id FROM profissionais WHERE salao_id = p_id);

  -- profissional_servicos (pode não existir em todos os ambientes)
  BEGIN
    DELETE FROM profissional_servicos
      WHERE profissional_id IN (SELECT id FROM profissionais WHERE salao_id = p_id);
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- 2. Tabelas que referenciam salao_id diretamente
  DELETE FROM agendamentos  WHERE salao_id = p_id;
  DELETE FROM profissionais WHERE salao_id = p_id;
  DELETE FROM servicos      WHERE salao_id = p_id;

  -- clientes (pode não existir ou ter FK diferente)
  BEGIN
    DELETE FROM clientes WHERE salao_id = p_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- push_subscriptions
  BEGIN
    DELETE FROM push_subscriptions WHERE salao_id = p_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- lixeira_saloes (se existir)
  BEGIN
    DELETE FROM lixeira_saloes WHERE salao_id = p_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- 3. Salão em si (refresh_tokens cascadeia automaticamente)
  DELETE FROM saloes WHERE id = p_id;

  RETURN jsonb_build_object(
    'ok',    true,
    'nome',  v_nome,
    'stats', jsonb_build_object(
      'agendamentos',  v_ags,
      'profissionais', v_profs,
      'servicos',      v_srvs
    )
  );
END;
$f$;

-- Permissão de execução via anon (necessário para o admin.html com anon key)
GRANT EXECUTE ON FUNCTION deletar_conta_salao(uuid) TO anon;
GRANT EXECUTE ON FUNCTION deletar_conta_salao(uuid) TO authenticated;
