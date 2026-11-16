/**
 * formulario.js
 * Formulário "Avaliar ou sugerir um local" de solucao.html (PRD 10.4 e 12, contratos K5 e K6).
 *
 * Valida com calculo.validarContribuicao e mostra os erros na própria página: resumo no topo com um
 * link por campo, mensagem embaixo de cada campo e foco no primeiro inválido (RF10 a RF12). Nunca usa
 * caixa de diálogo do navegador (R3). Todo texto digitado entra no DOM só por textContent (R5, RNF05).
 *
 * Carrega ANTES de app.js (ordem dos defer, K3). Por isso LugarCalmo.app só é lido dentro do envio,
 * quando a página inteira já carregou; na carga, este arquivo só preenche os selects e liga os eventos.
 */
(function (LC) {
  'use strict';

  const { dados, calculo } = LC;

  // Limite do comentário: o mesmo do maxlength do textarea e da validação (12.1).
  const LIMITE_COMENTARIO = 200;

  const form = document.getElementById('form-contribuicao');
  const resumoErros = document.getElementById('resumo-erros');
  const mensagemSucesso = document.getElementById('mensagem-sucesso');
  const comentario = document.getElementById('campo-comentario');
  const contador = document.getElementById('contador-comentario');
  const fieldsetTurno = document.getElementById('campo-turno');
  const radiosTurno = form.querySelectorAll('input[name="campo-turno"]');

  // Vira true logo após um envio válido e volta a false na próxima alteração do formulário (ver enviar).
  let acabouDeEnviar = false;

  /**
   * Acrescenta opções a um select com createElement e textContent (K4), sem HTML bruto.
   * @param {HTMLSelectElement} select select que já traz a opção vazia fixa do HTML
   * @param {Array<Array<string>>} pares lista de [valor, texto]
   * @returns {void}
   */
  function adicionarOpcoes(select, pares) {
    pares.forEach(([valor, texto]) => {
      const opcao = document.createElement('option');
      opcao.value = valor;
      opcao.textContent = texto;
      select.append(opcao);
    });
  }

  /**
   * Controles de um campo validável. O turno é um grupo de 3 rádios; os demais têm id "campo-{chave}" (K5).
   * O primeiro controle é o que recebe o foco e o alvo do link do resumo.
   * @param {string} chave chave de erro de validarContribuicao (nome, tipo, turno, ...)
   * @returns {Array<HTMLElement>} controles do campo
   */
  function controlesDoCampo(chave) {
    return chave === 'turno' ? Array.from(radiosTurno) : [document.getElementById(`campo-${chave}`)];
  }

  /**
   * Elemento que recebe .campo--erro (borda grossa, não só cor; K5): o fieldset do turno ou a caixa do campo.
   * @param {string} chave chave de erro
   * @returns {HTMLElement} contêiner do campo
   */
  function conteinerDoCampo(chave) {
    return chave === 'turno' ? fieldsetTurno : controlesDoCampo(chave)[0].closest('.campo, .opcao');
  }

  /**
   * Lê o formulário no formato que calculo.js espera (K6). Os textos são sempre strings (lidas de .value),
   * porque validarContribuicao chama trim() neles; '' quando vazio ou sem rádio marcado.
   * @returns {object} valores crus do formulário
   */
  function lerValores() {
    const valor = (id) => document.getElementById(id).value;
    const marcado = (id) => document.getElementById(id).checked;
    const turnoMarcado = form.querySelector('input[name="campo-turno"]:checked');
    return {
      nome: valor('campo-nome'),
      tipo: valor('campo-tipo'),
      turno: turnoMarcado ? turnoMarcado.value : '',
      ruido: valor('campo-ruido'),
      luz: valor('campo-luz'),
      lotacao: valor('campo-lotacao'),
      cheiro: valor('campo-cheiro'),
      perfilRemetente: valor('campo-perfil'),
      comentario: comentario.value,
      espacoCalmo: marcado('campo-calmo'),
      saidaFacil: marcado('campo-saida'),
      equipeTreinada: marcado('campo-equipe'),
      privacidade: marcado('campo-privacidade')
    };
  }

  /**
   * Atualiza o contador do comentário (12.2, passo 6). O contador não é aria-live, para não ser lido a
   * cada tecla; o textarea aponta para ele com aria-describedby.
   * @returns {void}
   */
  function atualizarContador() {
    contador.textContent = `${comentario.value.length} de ${LIMITE_COMENTARIO} caracteres`;
  }

  /**
   * Apaga todos os sinais de erro do envio anterior (12.2, passo 2).
   * @returns {void}
   */
  function limparErros() {
    resumoErros.hidden = true;
    resumoErros.replaceChildren();
    form.querySelectorAll('[aria-invalid]').forEach((elemento) => elemento.removeAttribute('aria-invalid'));
    form.querySelectorAll('.campo--erro').forEach((elemento) => elemento.classList.remove('campo--erro'));
    form.querySelectorAll('.erro-campo').forEach((erro) => {
      erro.textContent = '';
      erro.hidden = true;
    });
  }

  /**
   * Mostra os erros em cada campo e no resumo do topo, e põe o foco no primeiro campo inválido (RF10, RF12).
   * @param {Object<string, string>} erros mensagens por campo, na ordem do formulário (K6)
   * @returns {void}
   */
  function mostrarErros(erros) {
    const chaves = Object.keys(erros);
    const itens = chaves.map((chave) => {
      const controles = controlesDoCampo(chave);
      // RF10: aria-invalid em cada controle; no turno, os 3 rádios juntos (K5).
      controles.forEach((controle) => controle.setAttribute('aria-invalid', 'true'));
      conteinerDoCampo(chave).classList.add('campo--erro');
      // A mensagem vai no <p id="erro-{campo}">, já ligado ao campo por aria-describedby no HTML.
      const erroCampo = document.getElementById(`erro-${chave}`);
      erroCampo.textContent = erros[chave];
      erroCampo.hidden = false;

      const link = document.createElement('a');
      link.setAttribute('href', `#${controles[0].id}`);
      link.textContent = erros[chave];
      // Seguir uma âncora só rola a página; o foco precisa ir para o campo para a pessoa corrigir na hora.
      link.addEventListener('click', (evento) => {
        evento.preventDefault();
        controles[0].focus();
      });
      const item = document.createElement('li');
      item.append(link);
      return item;
    });

    const titulo = document.createElement('p');
    titulo.textContent = `Corrija ${chaves.length} ${chaves.length === 1 ? 'campo' : 'campos'} para enviar:`;
    const listaErros = document.createElement('ul');
    listaErros.append(...itens);
    resumoErros.replaceChildren(titulo, listaErros);
    // role="alert" no resumo faz o leitor de tela anunciá-lo; o foco vai direto para o que precisa ser corrigido.
    resumoErros.hidden = false;
    controlesDoCampo(chaves[0])[0].focus();
  }

  /**
   * Trata o envio (12.2): valida, mostra os erros ou insere a contribuição na lista da sessão.
   * @param {SubmitEvent} evento envio do formulário
   * @returns {void}
   */
  function enviar(evento) {
    // A página nunca recarrega: a contribuição vive só na memória (RN15).
    evento.preventDefault();
    // Clique duplo em "Enviar" (comum para quem tem pouca familiaridade digital): o 2º envio chegaria
    // ao formulário já limpo e trocaria a confirmação por 8 erros. Ignoramos até a pessoa mexer de novo.
    if (acabouDeEnviar) {
      return;
    }
    limparErros();
    // Uma confirmação antiga ao lado de erros novos (ou de uma falha) confundiria quem está enviando.
    mensagemSucesso.textContent = '';

    // Lido só aqui: app.js carrega depois deste arquivo (K3). Se ele não carregou, não há lista para
    // checar duplicado nem para inserir; avisamos na página em vez de falhar em silêncio (R3, RF12).
    if (!LC.app) {
      const aviso = document.createElement('p');
      aviso.textContent = 'Não foi possível enviar agora porque a lista de locais não carregou. ' +
        'Recarregue a página e tente de novo.';
      resumoErros.replaceChildren(aviso);
      resumoErros.hidden = false;
      resumoErros.focus();
      console.error('Lugar Calmo: LugarCalmo.app indisponível; a contribuição não foi inserida.');
      return;
    }

    const valores = lerValores();
    // A lista inclui as contribuições já enviadas na sessão (RF11).
    const locaisAtuais = LC.app.locais();
    const { valido, erros } = calculo.validarContribuicao(valores, locaisAtuais);
    if (!valido) {
      mostrarErros(erros);
      return;
    }

    // 12.2, passo 5: id = maior id + 1, para nunca repetir o id (e os ids de elemento) de um card.
    const proximoId = Math.max(0, ...locaisAtuais.map((local) => local.id)) + 1;
    const local = calculo.criarLocalDeContribuicao(valores, proximoId);
    LC.app.adicionarLocal(local);

    const rotuloTurno = dados.TURNOS.find((turno) => turno.id === valores.turno).rotulo;
    // O nome digitado entra por textContent: "<script>" aparece como texto e nada executa (T-27).
    mensagemSucesso.textContent = `“${local.nome}” entrou na lista desta sessão como contribuição cidadã, ` +
      `com dados do turno ${rotuloTurno}. Ela some ao recarregar a página.`;
    form.reset();
    atualizarContador();
    acabouDeEnviar = true;
  }

  // O envio é ligado ANTES do resto: se algo abaixo falhar, o botão ainda não faz um envio nativo,
  // que recarregaria a página e apagaria o que foi digitado e as contribuições da sessão (RN15).
  form.addEventListener('submit', enviar);
  // Qualquer alteração depois de um envio bem-sucedido libera um novo envio.
  form.addEventListener('input', () => {
    acabouDeEnviar = false;
  });

  // K4: tipos e perfis de remetente vêm de dados.js; o HTML traz só a opção vazia fixa.
  adicionarOpcoes(document.getElementById('campo-tipo'), dados.TIPOS_LOCAL.map((tipo) => [tipo, tipo]));
  adicionarOpcoes(document.getElementById('campo-perfil'), Object.entries(dados.PERFIS_REMETENTE));

  comentario.addEventListener('input', atualizarContador);
  // O navegador pode devolver o texto do comentário ao recarregar; o contador começa já certo.
  atualizarContador();
})(window.LugarCalmo = window.LugarCalmo || {});
