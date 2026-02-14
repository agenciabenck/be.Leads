import React, { useState } from 'react';
import Modal from './ui/Modal';

const Footer: React.FC = () => {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
      <footer className="bg-[#020203] border-t border-white/10 py-10 px-6 relative z-30">
        <div className="container mx-auto max-w-7xl flex flex-col items-center gap-6">
          
          {/* Logo & Credits */}
          <div className="flex flex-col items-center gap-3">
            <img 
              src="https://i.postimg.cc/ZKTLpRxM/logo-beleads-h1-1.png" 
              alt="Be.Leads" 
              className="h-10 md:h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
            />
            <p className="text-xs text-slate-500 font-medium">Criado por Agência Benck</p>
          </div>
          
          {/* Legal Links */}
          <div className="flex gap-6 text-sm text-slate-400 font-normal">
              <button 
                onClick={() => setShowTerms(true)} 
                className="hover:text-white transition-colors hover:underline underline-offset-4"
              >
                Termos de Uso
              </button>
              <button 
                onClick={() => setShowPrivacy(true)} 
                className="hover:text-white transition-colors hover:underline underline-offset-4"
              >
                Privacidade
              </button>
          </div>
        </div>
        
        {/* Legal Text & Copyright */}
        <div className="container mx-auto max-w-4xl mt-8 pt-6 border-t border-white/5 flex flex-col items-center text-center gap-4">
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl font-normal">
                O Be.Leads é uma ferramenta independente de automação e inteligência de dados. Não possuímos afiliação, parceria ou endosso do Google Inc. ou Google Maps. Todas as marcas registradas mencionadas pertencem aos seus respectivos proprietários. O uso desta ferramenta deve estar em conformidade com as leis locais de proteção de dados.
            </p>
            <p className="text-slate-500 text-xs font-normal">© 2026 Be.Leads Inc. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* --- MODALS --- */}

      {/* Termos de Uso */}
      <Modal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Termos de Uso">
        <p className="font-normal"><strong>Última atualização: Janeiro de 2026</strong></p>
        <p className="font-normal">Bem-vindo ao Be.Leads. Ao acessar nossa plataforma, você concorda com estes termos.</p>
        
        <h4 className="text-white font-bold mt-4">1. Uso Aceitável</h4>
        <p className="font-normal">Você concorda em usar nossa ferramenta apenas para fins legais e comerciais legítimos. É estritamente proibido usar os dados extraídos para spam, assédio ou qualquer atividade que viole as leis de proteção de dados vigentes (como LGPD e GDPR).</p>

        <h4 className="text-white font-bold mt-4">2. Licença de Software</h4>
        <p className="font-normal">Concedemos a você uma licença limitada, não exclusiva e revogável para usar o software Be.Leads conforme seu plano de assinatura. A engenharia reversa, redistribuição ou revenda do software é proibida.</p>

        <h4 className="text-white font-bold mt-4">3. Responsabilidade sobre Dados</h4>
        <p className="font-normal">O Be.Leads atua como um facilitador de busca de dados públicos. Não somos responsáveis pela precisão, atualidade ou qualidade dos dados encontrados no Google Maps, nem pelo uso que você fará deles.</p>

        <h4 className="text-white font-bold mt-4">4. Cancelamento</h4>
        <p className="font-normal">Você pode cancelar sua assinatura a qualquer momento. O acesso permanecerá ativo até o fim do ciclo de faturamento pago.</p>
      </Modal>

      {/* Política de Privacidade */}
      <Modal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Política de Privacidade">
        <p className="font-normal"><strong>Vigência: 2026</strong></p>
        <p className="font-normal">Sua privacidade é nossa prioridade. Esta política descreve como tratamos seus dados.</p>

        <h4 className="text-white font-bold mt-4">1. Coleta de Dados</h4>
        <p className="font-normal">Coletamos apenas as informações necessárias para o funcionamento da sua conta (nome, e-mail e dados de pagamento via processador seguro). Não armazenamos os dados dos seus cartões de crédito.</p>

        <h4 className="text-white font-bold mt-4">2. Dados Extraídos</h4>
        <p className="font-normal">Os leads que você extrai através da nossa ferramenta são processados de forma privada. Nós não vendemos, compartilhamos ou utilizamos as suas listas de leads extraídas. Elas pertencem exclusivamente a você.</p>

        <h4 className="text-white font-bold mt-4">3. Cookies e Rastreamento</h4>
        <p className="font-normal">Utilizamos cookies essenciais para manter sua sessão ativa e ferramentas de análise anônima para melhorar a performance da plataforma.</p>

        <h4 className="text-white font-bold mt-4">4. Segurança</h4>
        <p className="font-normal">Implementamos criptografia de ponta a ponta e seguimos os padrões da indústria para proteger suas credenciais e informações de conta.</p>
      </Modal>
    </>
  );
};

export default Footer;