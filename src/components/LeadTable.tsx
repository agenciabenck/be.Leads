import React, { useState } from 'react';
import { Lead, SortField, SortOrder, UserPlan } from '@/types/types';
import { Star, Globe, Phone, MapPin, AtSign, SearchX, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, MessageCircle, Instagram, Copy, Check, Plus, PlusCircle, Lock, Zap, Loader2, Users, Building, Mail, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { PLAN_HIERARCHY } from '@/constants/appConstants';

interface LeadTableProps {
  leads: Lead[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  isSearching: boolean;
  onAddToCRM: (lead: Lead) => void;
  savedLeadIds: string[];
  hasCRMAccess?: boolean;
  hasWhatsAppAccess?: boolean;
  searchSource?: 'maps' | 'instagram' | 'linkedin';
  onEnrichLead?: (lead: Lead) => void;
  enrichingIds?: Set<string>;
  failedEnrichmentAttempts?: Record<string, number>;
  plan?: 'free' | 'start' | 'pro' | 'elite';
}


export const LeadTable: React.FC<LeadTableProps> = React.memo(({ leads, sortField, sortOrder, onSort, isSearching, onAddToCRM, savedLeadIds, hasCRMAccess = true, hasWhatsAppAccess = true, searchSource = 'maps', onEnrichLead, enrichingIds, failedEnrichmentAttempts = {}, plan = 'free' }) => {

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-zinc-300 dark:text-zinc-600" />;
    return sortOrder === SortOrder.ASC
      ? <ArrowUp className="w-3.5 h-3.5 ml-1 text-primary-600 dark:text-primary-400" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1 text-primary-600 dark:text-primary-400" />;
  };

  const getWhatsAppLink = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length < 8) return null;
    const fullNumber = numbers.length <= 11 ? `55${numbers}` : numbers;
    return `https://wa.me/${fullNumber}`;
  };

  const ensureProtocol = (url: string) => {
    if (!url || url === 'N/A') return '';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const isInstagramLink = (url?: string) => {
    return url && url.toLowerCase().includes('instagram.com');
  };

  const getInstagramLink = (username?: string, website?: string) => {
    if (isInstagramLink(website)) return ensureProtocol(website!);
    if (!username || username === 'N/A') return null;
    return `https://instagram.com/${username.replace('@', '')}`;
  };

  const getLinkedInLink = (handle?: string) => {
    if (!handle || handle === 'N/A') return null;
    if (handle.startsWith('http')) return handle;
    return `https://linkedin.com/in/${handle}`;
  };

  if (isSearching && leads.length === 0) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Empresa', 'Reputação', 'Ações'].map((h, i) => (
                  <th key={i} className="px-6 py-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="bg-white dark:bg-app-cardDark rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <td className="px-6 py-5">
                    <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2"></div>
                  </td>
                  <td className="px-6 py-5"><div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-12"></div></td>
                  <td className="px-6 py-5"><div className="flex gap-2 justify-end"><div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div><div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div><div className="h-8 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-md"></div></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-app-cardDark rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center px-4 animate-fade-in-up transition-colors">
        <div className="bg-zinc-100 dark:bg-zinc-800 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <SearchX className="w-10 h-10 text-zinc-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">Aguardando resultados</h3>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md text-sm leading-relaxed">
          Sua lista de leads aparecerá aqui. Utilize a busca acima para encontrar empresas no Google Maps.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-900/50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors select-none" onClick={() => onSort(SortField.NAME)}>
                  <div className="flex items-center">Empresa {getSortIcon(SortField.NAME)}</div>
                </th>
                {searchSource === 'maps' && (
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors select-none" onClick={() => onSort(SortField.RATING)}>
                    <div className="flex items-center">Reputação {getSortIcon(SortField.RATING)}</div>
                  </th>
                )}
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {leads.map((lead, index) => {
                const isSaved = savedLeadIds.includes(lead.id);

                return (
                  <tr
                    key={lead.id}
                    className="bg-white dark:bg-app-cardDark hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >

                    {/* Coluna Nome e Endereço */}
                    <td className="px-6 py-4 align-top max-w-xs">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={ensureProtocol(lead.googleMapsLink || '')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base font-bold text-zinc-900 dark:text-zinc-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2 mb-1 truncate"
                            title="Abrir no Google Maps"
                          >
                            {lead.name}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary-400 flex-shrink-0" />
                          </a>
                        </div>

                        <div className="flex items-start text-xs text-zinc-500 dark:text-zinc-400 mt-1 group/addr cursor-pointer" onClick={() => handleCopy(lead.address, `addr-${lead.id}`)}>
                          {searchSource === 'maps' ? (
                            <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-zinc-400 dark:text-zinc-500 mt-0.5 group-hover/addr:text-primary-500 dark:group-hover/addr:text-primary-400 transition-colors" />
                          ) : (
                            <AtSign className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-zinc-400 dark:text-zinc-500 mt-0.5 group-hover/addr:text-primary-500 dark:group-hover/addr:text-primary-400 transition-colors" />
                          )}
                          <span className="leading-snug line-clamp-2 group-hover/addr:text-primary-600 dark:group-hover/addr:text-primary-300 transition-colors">{lead.address}</span>
                          {copiedId === `addr-${lead.id}` ? (
                            <Check className="w-3 h-3 ml-2 text-success-500 flex-shrink-0 animate-in fade-in zoom-in" />
                          ) : (
                            <Copy className="w-3 h-3 ml-2 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover/addr:opacity-100 transition-opacity hover:text-primary-500 dark:hover:text-primary-400 flex-shrink-0" />
                          )}
                        </div>
                        {/* Enriched data badges */}
                        {lead.cnpj && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800/40 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                              title="Clique para copiar CNPJ limpo"
                              onClick={(e) => {
                                e.stopPropagation();
                                const cleanedCnpj = lead.cnpj!.replace(/\D/g, '');
                                handleCopy(cleanedCnpj, `cnpj-${lead.id}`);
                                toast.success('CNPJ limpo copiado!');
                              }}
                            >
                              {copiedId === `cnpj-${lead.id}` ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-success-500" />
                                  <span>Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Building className="w-2.5 h-2.5" /> {lead.cnpj}
                                </>
                              )}
                            </span>

                            <button 
                              type="button"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 text-[9px] font-medium border border-zinc-200 dark:border-zinc-800 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                              title="Copiar CNPJ limpo e pesquisar no CNPJAberto"
                              onClick={(e) => {
                                e.stopPropagation();
                                const cleanedCnpj = lead.cnpj!.replace(/\D/g, '');
                                navigator.clipboard.writeText(cleanedCnpj);
                                toast.success('CNPJ copiado! Buscando no CNPJ Aberto...');
                                window.open('https://cnpjaberto.com.br/', '_blank');
                              }}
                            >
                              <span>CNPJ Aberto</span> <ExternalLink className="w-2 h-2" />
                            </button>

                            <button 
                              type="button"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 text-[9px] font-medium border border-zinc-200 dark:border-zinc-800 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                              title="Copiar CNPJ limpo e pesquisar no TeiaCNPJ"
                              onClick={(e) => {
                                e.stopPropagation();
                                const cleanedCnpj = lead.cnpj!.replace(/\D/g, '');
                                navigator.clipboard.writeText(cleanedCnpj);
                                toast.success('CNPJ copiado! Buscando no TeiaCNPJ...');
                                window.open('https://www.teiacnpj.com.br/', '_blank');
                              }}
                            >
                              <span>TeiaCNPJ</span> <ExternalLink className="w-2 h-2" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const promptText = `Você é um estrategista de vendas B2B e BDR Sênior especializado em prospecção. 
Seu objetivo é montar um guia de contexto rápido para auxiliar na abordagem comercial desta empresa.

Serviço que será ofertado nessa abordagem: Assessoria completa de marketing digital: geração de leads, estruturação do processo comercial e retenção de clientes, do primeiro contato até a recompra.

 — 

Empresa prospectada:

Nome: ${lead.name || 'N/A'}
Nicho: ${lead.category || 'N/A'}
CNPJ: ${lead.cnpj || 'N/A'}
Sócios: ${lead.socios && lead.socios.length > 0 ? lead.socios.join(', ') : 'N/A'}
Endereço: ${lead.address || 'N/A'}
Site: ${lead.website && lead.website !== 'N/A' ? lead.website : 'N/A'}
Instagram: ${lead.instagram || 'N/A'}

Faça uma pesquisa rápida na web para encontrar informações reais sobre a presença digital dessa empresa. Se encontrar site ou Instagram real, inclua o link. Não invente dados — se não encontrar, diga que não encontrou.

Gere exatamente este guia, nesta ordem, sempre considerando o serviço que será ofertado para personalizar o contexto, as lacunas e a abordagem:

---

1. CONTEXTO DA EMPRESA
O que essa empresa faz, em até 2 frases diretas. Se for profissional liberal (advogado, médico, dentista, corretor), descreve o perfil de atuação típico do segmento.

2. PRESENÇA DIGITAL ATUAL
O que foi encontrado: site, Instagram, Google Meu Negócio, avaliações. Se não tem presença, diga explicitamente. Não encha com suposições.

3. LACUNAS IDENTIFICADAS
2 pontos concretos onde essa empresa provavelmente tem oportunidade de melhoria — com base no segmento, no que foi encontrado e no Método AVR. Foco em: visibilidade, geração de leads previsível, processo de atendimento ou recorrência de clientes. Seja específico, não genérico.

4. PERGUNTAS DE DIAGNÓSTICO
2 perguntas curtas para fazer ao decisor no início da ligação. Objetivo: entender a situação atual dele antes de falar qualquer coisa sobre a Benck. Inspire-se em: "Como os seus clientes chegam até você hoje?" e "Você tem alguma ação ativa para gerar novos contatos toda semana?" — adapte conforme o segmento e as lacunas identificadas.

5. ABERTURA PARA LIGAÇÃO (30 segundos)
Frase de abertura direta, sem enrolação. Deve: identificar quem é, mencionar o segmento dele, e abrir com uma pergunta ou observação que gera curiosidade. Tom: consultivo, não de vendedor. Evite frases como "tenho uma proposta incrível".

6. MENSAGEM DE WHATSAPP
Mensagem curta (máximo 3 linhas). Deve parecer escrita por um humano, não por um robô. Objetivo: gerar uma resposta, não fechar venda. Sem emojis em excesso. Sem enrolação, Sem parecer algo genérico ou copia e cola. Pode ser uma cadência de até 3 mensagens. 

---

Formato final: tópicos curtos, sem texto longo, porém um conteúdo de valor. 
O BDR vai ler isso em 2 minutos antes de ligar.`;
                                navigator.clipboard.writeText(promptText);
                                toast.success('Contexto copiado! Abrindo ChatGPT...');
                                window.open('https://chatgpt.com/', '_blank');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm cursor-pointer active:scale-95"
                              title="Copiar informações do lead e abrir no ChatGPT para gerar abordagem comercial"
                            >
                              <Bot className="w-2.5 h-2.5 text-primary-500" />
                              <span>Gerar contexto</span>
                            </button>

                            {lead.socios && lead.socios.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/40" title={lead.socios.join(', ')}>
                                <Users className="w-2.5 h-2.5" /> {lead.socios.length} sócio(s)
                              </span>
                            )}
                            {lead.email && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800/40 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors" 
                                title={`Copiar e-mail: ${lead.email}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(lead.email!, `email-${lead.id}`);
                                }}
                              >
                                {copiedId === `email-${lead.id}` ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 text-success-500" />
                                    <span>Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Mail className="w-2.5 h-2.5" />
                                    <span className="truncate max-w-[150px]">{lead.email}</span>
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>




                    {/* Coluna Avaliação (Apenas para Maps) */}
                    {searchSource === 'maps' && (
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col items-start">
                          <div className="flex items-center bg-amber-50 dark:bg-amber-900/10 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-900/30">
                            <Star className={`w-3.5 h-3.5 mr-1.5 ${Number(lead.rating) > 0 ? 'text-amber-500 fill-amber-500' : 'text-zinc-300 dark:text-zinc-600'}`} />
                            <span className={`font-bold text-sm ${Number(lead.rating) > 0 ? 'text-amber-950 dark:text-amber-100' : 'text-zinc-400 dark:text-zinc-500'}`}>
                              {lead.rating !== 0 ? lead.rating : '-'}
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-1 ml-1 uppercase tracking-wide">
                            {lead.reviews} reviews
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Coluna Contato & Ações */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col items-end gap-3">

                        <div className="flex justify-end w-full">
                          {(lead.phone && lead.phone !== 'N/A') ? (
                            <div className="flex items-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 group/phone">
                              <Phone className="w-3 h-3 text-zinc-400 dark:text-zinc-500 mr-2" />
                              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 select-all whitespace-nowrap">{lead.phone}</span>
                              <button
                                onClick={() => handleCopy(lead.phone, `phone-${lead.id}`)}
                                className="ml-2 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                              >
                                {copiedId === `phone-${lead.id}` ? <Check className="w-3 h-3 text-success-600 dark:text-success-400" /> : <Copy className="w-3 h-3 text-zinc-300 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400" />}
                              </button>
                            </div>
                          ) : (searchSource === 'maps' && lead.website && lead.website !== 'N/A' && !isInstagramLink(lead.website)) ? (
                            <div className="flex items-center bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded px-2 py-1 group/web">
                              <Globe className="w-3 h-3 text-blue-400 dark:text-blue-500 mr-2" />
                              <a
                                href={ensureProtocol(lead.website)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-bold text-blue-700 dark:text-blue-400 truncate max-w-[150px] hover:underline"
                                title={lead.website}
                              >
                                {lead.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}
                              </a>
                            </div>
                          ) : searchSource === 'maps' ? (
                            <span className="text-xs text-zinc-300 dark:text-zinc-600 italic flex items-center pr-2">
                              <Phone className="w-3 h-3 mr-2 opacity-50" /> N/A
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2 justify-end flex-wrap">

                          {/* WhatsApp - Disponível se houver telefone */}
                          {lead.phone && lead.phone !== 'N/A' && (
                            hasWhatsAppAccess ? (
                              <a
                                href={getWhatsAppLink(lead.phone) || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center w-8 h-8 bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 rounded hover:bg-success-600 hover:text-white dark:hover:bg-success-500 dark:hover:text-white transition-all shadow-sm border border-success-200 dark:border-success-800/50 hover:border-success-600"
                                title="Conversar no WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            ) : (
                              <button
                                className="flex items-center justify-center w-8 h-8 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded cursor-not-allowed border border-zinc-200 dark:border-zinc-700"
                                title="Disponível no plano Start ou superior"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}

                          {/* Ícone Website - Fica opaco ou clicável dependendo dos dados */}
                          {lead.website && lead.website !== 'N/A' && !isInstagramLink(lead.website) ? (
                            <a
                              href={ensureProtocol(lead.website)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-8 h-8 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-sm border border-blue-200 dark:border-blue-800/50 hover:border-blue-600"
                              title={`Visitar: ${lead.website}`}
                            >
                              <Globe className="w-4 h-4" />
                            </a>
                          ) : (
                            <div
                              className="flex items-center justify-center w-8 h-8 bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 rounded border border-zinc-200 dark:border-zinc-700 cursor-not-allowed"
                              title="Website não encontrado"
                            >
                              <Globe className="w-4 h-4 opacity-50" />
                            </div>
                          )}

                          {/* Ícone Instagram */}
                          {getInstagramLink(lead.instagram, lead.website) ? (
                            <a
                              href={getInstagramLink(lead.instagram, lead.website)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-8 h-8 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded hover:bg-pink-600 hover:text-white dark:hover:bg-pink-500 dark:hover:text-white transition-all shadow-sm border border-pink-200 dark:border-pink-800/50 hover:border-pink-600"
                              title="Abrir Instagram"
                            >
                              <Instagram className="w-4 h-4" />
                            </a>
                          ) : (
                            <div
                              className="flex items-center justify-center w-8 h-8 bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 rounded border border-zinc-200 dark:border-zinc-700 cursor-not-allowed"
                              title="Instagram não encontrado"
                            >
                              <Instagram className="w-4 h-4 opacity-50" />
                            </div>
                          )}

                          {/* Ícone LinkedIn */}
                          {getLinkedInLink(lead.linkedin) ? (
                            <a
                              href={getLinkedInLink(lead.linkedin)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-8 h-8 bg-[#f0f7fe] dark:bg-[#0a66c2]/10 text-[#0a66c2] dark:text-[#70b5f9] rounded hover:bg-[#0a66c2] hover:text-white dark:hover:bg-[#0a66c2] dark:hover:text-white transition-all shadow-sm border border-[#0a66c2]/20 dark:border-[#0a66c2]/30 hover:border-[#0a66c2]"
                              title="Abrir LinkedIn"
                            >
                              <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z" /></svg>
                            </a>
                          ) : (
                            <div
                              className="flex items-center justify-center w-8 h-8 bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 rounded border border-zinc-200 dark:border-zinc-700 cursor-not-allowed"
                              title="LinkedIn não encontrado"
                            >
                              <svg className="w-4 h-4 fill-current opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z" /></svg>
                            </div>
                          )}

                        </div>

                        {/* Linha 3: Botões CRM + Enriquecer */}
                        <div className="flex justify-end items-center gap-2 w-full mt-1">

                          {/* Enriquecer button (maps only) */}
                          {searchSource === 'maps' && onEnrichLead && (
                            lead.cnpj ? (
                              <span
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 cursor-default"
                                title="Lead já enriquecido"
                              >
                                <Zap className="w-3 h-3 fill-current" />
                                Enriquecido
                              </span>
                            ) : enrichingIds?.has(lead.id) ? (
                              <span className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Buscando...
                              </span>
                            ) : failedEnrichmentAttempts && failedEnrichmentAttempts[lead.id] >= 2 ? (
                              <button
                                disabled={true}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-800/50 cursor-not-allowed"
                                title="Enriquecimento não encontrado após várias tentativas"
                              >
                                <SearchX className="w-3.5 h-3.5 text-zinc-400" /> Não encontrado
                              </button>
                            ) : failedEnrichmentAttempts && failedEnrichmentAttempts[lead.id] > 0 ? (
                              <button
                                onClick={() => onEnrichLead(lead)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-400 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all active:scale-95 shadow-sm animate-pulse"
                                title="Falhou na primeira tentativa. Tente novamente!"
                              >
                                <Zap className="w-3.5 h-3.5" /> Tentar novamente
                              </button>
                            ) : (
                              <button
                                onClick={() => onEnrichLead(lead)}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-bold transition-all active:scale-95 shadow-sm ${
                                  PLAN_HIERARCHY[plan] < PLAN_HIERARCHY.pro
                                    ? 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700/60'
                                    : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/50 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                                }`}
                                title={
                                  PLAN_HIERARCHY[plan] < PLAN_HIERARCHY.pro
                                    ? "Disponível a partir do plano Pro"
                                    : "Enriquecer com CNPJ, e-mail e sócios (1 crédito)"
                                }
                              >
                                {PLAN_HIERARCHY[plan] < PLAN_HIERARCHY.pro ? (
                                  <Lock className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                                ) : (
                                  <Zap className="w-3 h-3" />
                                )} Enriquecer
                              </button>
                            )
                          )}

                          <button
                            onClick={() => !isSaved && onAddToCRM(lead)}
                            disabled={isSaved}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all border ${isSaved
                              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 cursor-default'
                              : hasCRMAccess
                                ? 'bg-primary-600 hover:bg-primary-700 text-white border-transparent shadow-sm shadow-primary-500/20 active:scale-95'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-transparent cursor-not-allowed hover:bg-zinc-300 dark:hover:bg-zinc-700'
                              }`}
                            title={isSaved ? "Já adicionado ao CRM" : (!hasCRMAccess ? "Exclusivo Planos Pro e Elite" : "Adicionar ao CRM")}
                          >
                            {isSaved ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Salvo</span>
                              </>
                            ) : (
                              <>
                                {hasCRMAccess ? <PlusCircle className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                <span>CRM</span>
                              </>
                            )}
                          </button>
                        </div>


                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-between items-center px-2 pt-2 text-xs text-zinc-400 dark:text-zinc-600 font-medium">
        <span>Mostrando {leads.length} resultados</span>
        <span>Fonte: {searchSource === 'instagram' ? 'Instagram' : searchSource === 'linkedin' ? 'LinkedIn' : 'Google Maps'}</span>
      </div>
    </div >
  );
});