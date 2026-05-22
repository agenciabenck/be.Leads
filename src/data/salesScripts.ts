
export interface ScriptItem {
    id: string;
    title: string;
    description: string;
    content: string; // The text to copy
    tags: ('WhatsApp' | 'E-mail' | 'Ligação' | 'Documento' | 'Instagram')[];
}

export interface ScriptCategory {
    id: string;
    title: string;
    iconName: string; // Lucide icon name
    description: string;
    color: string; // Tailwind color class backbone (e.g. 'blue', 'green')
    items: ScriptItem[];
}

export const SALES_SCRIPTS: ScriptCategory[] = [
    {
        id: 'journey',
        title: 'Guia mestre de jornada do lead',
        iconName: 'Map',
        description: 'Este documento define o fluxo padrão ouro para transformar um dado extraído do Google Maps em um cliente fiel e recorrente.',
        color: 'blue',
        items: [
            {
                id: 'jou-1',
                title: 'Fase 1: Prospecção inteligente (extração)',
                description: 'O objetivo aqui é qualidade, não apenas quantidade.',
                tags: ['Documento'],
                content: `Fase 1: Prospecção inteligente (extração)
O objetivo aqui é qualidade, não apenas quantidade.

Ação: Utilize o extrator do beleadly para filtrar empresas por nicho e localização.

Checklist:
- Verificar se a empresa já possui site oficial no Google Maps.
- Analisar a velocidade de carregamento mobile (usando o script de "Site lento").
- Checar se há anúncios ativos no Instagram (usando o script de "LP para ads").`
            },
            {
                id: 'jou-2',
                title: 'Fase 2: Primeiro contato (conexão)',
                description: 'O foco é gerar curiosidade e não vender o contrato de cara.',
                tags: ['Documento'],
                content: `Fase 2: Primeiro contato (conexão)
O foco é gerar curiosidade e não tentar vender o contrato logo de cara.

Ação: Escolher um dos Scripts de abordagem com base no diagnóstico da Fase 1.

Checklist:
- Enviar o script personalizado (Elogio sincero, O vizinho ou Erro técnico).
- Priorizar o envio de áudio curto se o lead visualizar e não responder imediatamente.
- Mover o lead para a coluna "Prospecção" no seu CRM Kanban.`
            },
            {
                id: 'jou-3',
                title: 'Fase 3: Diagnóstico e qualificação',
                description: 'Descubra se o lead tem o problema que você resolve.',
                tags: ['Documento'],
                content: `Fase 3: Diagnóstico e qualificação
Nesta etapa, você descobre se o lead tem o "problema" que você resolve e se ele tem orçamento.

Ação: Aplicar a Pergunta diagnóstico ou agendar uma reunião de 15 minutos.

Checklist:
- Utilizar as perguntas do Briefing inicial para entender o ticket médio e as dores do cliente.
- Mover o lead para a coluna "Contatado" no CRM.`
            },
            {
                id: 'jou-4',
                title: 'Fase 4: Apresentação e proposta',
                description: 'Apresentação focada em ROI.',
                tags: ['Documento'],
                content: `Fase 4: Apresentação e proposta
É aqui que você apresenta a Proposta comercial irresistível focada em ROI.

Ação: Enviar o PDF da proposta e estar preparado para o Contorno de objeções.

Checklist:
- Se o lead disser "está caro", usar o script de "Valor vs preço".
- Se o lead precisar de tempo, agendar o follow-up no Calendário do CRM.
- Mover o lead para a coluna "Negociação".`
            },
            {
                id: 'jou-5',
                title: 'Fase 5: Fechamento e burocracia',
                description: 'Oficialize a parceria com segurança jurídica.',
                tags: ['Documento'],
                content: `Fase 5: Fechamento e burocracia
O momento de oficializar a parceria com segurança jurídica.

Ação: Enviar o Kit de burocracia completo.

Checklist:
- Coletar assinatura na Minuta de contrato simples.
- Formalizar o Termo de confidencialidade (nda).
- Enviar o Script de boas-vindas com o Checklist de onboarding.
- Mover o lead para a coluna "Ganhos".`
            },
            {
                id: 'jou-6',
                title: 'Fase 6: Entrega e retenção',
                description: 'A venda começa na entrega de valor contínua.',
                tags: ['Documento'],
                content: `Fase 6: Entrega e retenção
A venda não acaba na assinatura; ela começa na entrega de valor contínua.

Ação: Manter o relacionamento através da Cadência de mensagens (se a venda não fechou) ou do acompanhamento de pós-venda.

Checklist:
- Enviar o Relatório mensal simplificado com os KPIs de leads e vendas.
- Realizar o check-in de 30 dias para oferecer novos serviços (upsell).`
            },
            {
                id: 'onb-1',
                title: '(Onboarding) Mensagem de recepção',
                description: 'Dica: Envie imediatamente após a confirmação.',
                tags: ['WhatsApp'],
                content: `Oi [Nome], tudo bem?

É um prazer oficializar nossa parceria! A partir de agora, a [Sua Agência/Nome] está focada em transformar a presença digital da [Empresa do Cliente] em uma máquina ativa de novos negócios.

Para começarmos com o pé direito e ganharmos velocidade na extração dos seus primeiros leads, precisamos realizar o seu setup estratégico.

O que precisamos de você agora:
Abaixo, vou enviar o nosso Checklist de boas-vindas. Nele, você encontrará os acessos e materiais que nossa equipe precisa para configurar seu CRM e iniciar as campanhas.

Consegue dar uma olhada e me enviar esses itens até [Dia/Horário]? Assim, já conseguimos liberar seus primeiros relatórios ainda esta semana.

Qualquer dúvida, estou à disposição!`
            },
            {
                id: 'onb-2',
                title: '(Onboarding) Roteiro para áudio',
                description: 'Gere uma conexão humana poderosa.',
                tags: ['WhatsApp'],
                content: `Fala, [Nome]! Tudo certo por aí?

Passando para te dar as boas-vindas oficialmente! Estamos bem animados com o projeto da [Empresa dele]. Já dei uma olhada preliminar aqui no Google Maps e vi que tem um "oceano azul" de oportunidades que a gente vai começar a explorar agora.

Acabei de te mandar um texto com os próximos passos e um checklist básico. Dá uma olhadinha com calma e, se tiver qualquer trava com senhas ou materiais, me avisa que a gente resolve junto, beleza?

O objetivo é ganhar tração o quanto antes. Um abraço e vamos pra cima!`
            },
            {
                id: 'onb-3',
                title: '(Onboarding) E-mail formal',
                description: 'Assunto: Boas-vindas à nossa consultoria: Próximos passos.',
                tags: ['E-mail'],
                content: `Assunto: Boas-vindas à nossa consultoria: Próximos passos da [Empresa do Cliente]

Olá, [Nome],

É uma honra ter a [Empresa do Cliente] como nossa parceira. Este e-mail marca o início oficial da nossa jornada de crescimento e geração de leads qualificados.

Para garantirmos a máxima performance e organização, centralizaremos nossas comunicações iniciais por aqui. Segue abaixo o cronograma da nossa primeira semana:

Dia 1 (Hoje): Envio de documentos e preenchimento do briefing estratégico.
Dia 2-3: Análise de mercado e configuração da ferramenta de extração (beleadly).
Dia 4: Apresentação da estrutura da Landing Page e funil de vendas.
Dia 5: Início da prospecção ativa e gestão de CRM.

Ações requeridas:
1. Assinatura: Caso ainda não tenha feito, por favor, assine digitalmente o contrato anexo.
2. Briefing: Responda ao formulário de perguntas estratégicas para alinharmos o tom de voz.
3. Checklist: Envie os acessos técnicos solicitados no documento em anexo.

Estamos ansiosos para entregar os primeiros resultados.

Atenciosamente,

[Seu Nome]
[Seu Cargo]`
            },
            {
                id: 'onb-4',
                title: '(Onboarding) Cronograma de expectativas',
                description: 'Card de imagem ou texto para reduzir a ansiedade.',
                tags: ['Documento'],
                content: `NOSSA PRIMEIRA SEMANA:

Segunda: Contrato e Checklist (Ação do Cliente).
Terça: Configuração técnica e acessos (Ação da Agência).
Quarta: Estudo de público e nicho no Maps (Planejamento).
Quinta: Criação dos scripts de abordagem personalizados (Estratégia).
Sexta: Liberação do acesso ao CRM para acompanhamento (Execução).`
            }
        ]
    },
    {
        id: 'conection',
        title: 'Scripts de abordagem',
        iconName: 'Zap',
        description: 'Scripts de quebra-gelo para iniciar conversas impossíveis de ignorar.',
        color: 'blue',
        items: [
            {
                id: 'con-1',
                title: 'Elogio sincero (autoridade)',
                description: 'Para leads que postam conteúdo ou têm site profissional.',
                tags: ['WhatsApp'],
                content: 'Oi [Nome], tudo bem? Estava acompanhando seu perfil e achei muito interessante o posicionamento que você construiu em [Cidade]. É raro ver profissionais do setor com esse nível de cuidado visual e autoridade. Tive uma ideia que pode somar ao que você já faz, podemos falar rapidinho por aqui?'
            },
            {
                id: 'con-2',
                title: 'O vizinho (proximidade)',
                description: 'Para leads que estão na mesma região que você.',
                tags: ['WhatsApp'],
                content: 'Olá [Nome], tudo certo? Vi que somos vizinhos de atuação aqui em [Bairro/Cidade]. Atendo algumas empresas na região e notei que a procura por [Serviço] cresceu muito nos últimos dias. Como você já é referência na área, queria te passar um insight do que estamos vendo. Consegue falar?'
            },
            {
                id: 'con-3',
                title: 'Gancho de áudio',
                description: 'Cria curiosidade com uma abordagem humana.',
                tags: ['WhatsApp'],
                content: '(Mande um áudio curto): "Oi [Nome], tudo bem? Estava dando uma olhada no seu trabalho aqui e me surgiu uma ideia bem específica pro seu negócio... me dá um alô quando puder que te explico melhor!"'
            },
            {
                id: 'con-4',
                title: 'Indicação indireta',
                description: 'Cita uma fonte comum para gerar confiança.',
                tags: ['WhatsApp'],
                content: 'Oi [Nome], como vai? Cheguei no seu nome enquanto pesquisava referências de [Nicho] em [Cidade]. Vi que seu trabalho se destaca e acredito que você seria a pessoa certa para um projeto que estou desenhando. Teria um minuto pra gente conversar?'
            },
            {
                id: 'con-5',
                title: 'Pergunta diagnóstico',
                description: 'Qualifica o lead logo na primeira interação.',
                tags: ['WhatsApp', 'Instagram'],
                content: 'Olá [Nome], uma dúvida rápida: hoje o seu maior desafio no digital é atrair mais interessados ou conseguir converter quem já entra em contato? Pergunto porque estou validando uma solução para empresas de [Nicho] e seu feedback seria muito útil.'
            },
            {
                id: 'con-6',
                title: 'Notícia de mercado',
                description: 'Mostra que você está atento às tendências.',
                tags: ['WhatsApp', 'E-mail'],
                content: 'Oi [Nome], tudo bem? Vi essa atualização sobre [Assunto] hoje e lembrei do seu negócio na hora, acho que isso impacta direto o setor de [Nicho]. Se quiser, te mando o link do que eu li para você dar uma olhada.'
            },
            {
                id: 'con-7',
                title: 'Reativação (sumidos)',
                description: 'Para quem você já falou há meses.',
                tags: ['WhatsApp'],
                content: 'Oi [Nome], tudo bem? Estava revisando alguns contatos e lembrei da nossa conversa em [Mês]. Rodamos um teste novo aqui que trouxe ótimos resultados para o setor de [Nicho] e achei que valia a pena te atualizar. Como estão as coisas por aí?'
            },
            {
                id: 'con-8',
                title: 'Comentário em post (engajamento)',
                description: 'Para iniciar conversa a partir de um conteúdo deles.',
                tags: ['Instagram'],
                content: 'Oi [Nome], vi seu post sobre [Assunto] e achei o ponto de vista muito bom. Inclusive, tive um insight aqui que complementa exatamente o que você aplicou. Posso compartilhar com você?'
            },
            {
                id: 'con-9',
                title: 'Grupo em comum (networking)',
                description: 'Usa um grupo de WhatsApp/Facebook como âncora.',
                tags: ['WhatsApp'],
                content: 'Olá [Nome], tudo certo? Vi que também estamos no grupo [Nome do Grupo]. Achei seu perfil bem focado no mercado local e queria trocar uma figurinha rápida sobre como estão os movimentos por aqui. Tudo bem?'
            },
            {
                id: 'con-10',
                title: 'Recuperação de "quase cliente"',
                description: 'Para quem quase fechou no passado.',
                tags: ['WhatsApp'],
                content: 'Oi [Nome], tudo bem? Estava passando por alguns projetos antigos e lembrei que quase avançamos em [Mês]. Na época o momento era outro, mas queria saber se aquele plano de [Objetivo] ainda é uma prioridade para você. Se for, podemos retomar de onde paramos.'
            },
            {
                id: 'con-11',
                title: 'Feedback de cliente (admiração)',
                description: 'Gera reciprocidade instantânea.',
                tags: ['WhatsApp', 'Instagram'],
                content: 'Oi [Nome], sou um admirador do trabalho de vocês há um tempo. Tive uma experiência excelente com o seu [Produto/Serviço], mas notei um detalhe técnico no processo que pode estar fazendo vocês perderem vendas. Posso te dar esse feedback rapidinho?'
            },
            {
                id: 'con-13',
                title: 'Google maps (otimização)',
                description: 'Focado em melhorar o ranqueamento local.',
                tags: ['WhatsApp'],
                content: 'Oi [Nome], encontrei vocês no Google Maps e vi que tem ótimas avaliações, mas sua empresa não está aparecendo no "top 3" da região para quem busca por [Nicho]. Fiz um ajuste simples em um cliente que o colocou no topo. Quer ver como funciona?'
            },
            {
                id: 'con-14',
                title: 'Benchmarking regional',
                description: 'Levantamento de brechas na concorrência.',
                tags: ['WhatsApp'],
                content: 'Olá [Nome], estou fazendo um levantamento das empresas de [Nicho] aqui em [Cidade] e notei que vocês têm um diferencial que os concorrentes não estão explorando no site. Posso te mostrar qual é essa brecha?'
            }
        ]
    },
    {
        id: 'objections',
        title: 'Mapa de objeções',
        iconName: 'ShieldAlert',
        description: 'Respostas prontas para contornar os "nãos" mais comuns.',
        color: 'red',
        items: [
            {
                id: 'obj-1',
                title: 'Tá caro (valor vs preço)',
                description: 'Quando o cliente foca apenas no custo.',
                tags: ['WhatsApp', 'Ligação'],
                content: 'Entendo, [Nome]. Geralmente quando algo parece caro é porque o retorno ainda não ficou claro. Se a gente olhar para o quanto você deixa de ganhar por não ter esse processo hoje, o investimento se paga em quanto tempo? Se eu te mostrar que ele se paga no primeiro mês, faria sentido para você?'
            },
            {
                id: 'obj-2',
                title: 'Vou ver com meu sócio/esposa',
                description: 'Evita que o lead "esfrie" usando terceiros.',
                tags: ['WhatsApp'],
                content: 'Faz total sentido, decisões compartilhadas são mais seguras. Para facilitar, o que acha de eu te enviar um resumo dos pontos principais ou até participarmos de uma chamada rápida de 5 minutos com eles? Assim eu tiro as dúvidas técnicas direto e você não precisa se preocupar com isso.'
            },
            {
                id: 'obj-3',
                title: 'Já tenho quem faça',
                description: 'Não confronte, complemente.',
                tags: ['WhatsApp'],
                content: 'Que bom! Isso mostra que você já valoriza essa área. Minha ideia não é substituir quem já te atende, mas talvez oferecer uma segunda opinião ou uma estratégia complementar que ele possa não estar usando. Topa uma comparação sem compromisso?'
            },
            {
                id: 'obj-4',
                title: 'Me manda por e-mail',
                description: 'Onde as propostas vão para morrer.',
                tags: ['Ligação', 'WhatsApp'],
                content: 'Mando agora mesmo. Mas para eu não te mandar um documento genérico que vai só ocupar espaço na sua caixa, me tira uma dúvida: o que é prioridade hoje, atrair novos clientes ou organizar os que já chegam? Assim mando só o que interessa.'
            },
            {
                id: 'obj-5',
                title: 'Não tenho tempo agora',
                description: 'Transforma falta de tempo em prioridade.',
                tags: ['WhatsApp'],
                content: 'Justamente por isso que te chamei, [Nome]. Minha solução é desenhada para você ganhar tempo operacional. Me dá 3 minutos agora e eu te mostro como vamos liberar pelo menos 5 horas da sua semana. Podemos?'
            },
            {
                id: 'obj-6',
                title: 'Já tive experiência ruim',
                description: 'Valida a dor e se diferencia.',
                tags: ['WhatsApp'],
                content: 'Sinto muito por isso, o mercado infelizmente tem muitos amadores. Onde exatamente eles falharam com você? Quero entender para te mostrar como nosso contrato tem cláusulas que protegem você exatamente desse tipo de situação.'
            },
            {
                id: 'obj-7',
                title: 'Gostei, mas não agora',
                description: 'Gera compromisso futuro.',
                tags: ['WhatsApp'],
                content: 'Entendido. Para eu não ser o "vendedor chato" que fica te cobrando, qual seria uma data realista para retomarmos? Vou deixar agendado aqui e só te chamo nesse dia.'
            },
            {
                id: 'obj-8',
                title: 'Envie uma proposta formal',
                description: 'Evita o "buraco negro" das propostas enviadas.',
                tags: ['WhatsApp', 'E-mail'],
                content: 'Com certeza. Para ser assertivo e não te mandar um PDF de 50 páginas, me diz: o que não pode faltar nessa proposta para você bater o martelo e fecharmos o projeto?'
            },
            {
                id: 'obj-9',
                title: 'Preciso pensar',
                description: 'Tenta descobrir a objeção real oculta.',
                tags: ['WhatsApp', 'Ligação'],
                content: 'Claro, decisões importantes pedem reflexão. Mas geralmente quando meus clientes dizem isso, é porque algo ainda não ficou 100% claro: foi o preço, a garantia de resultado ou algum detalhe técnico? Pode ser sincero comigo.'
            },
            {
                id: 'obj-10',
                title: 'Concorrente X é mais barato',
                description: 'Foca na entrega e no risco.',
                tags: ['WhatsApp', 'Ligação'],
                content: 'Conheço o trabalho deles. A diferença é que nosso foco é em [Seu Diferencial], enquanto eles focam em preço. Você prefere economizar agora e arriscar o resultado, ou investir um pouco mais para ter a certeza da entrega?'
            },
            {
                id: 'obj-11',
                title: 'Não tenho orçamento agora',
                description: 'Diferencia falta de dinheiro de falta de prioridade.',
                tags: ['WhatsApp'],
                content: 'Compreendo. Mas e se eu te disser que meu objetivo é justamente colocar dinheiro no seu caixa? Se a gente começar de forma gradual e o próprio lucro do projeto financiar a escala, ajudaria você hoje?'
            },
            {
                id: 'obj-12',
                title: 'Vou esperar passar [Data]',
                description: 'Combate a procrastinação baseada em eventos.',
                tags: ['WhatsApp'],
                content: 'O problema de esperar é que o mercado não para. Enquanto você espera o [Evento/Data], seus concorrentes estão captando os leads que poderiam ser seus agora. Prefere sair na frente ou ter que correr atrás do prejuízo depois?'
            },
            {
                id: 'obj-13',
                title: 'Só quero saber o preço',
                description: 'Para o cliente especulador.',
                tags: ['WhatsApp'],
                content: 'Posso te passar agora, sem problemas. Mas como cada projeto tem um escopo, se eu te dar um valor seco posso estar sendo injusto: ou cobrando caro por algo simples, ou barato por algo complexo. Me permite 3 perguntas rápidas para te dar o valor exato?'
            },
            {
                id: 'obj-14',
                title: 'Como você garante o resultado?',
                description: 'Reverte o risco com honestidade.',
                tags: ['Ligação', 'WhatsApp'],
                content: 'Ninguém pode garantir resultado financeiro final, seria irresponsável. O que eu garanto é a aplicação de uma metodologia validada em X clientes. Se não batermos os indicadores técnicos no primeiro mês, eu reviso toda a estratégia sem custo adicional. Parece justo?'
            },
            {
                id: 'obj-15',
                title: 'Não conheço sua empresa',
                description: 'Constrói confiança sem arrogância.',
                tags: ['WhatsApp'],
                content: 'Totalmente compreensível. Por isso não quero que você feche nada agora. Quero apenas te apresentar um estudo de caso de um cliente com o perfil idêntico ao seu. Se o resultado dele fizer sentido para você, a gente volta a falar sobre contrato. Pode ser?'
            },
            {
                id: 'obj-16',
                title: 'Sou muito pequeno para isso',
                description: 'Foca no valor da automação para pequenos negócios.',
                tags: ['WhatsApp'],
                content: 'Na verdade, é justamente por ser pequeno que você precisa de automação. Você não tem braço para prospectar um por um manualmente. O beleadly vai ser o seu funcionário de vendas que trabalha 24h por um custo menor que um café por dia.'
            },
            {
                id: 'obj-17',
                title: 'Isso funciona para o meu nicho?',
                description: 'Validado em diversos nichos com dados em tempo real.',
                tags: ['WhatsApp'],
                content: 'Essa é a melhor parte: como extraímos direto do Google Maps, o dado é em tempo real. Já validamos isso para [Nicho A], [Nicho B] e [Nicho C]. Quer que eu faça uma busca rápida de 1 minuto agora para você ver quantos leads tem disponíveis para você aí na sua região?'
            },
            {
                id: 'obj-18',
                title: 'Não quero contrato longo',
                description: 'Foco em resultados e flexibilidade.',
                tags: ['WhatsApp'],
                content: 'Nós trabalhamos com foco em resultados, por isso não prendemos ninguém por contrato de fidelidade longo. Se você não enxergar valor no primeiro mês, pode cancelar. O risco é todo meu de te entregar algo tão bom que você não vai querer sair.'
            }
        ]
    },
    {
        id: 'cadence',
        title: 'Cadência de mensagens',
        iconName: 'CalendarClock',
        description: 'Acompanhamento estratégico',
        color: 'emerald',
        items: [
            {
                id: 'cad-1',
                title: 'Dia 1 - abordagem leve',
                description: 'Logo após adicionar.',
                tags: ['WhatsApp'],
                content: 'Oi [Nome], tudo bem? Estava acompanhando o trabalho da [Empresa] em [Local] e curti bastante o posicionamento de vocês. Tive uma ideia para uma possível parceria que pode fazer sentido para o momento atual. Teria disponibilidade para um papo rápido por aqui?'
            },
            {
                id: 'cad-2',
                title: 'Dia 2 - o benefício (áudio)',
                description: 'Foque no que ele ganha.',
                tags: ['WhatsApp'],
                content: 'Oi [Nome], só complementando o que te mandei ontem: essa parceria foca direto em trazer [Benefício X] para vocês já no curto prazo. Se quiser entender como funciona na prática, me dá um toque por aqui que te explico em um áudio rápido.'
            },
            {
                id: 'cad-3',
                title: 'Dia 3 - estudo de caso (valor)',
                description: 'Mostre resultados reais.',
                tags: ['WhatsApp'],
                content: 'Oi [Nome], lembrei de você agora porque acabei de ver o resultado que um cliente nosso de [Nicho] teve: [Link/Print]. É exatamente o cenário que comentei com você. Vale dar uma olhada no potencial que isso tem para o seu negócio também.'
            },
            {
                id: 'cad-4',
                title: 'Dia 4 - prova social',
                description: 'Mostre que outros estão ganhando.',
                tags: ['WhatsApp'],
                content: 'Dá uma olhada no volume de contatos que esse parceiro aí da sua região recebeu esta semana (Print/Texto). Com a estrutura que você já tem, imagino um resultado bem similar. Faz sentido a gente avançar com aquele teste?'
            },
            {
                id: 'cad-6',
                title: 'Dia 6 - agenda limitada',
                description: 'Crie senso de urgência de forma natural.',
                tags: ['WhatsApp'],
                content: '[Nome], estou organizando minha agenda de consultorias para os próximos dias e queria ver se conseguimos encaixar aquele nosso papo. Tenho uma janela amanhã às [Horário] ou na [Dia]. Qual desses horários fica melhor para você?'
            },
            {
                id: 'cad-7',
                title: 'Dia 7 - último contato',
                description: 'Respeito ao tempo do lead.',
                tags: ['WhatsApp', 'E-mail'],
                content: '[Nome], como não recebi seu retorno, imagino que as prioridades tenham mudado por aí agora. Vou retirar seu nome do meu fluxo de acompanhamento para não te incomodar. Se em algum momento você quiser retomar o assunto, meu contato continua o mesmo. Sucesso!'
            },
            {
                id: 'cad-10',
                title: 'Dia 10 - check-in suave',
                description: 'Apenas para estar presente.',
                tags: ['WhatsApp'],
                content: 'E aí [Nome], como estão as coisas na [Empresa]? Passando só para desejar uma ótima semana e manter o contato por aqui. Se precisar de qualquer coisa na área de [Seu Setor], conte comigo. Abraço!'
            },
            {
                id: 'cad-14',
                title: 'Dia 14 - lembrete amigável',
                description: 'Acompanhamento profissional com valor.',
                tags: ['WhatsApp'],
                content: 'Oi [Nome], tudo bem? Vi essa matéria sobre [Assunto/Notícia] e lembrei da nossa conversa. Acho que tem tudo a ver com o que vocês estão planejando. Segue o link, espero que seja útil para o seu planejamento!'
            },
            {
                id: 'cad-30',
                title: 'Dia 30 - nova oportunidade',
                description: 'Ciclo mensal de contato.',
                tags: ['WhatsApp', 'E-mail'],
                content: '[Nome], iniciamos um novo mês por aqui e abrimos algumas condições especiais para novos parceiros. Se aquele projeto ainda estiver nos seus planos, este é o melhor momento para começarmos com o pé direito. Me avisa se quiser ver como ficou a proposta atual?'
            },
            {
                id: 'cad-45',
                title: 'Dia 45 - convite para conteúdo',
                description: 'Engajamento com conteúdo de valor.',
                tags: ['WhatsApp', 'E-mail'],
                content: 'Oi [Nome], vamos fazer uma breve apresentação ao vivo sobre [Assunto de interesse do lead] esta semana. Como você tinha demonstrado interesse nisso, achei que gostaria de participar. Quer que eu te envie o link de acesso?'
            },
            {
                id: 'cad-90',
                title: 'Dia 90 - retomada de ciclo',
                description: 'Acompanhamento trimestral estratégico.',
                tags: ['WhatsApp', 'E-mail'],
                content: 'Oi [Nome], faz tempo que não nos falamos! Vi que a [Empresa] cresceu bastante de uns meses para cá. Queria te mostrar como nossas novas ferramentas de automação podem ajudar nesta sua fase atual. Topa um café virtual rápido?'
            }
        ]
    },
    {
        id: 'docs',
        title: 'Kit de burocracia',
        iconName: 'FileText',
        description: 'Modelos prontos de contratos e propostas para fechar negócio.',
        color: 'purple',
        items: [
            {
                id: 'doc-1',
                title: 'Proposta comercial irresistível',
                description: 'Orientações: Este documento é focado em transformar a percepção de "custo" em "investimento com retorno".',
                tags: ['Documento'],
                content: `PROPOSTA ESTRATÉGICA DE CRESCIMENTO DIGITAL

1. Diagnóstico e problema identificado
Após análise do cenário atual da [Nome da Empresa], identificamos um gargalo crítico na captação ativa de novos clientes. Atualmente, a empresa depende de indicações ou de uma presença passiva, o que resulta em uma perda estimada de R$ [Valor] mensais em oportunidades que estão sendo absorvidas pela concorrência direta no Google.

2. A solução (Nossa entrega estratégica)
Nosso projeto não visa apenas "criar um site", mas sim implementar uma infraestrutura de vendas focada em alta conversão:

Landing page de alta performance: Desenvolvimento de uma página otimizada para dispositivos móveis, com foco total em levar o visitante ao botão de contato.

SEO local e autoridade: Otimização para que sua empresa seja a primeira opção quando alguém buscar por [Nicho] na região.

Gestão de leads: Implementação de um fluxo de atendimento para garantir que nenhum interessado fique sem resposta imediata.

3. Cronograma de implementação

Fase 1 (Planejamento e Briefing): [X] dias úteis.

Fase 2 (Desenvolvimento e Design): [X] dias úteis.

Fase 3 (Lançamento e Testes): [X] dias úteis.

Primeiros resultados esperados: Entre [X] e [Y] dias após o lançamento.

4. O investimento
Para a implementação completa da estrutura descrita, o investimento será de:

Valor total: R$ [Valor]

Condições: Parcelamento em até [X] vezes via [Cartão/Boleto].

5. Garantia de entrega
Comprometemo-nos com a excelência técnica. Caso os marcos de entrega não sejam atingidos nos prazos estipulados por responsabilidade da nossa equipe, estenderemos o suporte técnico por mais 30 dias sem qualquer custo adicional para o cliente.

6. Próximos passos
Para darmos início ao setup do seu projeto, basta responder com um "De acordo" a esta proposta. Em seguida, enviaremos a minuta do contrato e o link para o briefing inicial.

Aguardo seu OK!`
            },
            {
                id: 'doc-2',
                title: 'Minuta de contrato simples',
                description: 'Orientações: Um documento formal que protege ambos os lados, incluindo cláusulas modernas de LGPD.',
                tags: ['Documento'],
                content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS PROFISSIONAIS

I - DAS PARTES
CONTRATANTE: [Nome/Razão Social], inscrito no CPF/CNPJ sob o nº [Número], com sede em [Endereço Completo].
CONTRATADA: [Seu Nome/Razão Social], inscrito no CPF/CNPJ sob o nº [Número], com sede em [Endereço Completo].

II - DO OBJETO
O presente contrato tem como objeto a prestação de serviços de [Descrever Serviço, ex: Criação de Site e Gestão de Leads], conforme as especificações técnicas detalhadas na proposta comercial anexa, que passa a fazer parte integrante deste instrumento.

III - DAS OBRIGAÇÕES

DA CONTRATADA: Realizar os serviços com zelo, técnica e dentro dos prazos estipulados, mantendo a CONTRATANTE informada sobre o progresso.

DA CONTRATANTE: Fornecer todas as informações, acessos e materiais necessários em até [X] dias úteis após a solicitação, sob pena de prorrogação automática do prazo de entrega.

IV - DO VALOR E PAGAMENTO
Pelo serviço prestado, a CONTRATANTE pagará à CONTRATADA a importância total de R$ [Valor], na seguinte forma: [Descrever parcelas/datas].

Parágrafo único: O atraso no pagamento implicará em multa moratória de 2% (dois por cento) e juros de 1% (um por cento) ao mês.

V - DA LGPD E CONFIDENCIALIDADE
As partes declaram-se cientes das obrigações da Lei Geral de Proteção de Dados (Lei 13.709/18), comprometendo-se a utilizar os dados coletados estritamente para a finalidade deste contrato. Todas as informações comerciais trocadas são consideradas confidenciais.

VI - DO PRAZO E RESCISÃO
O contrato tem vigência de [X] meses. Qualquer das partes poderá rescindi-lo mediante aviso prévio por escrito de 30 dias. Em caso de rescisão antecipada por parte da CONTRATANTE sem justa causa, será devida multa de [X]% sobre o saldo remanescente.

VII - DO FORO
Fica eleito o foro da comarca de [Sua Cidade] para dirimir quaisquer controvérsias oriundas deste contrato.

[Local e Data]

_________________________      _________________________
      CONTRATANTE                     CONTRATADA`
            },
            {
                id: 'doc-3',
                title: 'Termo de confidencialidade (nda)',
                description: 'Orientações: Use este termo para dar segurança ao cliente de que os dados de faturamento e estratégia dele estão protegidos.',
                tags: ['Documento'],
                content: `TERMO DE CONFIDENCIALIDADE E SIGILO (NDA)

Pelo presente instrumento, as partes comprometem-se a manter o mais absoluto sigilo sobre quaisquer dados, materiais, estratégias comerciais, listas de clientes, documentos ou especificações técnicas que venham a ter acesso em razão da parceria firmada.

Abrangência: O sigilo abrange informações escritas, verbais, digitais ou em formato de vídeo, independentemente de estarem marcadas como "confidenciais".

Restrição: É terminantemente vedada a cópia, reprodução, divulgação ou compartilhamento com terceiros não autorizados sem autorização expressa e por escrito da outra parte.

Penalidades: A quebra comprovada deste termo ensejará indenização por perdas e danos, além de possíveis sanções civis e criminais cabíveis.

Vigência: A obrigação de sigilo perdurará por [X] anos após o encerramento da relação comercial entre as partes.

[Cidade], [Data].

_________________________
Assinatura Responsável`
            },
            {
                id: 'doc-4',
                title: 'Briefing inicial (perguntas)',
                description: 'Orientações: Organize este documento em um formulário (Typeform/Google Forms) ou envie em pdf para o cliente responder.',
                tags: ['Documento'],
                content: `DIAGNÓSTICO ESTRATÉGICO DE NEGÓCIO

MÓDULO 1: Identidade e diferenciais
1. Qual é a principal promessa da sua empresa ao cliente final?
2. Se o seu negócio fosse o único do setor em sua cidade, por que os clientes sentiriam falta de vocês? (Diferencial competitivo).
3. Quais são os 3 valores fundamentais que guiam o seu atendimento?

MÓDULO 2: Produto e monetização
4. Qual produto ou serviço possui a maior margem de lucro?
5. Qual é o ticket médio (valor médio gasto) de um cliente novo?
6. Quais são as 3 dúvidas ou "desculpas" que os clientes mais dão para não fechar com você hoje?

MÓDULO 3: O cliente ideal (Persona)
7. Descreva o cliente que você gostaria de ter 10 vezes mais (idade, profissão, comportamento).
8. Qual é o maior medo que esse cliente tem ao contratar o seu tipo de serviço?
9. Quem é o perfil de cliente que você NÃO quer atender?

MÓDULO 4: Mercado e metas
10. Quem são seus 3 maiores concorrentes e o que você mais admira neles?
11. Qual é a sua meta de faturamento mensal para os próximos 6 meses?
12. Quantos novos contatos (leads) sua equipe comercial consegue atender com qualidade por dia?

OBSERVAÇÕES GERAIS:
[Espaço livre para considerações]`
            },
            {
                id: 'doc-5',
                title: 'Relatório mensal simplificado',
                description: 'Orientações: Envie este relatório mensalmente em pdf para justificar o valor da sua mensalidade.',
                tags: ['Documento'],
                content: `RELATÓRIO DE PERFORMANCE E RESULTADOS - [MÊS]

1. Resumo executivo
Neste mês, focamos na otimização da taxa de conversão do site e na extração de leads qualificados via beleadly. O principal destaque foi a redução do custo por lead em [X]% comparado ao mês anterior.

2. Indicadores principais (KPIs)
- Total de leads gerados: [Qtd]
- Custo por lead (CPL): R$ [Valor]
- Oportunidades de negócio abertas: [Qtd]
- Vendas confirmadas: [Qtd]
- Retorno sobre investimento (ROAS): [X]x

3. Atividades realizadas
- Ajuste na cópia dos botões de ação para melhorar o clique.
- Implementação de novos scripts de abordagem para a equipe comercial.
- Otimização da velocidade de carregamento (mobile).

4. Planejamento para o próximo mês
- Iniciar teste de público [A/B] para nicho específico.
- Implementar automação de follow-up no Dia 3.

OBSERVAÇÕES:
[Espaço para dúvidas ou solicitações]`
            }
        ]
    },
    {
        id: 'web-sales',
        title: 'Venda de sites e LPs',
        iconName: 'Globe',
        description: 'Abordagens específicas para vender sites, landing pages e e-commerces.',
        color: 'sky',
        items: [
            {
                id: 'web-1',
                title: 'Site lento (mobile)',
                description: 'Focado na experiência do usuário e perda de vendas.',
                tags: ['WhatsApp'],
                content: 'Oi [Nome], tudo bem? Estava navegando no seu site pelo celular e notei um gargalo técnico: ele demorou mais de 5s para carregar. O Google aponta que cada segundo extra pode custar até 20% das suas vendas. Gravei um vídeo rápido mostrando onde está o erro e como resolver. Quer que eu te mande?'
            },
            {
                id: 'web-2',
                title: 'Sem site (autoridade)',
                description: 'Para empresas que só usam Instagram.',
                tags: ['Instagram', 'WhatsApp'],
                content: 'Olá [Nome], parabéns pelo trabalho em [Cidade]! Notei que ao buscar pelo seu serviço no Google, seus concorrentes aparecem com site oficial e você não. Hoje, 80% das pessoas validam a empresa no Google antes de fechar. Posso te enviar um layout de como seria sua presença oficial para não perder mais esses leads?'
            },
            {
                id: 'web-3',
                title: 'Redesign (site antigo)',
                description: 'Foca na modernização e credibilidade.',
                tags: ['E-mail', 'WhatsApp'],
                content: 'Oi [Nome], vi que seu site tem um conteúdo excelente, mas o layout ainda segue o padrão de 2018. Para o público premium que você atende, isso pode passar uma imagem de desatualização. Desenvolvi um novo conceito focado em autoridade e conversão. Topa dar uma olhado em como ele ficaria?'
            },
            {
                id: 'web-4',
                title: 'LP para ads (tráfego)',
                description: 'Para quem manda tráfego para a home.',
                tags: ['WhatsApp'],
                content: 'Oi [Nome], vi seu anúncio no Instagram e cliquei, mas ele me levou para a Home do site. Isso acaba dispersando o cliente e encarecendo seu lead. O ideal seria uma Landing Page específica para essa oferta. Posso te mostrar como essa pequena troca pode dobrar seu ROI nos anúncios?'
            },
            {
                id: 'web-5',
                title: 'Google maps (conversão)',
                description: 'Focado em converter tráfego local.',
                tags: ['WhatsApp'],
                content: 'Olá [Nome], encontrei sua empresa no Maps, mas notei que você ainda não aproveita o tráfego direto de quem busca por [Nicho] na região. Um site otimizado converteria essas buscas em orçamentos no seu WhatsApp automaticamente. Posso te mostrar como configurar isso?'
            },
            {
                id: 'web-6',
                title: 'Prova social (setorial)',
                description: 'Prova social específica.',
                tags: ['WhatsApp'],
                content: 'Oi [Nome], acabei de finalizar um projeto para uma empresa de [Nicho] e conseguimos aumentar o volume de contatos em X% em 30 dias. Vi que seu negócio tem um potencial parecido e montei uma estrutura similar que funcionaria bem para você. Quer ver o resultado desse estudo de caso?'
            },
            {
                id: 'web-7',
                title: 'Erro no site (técnico)',
                description: 'Ajuda genuína gera abertura.',
                tags: ['WhatsApp', 'E-mail'],
                content: 'Olá [Nome], estava navegando no site de vocês e encontrei um erro na página [Nome da Página] que está impedindo o cliente de [Comprar/Cadastrar]. Tirei um print para te mostrar. Onde posso te enviar?'
            }
        ]
    }
];
