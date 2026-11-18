/**
 * render.js
 * Monta os cards do Mapa Sensorial e atualiza o resumo e os avisos da lista (PRD 8.4 e 10.2, contrato K8).
 *
 * Segurança (R5, RNF05): todo elemento nasce de createElement, todo texto entra por textContent e os
 * atributos passam por uma lista branca. Nada de HTML bruto: um nome como "<script>x</script>" enviado
 * pelo formulário aparece como texto e nunca é interpretado (T-27).
 * Só monta o DOM; quem decide o que mostrar é o calculo.js (RNF11). Nenhum estilo inline: a aparência
 * vem das classes de css/componentes.css (R4).
 * Depende de dados.js e calculo.js, carregados antes (defer mantém a ordem do HTML, K3).
 */
(function (LC) {
  'use strict';

  const { TURNOS, LIMIARES, PERFIS_REMETENTE } = LC.dados;
  const { rotuloSelo } = LC.calculo;

  // Lista branca de atributos da seção 10.2; os aria-* entram pelo prefixo. Fora dela, nada chega ao DOM
  // (por exemplo, atributos de evento ou de estilo, que poderiam executar código ou mudar a aparência).
  const ATRIBUTOS_PERMITIDOS = new Set([
    'id', 'class', 'src', 'alt', 'width', 'height', 'href', 'min', 'max', 'low', 'high', 'optimum', 'value', 'role'
  ]);

  // Origem do dado mostrada em todo card (RN10, RN13).
  const ROTULO_FICTICIO = 'Dado de demonstração (fictício)';
  const ROTULO_CONTRIBUICAO = 'Contribuição cidadã (sessão, não verificada)';

  // Etiquetas de adaptação na ordem do card (RF08, K8): propriedade do local, ícone e texto.
  const ETIQUETAS = Object.freeze([
    { campo: 'espacoCalmo', icone: 'img/icone-espaco-calmo.svg', texto: 'Espaço calmo' },
    { campo: 'saidaFacil', icone: 'img/icone-saida.svg', texto: 'Saída fácil' },
    { campo: 'equipeTreinada', icone: 'img/icone-equipe.svg', texto: 'Equipe treinada' }
  ]);

  // Estímulos efetivos do <dl> (K8): chave em avaliacao.efetivos e rótulo exibido.
  const ESTIMULOS = Object.freeze([['ruido', 'Ruído'], ['luz', 'Iluminação'], ['lotacao', 'Lotação'], ['cheiro', 'Cheiros']]);

  /**
   * Cria um elemento só com textContent e setAttribute (contrato 10.2).
   * Atributo fora da lista branca é ignorado sem quebrar a página: os cards continuam aparecendo.
   * @param {string} tag nome da tag
   * @param {{classe?: string, texto?: (string|number), atributos?: Object<string, (string|number)>}} [opcoes]
   * @returns {HTMLElement} elemento novo, ainda fora do documento
   */
  function criarElemento(tag, { classe, texto, atributos } = {}) {
    const elemento = document.createElement(tag);
    if (classe) elemento.setAttribute('class', classe);
    // textContent nunca interpreta marcação: é o que torna seguro mostrar texto digitado (R5).
    if (texto !== undefined) elemento.textContent = String(texto);
    for (const [nome, valor] of Object.entries(atributos || {})) {
      if (ATRIBUTOS_PERMITIDOS.has(nome) || nome.startsWith('aria-')) elemento.setAttribute(nome, String(valor));
    }
    return elemento;
  }

  /**
   * Rótulo exibido de um turno ("Manhã", "Tarde", "Noite"); a fonte única é dados.TURNOS.
   * @param {string} turno 'manha' | 'tarde' | 'noite'
   * @returns {string} rótulo do turno
   */
  function rotuloTurno(turno) {
    return TURNOS.find((item) => item.id === turno).rotulo;
  }

  /**
   * Ícone de selo ou etiqueta. É decorativo (alt vazio): o texto ao lado já diz tudo (RNF01, K8).
   * @param {string} src caminho do SVG em img/
   * @returns {HTMLImageElement} imagem de 20 x 20
   */
  function criarIcone(src) {
    return criarElemento('img', { atributos: { src, alt: '', width: 20, height: 20 } });
  }

  /**
   * Selo qualitativo com ícone e texto, para a cor nunca ser a única pista (RF05).
   * @param {'tranquilo'|'atencao'|'evitar'} selo chave do selo
   * @returns {HTMLElement} parágrafo do selo
   */
  function criarSelo(selo) {
    const elemento = criarElemento('p', { classe: `selo selo--${selo}` });
    elemento.append(criarIcone(`img/icone-${selo}.svg`), criarElemento('span', { texto: rotuloSelo(selo) }));
    return elemento;
  }

  /**
   * Nota em número e em barra <meter>. O meter nunca é o único indicador: o número e o selo vêm junto (8.4).
   * @param {string} prefixo início dos ids do card ("local-{id}")
   * @param {number} nota nota de 0 a 100
   * @param {string} selo chave do selo, que dá a cor da barra
   * @returns {HTMLElement} bloco da nota
   */
  function criarNota(prefixo, nota, selo) {
    const bloco = criarElemento('div', { classe: 'nota' });
    bloco.append(
      criarElemento('span', { classe: 'nota-numero', texto: `${nota}/100`, atributos: { id: `${prefixo}-nota` } }),
      // low e high vêm dos limiares dos selos (RN05), para a faixa do meter e o selo nunca discordarem.
      criarElemento('meter', {
        classe: `meter-nota meter--${selo}`,
        atributos: {
          min: 0, max: 100, low: LIMIARES.atencao, high: LIMIARES.tranquilo, optimum: 100, value: nota,
          'aria-labelledby': `${prefixo}-rotulo-nota`
        }
      }),
      // Nome acessível do meter: o leitor de tela ouve "Compatibilidade 80 de 100" em vez de só um número.
      criarElemento('span', { classe: 'visualmente-oculto', texto: `Compatibilidade ${nota} de 100`, atributos: { id: `${prefixo}-rotulo-nota` } })
    );
    return bloco;
  }

  /**
   * Lista de etiquetas de adaptação do local (RF08).
   * @param {object} local local sensorial
   * @returns {HTMLElement|null} a lista, ou null quando o local não tem nenhuma etiqueta (evita lista vazia)
   */
  function criarEtiquetas(local) {
    const itens = ETIQUETAS.filter((etiqueta) => local[etiqueta.campo] === true).map((etiqueta) => {
      const item = criarElemento('li', { classe: 'etiqueta' });
      // append com texto cria um nó de texto, como o textContent: nada é interpretado como marcação.
      item.append(criarIcone(etiqueta.icone), etiqueta.texto);
      return item;
    });
    // K8: a etiqueta de hora silenciosa não tem ícone e diz o turno dela.
    if (local.horaSilenciosa !== null) {
      itens.push(criarElemento('li', {
        classe: 'etiqueta etiqueta--silenciosa',
        texto: `Hora silenciosa: ${local.horaSilenciosa.descricao} (${rotuloTurno(local.horaSilenciosa.turno)})`
      }));
    }
    if (itens.length === 0) return null;
    const lista = criarElemento('ul', { classe: 'etiquetas', atributos: { 'aria-label': 'Adaptações' } });
    lista.append(...itens);
    return lista;
  }

  /**
   * Níveis efetivos no turno, já com a hora silenciosa aplicada (K8).
   * @param {{ruido: number, luz: number, lotacao: number, cheiro: number}} efetivos níveis de 0 a 5
   * @returns {HTMLElement} lista de descrição com um grupo por estímulo
   */
  function criarEstimulos(efetivos) {
    const lista = criarElemento('dl', { classe: 'estimulos' });
    for (const [chave, rotulo] of ESTIMULOS) {
      const grupo = criarElemento('div');
      grupo.append(criarElemento('dt', { texto: rotulo }), criarElemento('dd', { texto: `${efetivos[chave]}/5` }));
      lista.append(grupo);
    }
    return lista;
  }

  /**
   * Card de um local no turno escolhido, exatamente na estrutura da seção 8.4.
   * @param {object} avaliacao resultado de calculo.avaliarLocal
   * @param {string} turno turno escolhido no painel
   * @returns {HTMLElement} o <article> do card
   */
  function criarCard(avaliacao, turno) {
    const { local, situacao, nota, selo, melhor, efetivos } = avaliacao;
    const prefixo = `local-${local.id}`;
    const aberto = situacao === 'aberto';
    const contribuicao = local.enviadoPeloUsuario === true;

    // K8: --fechado vale para 'fechado' e 'sem-dados'; --novo marca toda contribuição da sessão (12.2).
    const classes = ['card-local'];
    if (!aberto) classes.push('card-local--fechado');
    if (contribuicao) classes.push('card-local--novo');
    const card = criarElemento('article', { classe: classes.join(' '), atributos: { 'aria-labelledby': `${prefixo}-nome` } });

    const topo = criarElemento('header', { classe: 'card-topo' });
    // O nome pode vir do formulário: entra só como texto (T-27).
    topo.append(
      criarElemento('h3', { texto: local.nome, atributos: { id: `${prefixo}-nome` } }),
      criarElemento('p', { classe: 'card-tipo', texto: local.tipo })
    );
    // RN10 e RN13: o rótulo diz de onde veio o dado; o fictício tem prioridade.
    let origem = null;
    if (local.ficticio) origem = ROTULO_FICTICIO;
    else if (local.enviadoPeloUsuario) origem = ROTULO_CONTRIBUICAO;
    if (origem !== null) topo.append(criarElemento('p', { classe: 'rotulo-origem', texto: origem }));
    card.append(topo);

    if (aberto) {
      card.append(criarSelo(selo), criarNota(prefixo, nota, selo));
    } else {
      // RN07 e RN16: sem nota; o aviso em texto diz o motivo.
      card.append(criarElemento('p', { classe: 'aviso-turno', texto: situacao === 'fechado' ? 'Fechado neste turno' : 'Sem dados neste turno' }));
    }

    // RN08: sem nenhum turno com nota, a linha não aparece.
    if (melhor !== null) {
      card.append(criarElemento('p', { classe: 'melhor-horario', texto: `Melhor horário: ${rotuloTurno(melhor.turno)} (${melhor.nota})` }));
    }

    const etiquetas = criarEtiquetas(local);
    if (etiquetas !== null) card.append(etiquetas);

    // RF08: a hora silenciosa é do turno escolhido; os níveis mostrados abaixo já vêm reduzidos (RN06).
    if (local.horaSilenciosa !== null && local.horaSilenciosa.turno === turno) {
      card.append(criarElemento('p', { classe: 'hora-silenciosa-ativa', texto: 'Hora silenciosa neste turno: estímulos reduzidos' }));
    }

    // Os níveis só existem com o local aberto e com dados no turno.
    if (efetivos !== null) card.append(criarEstimulos(efetivos));

    // Só contribuições têm relato e remetente; os dois entram como texto (RNF05).
    if (contribuicao) {
      if (local.comentario) {
        card.append(criarElemento('p', { classe: 'relato', texto: `Relato: ${local.comentario}` }));
      }
      if (local.perfilRemetente) {
        // K8: mostra o rótulo do perfil, nunca a chave interna.
        card.append(criarElemento('p', { classe: 'remetente', texto: `Enviado por: ${PERFIS_REMETENTE[local.perfilRemetente]}` }));
      }
    }
    return card;
  }

  /**
   * Redesenha a lista inteira de cards (RF01, RF06).
   * replaceChildren troca tudo de uma vez: limpa sem HTML bruto e não deixa card velho para trás.
   * @param {HTMLElement} elementoLista o <ol id="lista-locais">
   * @param {Array<object>} avaliacoes resultados de calculo.avaliarLocal, já filtrados e ordenados
   * @param {string} turno turno escolhido no painel ('manha' | 'tarde' | 'noite')
   * @returns {void}
   */
  function renderizarLista(elementoLista, avaliacoes, turno) {
    elementoLista.replaceChildren(...avaliacoes.map(function (avaliacao) {
      const item = criarElemento('li');
      item.append(criarCard(avaliacao, turno));
      return item;
    }));
  }

  /**
   * Escreve o resumo da lista (RF18). A região é aria-live, então o leitor de tela anuncia a mudança.
   * @param {HTMLElement} elemento o <p id="resumo-lista">
   * @param {string} texto frase de calculo.resumirLista
   * @returns {void}
   */
  function atualizarResumo(elemento, texto) {
    elemento.textContent = texto;
  }

  /**
   * Mostra ou esconde a mensagem de lista vazia (RF09). Usa o atributo hidden, nunca estilo inline (R4).
   * @param {HTMLElement} elemento o <p id="estado-vazio">
   * @param {boolean} vazio true quando nenhum local passa nos filtros
   * @returns {void}
   */
  function alternarEstadoVazio(elemento, vazio) {
    elemento.hidden = !vazio;
  }

  /**
   * Mostra ou esconde o aviso de perfil zerado (RN02). Usa o atributo hidden (R4).
   * @param {HTMLElement} elemento o <p id="aviso-soma-zero">
   * @param {boolean} ativo true quando a soma das sensibilidades é zero
   * @returns {void}
   */
  function alternarAvisoSomaZero(elemento, ativo) {
    elemento.hidden = !ativo;
  }

  LC.render = Object.freeze({ renderizarLista, atualizarResumo, alternarEstadoVazio, alternarAvisoSomaZero });
})(window.LugarCalmo = window.LugarCalmo || {});
