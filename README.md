<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# be.Leads - Gerador de Leads & CRM Inteligente

Plataforma completa para extração de leads comerciais via IA (Google Maps + Gemini) e gestão de pipeline de vendas com autenticação segura e isolamento de dados por usuário.

## ✨ Funcionalidades Principais

### 🔍 Extração de Leads Inteligente
- Busca automatizada via Google Maps API e IA Gemini
- Filtros avançados (rating mínimo, telefone obrigatório, quantidade)
- Modo guiado com seleção de nicho, estado e cidade
- Histórico de buscas para evitar duplicatas

### 📊 CRM Kanban Completo
- Pipeline visual (Prospecting → Contacted → Negotiation → Won/Lost)
- Gestão de valor potencial e prioridades
- Tags personalizadas e notas por lead
- Meta mensal com tracking de progresso

### 📅 Calendário de Compromissos
- Agendamento de reuniões e follow-ups
- Visualização mensal com eventos destacados
- Integração com pipeline de vendas

### 🔐 Autenticação & Isolamento de Dados
- Login seguro via Supabase Auth (email/senha)
- **Isolamento completo de dados por usuário**
- Cada cliente tem seus próprios leads, configurações e eventos
- Persistência local com sincronização por user.id

### 💳 Sistema de Assinaturas
- Planos: Free, Start, Pro, Elite
- Integração com Stripe para pagamentos
- Controle de créditos e funcionalidades por plano

## 🏗️ Arquitetura

### Estrutura de Diretórios (`src/`)

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Auth.tsx        # Tela de autenticação
│   ├── Sidebar.tsx     # Menu lateral
│   ├── LeadTable.tsx   # Tabela de leads
│   └── KanbanBoard.tsx # Board CRM
├── pages/              # Páginas principais
│   ├── Home.tsx        # Dashboard
│   ├── LeadExtractor.tsx
│   ├── CRM.tsx
│   ├── Subscription.tsx
│   └── Settings.tsx
├── services/           # Integrações externas
│   ├── supabase.ts     # Cliente Supabase
│   ├── gemini.ts       # API Gemini
│   ├── payment.ts      # Stripe
│   └── googleMapsService.ts
├── utils/              # Utilitários
│   └── storageUtils.ts # Storage isolado por usuário
├── types/              # TypeScript types
└── constants/          # Configurações globais
```

### Isolamento de Dados

Cada usuário tem seus dados armazenados com chaves únicas:
```typescript
// Exemplo de chaves no localStorage
beleads_{userId}_settings   // Configurações do usuário
beleads_{userId}_crm        // Leads do CRM
beleads_{userId}_calendar   // Eventos do calendário
beleads_{userId}_history    // Histórico de buscas
```

**Benefícios:**
- ✅ Múltiplos usuários no mesmo navegador sem conflito
- ✅ Dados isolados e seguros
- ✅ Reset automático ao fazer logout

## 🚀 Desenvolvimento

### Pré-requisitos
- Node.js 18+
- Conta Supabase (Auth + Database)
- API Key do Google Gemini
- Conta Stripe (para pagamentos)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/agenciabenck/be.Leads.git
cd be.Leads
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env.local` baseado no `.env.example`:
```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon
VITE_API_KEY=sua_api_key_gemini
VITE_STRIPE_PUBLIC_KEY=sua_chave_publica_stripe
VITE_STRIPE_SECRET_KEY=sua_chave_secreta_stripe
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

Acesse: `http://localhost:5173`

### Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão em `dist/`.

## 🌐 Deploy (Hostinger)

1. **Build do projeto**
```bash
npm run build
```

2. **Upload dos arquivos**
- Envie todo o conteúdo da pasta `dist/` para o servidor
- Certifique-se de que o arquivo `.htaccess` está presente na raiz

3. **Configuração do .htaccess**

O arquivo `.htaccess` incluído garante o roteamento SPA:
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend/BaaS
- **Supabase** - Auth, Database, Edge Functions
- **PostgreSQL** - Database (via Supabase)

### Integrações
- **Google Gemini Pro** - IA para busca inteligente
- **Google Maps API** - Extração de dados comerciais
- **Stripe** - Processamento de pagamentos

## 📝 Changelog Recente

### [2026-02-10] - Refinamento de UI e Lógica de Planos
- ✅ **Lógica de Plano Anual**: Seleção de ciclo anual persiste corretamente e bloqueia visualmente a troca para mensal.
- ✅ **Banner Promocional**: Feedback visual imediato ("Desconto aplicado") ao selecionar plano anual.
- ✅ **Refinamento Visual**: Títulos padronizados com `tracking-tighter` e tamanho `text-4xl`.
- ✅ **UX de Upgrade**: Botões de upgrade substituídos por badges clicáveis ("Você está no topo!") para usuários Pro/Elite na Home e Sidebar.
- ✅ **Plano Free**: Removida opção de "mudar para anual" para plano gratuito.

### [2026-02-08] - Isolamento de Dados por Usuário
- ✅ Implementado storage isolado por `user.id`
- ✅ Criado `storageUtils.ts` para gerenciar localStorage
- ✅ Refatorado `App.tsx` para carregar dados específicos após login
- ✅ Adicionado reset de estados ao fazer logout
- ✅ Resolvido problema de compartilhamento de dados entre usuários

### Commits Anteriores
- Autenticação com Supabase
- Sistema de assinaturas com Stripe
- CRM Kanban com drag-and-drop
- Extração de leads via IA

## 🔒 Segurança

- ✅ Autenticação via Supabase Auth
- ✅ Isolamento de dados por usuário
- ✅ Variáveis de ambiente para chaves sensíveis
- ✅ Reset de dados ao fazer logout
- ⚠️ localStorage não é criptografado (dados acessíveis via DevTools)

**Recomendação para produção:** Migrar dados sensíveis para Supabase Database com Row Level Security (RLS).

## 📄 Licença

Propriedade da Agência Benck. Todos os direitos reservados.

## 🤝 Suporte

Para dúvidas ou suporte, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ pela [Agência Benck](https://agenciabenck.com.br)**
