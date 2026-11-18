/**
 * calculo.js
 * Motor de cálculo do Lugar Calmo: funções puras, sem DOM e sem estado.
 *
 * Esta é a implementação funcional do diagrama de classes da Fase 04. Os métodos da classe
 * LocalSensorial (estimulosEfetivos, calcularCompatibilidade, classificarSelo, melhorTurno) viram
 * funções puras que recebem o local como parâmetro. Dados imutáveis + funções puras são mais fáceis
 * de testar: a mesma entrada sempre dá a mesma saída, sem montar a página nem simular estado.
 * Nenhuma função altera os argumentos recebidos.
 *
 * Depende de js/dados.js, carregado antes (scripts com defer rodam na ordem em que aparecem no HTML).
 */
(function (LC) {
  'use strict';

  const { TURNOS, LIMIARES, TIPOS_LOCAL, PERFIS_REMETENTE, FILTROS_ADAPTACAO } = LC.dados;

  // Texto exibido de cada selo (RN05). A ordem das chaves também é a ordem do resumo (RF18).
  const ROTULOS_SELO = Object.freeze({ tranquilo: 'Tranquilo', atencao: 'Atenção', evitar: 'Evitar neste horário' });

  // Nome de cada estímulo nas mensagens de erro, na ordem do formulário (K6).
  const NOMES_ESTIMULO = Object.freeze({ ruido: 'ruído', luz: 'iluminação', lotacao: 'lotação', cheiro: 'cheiro' });

  // RN11: nível do formulário é um único dígito de 0 a 5. A regex recusa "6", "-1", "2.5", "abc", " 3" e "".
  const NIVEL_VALIDO = /^[0-5]$/;

  // Estímulos na ordem do card e do formulário. Na versão 2 os quatro variam por turno.
  const CHAVES_ESTIMULO = Object.freeze(['ruido', 'luz', 'lotacao', 'cheiro']);

  // Alerta de gatilho (versão 2, pedido da entrevista P2): um estímulo forte no local (4 ou 5) somado a uma
  // sensibilidade alta da pessoa (4 ou 5) é avisado no card, porque a nota média pode esconder esse pico.
  const NIVEL_FORTE = 4;

  // Limite do texto da hora silenciosa informada no formulário ("Terça, 9h" cabe com folga).
  const DESCRICAO_SILENCIOSA = Object.freeze({ min: 3, max: 40 });

  /**
   * Soma as quatro sensibilidades do perfil (o S da RN03).
   * Publicada como somaSensibilidades (contrato 10.1); o nome interno usa o verbo para que a variável
   * local de calcularCompatibilidade possa se chamar somaSensibilidades, como na fórmula da RN04.
   * @param {{ruido: number, luz: number, lotacao: number, cheiro: number}} perfil sensibilidades de 0 a 5 (RN01)
   * @returns {number} soma de 0 a 20
   */
  function somarSensibilidades(perfil) {
    return perfil.ruido + perfil.luz + perfil.lotacao + perfil.cheiro;
  }

  /**
   * Diz se o local tem dados para receber nota no turno.
   * @param {object} local local sensorial (seção 7.1 do PRD)
   * @param {string} turno 'manha' | 'tarde' | 'noite'
   * @returns {'aberto'|'fechado'|'sem-dados'} situação do local no turno
   */
  function situacaoNoTurno(local, turno) {
    // RN07: turno fora de turnosAbertos não tem nota.
    if (!local.turnosAbertos.includes(turno)) return 'fechado';
    // RN16: contribuição só tem os 4 estímulos no turno informado; nos outros turnos eles são null.
    // typeof (e não === null) para que um dado ausente (undefined) também vire "sem dados", nunca NaN.
    const temTodos = CHAVES_ESTIMULO.every((chave) => typeof local[chave][turno] === 'number');
    return temTodos ? 'aberto' : 'sem-dados';
  }

  /**
   * Níveis que a pessoa vai encontrar no local naquele turno, já com a Hora Silenciosa aplicada.
   * @param {object} local local sensorial
   * @param {string} turno 'manha' | 'tarde' | 'noite'
   * @returns {{ruido: number, luz: number, lotacao: number, cheiro: number, horaSilenciosaAtiva: boolean}|null}
   *   níveis efetivos de 0 a 5, ou null se o local não está aberto com dados no turno
   */
  function estimulosEfetivos(local, turno) {
    if (situacaoNoTurno(local, turno) !== 'aberto') return null;
    // RN06: a hora silenciosa vale só no turno dela; o dia da semana em descricao é só informativo.
    const ativa = local.horaSilenciosa !== null && local.horaSilenciosa.turno === turno;
    // RN06: ruído, luz e lotação caem 2 com piso 0; o cheiro não muda.
    const reducao = ativa ? 2 : 0;
    // Versão 2: luz e cheiro também são lidos do turno, como ruído e lotação.
    return {
      ruido: Math.max(0, local.ruido[turno] - reducao),
      luz: Math.max(0, local.luz[turno] - reducao),
      lotacao: Math.max(0, local.lotacao[turno] - reducao),
      cheiro: local.cheiro[turno],
      horaSilenciosaAtiva: ativa
    };
  }

  /**
   * Nota de compatibilidade do local para o perfil sensorial no turno (RN02 a RN04).
   * @param {object} local local sensorial
   * @param {{ruido: number, luz: number, lotacao: number, cheiro: number}} perfil sensibilidades de 0 a 5
   * @param {string} turno 'manha' | 'tarde' | 'noite'
   * @returns {number|null} inteiro de 0 a 100, ou null se o local está fechado ou sem dados no turno (RN07, RN16)
   */
  function calcularCompatibilidade(local, perfil, turno) {
    const efetivos = estimulosEfetivos(local, turno);
    if (efetivos === null) return null;
    const somaSensibilidades = somarSensibilidades(perfil);
    // RN02: sem nenhuma sensibilidade, nada incomoda; todo aberto vale 100, sem bônus e sem dividir por zero.
    if (somaSensibilidades === 0) return 100;
    // RN03: cada estímulo pesa conforme a sensibilidade da pessoa a ele.
    const somaPonderada = perfil.ruido * efetivos.ruido + perfil.luz * efetivos.luz +
      perfil.lotacao * efetivos.lotacao + perfil.cheiro * efetivos.cheiro;
    // RN04: bônus B de preparo do local, +5 por espaço calmo e +5 por saída fácil.
    const B = (local.espacoCalmo === true ? 5 : 0) + (local.saidaFacil === true ? 5 : 0);
    // RN03 + RN04: Incômodo% = 100 × soma / (5 × S), e 100 × soma / (5 × S) = 20 × soma / S.
    // A forma simplificada faz uma divisão só e reduz o erro de ponto flutuante antes do arredondamento.
    return Math.min(100, Math.max(0, Math.round(100 + B - (20 * somaPonderada) / somaSensibilidades)));
  }

  /**
   * Selo da nota (RN05): 70 ou mais é Tranquilo, de 40 a 69 é Atenção, abaixo de 40 é Evitar.
   * @param {number} nota inteiro de 0 a 100
   * @returns {'tranquilo'|'atencao'|'evitar'} chave do selo
   */
  function classificarSelo(nota) {
    if (nota >= LIMIARES.tranquilo) return 'tranquilo';
    if (nota >= LIMIARES.atencao) return 'atencao';
    return 'evitar';
  }

  /**
   * Texto exibido para a chave do selo.
   * @param {'tranquilo'|'atencao'|'evitar'} selo chave do selo
   * @returns {string} 'Tranquilo' | 'Atenção' | 'Evitar neste horário'
   */
  function rotuloSelo(selo) {
    return ROTULOS_SELO[selo];
  }

  /**
   * Melhor horário do local para o perfil (RN08).
   * @param {object} local local sensorial
   * @param {{ruido: number, luz: number, lotacao: number, cheiro: number}} perfil sensibilidades de 0 a 5
   * @returns {{turno: string, nota: number}|null} turno ('manha' | 'tarde' | 'noite') de maior nota, ou null se nenhum turno tem nota
   */
  function melhorTurno(local, perfil) {
    let melhor = null;
    // TURNOS está em ordem cronológica e só trocamos com nota estritamente maior:
    // assim o empate fica com o turno mais cedo (manhã, depois tarde, depois noite).
    for (const { id } of TURNOS) {
      const nota = calcularCompatibilidade(local, perfil, id);
      if (nota !== null && (melhor === null || nota > melhor.nota)) melhor = { turno: id, nota };
    }
    return melhor;
  }

  /**
   * Texto da linha de melhor horário (versão 2, pedido da entrevista P2).
   * Abaixo da faixa Tranquilo (RN05), "melhor" daria uma falsa sensação de calma; vira "menos crítico".
   * @param {number} nota maior nota do local entre os turnos
   * @returns {'Melhor horário'|'Horário menos crítico'} rótulo da linha
   */
  function rotuloMelhorHorario(nota) {
    return nota >= LIMIARES.tranquilo ? 'Melhor horário' : 'Horário menos crítico';
  }

  /**
   * Estímulos que podem ser gatilho para a pessoa no turno (versão 2, pedido da entrevista P2).
   * @param {{ruido: number, luz: number, lotacao: number, cheiro: number}|null} efetivos níveis efetivos no turno
   * @param {{ruido: number, luz: number, lotacao: number, cheiro: number}} perfil sensibilidades de 0 a 5
   * @returns {Array<string>} chaves dos estímulos com nível 4 ou 5 no local e sensibilidade 4 ou 5 na pessoa
   */
  function estimulosFortes(efetivos, perfil) {
    if (efetivos === null) return [];
    return CHAVES_ESTIMULO.filter((chave) => efetivos[chave] >= NIVEL_FORTE && perfil[chave] >= NIVEL_FORTE);
  }

  /**
   * Origem do dado mostrada no card (RN10, RN13; versão 2, pedido das entrevistas P3 e P6).
   * Comerciante ou gestor informa pelo estabelecimento; os demais perfis são relato comunitário.
   * @param {object} local local sensorial
   * @returns {string} texto do selo de origem
   */
  function descreverOrigem(local) {
    if (local.ficticio) return 'Dado demonstrativo (fictício)';
    if (local.perfilRemetente === 'comerciante-gestor') return 'Informação do estabelecimento (sessão, não verificada)';
    if (local.perfilRemetente) return `Relato comunitário: ${PERFIS_REMETENTE[local.perfilRemetente]} (sessão, não verificada)`;
    return 'Relato comunitário (sessão, não verificada)';
  }

  /**
   * Reúne tudo o que o card precisa para mostrar o local no turno escolhido.
   * @param {object} local local sensorial
   * @param {{ruido: number, luz: number, lotacao: number, cheiro: number}} perfil sensibilidades de 0 a 5
   * @param {string} turno 'manha' | 'tarde' | 'noite'
   * @returns {{local: object, situacao: string, nota: (number|null), selo: (string|null), melhor: (object|null),
   *   efetivos: (object|null), fortes: Array<string>}}
   *   nota, selo e efetivos são null quando a situação não é 'aberto'; fortes fica vazio nesse caso
   */
  function avaliarLocal(local, perfil, turno) {
    const nota = calcularCompatibilidade(local, perfil, turno);
    const efetivos = estimulosEfetivos(local, turno);
    return {
      local,
      situacao: situacaoNoTurno(local, turno),
      nota,
      selo: nota === null ? null : classificarSelo(nota),
      melhor: melhorTurno(local, perfil),
      efetivos,
      fortes: estimulosFortes(efetivos, perfil)
    };
  }

  /**
   * Diz se o local tem a adaptação pedida no filtro.
   * A hora silenciosa é um objeto (ou null); as outras adaptações são booleanos.
   * @param {object} local local sensorial
   * @param {string} chave chave de FILTROS_ADAPTACAO
   * @returns {boolean} true quando o local tem a adaptação
   */
  function temAdaptacao(local, chave) {
    return chave === 'horaSilenciosa' ? local.horaSilenciosa !== null : local[chave] === true;
  }

  /**
   * Aplica os filtros da lista (RF09).
   * Versão 2 (pedido das entrevistas P1 e P6): o antigo filtro único "espaço calmo e saída fácil" virou
   * 4 filtros independentes. Cada um marcado precisa ser atendido (E), porque quem marca dois quer os dois.
   * @param {Array<object>} locais locais sensoriais
   * @param {{tipo: string, exigir: Array<string>}} filtros tipo de TIPOS_LOCAL ou 'todos' (não filtra por tipo)
   *   e as chaves de FILTROS_ADAPTACAO marcadas (lista vazia não filtra por adaptação)
   * @returns {Array<object>} novo array só com os locais que passam em todos os filtros
   */
  function filtrarLocais(locais, { tipo, exigir }) {
    // Só chaves conhecidas valem: uma chave estranha vinda do HTML não pode esconder todos os locais.
    const validas = exigir.filter((chave) => FILTROS_ADAPTACAO.some((filtro) => filtro.chave === chave));
    return locais.filter(function (local) {
      const tipoOk = tipo === 'todos' || local.tipo === tipo;
      return tipoOk && validas.every((chave) => temAdaptacao(local, chave));
    });
  }

  /**
   * Ordena as avaliações para exibição.
   * @param {Array<object>} avaliacoes resultados de avaliarLocal
   * @returns {Array<object>} novo array: maior nota primeiro, empate em ordem alfabética, sem nota no fim
   */
  function ordenarAvaliacoes(avaliacoes) {
    // slice() antes do sort: sort ordena no próprio array, e a função não pode mudar o que recebeu.
    return avaliacoes.slice().sort(function (a, b) {
      // RN07 e RN16: fechados e sem dados (nota null) vão para o fim.
      if ((a.nota === null) !== (b.nota === null)) return a.nota === null ? 1 : -1;
      // RF06: maior nota primeiro.
      if (a.nota !== b.nota) return b.nota - a.nota;
      // RN09: empate de nota, e também o grupo sem nota, em ordem alfabética do português.
      return a.local.nome.localeCompare(b.local.nome, 'pt-BR');
    });
  }

  /**
   * Frase do resumo dinâmico da lista (RF18, formato fixado no contrato K7).
   * Singular só quando o número é exatamente 1; 0 usa plural ("0 locais").
   * @param {Array<object>} avaliacoes resultados de avaliarLocal já filtrados
   * @param {string} turno 'manha' | 'tarde' | 'noite'
   * @returns {string} ex.: "Turno Noite: 9 locais com nota. 2 Tranquilo, 3 Atenção, 4 Evitar neste horário. 3 fechados ou sem dados neste turno."
   */
  function resumirLista(avaliacoes, turno) {
    const contar = (condicao) => avaliacoes.filter(condicao).length;
    const comNota = contar((avaliacao) => avaliacao.nota !== null);
    const semNota = contar((avaliacao) => avaliacao.situacao === 'fechado' || avaliacao.situacao === 'sem-dados');
    const rotuloTurno = TURNOS.find((item) => item.id === turno).rotulo;

    let texto = `Turno ${rotuloTurno}: ${comNota} ${comNota === 1 ? 'local' : 'locais'} com nota.`;
    if (comNota > 0) {
      const porSelo = Object.keys(ROTULOS_SELO).map((selo) => `${contar((avaliacao) => avaliacao.selo === selo)} ${ROTULOS_SELO[selo]}`);
      texto += ` ${porSelo.join(', ')}.`;
    }
    if (semNota > 0) {
      texto += ` ${semNota} ${semNota === 1 ? 'fechado' : 'fechados'} ou sem dados neste turno.`;
    }
    return texto;
  }

  /**
   * Limpa o nome digitado: normaliza acentos (NFC), tira caracteres invisíveis de largura zero e faz trim.
   * Texto colado de mensageiros traz U+200B/U+2060/U+FEFF e acentos decompostos, que driblariam a RN12
   * e o mínimo de 3 caracteres e deixariam o título do card vazio.
   * @param {string} nome nome como veio do formulário
   * @returns {string} nome limpo, com as maiúsculas e os espaços internos originais
   */
  function limparNome(nome) {
    return nome.normalize('NFC').replace(/[​-‍⁠﻿]/g, '').trim();
  }

  /**
   * Forma canônica do nome para detectar duplicados (RN12).
   * @param {string} nome nome digitado ou já cadastrado
   * @returns {string} nome limpo, com espaços múltiplos colapsados e em minúsculas
   */
  function normalizarNome(nome) {
    return limparNome(nome).replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
  }

  /**
   * Valida o formulário "Avaliar ou sugerir um local" (seção 12, contrato K6).
   * @param {{nome: string, tipo: string, turno: string, ruido: string, luz: string, lotacao: string, cheiro: string,
   *   perfilRemetente: string, comentario: string, espacoCalmo: boolean, saidaFacil: boolean, equipeTreinada: boolean,
   *   temHoraSilenciosa: boolean, silenciosaTurno: string, silenciosaDescricao: string,
   *   privacidade: boolean}} valores valores crus do formulário ('' quando vazio)
   * @param {Array<object>} locaisExistentes locais já na lista, para recusar nome duplicado
   * @returns {{valido: boolean, erros: Object<string, string>}} erros só dos campos inválidos, na ordem do formulário
   */
  function validarContribuicao(valores, locaisExistentes) {
    // As chaves entram na ordem do formulário (K6): o formulário usa Object.keys(erros) para montar o resumo e focar o primeiro.
    const erros = {};

    const nome = limparNome(valores.nome);
    if (nome === '') {
      erros.nome = 'Informe o nome do local.';
    } else if (nome.length < 3 || nome.length > 60) {
      erros.nome = 'O nome precisa ter entre 3 e 60 caracteres.';
    } else {
      // RN12: duplicado sem diferenciar maiúsculas, depois de trim e colapso de espaços.
      const nomeNormalizado = normalizarNome(nome);
      if (locaisExistentes.some((local) => normalizarNome(local.nome) === nomeNormalizado)) {
        erros.nome = 'Este local já está na lista. Use outro nome.';
      }
    }

    if (!TIPOS_LOCAL.includes(valores.tipo)) erros.tipo = 'Selecione o tipo de local.';
    if (!TURNOS.some((item) => item.id === valores.turno)) erros.turno = 'Escolha o turno da visita.';

    // RN11 [DECISÃO PRD]: os 4 níveis são obrigatórios e inteiros de 0 a 5.
    for (const [campo, estimulo] of Object.entries(NOMES_ESTIMULO)) {
      if (!NIVEL_VALIDO.test(valores[campo])) erros[campo] = `Informe o nível de ${estimulo}, de 0 a 5.`;
    }

    // Versão 2 (pedido da entrevista P3): a hora silenciosa pode ser informada. Só é validada se marcada.
    if (valores.temHoraSilenciosa === true) {
      if (!TURNOS.some((item) => item.id === valores.silenciosaTurno)) {
        erros['silenciosa-turno'] = 'Escolha o turno da hora silenciosa.';
      }
      const descricao = limparNome(valores.silenciosaDescricao);
      if (descricao.length < DESCRICAO_SILENCIOSA.min || descricao.length > DESCRICAO_SILENCIOSA.max) {
        erros['silenciosa-descricao'] = `Informe o dia e o horário da hora silenciosa (ex.: Terça, 9h), com até ${DESCRICAO_SILENCIOSA.max} caracteres.`;
      }
    }

    if (valores.comentario.trim().length > 200) erros.comentario = 'O comentário pode ter no máximo 200 caracteres.';
    // Só o booleano true vale: a confirmação de privacidade precisa ser uma marcação explícita (LGPD).
    if (valores.privacidade !== true) erros.privacidade = 'Confirme que não incluiu nomes ou dados pessoais de terceiros.';

    return { valido: Object.keys(erros).length === 0, erros };
  }

  /**
   * Monta o local de uma contribuição já validada (seção 12.3; RN13, RN16).
   * @param {object} valores valores do formulário, no mesmo formato de validarContribuicao
   * @param {number} proximoId id livre (maior id da lista + 1)
   * @returns {object} novo local sensorial com dados só no turno informado
   */
  function criarLocalDeContribuicao(valores, proximoId) {
    return {
      id: proximoId,
      nome: limparNome(valores.nome),
      tipo: valores.tipo,
      // RN16: só o turno da visita recebe dados; nos outros o card mostra "Sem dados neste turno".
      // Versão 2: os 4 estímulos seguem a mesma regra, porque todos variam por turno.
      ruido: { manha: null, tarde: null, noite: null, [valores.turno]: Number(valores.ruido) },
      luz: { manha: null, tarde: null, noite: null, [valores.turno]: Number(valores.luz) },
      lotacao: { manha: null, tarde: null, noite: null, [valores.turno]: Number(valores.lotacao) },
      cheiro: { manha: null, tarde: null, noite: null, [valores.turno]: Number(valores.cheiro) },
      espacoCalmo: valores.espacoCalmo === true,
      saidaFacil: valores.saidaFacil === true,
      equipeTreinada: valores.equipeTreinada === true,
      // Versão 2 (pedido da entrevista P3): hora silenciosa informada no formulário, já validada.
      horaSilenciosa: valores.temHoraSilenciosa === true
        ? { turno: valores.silenciosaTurno, descricao: limparNome(valores.silenciosaDescricao) }
        : null,
      // Não sabemos se o local fecha em algum turno; os turnos sem dados ficam como "sem-dados", não "fechado".
      turnosAbertos: ['manha', 'tarde', 'noite'],
      ficticio: false,
      // RN13: o card mostra "Contribuição cidadã (sessão, não verificada)".
      enviadoPeloUsuario: true,
      // hasOwnProperty: só chaves da própria lista valem (uma chave herdada como "toString" vira null).
      perfilRemetente: Object.prototype.hasOwnProperty.call(PERFIS_REMETENTE, valores.perfilRemetente) ? valores.perfilRemetente : null,
      comentario: valores.comentario.trim()
    };
  }

  LC.calculo = Object.freeze({
    somaSensibilidades: somarSensibilidades,
    situacaoNoTurno,
    estimulosEfetivos,
    calcularCompatibilidade,
    classificarSelo,
    rotuloSelo,
    melhorTurno,
    rotuloMelhorHorario,
    estimulosFortes,
    descreverOrigem,
    avaliarLocal,
    filtrarLocais,
    ordenarAvaliacoes,
    resumirLista,
    normalizarNome,
    validarContribuicao,
    criarLocalDeContribuicao
  });
})(window.LugarCalmo = window.LugarCalmo || {});
