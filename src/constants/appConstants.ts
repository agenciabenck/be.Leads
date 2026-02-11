export const COMMON_NICHES = [
    "Academias",
    "Agências de Marketing",
    "Agências de Viagens",
    "Autoescolas",
    "Buffets e Eventos",
    "Casas de Câmbio",
    "Clínicas Médicas",
    "Construtoras",
    "Contabilidades",
    "Dentistas",
    "Distribuidoras",
    "Empresas de TI",
    "Escolas e Cursos",
    "Escritórios de Advocacia",
    "Farmácias",
    "Gráficas",
    "Hotéis e Pousadas",
    "Imobiliárias",
    "Indústrias Metalúrgicas",
    "Joalherias",
    "Lavanderias",
    "Lojas de Móveis",
    "Lojas de Roupas",
    "Oficinas Mecânicas",
    "Pet Shops",
    "Restaurantes",
    "Salões de Beleza",
    "Supermercados"
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
    "Localizando as melhores oportunidades...",
    "Filtrando apenas empresas ativas...",
    "Validando números de telefone...",
    "Organizando resultados por relevância...",
    "Preparando sua próxima venda...",
    "IA analisando dados do Google Maps...",
    "Quase pronto para prospectar...",
    "Finalizando a extração estratégica..."
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

export const PLAN_CREDITS = {
    free: 60,
    start: 500,
    pro: 1200,
    elite: 3200
};


