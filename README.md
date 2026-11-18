# Lugar Calmo: mapa sensorial da cidade

> **Acessibilidade também é silêncio. A rampa chegou. Mas e o barulho?**

**Previsibilidade sensorial para circular pela cidade com liberdade e tranquilidade.**

O Lugar Calmo é uma plataforma web cívica que classifica espaços urbanos (UBS, mercados, bibliotecas, parques, terminais, centros culturais) por **ruído, iluminação, lotação e cheiro** em cada turno (**Manhã, Tarde, Noite**). Com isso, calcula uma nota de compatibilidade de **0 a 100** para o perfil sensorial de cada pessoa autista ou neurodivergente.

Projeto da Global Solution 2026/2 (FIAP, Engenharia de Software, tema CitizenTech).

## O problema

Som alto, eco, luz fluorescente, aglomeração e cheiro forte são barreiras sensoriais invisíveis. Elas causam sobrecarga, exaustão e exclusão. A acessibilidade urbana costuma olhar só rampa, elevador e piso tátil.

**2,4 milhões de pessoas** foram diagnosticadas com autismo no Brasil (**1,2% da população**). Na faixa de 5 a 9 anos, a prevalência é de 2,6%, cerca de 1 em cada 38 crianças.
Fonte: [IBGE, Censo 2022](https://agenciadenoticias.ibge.gov.br/agencia-noticias/2012-agencia-de-noticias/noticias/43464-censo-2022-identifica-2-4-milhoes-de-pessoas-diagnosticadas-com-autismo-no-brasil).
Nota metodológica: o Censo investiga o diagnóstico declarado por profissional de saúde. Os 14,4 milhões (7,3%) de pessoas com deficiência são outro recorte, e os números não devem ser somados.

## Como funciona

1. **Ajuste suas 4 sensibilidades** (seu incômodo com ruído, luz, lotação e cheiros), de 0 (tolero bem) a 5 (incomoda muito). Há perfis rápidos: Padrão, Perfil Ana e Perfil Rafael.
2. **Escolha o turno**: Manhã, Tarde ou Noite.
3. **Veja os lugares do mais ao menos compatível**, com selo, os 4 níveis do turno, alerta de gatilho e melhor horário.
4. **Filtre** por tipo de local e por adaptação (espaço calmo, saída fácil, equipe treinada, hora silenciosa).
5. **Avalie ou sugira um local** no formulário, inclusive com a hora silenciosa.

**Fórmula resumida**

```
Incômodo% = Σ (sensibilidade × estímulo no turno) / (5 × Σ sensibilidades) × 100
Nota      = 100 − Incômodo% + bônus   (limitada entre 0 e 100)
Bônus     = +5 se tem espaço calmo, +5 se tem saída fácil
```

- **Selos**: nota de 70 ou mais é **Tranquilo**; de 40 a 69, **Atenção**; abaixo de 40, **Evitar neste horário**. Cada selo tem ícone e texto, porque a cor nunca é a única pista.
- **Hora Silenciosa**: no turno em que o local tem hora silenciosa, ruído, iluminação e lotação caem 2 pontos (mínimo 0).
- **Melhor horário**: o turno aberto com a maior nota. Em caso de empate, vale a ordem manhã, tarde, noite. Se essa nota fica abaixo de 70, a linha diz **Horário menos crítico**, para não prometer calma.
- **Alerta de gatilho**: quando um estímulo está em 4 ou 5 no local e a sua sensibilidade a ele também é 4 ou 5, o card avisa, porque a nota média pode esconder esse pico.
- Se todas as sensibilidades forem 0, todo local aberto recebe nota 100, e um aviso pede para ajustar os controles.
- Locais fechados ou sem dados no turno vão para o fim da lista.

## Tecnologias

HTML5 semântico, CSS3 e JavaScript puro. Sem frameworks, bibliotecas, CDNs ou fontes externas. Nenhuma instalação é necessária.

## Como executar

Baixe ou extraia a pasta e dê dois cliques em `index.html`. Não precisa de instalação nem servidor.

Site publicado (GitHub Pages): https://richardalmeida-dev.github.io/lugar-calmo/

## Estrutura de pastas

```
lugar-calmo/
├── index.html        Início: problema, dado oficial, como funciona, ODS
├── solucao.html      Mapa Sensorial: perfil, turno, lista de lugares e formulário
├── impacto.html      Impacto social, ODS, validação e visão futura
├── equipe.html       Equipe, metodologia e fontes
├── README.md
├── css/  base.css, layout.css, componentes.css, temas.css
├── js/   dados.js, calculo.js, render.js, formulario.js, acessibilidade.js, app.js
└── img/  aneis-hero.svg, icone-tranquilo.svg, icone-atencao.svg, icone-evitar.svg,
          icone-espaco-calmo.svg, icone-saida.svg, icone-equipe.svg, favicon.svg
```

## Acessibilidade

- Construído para WCAG 2.2 nível AA: contraste mínimo de 4,5:1, foco sempre visível, `<label>` em todo campo e hierarquia de títulos sem pulos.
- **Modo Calmo**: cores mais suaves, mais espaço entre linhas, nenhuma animação e ilustrações escondidas.
- **Alto Contraste**: fundo preto, texto branco e destaques em amarelo.
- **A- e A+**: 5 tamanhos de texto (de 87,5% a 137,5%).
- Essas preferências valem em todas as páginas e ficam salvas no navegador quando ele permite.
- Tudo funciona só com o teclado. O resumo da lista é anunciado por leitores de tela.
- Áreas de toque de pelo menos 44 × 44 px, sem som, sem reprodução automática e com respeito a "reduzir movimento".

## Privacidade e segurança

- Sem login, sem cadastro e sem coleta de dados pessoais (LGPD, Lei 13.709/2018, Art. 11: dados de saúde são sensíveis).
- O perfil sensorial fica só na memória da página. O navegador guarda apenas as preferências visuais (tamanho do texto, contraste, Modo Calmo).
- Proteção contra injeção de código: todo texto digitado é exibido como texto puro, nunca interpretado como HTML.
- O formulário pede para não escrever nomes, telefones ou informações de saúde de ninguém.

> Protótipo acadêmico. O Lugar Calmo apoia a escolha do dia a dia e não é ferramenta médica. Não substitui orientação profissional nem laudo técnico de acústica (ABNT NBR 10152).

## Aviso sobre os dados

- Os **12 locais são fictícios** e servem só para demonstração. Cada card mostra "Dado demonstrativo (fictício)".
- Os 4 estímulos (ruído, iluminação, lotação e cheiros) variam por turno.
- As contribuições enviadas pelo formulário valem **só durante a sessão**: somem ao recarregar a página. O card diz a origem: "Relato comunitário" (com o perfil de quem enviou) ou "Informação do estabelecimento".

## Validação com pessoas reais

Ouvimos 6 pessoas (P1 a P6) em novembro de 2026: 2 adultos autistas, 2 familiares que cuidam de crianças autistas, 1 pessoa com enxaqueca crônica e 1 gerente de supermercado de bairro. Os registros usam só códigos, sem nomes. Elas usaram o protótipo e pediram 7 mudanças, todas feitas na versão 2:

| Mudança | Quem pediu |
|---|---|
| Os 4 níveis do turno logo abaixo da nota, com alerta de gatilho | P2 e P5 |
| 4 filtros de adaptação independentes | P1 e P6 |
| Escalas claras: "Seu incômodo com ruído", de 0 (tolero bem) a 5 (incomoda muito), e legenda no formulário | P4 |
| "Horário menos crítico" quando a maior nota fica abaixo de 70 | P2 |
| Iluminação e cheiros variando por turno | P5 |
| Hora silenciosa no formulário | P3 |
| Origem do dado no card | P3 e P6 |

Ficaram para a próxima etapa, porque dependem de servidor e API: mapa visual com localização opcional e avaliações guardadas na nuvem com moderação.

Detalhes na página Impacto: https://richardalmeida-dev.github.io/lugar-calmo/impacto.html#validacao

## Versões

- **Versão 2 (atual)**: com as mudanças pedidas nas entrevistas.
- **Versão 1**, de antes das entrevistas: https://richardalmeida-dev.github.io/lugar-calmo/v1/ (código na tag [`v1.0`](https://github.com/richardalmeida-dev/lugar-calmo/tree/v1.0)). A pasta `v1/` do repositório existe só para essa comparação e não faz parte da entrega.

## Objetivos de Desenvolvimento Sustentável

- **ODS 10**, Redução das desigualdades (Meta 10.2): inclusão de pessoas com deficiência.
- **ODS 11**, Cidades e comunidades sustentáveis (Meta 11.7): espaços públicos acessíveis.
- **ODS 3**, Saúde e bem-estar (Meta 3.4), complementar: saúde mental e bem-estar.
- **ODS 4**, Educação de qualidade (Meta 4.5), complementar: acesso igual para pessoas com deficiência.

## Integrantes

| Nome completo | RM | Responsabilidade |
|---|---|---|
| Francisco Wellington da Silva Rodrigues | RM566700 | Concepção da solução e entrevistas |
| Richard Henrique Godoy de Almeida | RM574660 | Código e vídeo |
| Alexandre Oliveira Machado | RM575671 | Testes |
| Luiza Eduarda Luza Neckel | RM576827 | Documentação e envio |
| Paulo Henrique Oliveira Freitas | RM574796 | Integrante |

## Links

- Site publicado (GitHub Pages): https://richardalmeida-dev.github.io/lugar-calmo/
- Repositório no GitHub: https://github.com/richardalmeida-dev/lugar-calmo
- Vídeo pitch: [PREENCHER URL]
- Versão 1 do protótipo: https://richardalmeida-dev.github.io/lugar-calmo/v1/

## Fontes

- IBGE, Agência de Notícias (23/05/2025), Censo 2022: [2,4 milhões de pessoas diagnosticadas com autismo no Brasil](https://agenciadenoticias.ibge.gov.br/agencia-noticias/2012-agencia-de-noticias/noticias/43464-censo-2022-identifica-2-4-milhoes-de-pessoas-diagnosticadas-com-autismo-no-brasil)
- OMS, [Autism fact sheet](https://www.who.int/news-room/fact-sheets/detail/autism-spectrum-disorders): cerca de 1 em cada 100 crianças no espectro autista no mundo
- [Lei 12.764/2012 (Berenice Piana)](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12764.htm): pessoa autista é pessoa com deficiência para todos os efeitos legais
- [Lei 13.146/2015 (LBI)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm): direito à acessibilidade e eliminação de barreiras
- [Lei 13.709/2018 (LGPD)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm), Art. 11: dados sensíveis de saúde
- [ONU Brasil, Objetivos de Desenvolvimento Sustentável](https://brasil.un.org/pt-br/sdgs)

## Uso de IA generativa

- **Entrevistas**: usamos IA generativa para transcrever os áudios das entrevistas e para apoiar a análise individual de cada uma. A equipe revisou as transcrições e as análises.
