-- Seed básico para ambiente local Projeto ENEM

TRUNCATE TABLE
  public.respostas_usuarios,
  public.alternativas,
  public.solucoes_questoes,
  public.questoes,
  public.provas,
  public.temas,
  public.imagens
RESTART IDENTITY CASCADE;

INSERT INTO public.temas (nome_tema, descricao) VALUES
  ('Matematica Basica', 'Operacoes fundamentais e raciocinio logico'),
  ('Interpretacao de Texto', 'Compreensao e analise de textos diversos'),
  ('Ciencias da Natureza', 'Fisica, quimica e biologia basicas')
ON CONFLICT (nome_tema) DO UPDATE
  SET descricao = EXCLUDED.descricao;

INSERT INTO public.provas (nome, ano, descricao, tempo_por_questao) VALUES
  ('ENEM 2023 - 1º Dia', 2023, 'Exame Nacional do Ensino Médio 2023 - dia 1', 180),
  ('ENEM 2023 - 2º Dia', 2023, 'Exame Nacional do Ensino Médio 2023 - dia 2', 180),
  ('ENEM 2022 - 1º Dia', 2022, 'Exame Nacional do Ensino Médio 2022 - dia 1', 180)
ON CONFLICT (nome) DO UPDATE
  SET ano = EXCLUDED.ano,
      descricao = EXCLUDED.descricao,
      tempo_por_questao = EXCLUDED.tempo_por_questao;

INSERT INTO public.questoes
  (id_tema, id_prova, enunciado, dificuldade, tem_imagem, nr_questao)
VALUES
  (
    (SELECT id_tema FROM public.temas WHERE nome_tema = 'Matematica Basica'),
    (SELECT id_prova FROM public.provas WHERE nome = 'ENEM 2023 - 1º Dia'),
    'Qual e o valor de 3 + 5?',
    'FACIL',
    false,
    1
  ),
  (
    (SELECT id_tema FROM public.temas WHERE nome_tema = 'Matematica Basica'),
    (SELECT id_prova FROM public.provas WHERE nome = 'ENEM 2023 - 1º Dia'),
    'Resolva: 2x = 14. Qual e o valor de x?',
    'MEDIO',
    false,
    2
  ),
  (
    (SELECT id_tema FROM public.temas WHERE nome_tema = 'Interpretacao de Texto'),
    (SELECT id_prova FROM public.provas WHERE nome = 'ENEM 2023 - 1º Dia'),
    'O que melhor resume a ideia principal de um texto argumentativo?',
    'MEDIO',
    false,
    3
  ),
  (
    (SELECT id_tema FROM public.temas WHERE nome_tema = 'Ciencias da Natureza'),
    (SELECT id_prova FROM public.provas WHERE nome = 'ENEM 2023 - 2º Dia'),
    'Qual particula possui carga negativa?',
    'FACIL',
    false,
    1
  ),
  (
    (SELECT id_tema FROM public.temas WHERE nome_tema = 'Ciencias da Natureza'),
    (SELECT id_prova FROM public.provas WHERE nome = 'ENEM 2023 - 2º Dia'),
    'A fotossintese ocorre principalmente em qual estrutura vegetal?',
    'DIFICIL',
    false,
    2
  )
ON CONFLICT (enunciado) DO NOTHING;

-- Inserção de alternativas relacionadas às questões criadas
INSERT INTO public.alternativas (id_questao, letra, texto, correta, tem_imagem) VALUES
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'Qual e o valor de 3 + 5?'), 'A', '6', false, false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'Qual e o valor de 3 + 5?'), 'B', '7', false, false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'Qual e o valor de 3 + 5?'), 'C', '8', true,  false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'Qual e o valor de 3 + 5?'), 'D', '9', false, false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'Qual e o valor de 3 + 5?'), 'E', '10', false, false),

  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'Resolva: 2x = 14. Qual e o valor de x?'), 'A', '5', false, false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'Resolva: 2x = 14. Qual e o valor de x?'), 'B', '6', false, false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'Resolva: 2x = 14. Qual e o valor de x?'), 'C', '7', true,  false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'Resolva: 2x = 14. Qual e o valor de x?'), 'D', '8', false, false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'Resolva: 2x = 14. Qual e o valor de x?'), 'E', '9', false, false),

  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'O que melhor resume a ideia principal de um texto argumentativo?'), 'A', 'Apresentar dados sem opiniao', false, false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'O que melhor resume a ideia principal de um texto argumentativo?'), 'B', 'Convencer o leitor por meio de argumentos', true, false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'O que melhor resume a ideia principal de um texto argumentativo?'), 'C', 'Narrar eventos em ordem cronologica', false, false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'O que melhor resume a ideia principal de um texto argumentativo?'), 'D', 'Descrever detalhadamente um objeto', false, false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'O que melhor resume a ideia principal de um texto argumentativo?'), 'E', 'Expressar sentimentos do autor', false, false),

  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'Qual particula possui carga negativa?'), 'A', 'Proton', false, false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'Qual particula possui carga negativa?'), 'B', 'Neutron', false, false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'Qual particula possui carga negativa?'), 'C', 'Eletron', true,  false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'Qual particula possui carga negativa?'), 'D', 'Positron', false, false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'Qual particula possui carga negativa?'), 'E', 'Ion', false, false),

  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'A fotossintese ocorre principalmente em qual estrutura vegetal?'), 'A', 'Raiz', false, false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'A fotossintese ocorre principalmente em qual estrutura vegetal?'), 'B', 'Caule', false, false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'A fotossintese ocorre principalmente em qual estrutura vegetal?'), 'C', 'Flor', false, false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'A fotossintese ocorre principalmente em qual estrutura vegetal?'), 'D', 'Folha', true,  false),
  ((SELECT id_questao FROM public.questoes WHERE enunciado = 'A fotossintese ocorre principalmente em qual estrutura vegetal?'), 'E', 'Fruto', false, false);

INSERT INTO public.solucoes_questoes (id_questao, texto_solucao)
SELECT q.id_questao,
  CASE q.enunciado
    WHEN 'Qual e o valor de 3 + 5?' THEN 'Somar 3 e 5 resulta em 8. Logo, alternativa C.'
    WHEN 'Resolva: 2x = 14. Qual e o valor de x?' THEN 'Divida ambos os lados por 2 e obtenha x = 7 (alternativa C).'
    WHEN 'O que melhor resume a ideia principal de um texto argumentativo?' THEN 'A proposta e defender um ponto de vista. Alternativa B.'
    WHEN 'Qual particula possui carga negativa?' THEN 'O eletron possui carga negativa. Alternativa C.'
    WHEN 'A fotossintese ocorre principalmente em qual estrutura vegetal?' THEN 'O processo ocorre nas folhas. Alternativa D.'
  END
FROM public.questoes q
ON CONFLICT (id_questao) DO NOTHING;
