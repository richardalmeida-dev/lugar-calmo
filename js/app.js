/**
 * app.js
 * Liga o Mapa Sensorial de solucao.html: guarda o estado da página, escuta o painel de perfil e os
 * filtros e redesenha a lista (PRD 10.3).
 *
 * Fluxo único: cada evento só muda o estado e chama atualizar(), a única porta de renderização.
 * Assim a lista, o resumo e os avisos nunca ficam fora de sincronia entre si.
 * O perfil sensorial fica só na memória da página (R9, LGPD): nada é gravado no navegador.
 * Carrega por último (K3): dados.js, calculo.js, render.js e formulario.js já rodaram.
 */
(function (LC) {
  'use strict';

  const { dados, calculo, render } = LC;

  const ESTIMULOS = Object.freeze(['ruido', 'luz', 'lotacao', 'cheiro']);
  const PERFIL_PADRAO = 'padrao';
  // [DECISÃO PRD] 8.3: o turno inicial (e o do Restaurar) é a Manhã.
  const TURNO_PADRAO = 'manha';

  // Estado único em memória (10.3): perfil Padrão, turno Manhã e sem filtros.
  // locais é uma cópia: os dados iniciais ficam congelados e as contribuições entram só aqui (RN15).
  const estado = {
    perfil: { ruido: 3, luz: 3, lotacao: 3, cheiro: 3 },
    turno: TURNO_PADRAO,
    filtroTipo: 'todos',
    somenteAdaptados: false,
    locais: [...dados.LOCAIS_INICIAIS]
  };

  const lista = document.getElementById('lista-locais');
  const resumo = document.getElementById('resumo-lista');
  const estadoVazio = document.getElementById('estado-vazio');
  const avisoSomaZero = document.getElementById('aviso-soma-zero');
  const filtroTipo = document.getElementById('filtro-tipo');
  const filtroAdaptacao = document.getElementById('filtro-adaptacao');
  const botaoRestaurar = document.getElementById('btn-restaurar');
  const botoesPerfil = document.querySelectorAll('.btn-perfil');
  const radiosTurno = document.querySelectorAll('input[name="turno"]');
  // Cada estímulo tem o slider (#sens-*) e o número ao lado (#valor-*), seção 8.3.
  const controles = Object.fromEntries(ESTIMULOS.map((estimulo) => [estimulo, {
    slider: document.getElementById(`sens-${estimulo}`),
    saida: document.getElementById(`valor-${estimulo}`)
  }]));

  /**
   * Única porta de renderização (10.3): filtra, avalia, ordena e redesenha lista, resumo e avisos.
   * @returns {void}
   */
  function atualizar() {
    const filtrados = calculo.filtrarLocais(estado.locais, { tipo: estado.filtroTipo, somenteAdaptados: estado.somenteAdaptados });
    const avaliacoes = calculo.ordenarAvaliacoes(filtrados.map((local) => calculo.avaliarLocal(local, estado.perfil, estado.turno)));
    render.renderizarLista(lista, avaliacoes, estado.turno);
    // RF18: o resumo descreve só o que está na tela, por isso usa a lista já filtrada.
    render.atualizarResumo(resumo, calculo.resumirLista(avaliacoes, estado.turno));
    // RN02: perfil todo zerado dá 100 em todos os abertos; o aviso explica o porquê.
    render.alternarAvisoSomaZero(avisoSomaZero, calculo.somaSensibilidades(estado.perfil) === 0);
    render.alternarEstadoVazio(estadoVazio, avaliacoes.length === 0);
  }

  /**
   * Leva o valor do estado para o slider, para o número ao lado e para o aria-valuetext (RF02, 8.3).
   * O aria-valuetext faz o leitor de tela dizer "3 de 5" em vez de só "3".
   * @param {string} estimulo 'ruido' | 'luz' | 'lotacao' | 'cheiro'
   * @returns {void}
   */
  function mostrarSensibilidade(estimulo) {
    const valor = String(estado.perfil[estimulo]);
    controles[estimulo].slider.value = valor;
    controles[estimulo].saida.textContent = valor;
    controles[estimulo].slider.setAttribute('aria-valuetext', `${valor} de ${dados.SENSIBILIDADE.max}`);
  }

  /**
   * Marca o botão do perfil rápido ativo com aria-pressed (RF19).
   * @param {string|null} chave 'padrao' | 'ana' | 'rafael', ou null para desmarcar todos
   * @returns {void}
   */
  function marcarPerfil(chave) {
    botoesPerfil.forEach((botao) => botao.setAttribute('aria-pressed', String(botao.dataset.perfil === chave)));
  }

  /**
   * Aplica um perfil rápido ao estado e aos sliders (RF19). Não redesenha: quem chama decide quando.
   * @param {string} chave chave de dados.PERFIS_RAPIDOS
   * @returns {void}
   */
  function aplicarPerfilRapido(chave) {
    const perfil = dados.PERFIS_RAPIDOS[chave];
    ESTIMULOS.forEach((estimulo) => {
      estado.perfil[estimulo] = perfil[estimulo];
      mostrarSensibilidade(estimulo);
    });
    marcarPerfil(chave);
  }

  /**
   * Muda o turno no estado e deixa marcado o rádio correspondente (RF03).
   * @param {string} turno 'manha' | 'tarde' | 'noite'
   * @returns {void}
   */
  function selecionarTurno(turno) {
    estado.turno = turno;
    radiosTurno.forEach((radio) => { radio.checked = radio.value === turno; });
  }

  /**
   * Acrescenta uma contribuição do formulário à lista da sessão e redesenha (10.3, RF12).
   * Fica só na memória: some ao recarregar a página (RN15).
   * @param {object} local local criado por calculo.criarLocalDeContribuicao
   * @returns {void}
   */
  function adicionarLocal(local) {
    estado.locais.push(local);
    atualizar();
  }

  /**
   * Locais da sessão, para o formulário recusar nome duplicado (RF11) e calcular o próximo id.
   * @returns {Array<object>} cópia da lista: quem recebe não consegue mexer no estado da página
   */
  function locais() {
    return estado.locais.slice();
  }

  // K4: os tipos vêm de dados.js (fonte única); o HTML traz só a opção fixa "Todos os tipos".
  dados.TIPOS_LOCAL.forEach((tipo) => {
    const opcao = document.createElement('option');
    opcao.value = tipo;
    opcao.textContent = tipo;
    filtroTipo.append(opcao);
  });

  // Alguns navegadores devolvem aos controles os valores da visita anterior ao recarregar a página.
  // Escrever o estado inicial nos controles garante que tela e estado começam iguais.
  ESTIMULOS.forEach(mostrarSensibilidade);
  marcarPerfil(PERFIL_PADRAO);
  selecionarTurno(estado.turno);
  filtroTipo.value = estado.filtroTipo;
  filtroAdaptacao.checked = estado.somenteAdaptados;

  // RF02: o evento input recalcula enquanto o slider se move, com mouse, toque ou setas do teclado.
  ESTIMULOS.forEach((estimulo) => {
    controles[estimulo].slider.addEventListener('input', (evento) => {
      estado.perfil[estimulo] = Number(evento.target.value);
      mostrarSensibilidade(estimulo);
      // RF19: valor ajustado à mão deixa de ser um perfil rápido, então nenhum botão fica pressionado.
      marcarPerfil(null);
      atualizar();
    });
  });

  botoesPerfil.forEach((botao) => {
    botao.addEventListener('click', () => {
      aplicarPerfilRapido(botao.dataset.perfil);
      atualizar();
    });
  });

  // RF03: change dispara só no rádio que acabou de ser marcado.
  radiosTurno.forEach((radio) => {
    radio.addEventListener('change', () => {
      estado.turno = radio.value;
      atualizar();
    });
  });

  // RF09: os dois filtros valem juntos (a lógica fica em calculo.filtrarLocais).
  filtroTipo.addEventListener('change', () => {
    estado.filtroTipo = filtroTipo.value;
    atualizar();
  });
  filtroAdaptacao.addEventListener('change', () => {
    estado.somenteAdaptados = filtroAdaptacao.checked;
    atualizar();
  });

  // 8.3: volta sliders a 3, perfil Padrão e turno Manhã; os filtros ficam como estão.
  botaoRestaurar.addEventListener('click', () => {
    aplicarPerfilRapido(PERFIL_PADRAO);
    selecionarTurno(TURNO_PADRAO);
    atualizar();
  });

  // RF01 e R8: os 12 locais aparecem assim que a página termina de carregar.
  atualizar();

  // Só o necessário para o formulário (10.3); congelado para ninguém trocar as funções depois.
  LC.app = Object.freeze({ adicionarLocal, locais });
})(window.LugarCalmo = window.LugarCalmo || {});
