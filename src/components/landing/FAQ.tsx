import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { FAQItem } from '@/types/landing';

const faqs: FAQItem[] = [
  {
    question: "Como funcionam os créditos de prospecção?",
    answer: "Cada extração bem-sucedida de um lead (com os dados encontrados) consome um saldo da sua conta. Você ganha 60 créditos todos os meses no plano Gratuito para testar. Se precisar escalar, nossos planos premium oferecem até 3.200 créditos renovados mensalmente."
  },
  {
    question: "O BeLeadly substitui o meu CRM atual (Pipedrive, RD, Salesforce)?",
    answer: "Ele pode substituir perfeitamente para a fase de Outbound (Prospecção), graças ao nosso CRM Kanban visual e nativo. No entanto, se você já possui um CRM consolidado, pode exportar todos os leads enriquecidos para CSV ou Google Sheets em apenas um clique e integrá-los à sua ferramenta."
  },
  {
    question: "Quais canais de busca a plataforma utiliza?",
    answer: "Não nos limitamos a uma fonte. Nossa tecnologia extrai dados públicos e qualificados do Google Maps (foco em negócios locais), LinkedIn (foco em cargos e decisores corporativos) e Instagram (foco em nichos e engajamento)."
  },
  {
    question: "Existe algum contrato de fidelidade ou multa de cancelamento?",
    answer: "Não. O BeLeadly funciona no modelo de assinatura mensal. Você tem total liberdade para fazer upgrade, downgrade ou cancelar a sua assinatura a qualquer momento diretamente pelo seu painel, sem burocracia."
  },
  {
    question: "Minhas contas do Google, LinkedIn ou Instagram correm risco de bloqueio?",
    answer: "Zero risco. Você não precisa conectar suas contas pessoais ou empresariais na nossa plataforma para realizar as buscas. Nosso sistema opera na nuvem utilizando uma rede própria de proxies rotativos seguros para extrair os dados."
  },
  {
    question: "Os leads ficam visíveis para outros usuários da plataforma?",
    answer: "De forma alguma. A privacidade é nosso pilar. O BeLeadly possui uma arquitetura estrita de Isolamento de Dados (Data Isolation). Tudo o que você busca, os contatos que descobre e o seu funil no CRM são 100% privados e restritos apenas ao seu usuário."
  },
  {
    question: "Os dados fornecidos são legais e estão de acordo com a LGPD?",
    answer: "Sim, totalmente em conformidade. Nossa inteligência artificial pesquisa e organiza apenas dados corporativos (B2B) que já são públicos e estão disponíveis abertamente na internet. Não trabalhamos com compra de listas ocultas ou dados sensíveis."
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    // DARK SESSION: Reverted to Dark Glassmorphism
    <section id="faq" className="py-12 md:py-20 px-4 md:px-12 bg-[#050508] border-t border-white/5 relative">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto max-w-3xl relative z-10">
        <div className="text-left md:text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-xl mb-6">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          {/* Standardized Title Typography */}
          <h2 className="text-3xl sm:text-4xl lg:text-[50px] lg:leading-[1.15] font-bold text-white tracking-tight text-balance">
            Perguntas frequentes
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-white/10 rounded-2xl bg-[#0a0a0f] overflow-hidden hover:border-white/20 transition-all duration-300">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left group"
              >
                <span className={`font-medium text-lg transition-colors ${openIndex === idx ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                  {faq.question}
                </span>
                <div className={`p-1 rounded-full transition-colors ${openIndex === idx ? 'bg-primary/20 text-primary' : 'text-slate-500 bg-white/5 group-hover:bg-white/10'}`}>
                  {openIndex === idx ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
              </button>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 pt-0 text-slate-400 leading-relaxed border-t border-white/5 mt-2 text-base font-normal">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;