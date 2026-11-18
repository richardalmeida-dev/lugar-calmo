/*
 * acessibilidade.js: barra "Preferências de leitura" (A-, A+, Alto contraste, Modo Calmo).
 * Carregado com defer em TODAS as páginas (PRD 8.1 e 10.5). Atende RF13, RF14, RF15 e RF20.
 *
 * Decisões:
 * - Só alterna classes no <html> e atributos dos botões. Nenhum estilo inline (R4): as
 *   cores e tamanhos estão em css/base.css (fonte-0 a fonte-4) e css/temas.css.
 * - O armazenamento local guarda só preferências visuais, nunca dado pessoal (R9, LGPD).
 * - Todo acesso ao armazenamento fica em try/catch: em aba anônima ou com cookies
 *   bloqueados ele lança exceção, e a página precisa continuar funcionando (RF20).
 */
(function () {
  'use strict';

  const CHAVE = 'lugarCalmo:preferencias';
  // 5 níveis de fonte (RF14): 0 = 87,5%, 1 = 100% (padrão), 2 = 112,5%, 3 = 125%, 4 = 137,5%.
  const FONTE_MIN = 0;
  const FONTE_MAX = 4;
  const FONTE_PADRAO = 1;

  const raiz = document.documentElement;
  // O defer garante que o DOM já foi lido quando este código roda (R2), então os botões existem.
  const botoes = {
    menos: document.getElementById('btn-fonte-menos'),
    mais: document.getElementById('btn-fonte-mais'),
    contraste: document.getElementById('btn-contraste'),
    calmo: document.getElementById('btn-modo-calmo')
  };

  // Garante um único aviso no console durante a vida da página (PRD 10.5).
  let avisoEmitido = false;

  /**
   * Avisa uma única vez que as preferências não serão lembradas. Nunca lança erro.
   * @returns {void}
   */
  function avisarSoNestaPagina() {
    if (avisoEmitido) {
      return;
    }
    avisoEmitido = true;
    console.info('Lugar Calmo: o navegador bloqueou o armazenamento local; as preferências de leitura valem só enquanto esta página estiver aberta.');
  }

  /**
   * Confere campo a campo um objeto de preferências vindo de fora (armazenamento local).
   * Qualquer campo ausente ou com tipo/faixa errado volta ao padrão, sem descartar os outros.
   * @param {*} dados valor já convertido de JSON (pode ser qualquer coisa, inclusive null)
   * @returns {{fonte: number, contraste: boolean, calmo: boolean}} preferências válidas (objeto novo)
   */
  function validarPreferencias(dados) {
    const origem = dados !== null && typeof dados === 'object' ? dados : {};
    const fonteValida = Number.isInteger(origem.fonte) && origem.fonte >= FONTE_MIN && origem.fonte <= FONTE_MAX;
    return {
      fonte: fonteValida ? origem.fonte : FONTE_PADRAO,
      contraste: typeof origem.contraste === 'boolean' ? origem.contraste : false,
      calmo: typeof origem.calmo === 'boolean' ? origem.calmo : false
    };
  }

  /**
   * Lê as preferências salvas. Armazenamento bloqueado gera o aviso único; JSON corrompido
   * só volta ao padrão, porque não é falha do navegador e não vale incomodar o console.
   * @returns {{fonte: number, contraste: boolean, calmo: boolean}}
   */
  function lerPreferencias() {
    let bruto = null;
    try {
      bruto = window.localStorage.getItem(CHAVE);
    } catch (erro) {
      avisarSoNestaPagina();
    }
    if (bruto === null) {
      return validarPreferencias(null);
    }
    try {
      return validarPreferencias(JSON.parse(bruto));
    } catch (erro) {
      return validarPreferencias(null);
    }
  }

  /**
   * Salva as preferências. Se o navegador recusar (bloqueio ou cota cheia), segue só na
   * página atual, sem erro no console (RF20).
   * @param {{fonte: number, contraste: boolean, calmo: boolean}} preferencias
   * @returns {void}
   */
  function gravarPreferencias(preferencias) {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(preferencias));
    } catch (erro) {
      avisarSoNestaPagina();
    }
  }

  /**
   * Aplica as preferências: classes no <html> e estado dos botões da barra.
   * aria-pressed comunica ao leitor de tela se o modo está ligado (RF13, RF15);
   * disabled nos extremos mostra que não dá para diminuir ou aumentar mais (RF14).
   * @param {{fonte: number, contraste: boolean, calmo: boolean}} preferencias
   * @returns {void}
   */
  function aplicarPreferencias(preferencias) {
    // Exatamente uma classe fonte-N fica ligada; as outras são removidas.
    for (let nivel = FONTE_MIN; nivel <= FONTE_MAX; nivel += 1) {
      raiz.classList.toggle('fonte-' + nivel, nivel === preferencias.fonte);
    }
    raiz.classList.toggle('alto-contraste', preferencias.contraste);
    raiz.classList.toggle('modo-calmo', preferencias.calmo);

    // Os testes de null evitam erro numa página que, por engano, venha sem a barra.
    if (botoes.menos) {
      botoes.menos.disabled = preferencias.fonte === FONTE_MIN;
    }
    if (botoes.mais) {
      botoes.mais.disabled = preferencias.fonte === FONTE_MAX;
    }
    if (botoes.contraste) {
      botoes.contraste.setAttribute('aria-pressed', String(preferencias.contraste));
    }
    if (botoes.calmo) {
      botoes.calmo.setAttribute('aria-pressed', String(preferencias.calmo));
    }
  }

  // Estado da página: começa com o que estava salvo (ou o padrão) e é aplicado já na carga.
  let preferencias = lerPreferencias();
  aplicarPreferencias(preferencias);

  /**
   * Liga um botão da barra: calcula as novas preferências, aplica e salva.
   * @param {HTMLElement|null} botao botão da barra (ignorado se não existir)
   * @param {function(Object): Object} alterar recebe as preferências atuais e devolve um objeto novo
   * @returns {void}
   */
  function ligarBotao(botao, alterar) {
    if (!botao) {
      return;
    }
    botao.addEventListener('click', function () {
      preferencias = alterar(preferencias);
      aplicarPreferencias(preferencias);
      gravarPreferencias(preferencias);
      // Ao chegar ao extremo, A- ou A+ vira disabled e o navegador tira o foco dele, deixando quem
      // usa teclado sem ponto de partida (WCAG 2.4.3, RNF01). O foco passa para o botão de tamanho
      // oposto, que continua ativo.
      if (botao.disabled) {
        const oposto = botao === botoes.menos ? botoes.mais : botoes.menos;
        if (oposto) {
          oposto.focus();
        }
      }
    });
  }

  // Cada botão devolve um objeto novo que copia as preferências atuais e troca só o campo dele.
  // Math.max/min prendem o nível na faixa 0..4 mesmo se o clique chegar com o botão no limite.
  ligarBotao(botoes.menos, function (atual) {
    return { ...atual, fonte: Math.max(FONTE_MIN, atual.fonte - 1) };
  });
  ligarBotao(botoes.mais, function (atual) {
    return { ...atual, fonte: Math.min(FONTE_MAX, atual.fonte + 1) };
  });
  ligarBotao(botoes.contraste, function (atual) {
    return { ...atual, contraste: !atual.contraste };
  });
  ligarBotao(botoes.calmo, function (atual) {
    return { ...atual, calmo: !atual.calmo };
  });

  // Publica no namespace único do projeto (PRD 10). Só leitura: ninguém de fora troca o estado.
  window.LugarCalmo = window.LugarCalmo || {};
  window.LugarCalmo.acessibilidade = Object.freeze({
    validarPreferencias: validarPreferencias,
    /**
     * Cópia das preferências em uso (útil para testes e depuração).
     * @returns {{fonte: number, contraste: boolean, calmo: boolean}}
     */
    obterPreferencias: function () {
      return { ...preferencias };
    }
  });
})();
