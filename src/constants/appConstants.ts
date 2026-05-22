export const COMMON_NICHES = [
    "Academias",
    "Açougues e Casas de Carnes",
    "Advogados / Advocacia",
    "Agências de Marketing",
    "Agências de Viagens",
    "Agronegócio e Fazendas",
    "Arquitetura e Interiores",
    "Assistência Técnica",
    "Autoescolas",
    "Bares e Pubs",
    "Barbearias",
    "Beleza e Estética",
    "Bicicletarias",
    "Borracharias",
    "Buffets e Eventos",
    "Cafeterias e Padarias",
    "Casas Noturnas e Baladas",
    "Centros Automotivos",
    "Chaveiros",
    "Clínicas Odontológicas",
    "Clínicas Médicas",
    "Clínicas Veterinárias",
    "Concessionárias de Veículos",
    "Construção Civil",
    "Consultorias Empresariais",
    "Contabilidades",
    "Coworking",
    "Despachantes",
    "Distribuidoras de Bebidas",
    "Distribuidoras e Atacadistas",
    "E-commerce e Lojas Virtuais",
    "Empresas de Energia Solar",
    "Empresas de Limpeza",
    "Empresas de Segurança",
    "Energia Solar",
    "Empresas de TI e Software",
    "Engenharia e Projetos",
    "Escolas e Cursos",
    "Escritórios de Advocacia",
    "Espaços de Beleza",
    "Estacionamentos",
    "Estúdios de Dança",
    "Estúdios de Fotografia",
    "Estúdios de Pilates",
    "Estúdios de Tatuagem",
    "Fábricas de Móveis",
    "Farmácias",
    "Fisioterapia",
    "Floriculturas",
    "Fonoaudiologia",
    "Fornecedores de Casamento",
    "Franquias",
    "Gráficas",
    "Hospitais e Laboratórios",
    "Hotéis e Pousadas",
    "Imobiliárias e Corretores",
    "Indústrias e Fábricas",
    "Instaladores de Ar Condicionado",
    "Lavajatos e Estética Automotiva",
    "Lavanderias",
    "Lojas de Artigos Esportivos",
    "Lojas de Autopeças",
    "Lojas de Brinquedos",
    "Lojas de Calçados",
    "Lojas de Cosméticos e Perfumarias",
    "Lojas de Eletrônicos",
    "Lojas de Ferragens e Materiais de Construção",
    "Lojas de Móveis e Decoração",
    "Lojas de Roupas Femininas",
    "Lojas de Roupas Masculinas",
    "Lojas de Suplementos",
    "Lojas de Veículos Multimarcas",
    "Móveis Planejados/Marcenaria",
    "Marido de Aluguel e Pequenos Reparos",
    "Motéis e Pernoites",
    "Nutricionistas",
    "Odontologia Especializada",
    "Oficinas Mecânicas",
    "Organização de Eventos",
    "Óticas e Joalherias",
    "Papelarias e Livrarias",
    "Personal Trainers e Preparadores",
    "Pesca e Náutica",
    "Pet Shops",
    "Pizzarias e Delivery",
    "Postos de Combustível",
    "Psicologia e Terapia",
    "Restaurantes e Bares",
    "Salões de Beleza",
    "Seguradoras e Corretoras de Seguros",
    "Self Storage",
    "Serralherias e Vidraçarias",
    "Sindicatos e Associações",
    "Sorveterias e Açaiterias",
    "Supermercados e Mercadinhos",
    "Tabelionatos e Cartórios",
    "Tapeçarias e Estofarias",
    "Terapias Holísticas",
    "Transportadoras e Logística",
    "Turismo e Excursões",
    "Vidraçarias e Serralherias",
    "Zeladoria e Manutenção Predial"
].sort();

