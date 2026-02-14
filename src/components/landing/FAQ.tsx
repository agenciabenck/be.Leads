import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { FAQItem } from '@/types/landing';

const faqs: FAQItem[] = [
  {
    question: "O Google pode bloquear meu IP?",
    answer: "Não. Utilizamos uma rede de proxies residenciais rotativos que simulam comportamento humano, garantindo 100% de segurança para sua conexão."
  },
  {
    question: "Os dados são atualizados?",
    answer: "Sim! A extração é feita em tempo real direto da base do Google Maps. Você recebe os dados que estão lá naquele exato momento."
  },
  {
    question: "Posso cancelar quando quiser?",
    answer: "Com certeza. Sem contratos de fidelidade. Você pode cancelar sua assinatura mensal a qualquer momento direto no painel."
  },
  {
    question: "Serve para qualquer país?",
    answer: "Sim, o Be.Leads funciona globalmente. Você pode extrair leads de qualquer cidade do mundo onde o Google Maps funcione."
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    // DARK SESSION: Reverted to Dark Glassmorphism
    <section className="py-12 md:py-20 px-6 bg-[#050508] border-t border-white/5 relative">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto max-w-3xl relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-xl mb-6">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          {/* Standardized Title Typography */}
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Perguntas <span className="text-gradient-primary">frequentes</span>
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