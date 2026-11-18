/**
 * dados.js
 * Camada de dados do Lugar Calmo. Só constantes, nenhuma lógica e nenhum acesso ao DOM.
 * Todos os 12 locais são FICTÍCIOS e servem apenas para demonstração (RN10).
 */
(function (LC) {
  'use strict';

  // Turnos na ordem cronológica. A ordem importa: é o critério de desempate do melhor horário (RN08).
  const TURNOS = Object.freeze([
    Object.freeze({ id: 'manha', rotulo: 'Manhã' }),
    Object.freeze({ id: 'tarde', rotulo: 'Tarde' }),
    Object.freeze({ id: 'noite', rotulo: 'Noite' })
  ]);

  // Limiares dos selos (RN05).
  const LIMIARES = Object.freeze({ tranquilo: 70, atencao: 40 });

  const SENSIBILIDADE = Object.freeze({ min: 0, max: 5, padrao: 3 });

  const PERFIS_RAPIDOS = Object.freeze({
    padrao: Object.freeze({ rotulo: 'Padrão', ruido: 3, luz: 3, lotacao: 3, cheiro: 3 }),
    ana: Object.freeze({ rotulo: 'Perfil Ana', ruido: 5, luz: 5, lotacao: 4, cheiro: 3 }),
    rafael: Object.freeze({ rotulo: 'Perfil Rafael', ruido: 3, luz: 2, lotacao: 5, cheiro: 5 })
  });

  const TIPOS_LOCAL = Object.freeze([
    'Saúde', 'Supermercado', 'Biblioteca', 'Parque', 'Shopping', 'Farmácia',
    'Padaria', 'Transporte', 'Cinema', 'Assistência Social', 'Museu', 'Outro'
  ]);

  // Filtros de adaptação independentes (versão 2, pedido das entrevistas P1 e P6): chave do filtro e texto.
  const FILTROS_ADAPTACAO = Object.freeze([
    Object.freeze({ chave: 'espacoCalmo', rotulo: 'Espaço calmo' }),
    Object.freeze({ chave: 'saidaFacil', rotulo: 'Saída fácil' }),
    Object.freeze({ chave: 'equipeTreinada', rotulo: 'Equipe treinada' }),
    Object.freeze({ chave: 'horaSilenciosa', rotulo: 'Hora silenciosa' })
  ]);

  const PERFIS_REMETENTE = Object.freeze({
    'familiar-cuidador': 'Familiar ou cuidador',
    'pessoa-autista': 'Pessoa autista',
    'comerciante-gestor': 'Comerciante ou gestor',
    'outro': 'Outro'
  });

  /**
   * Congela o objeto e, recursivamente, tudo o que ele contém (aqui: ruido, luz, lotacao, cheiro, horaSilenciosa e turnosAbertos).
   * Por quê: Object.freeze é raso; sem isto, local.ruido.manha ainda poderia ser alterado por engano.
   * @param {object} objeto objeto ou array a congelar
   * @returns {object} o mesmo objeto, congelado em profundidade
   */
  function congelarProfundo(objeto) {
    Object.values(objeto).forEach(function (valor) {
      if (valor !== null && typeof valor === 'object') congelarProfundo(valor);
    });
    return Object.freeze(objeto);
  }

  // Versão 2: os 4 estímulos variam por turno (pedido das entrevistas, P5). Turno fechado fica null nos 4.
  // Supermercado Bom Preço e Biblioteca Aurora mantêm os valores da versão 1, para os exemplos conferidos
  // do documento mestre (notas 8, 21, 62 e 86) continuarem valendo.
  const LOCAIS_INICIAIS = [
    { id: 1, nome: 'UBS Jardim Modelo', tipo: 'Saúde',
      ruido: { manha: 3, tarde: 3, noite: null }, luz: { manha: 3, tarde: 3, noite: null },
      lotacao: { manha: 4, tarde: 3, noite: null }, cheiro: { manha: 3, tarde: 2, noite: null },
      espacoCalmo: true, saidaFacil: true, equipeTreinada: true,
      horaSilenciosa: { turno: 'manha', descricao: 'Quarta, 7h30' }, turnosAbertos: ['manha', 'tarde'] },
    { id: 2, nome: 'Supermercado Bom Preço', tipo: 'Supermercado',
      ruido: { manha: 4, tarde: 4, noite: 5 }, luz: { manha: 5, tarde: 5, noite: 5 },
      lotacao: { manha: 3, tarde: 4, noite: 5 }, cheiro: { manha: 4, tarde: 4, noite: 4 },
      espacoCalmo: false, saidaFacil: true, equipeTreinada: false,
      horaSilenciosa: { turno: 'manha', descricao: 'Terça, 9h' }, turnosAbertos: ['manha', 'tarde', 'noite'] },
    { id: 3, nome: 'Mercadinho do Bairro', tipo: 'Supermercado',
      ruido: { manha: 3, tarde: 3, noite: 4 }, luz: { manha: 3, tarde: 3, noite: 4 },
      lotacao: { manha: 2, tarde: 3, noite: 4 }, cheiro: { manha: 3, tarde: 3, noite: 3 },
      espacoCalmo: false, saidaFacil: false, equipeTreinada: false,
      horaSilenciosa: null, turnosAbertos: ['manha', 'tarde', 'noite'] },
    { id: 4, nome: 'Biblioteca Comunitária Aurora', tipo: 'Biblioteca',
      ruido: { manha: 1, tarde: 2, noite: 1 }, luz: { manha: 2, tarde: 2, noite: 2 },
      lotacao: { manha: 1, tarde: 2, noite: 1 }, cheiro: { manha: 1, tarde: 1, noite: 1 },
      espacoCalmo: true, saidaFacil: true, equipeTreinada: true,
      horaSilenciosa: null, turnosAbertos: ['manha', 'tarde', 'noite'] },
    { id: 5, nome: 'Parque Municipal das Árvores', tipo: 'Parque',
      ruido: { manha: 2, tarde: 3, noite: 1 }, luz: { manha: 2, tarde: 3, noite: 1 },
      lotacao: { manha: 2, tarde: 4, noite: 1 }, cheiro: { manha: 1, tarde: 1, noite: 1 },
      espacoCalmo: true, saidaFacil: true, equipeTreinada: false,
      horaSilenciosa: null, turnosAbertos: ['manha', 'tarde', 'noite'] },
    { id: 6, nome: 'Shopping Central Exemplo', tipo: 'Shopping',
      ruido: { manha: 4, tarde: 5, noite: 5 }, luz: { manha: 5, tarde: 5, noite: 5 },
      lotacao: { manha: 3, tarde: 5, noite: 5 }, cheiro: { manha: 3, tarde: 5, noite: 4 },
      espacoCalmo: true, saidaFacil: true, equipeTreinada: true,
      horaSilenciosa: { turno: 'manha', descricao: 'Sábado, 9h' }, turnosAbertos: ['manha', 'tarde', 'noite'] },
    { id: 7, nome: 'Farmácia Saúde Simulada', tipo: 'Farmácia',
      ruido: { manha: 2, tarde: 2, noite: 2 }, luz: { manha: 4, tarde: 4, noite: 4 },
      lotacao: { manha: 2, tarde: 3, noite: 3 }, cheiro: { manha: 3, tarde: 3, noite: 3 },
      espacoCalmo: false, saidaFacil: true, equipeTreinada: false,
      horaSilenciosa: null, turnosAbertos: ['manha', 'tarde', 'noite'] },
    { id: 8, nome: 'Padaria Pão Quente', tipo: 'Padaria',
      ruido: { manha: 3, tarde: 4, noite: 2 }, luz: { manha: 3, tarde: 3, noite: 3 },
      lotacao: { manha: 3, tarde: 5, noite: 2 }, cheiro: { manha: 5, tarde: 4, noite: 3 },
      espacoCalmo: false, saidaFacil: true, equipeTreinada: false,
      horaSilenciosa: null, turnosAbertos: ['manha', 'tarde', 'noite'] },
    { id: 9, nome: 'Terminal de Ônibus Centro', tipo: 'Transporte',
      ruido: { manha: 5, tarde: 5, noite: 4 }, luz: { manha: 4, tarde: 4, noite: 5 },
      lotacao: { manha: 5, tarde: 5, noite: 4 }, cheiro: { manha: 4, tarde: 4, noite: 4 },
      espacoCalmo: false, saidaFacil: true, equipeTreinada: false,
      horaSilenciosa: null, turnosAbertos: ['manha', 'tarde', 'noite'] },
    { id: 10, nome: 'Cinema Tela Azul', tipo: 'Cinema',
      ruido: { manha: null, tarde: 4, noite: 4 }, luz: { manha: null, tarde: 2, noite: 2 },
      lotacao: { manha: null, tarde: 3, noite: 4 }, cheiro: { manha: null, tarde: 3, noite: 4 },
      espacoCalmo: false, saidaFacil: true, equipeTreinada: true,
      horaSilenciosa: { turno: 'tarde', descricao: 'Domingo, 14h' }, turnosAbertos: ['tarde', 'noite'] },
    { id: 11, nome: 'CRAS Vila Esperança', tipo: 'Assistência Social',
      ruido: { manha: 2, tarde: 2, noite: null }, luz: { manha: 2, tarde: 2, noite: null },
      lotacao: { manha: 3, tarde: 2, noite: null }, cheiro: { manha: 1, tarde: 1, noite: null },
      espacoCalmo: true, saidaFacil: true, equipeTreinada: true,
      horaSilenciosa: null, turnosAbertos: ['manha', 'tarde'] },
    { id: 12, nome: 'Museu de Ciências Aberto', tipo: 'Museu',
      ruido: { manha: 1, tarde: 2, noite: null }, luz: { manha: 2, tarde: 2, noite: null },
      lotacao: { manha: 1, tarde: 3, noite: null }, cheiro: { manha: 1, tarde: 1, noite: null },
      espacoCalmo: true, saidaFacil: true, equipeTreinada: true,
      horaSilenciosa: { turno: 'tarde', descricao: 'Quinta, 14h' }, turnosAbertos: ['manha', 'tarde'] }
  ].map(function (local) {
    // Todo local inicial é demonstrativo (RN10). Congelado em profundidade para a lógica nunca alterar a base por engano.
    return congelarProfundo(Object.assign({}, local, { ficticio: true, enviadoPeloUsuario: false, perfilRemetente: null, comentario: '' }));
  });

  LC.dados = Object.freeze({
    TURNOS, LIMIARES, SENSIBILIDADE, PERFIS_RAPIDOS, TIPOS_LOCAL, PERFIS_REMETENTE, FILTROS_ADAPTACAO,
    LOCAIS_INICIAIS: Object.freeze(LOCAIS_INICIAIS)
  });
})(window.LugarCalmo = window.LugarCalmo || {});