export const BRAZIL_STATES = [
    { sigla: 'AC', nome: 'Acre' },
    { sigla: 'AL', nome: 'Alagoas' },
    { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' },
    { sigla: 'BA', nome: 'Bahia' },
    { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' },
    { sigla: 'ES', nome: 'Espírito Santo' },
    { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' },
    { sigla: 'MT', nome: 'Mato Grosso' },
    { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' },
    { sigla: 'PA', nome: 'Pará' },
    { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PR', nome: 'Paraná' },
    { sigla: 'PE', nome: 'Pernambuco' },
    { sigla: 'PI', nome: 'Piauí' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' },
    { sigla: 'RN', nome: 'Rio Grande do Norte' },
    { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondônia' },
    { sigla: 'RR', nome: 'Roraima' },
    { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'São Paulo' },
    { sigla: 'SE', nome: 'Sergipe' },
    { sigla: 'TO', nome: 'Tocantins' }
];

export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
});

export const AVATAR_EMOJIS = [
    '👨‍💼', '👩‍💼', '🚀', '🎯', '💰', '💼', '📈', '🤝',
    '⚡', '🌟', '📱', '💻', '🏢', '⚙️', '🤖', '🔥',
    '🌈', '✨', '🏆', '💎'
];

export const LOADING_MESSAGES = [
    "Lendo páginas públicas...",
    "Filtrando contatos inválidos...",
    "Garantindo a qualidade da busca...",
    "Removendo leads duplicados...",
    "Organizando resultados por relevância...",
    "Quase lá! Processando leads...",
    "Buscando as últimas informações...",
    "Finalizando a extração...",
    "Isso pode levar até 2 minutos, aguarde...",
    "Montando a tabela de contatos..."
];

export const STRIPE_PRICES = {
    start: "price_1SzdGU3fc3cZuklGVPzlU4Fi",
    pro: "price_1SzdHi3fc3cZuklG5rtVblVa",
    elite: "price_1SzdJQ3fc3cZuklGzmncl1Oh"
};

export const STRIPE_PRICES_ANNUAL = {
    start: "price_1SzdGu3fc3cZuklGDHAMMsBR",
    pro: "price_1SzdI83fc3cZuklGDBe9TJVy",
    elite: "price_1SzdJi3fc3cZuklGhjinw5av"
};


export const PLAN_HIERARCHY = {
    free: 0,
    start: 1,
    pro: 2,
    elite: 3
};

export const PLAN_FEATURES = {
    free: {
        maps: true,
        whatsapp_click: false,
        export_excel: false,
        export_sheets: false,
        crm: false,
        dashboard: false,
        instagram: true,
        linkedin: false,
        extras: false,
        enrich: false,
        ai_chat: false
    },
    start: {
        maps: true,
        whatsapp_click: true,
        export_excel: true,
        export_sheets: false,
        crm: false,
        dashboard: false,
        instagram: true,
        linkedin: false,
        extras: false,
        enrich: false,
        ai_chat: false
    },
    pro: {
        maps: true,
        whatsapp_click: true,
        export_excel: true,
        export_sheets: true,
        crm: true,
        dashboard: true,
        instagram: true,
        linkedin: true,
        extras: true,
        enrich: true,
        ai_chat: true
    },
    elite: {
        maps: true,
        whatsapp_click: true,
        export_excel: true,
        export_sheets: true,
        crm: true,
        dashboard: true,
        instagram: true,
        linkedin: true,
        extras: true,
        enrich: true,
        ai_chat: true
    }
};

export const DEMO_LEADS = [
    { id: '1', name: 'Exemplo Lead A', category: 'Restaurante', address: 'Av. Paulista, 1000', phone: '(11) 99999-9999', rating: 4.5, reviews: 120, website: 'www.exemplo.com', status: 'prospecting', priority: 'medium', tags: ['Novo'], addedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '2', name: 'Exemplo Lead B', category: 'Academia', address: 'Rua Oscar Freire, 500', phone: '(11) 88888-8888', rating: 4.8, reviews: 350, website: 'www.gym.com', status: 'contacted', priority: 'high', tags: ['Quente'], addedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const MAIOR_CIDADES: Record<string, string[]> = {
    'AC': ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó'],
    'AL': ['Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios', 'União dos Palmares'],
    'AM': ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari'],
    'AP': ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Porto Grande'],
    'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro'],
    'CE': ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral'],
    'DF': ['Brasília', 'Taguatinga', 'Ceilândia', 'Samambaia', 'Plano Piloto'],
    'ES': ['Serra', 'Vila Velha', 'Cariacica', 'Vitória', 'Cachoeiro de Itapemirim'],
    'GO': ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia'],
    'MA': ['São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias'],
    'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim'],
    'MS': ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã'],
    'MT': ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra'],
    'PA': ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas'],
    'PB': ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux'],
    'PE': ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina'],
    'PI': ['Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano'],
    'PR': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel'],
    'RJ': ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói'],
    'RN': ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba'],
    'RO': ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal'],
    'RR': ['Boa Vista', 'Rorainópolis', 'Caracaraí', 'Pacaraima', 'Cantá'],
    'RS': ['Porto Alegre', 'Caxias do Sul', 'Canoas', 'Pelotas', 'Santa Maria'],
    'SC': ['Joinville', 'Florianópolis', 'Blumenau', 'São José', 'Itajaí'],
    'SE': ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão'],
    'SP': ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André'],
    'TO': ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins']
};

export const CIDADES_SECUNDARIAS: Record<string, string[]> = {
    'AC': ['Epitaciolândia', 'Plácido de Castro', 'Xapuri', 'Porto Acre', 'Mâncio Lima'],
    'AL': ['Penedo', 'Coruripe', 'São Miguel dos Campos', 'Delmiro Gouveia', 'Marechal Deodoro'],
    'AM': ['Tefé', 'Tabatinga', 'Maués', 'Humaitá', 'Iranduba'],
    'AP': ['Mazagão', 'Tartarugalzinho', 'Ferreira Gomes', 'Vitória do Jari', 'Calçoene'],
    'BA': ['Itabuna', 'Ilhéus', 'Jequié', 'Teixeira de Freitas', 'Alagoinhas', 'Barreiras', 'Porto Seguro', 'Paulo Afonso', 'Eunápolis', 'Valença'],
    'CE': ['Crato', 'Itapipoca', 'Iguatu', 'Quixadá', 'Pacajus', 'Tianguá', 'Aquiraz', 'Quixeramobim', 'Russas', 'Crateús'],
    'DF': ['Gama', 'Brazlândia', 'Sobradinho', 'Planaltina', 'Paranoá', 'Núcleo Bandeirante', 'Recanto das Emas', 'Santa Maria'],
    'ES': ['Colatina', 'Linhares', 'São Mateus', 'Guarapari', 'Aracruz', 'Nova Venécia', 'Barra de São Francisco', 'Viana'],
    'GO': ['Trindade', 'Itumbiara', 'Catalão', 'Jataí', 'Formosa', 'Caldas Novas', 'Senador Canedo', 'Goianésia'],
    'MA': ['Açailândia', 'Balsas', 'Bacabal', 'Santa Inês', 'Pinheiro', 'Chapadinha', 'Baraúna', 'Itapecuru Mirim'],
    'MG': ['Montes Claros', 'Gov. Valadares', 'Ipatinga', 'Divinópolis', 'Poços de Caldas', 'Patos de Minas', 'Pouso Alegre', 'Varginha', 'Conselheiro Lafaiete', 'Itabira'],
    'MS': ['Naviraí', 'Nova Andradina', 'Aquidauana', 'Sidrolândia', 'Paranaíba', 'Coxim', 'Amambai', 'Rio Brilhante'],
    'MT': ['Cáceres', 'Sorriso', 'Lucas do Rio Verde', 'Primavera do Leste', 'Barra do Garças', 'Alta Floresta', 'Pontes e Lacerda', 'Nova Mutum'],
    'PA': ['Castanhal', 'Abaetetuba', 'Cametá', 'Bragança', 'Barcarena', 'Altamira', 'Tucuruí', 'Paragominas', 'Itaituba'],
    'PB': ['Sousa', 'Cajazeiras', 'Guarabira', 'Sapé', 'Mamanguape', 'Queimadas', 'Pombal', 'Catolé do Rocha'],
    'PE': ['Vitória de Santo Antão', 'Cabo de Santo Agostinho', 'Garanhuns', 'Serra Talhada', 'Goiana', 'Gravatá', 'Igarassu', 'Abreu e Lima'],
    'PI': ['Campo Maior', 'Esperantina', 'Altos', 'União', 'Oeiras', 'São Raimundo Nonato', 'José de Freitas', 'Piracuruca'],
    'PR': ['Foz do Iguaçu', 'Guarapuava', 'Paranaguá', 'Apucarana', 'Toledo', 'Campo Mourão', 'Arapongas', 'Umuarama', 'Cambé', 'Pato Branco', 'Pinhais', 'Araucária', 'Fazenda Rio Grande', 'Rolândia'],
    'RJ': ['Macaé', 'Petrópolis', 'Cabo Frio', 'Campos dos Goytacazes', 'Teresópolis', 'Volta Redonda', 'Resende', 'Angra dos Reis', 'Nova Friburgo', 'Barra Mansa'],
    'RN': ['Caicó', 'Currais Novos', 'Assu', 'Ceará-Mirim', 'Macau', 'Santa Cruz', 'Nova Cruz', 'Apodi'],
    'RO': ['Guajará-Mirim', 'Rolim de Moura', 'Pimenta Bueno', 'Jaru', 'Machadinho D\'Oeste', 'Buritis', 'Presidente Médici'],
    'RR': ['Mucajaí', 'Bonfim', 'Normandia', 'Amajari', 'Alto Alegre', 'Caroebe', 'São João da Baliza'],
    'RS': ['Passo Fundo', 'Rio Grande', 'Novo Hamburgo', 'São Leopoldo', 'Bento Gonçalves', 'Santa Cruz do Sul', 'Erechim', 'Gravataí', 'Viamão', 'Bagé'],
    'SC': ['Criciúma', 'Chapecó', 'Lages', 'Balneário Camboriú', 'Brusque', 'Tubarão', 'Jaraguá do Sul', 'Palhoça', 'Concórdia', 'Navegantes'],
    'SE': ['Estância', 'Tobias Barreto', 'Simão Dias', 'Propá', 'Capela', 'Itaporanga d\'Ajuda', 'Laranjeiras'],
    'SP': ['Ribeirão Preto', 'Sorocaba', 'São José dos Campos', 'Piracicaba', 'Bauru', 'Franca', 'Jundiaí', 'Presidente Prudente', 'Marília', 'Limeira', 'Araçatuba', 'Mogi das Cruzes', 'Santos', 'Diadema'],
    'TO': ['Colinas do Tocantins', 'Guaraí', 'Dianópolis', 'Taguatinga', 'Miracema do Tocantins', 'Formoso do Araguaia', 'Augustinópolis']
};

export const CAPITAL_NEIGHBORHOODS: Record<string, string[]> = {
    'AC': ['Bosque', 'Cerâmica', 'Capoeira', 'Estação Experimental', 'Inácio de Loyola', 'Isaura Parente', 'Manoel Julião'], // Rio Branco
    'AL': ['Ponta Verde', 'Jatiúca', 'Pajuçara', 'Farol', 'Mangabeiras', 'Serraria', 'Antares', 'Cruz das Almas'], // Maceió
    'AM': ['Adrianópolis', 'Vila Buriti', 'Nossa Senhora das Graças', 'Ponta Negra', 'Parque Dez de Novembro', 'Vieiralves', 'Flores'], // Amazon
    'AP': ['Centro', 'Trem', 'Laguinho', 'Beirol', 'Alvorada', 'Jardim Felicidade', 'Buritizal'], // Macapá
    'BA': ['Barra', 'Pituba', 'Caminho das Árvores', 'Rio Vermelho', 'Brotas', 'Cabula', 'Imbuí', 'Stella Maris', 'Itapuã', 'Graça', 'Ondina'], // Salvador
    'CE': ['Aldeota', 'Meireles', 'Cocó', 'Centro', 'Fátima', 'Dionísio Torres', 'Varjota', 'Papicu', 'Mucuripe', 'Praia de Iracema'], // Fortaleza
    'DF': ['Asa Sul', 'Asa Norte', 'Sudoeste', 'Águas Claras', 'Taguatinga', 'Guará', 'Lago Sul', 'Lago Norte', 'Cruzeiro', 'Sobradinho'], // Brasília/DF
    'ES': ['Praia do Canto', 'Jardim da Penha', 'Jardim Camburi', 'Enseada do Suá', 'Bento Ferreira', 'Santa Lúcia'], // Vitória
    'GO': ['Setor Bueno', 'Setor Marista', 'Setor Oeste', 'Setor Sul', 'Jardim Goiás', 'Setor Universitário', 'Setor Pedro Ludovico'], // Goiânia
    'MA': ['Ponta d\'Areia', 'Renascença', 'Calhau', 'Cohama', 'Olho d\'Água', 'São Francisco', 'Centro Histórico'], // São Luís
    'MG': ['Savassi', 'Lourdes', 'Anchieta', 'Sion', 'Buritis', 'Centro', 'Pampulha', 'Padre Eustáquio', 'Prado', 'Castelo', 'Sagrada Família', 'Belvedere'], // Belo Horizonte
    'MS': ['Centro', 'Chácara Cachoeira', 'Santa Fé', 'Carandá Bosque', 'Jardim dos Estados', 'Monte Castelo', 'Tiradentes'], // Campo Grande
    'MT': ['Bosque da Saúde', 'Goiabeiras', 'Jardim das Américas', 'Centro América', 'Duque de Caxias', 'Santa Rosa'], // Cuiabá
    'PA': ['Umarizal', 'Nazaré', 'Batista Campos', 'Reduto', 'Marco', 'Cremação', 'Campina'], // Belém
    'PB': ['Tambaú', 'Cabo Branco', 'Manaíra', 'Bessa', 'Altiplano', 'Miramar', 'Torre', 'Centro'], // João Pessoa
    'PE': ['Boa Viagem', 'Madalena', 'Espinheiro', 'Graças', 'Jaqueira', 'Derby', 'Imbiribeira', 'Casa Forte', 'Pina'], // Recife
    'PI': ['Jóquei', 'Fátima', 'Centro', 'Ininga', 'São Cristóvão', 'Horto', 'Ilhotas'], // Teresina
    'PR': ['Batel', 'Centro', 'Portão', 'Água Verde', 'Bigorrilho', 'Cabral', 'Cristo Rei', 'Santa Felicidade', 'Jardim Social'], // Curitiba
    'RJ': ['Copacabana', 'Ipanema', 'Barra da Tijuca', 'Botafogo', 'Flamengo', 'Leblon', 'Tijuca', 'Centro', 'Jacarepaguá', 'Campo Grande', 'Méier', 'Recreio'], // Rio de Janeiro
    'RN': ['Ponta Negra', 'Tirol', 'Petrópolis', 'Lagoa Nova', 'Capim Macio', 'Candelária'], // Natal
    'RO': ['Olaria', 'Pedrinhas', 'Nossa Senhora das Graças', 'São João Bosco', 'Centro', 'Embratel'], // Porto Velho
    'RR': ['Centro', 'Caçari', 'Paraviana', 'São Francisco', 'Aparecida', 'Aeroporto'], // Boa Vista
    'RS': ['Moinhos de Vento', 'Petrópolis', 'Centro Histórico', 'Menino Deus', 'Auxiliadora', 'Bela Vista', 'Bom Fim', 'Tristeza', 'Passo d\'Areia'], // Porto Alegre
    'SC': ['Centro', 'Trindade', 'Agronômica', 'Itacorubi', 'Coqueiros', 'Estreito', 'Santa Mônica', 'Jurerê Internacional'], // Florianópolis
    'SE': ['Treze de Julho', 'Jardins', 'Atalaia', 'Coroa do Meio', 'Grageru', 'Centro', 'Salgado Filho'], // Aracaju
    'SP': ['Pinheiros', 'Moema', 'Jardins', 'Vila Mariana', 'Perdizes', 'Tatuapé', 'Santana', 'Itaim Bibi', 'Santo Amaro', 'Bela Vista', 'Morumbi', 'Lapa', 'Brás', 'Liberdade', 'Butantã'], // São Paulo
    'TO': ['Plano Diretor Sul', 'Plano Diretor Norte', 'Arse', 'Arne', 'Taquaralto'] // Palmas
};

export const PLAN_CREDITS = {
    free: 60,
    start: 500,
    pro: 1100,
    elite: 3200
};

export const MOTIVATIONAL_QUOTES = [
    "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    "Acredite que você pode e você já está no meio do caminho.",
    "A persistência é o caminho do êxito.",
    "Não espere por oportunidades, crie-as.",
    "O seu único limite é a sua mente.",
    "Grandes jornadas começam com um único passo.",
    "Foque no progresso, não na perfeição.",
    "Venda o problema que você resolve, não o produto que você tem.",
    "Cada 'não' te aproxima do 'sim' que vai mudar o seu jogo.",
    "Consistência bate talento quando o talento não tem consistência.",
    "O melhor momento para começar foi ontem. O segundo melhor é agora.",
    "Sorte é o que acontece quando a preparação encontra a oportunidade.",
    "Não pare até se orgulhar.",
    "A disciplina é a ponte entre metas e conquistas.",
    "Seja o tipo de energia que você deseja atrair.",
    "O segredo de progredir é começar.",
    "Obstáculos são o que você vê quando tira os olhos do objetivo.",
    "Transforme seus leads em parceiros, e seus parceiros em advogados da marca.",
    "Vender é ajudar alguém a tomar uma decisão que vai melhorar a vida dela.",
    "Pare de vender. Comece a ajudar.",
    "O fracasso é apenas a oportunidade de recomeçar com mais inteligência.",
    "A excelência não é um ato, mas um hábito.",
    "Se você quer colher o que ninguém colhe, plante o que ninguém planta.",
    "Dificuldades preparam pessoas comuns para destinos extraordinários.",
    "Trabalhe duro em silêncio e deixe o sucesso ser o seu barulho.",
    "A única forma de chegar ao impossível é acreditar que é possível.",
    "Nada é tão gratificante quanto resolver um problema real para um cliente.",
    "Sucesso não é sobre quanto dinheiro você ganha, mas sobre a diferença que faz.",
    "Mire na lua. Mesmo que você erre, cairá entre as estrelas.",
    "Não é sobre ter tempo, é sobre prioridade.",
    "A motivação faz você começar. O hábito faz você continuar.",
    "Metas são sonhos com prazos.",
    "Seja mais forte que sua melhor desculpa.",
    "A maior glória não é nunca cair, mas levantar-se a cada queda.",
    "O que você faz hoje pode melhorar todos os seus amanhãs.",
    "Vencer a si mesmo é a maior das vitórias.",
    "Onde há vontade, há um caminho.",
    "Acreditar é a força que te permite subir os degraus mais altos.",
    "Pequenos passos todos os dias levam a grandes resultados.",
    "Não conte os dias, faça os dias contarem.",
    "O sucesso começa quando você decide sair da zona de conforto.",
    "Seja a mudança que você deseja ver no mercado.",
    "A resiliência é a arte de navegar em dias difíceis.",
    "Grandes conquistas exigem grandes sacrifícios.",
    "Nunca é tarde demais para ser quem você poderia ter sido.",
    "O conhecimento é poder, mas a execução é o que traz o lucro.",
    "Valorize o processo tanto quanto o resultado final.",
    "Dê o seu melhor, mesmo que ninguém esteja vendo.",
    "A confiança é contagiosa. Transmita-a para seus clientes.",
    "A curiosidade mata o medo. Aprenda algo novo hoje.",
    "O otimismo é a fé que leva à realização.",
    "Não busque ser melhor que os outros, busque ser melhor que ontem.",
    "A paciência é amarga, mas seu fruto é doce.",
    "Foque na solução, nunca no problema.",
    "Seja grato pelo que tem enquanto busca o que deseja.",
    "A coragem não é a ausência do medo, mas o triunfo sobre ele.",
    "Tudo o que você sempre quis está do outro lado do medo.",
    "A vida é 10% do que acontece com você e 90% de como você reage.",
    "Sonhe grande, execute rápido, erre barato.",
    "A inovação diferencia um líder de um seguidor.",
    "Não tente ser uma pessoa de sucesso, tente ser uma pessoa de valor.",
    "Se você não cuidar do seu cliente, seu concorrente cuidará.",
    "A melhor propaganda é um cliente satisfeito.",
    "O bom vendedor ouve 80% e fala 20%.",
    "Qualidade significa fazer certo quando ninguém está olhando.",
    "Liderança é a arte de dar às pessoas uma plataforma para o sucesso.",
    "Sem entusiasmo, nunca se realizou nada de grandioso.",
    "A criatividade é a inteligência se divertindo.",
    "O trabalho em equipe divide o esforço e multiplica os resultados.",
    "Seja um mestre na arte de perguntar, não na de afirmar.",
    "O sucesso é ir de fracasso em fracasso sem perder o entusiasmo.",
    "Ação é a chave fundamental para todo sucesso.",
    "Comece onde você está. Use o que você tem. Faça o que você pode.",
    "A jornada de mil milhas começa com um passo.",
    "Não se preocupe com falhas. Preocupe-se com as chances que perdeu.",
    "A única maneira de fazer um excelente trabalho é amar o que você faz.",
    "A janela de oportunidade é aberta pelo seu próprio esforço.",
    "O segredo do sucesso é a constância do propósito.",
    "Se você quer ser bem-sucedido, precisa ser apaixonado pelo seu negócio.",
    "Produtividade não é estar ocupado, é ser eficaz.",
    "O tempo é o recurso mais escasso; se não for gerido, nada mais pode ser.",
    "A melhor maneira de prever o futuro é criá-lo.",
    "Mudança é a lei da vida. Aqueles que olham apenas para o passado certamente perderão o futuro.",
    "Inteligência é a habilidade de se adaptar à mudança.",
    "Simplicidade é o último grau de sofisticação.",
    "O risco vem de não saber o que você está fazendo.",
    "Preço é o que você paga. Valor é o que você recebe.",
    "O investimento em conhecimento paga os melhores juros.",
    "Regra número 1: Nunca perca dinheiro. Regra número 2: Nunca esqueça a regra número 1.",
    "A prospecção é o oxigênio do seu negócio. Respire fundo hoje.",
    "Venda confiança, entregue resultados.",
    "Sua reputação vale mais que qualquer comissão."
];

export const INSTAGRAM_CATEGORIES = [
    "Artesanato e Produtos Manuais",
    "Arquitetura e Design",
    "Beleza e Estética",
    "Blogs de Estilo de Vida",
    "Cafeterias e Docerias",
    "Carros e Estética Automotiva",
    "Casamento e Noivas",
    "Coach e Desenvolvimento",
    "Comédia e Entretenimento",
    "Consultoria de Imagem",
    "Conteúdo Gamer",
    "Criação de Conteúdo e Influenciadores",
    "Decoração e Interiores",
    "Delivery de Comida",
    "Designer de Sobrancelhas",
    "E-commerce e Loja Online",
    "Educação e Cursos",
    "Empreendedorismo",
    "Energia Solar",
    "Esportes e Radicais",
    "Estúdios de Tatuagem e Piercing",
    "Eventos e Festas",
    "Fitness e Saúde",
    "Fotografia e Vídeo",
    "Gastronomia Artesanal",
    "Joias e Acessórios",
    "Livros e Literatura",
    "Maquiagem Artística",
    "Maquiadores Profissionais",
    "Advogados e Jurídico",
    "Marketing e Negócios",
    "Mercado Imobiliário",
    "Moda Íntima",
    "Moda Infantil",
    "Moda Masculina",
    "Moda Plus Size",
    "Moda Sustentável",
    "Moda e Estilo",
    "Nutrição e Dieta",
    "Odontologia Estética",
    "Paternidade e Maternidade",
    "Personal Trainer",
    "Pet Shops e Animais",
    "Podcasts",
    "Restaurantes e Gastronomia",
    "Sustentabilidade e Meio Ambiente",
    "Tecnologia e Inovação",
    "Turismo e Viagens",
    "Terapias Alternativas e Holísticas"
].sort();

export const LINKEDIN_CATEGORIES = [
    "Advogados e Escritórios",
    "Advocacia Tributária e Trabalhista",
    "Agtech e Inovação no Campo",
    "Agronegócio",
    "Análise de Dados e BI",
    "Auditoria e Compliance",
    "Bancos e Instituições Financeiras",
    "BPO e Terceirização de Serviços",
    "Cadeia de Suprimentos (Supply Chain)",
    "Comércio Exterior",
    "Consultoria de TI",
    "Consultoria e Estratégia",
    "Criptomoedas e Web3",
    "Customer Success (CS)",
    "Design e UX",
    "Direito Corporativo",
    "Direito e Jurídico",
    "Diversidade e Inclusão",
    "E-learning e EdTech",
    "Educação Corporativa",
    "Embalagens e Indústria",
    "Energia Solar",
    "Energias Renováveis",
    "Engenharia Civil e Construção",
    "Engenharia Mecânica",
    "Engenharia e Software",
    "ESG e Sustentabilidade",
    "Eventos Corporativos",
    "Fusões e Aquisições (M&A)",
    "Gestão de Projetos e Ágil",
    "Gestão de Saúde Mental Corporativa",
    "Gestão Pública e Governamental",
    "Headhunting e Recrutamento",
    "Imobiliário Corporate",
    "Indústria 4.0",
    "Institutos de Pesquisa e P&D",
    "Logística e Supply Chain",
    "Marketing B2B",
    "Marketing e Publicidade",
    "Mídia e Entretenimento",
    "Óleo e Gás",
    "Operações e Manufatura",
    "Pecuária e Medicina Veterinária",
    "Relações Públicas e Assessorias",
    "Recursos Humanos (RH)",
    "Saúde e Hospitalar",
    "Segurança da Informação e Cibersegurança",
    "Segurança do Trabalho",
    "Seguros e Finanças",
    "Telecomunicações",
    "Telemedicina e HealthTech",
    "Treinamento e Desenvolvimento (T&D)",
    "Varejo e E-commerce",
    "Vendas B2B e Inside Sales",
    "Vendas e Comercial"
].sort();

/**
 * Mapeamento de tradução para nichos guiados
 * Permite que o usuário selecione em PT-BR e a busca ocorra no idioma local
 */
export const NICHE_TRANSLATIONS: Record<string, { en: string, es: string }> = {
    "Advogados / Advocacia": { en: "Lawyers", es: "Abogados" },
    "Advogados e Jurídico": { en: "Lawyers and Legal", es: "Abogados y Jurídico" },
    "Advogados e Escritórios": { en: "Lawyers and Law Firms", es: "Abogados y Bufetes" },
    "Escritórios de Advocacia": { en: "Law Firms", es: "Bufetes de abogados" },
    "Clínicas Odontológicas": { en: "Dental Clinics", es: "Clínicas Dentais" },
    "Odontologia Estética": { en: "Cosmetic Dentistry", es: "Odontología Estética" },
    "Restaurantes e Bares": { en: "Restaurants and Bars", es: "Restaurantes y Bares" },
    "Academias": { en: "Gyms", es: "Gimnasios" },
    "Imobiliárias e Corretores": { en: "Real Estate Agencies", es: "Inmobiliarias" },
    "Agências de Marketing": { en: "Marketing Agencies", es: "Agencias de Marketing" },
    "Estética e Beleza": { en: "Beauty and Aesthetics", es: "Estética y Belleza" },
    "Beleza e Estética": { en: "Beauty and Aesthetics", es: "Estética y Belleza" },
    "Pet Shops": { en: "Pet Shops", es: "Tiendas de mascotas" },
    "Arquitetura e Design": { en: "Architecture and Design", es: "Arquitectura y Diseño" },
    "Energia Solar": { en: "Solar Energy", es: "Energía Solar" },
    "Engenharia": { en: "Engineering", es: "Ingeniería" },
    "Contabilidades": { en: "Accounting Firms", es: "Contabilidades" },
    "Escolas e Cursos": { en: "Schools and Courses", es: "Escuelas y Cursos" }
};

