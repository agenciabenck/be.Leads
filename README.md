<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# be.leads - Gerador de Leads & CRM Inteligente

Plataforma completa para extração de leads comerciais via IA (Google Maps + Gemini) e gestão de pipeline de vendas.

## 🏗️ Estrutura Modular

O projeto segue uma arquitetura moderna organizada no diretório `src/`:

- **components/**: Componentes de UI reutilizáveis (Tabelas, Modais, Sidebar, Autenticação).
- **pages/**: Lógica modular de cada tela (Home/Dashboard, LeadExtractor, CRM Kanban, Subscription).
- **services/**: Camada de integração (Supabase DB/Auth, API Gemini, Stripe Payments).
- **types/** & **constants/**: Centralização de tipagem e configurações globais.

## 🚀 Desenvolvimento e Produção

### Rodar Localmente
1. Instale as dependências: `npm install`
2. Configure seu `.env` com as chaves do Supabase e Gemini.
3. Inicie o servidor: `npm run dev`

### Build & Deploy (Hostinger)
1. Para gerar a versão de produção: `npm run build`
2. O conteúdo da pasta `dist/` deve ser enviado para o servidor.
3. O arquivo `.htaccess` incluído na raiz garante que o roteamento Single Page Application (SPA) funcione corretamente em servidores Apache.

## 🛠️ Tecnologias
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide React.
- **Backend/BaaS**: Supabase (Auth, Postgres, Edge Functions).
- **IA**: Google Gemini Pro (Busca inteligente e filtragem).
- **Pagamentos**: Stripe Integration.
