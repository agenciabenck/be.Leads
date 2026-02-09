import React, { useState } from 'react';
import { Lead, SortField, SortOrder } from '@/types/types';
import { Star, Globe, Phone, MapPin, SearchX, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, MessageCircle, Instagram, Copy, Check, Plus, Lock } from 'lucide-react';

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
}

export const LeadTable: React.FC<LeadTableProps> = ({ leads, sortField, sortOrder, onSort, isSearching, onAddToCRM, savedLeadIds, hasCRMAccess = true, hasWhatsAppAccess = true }) => {
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

  if (isSearching) {
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
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors select-none" onClick={() => onSort(SortField.RATING)}>
                  <div className="flex items-center">Reputação {getSortIcon(SortField.RATING)}</div>
                </th>
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
                          <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-zinc-400 dark:text-zinc-500 mt-0.5 group-hover/addr:text-primary-500 dark:group-hover/addr:text-primary-400 transition-colors" />
                          <span className="leading-snug line-clamp-2 group-hover/addr:text-primary-600 dark:group-hover/addr:text-primary-300 transition-colors">{lead.address}</span>
                          {copiedId === `addr-${lead.id}` ? (
                            <Check className="w-3 h-3 ml-2 text-success-500 flex-shrink-0 animate-in fade-in zoom-in" />
                          ) : (
                            <Copy className="w-3 h-3 ml-2 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover/addr:opacity-100 transition-opacity hover:text-primary-500 dark:hover:text-primary-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </td>



                    {/* Coluna Avaliação */}
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

                    {/* Coluna Contato & Ações */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col items-end gap-3">

                        <div className="flex items-center gap-2 justify-end">
                          {lead.phone && lead.phone !== 'N/A' ? (
                            <>
                              <div className="flex items-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 group/phone">
                                <Phone className="w-3 h-3 text-zinc-400 dark:text-zinc-500 mr-2" />
                                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 select-all">{lead.phone}</span>
                                <button
                                  onClick={() => handleCopy(lead.phone, `phone-${lead.id}`)}
                                  className="ml-2 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                                >
                                  {copiedId === `phone-${lead.id}` ? <Check className="w-3 h-3 text-success-600 dark:text-success-400" /> : <Copy className="w-3 h-3 text-zinc-300 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400" />}
                                </button>
                              </div>

                              {hasWhatsAppAccess ? (
                                <a
                                  href={getWhatsAppLink(lead.phone) || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center w-7 h-7 bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 rounded hover:bg-success-600 hover:text-white dark:hover:bg-success-500 dark:hover:text-white transition-all shadow-sm border border-success-200 dark:border-success-800/50 hover:border-success-600"
                                  title="Conversar no WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </a>
                              ) : (
                                <button
                                  className="flex items-center justify-center w-7 h-7 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded cursor-not-allowed border border-zinc-200 dark:border-zinc-700"
                                  title="Disponível no plano Start ou superior"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-zinc-300 dark:text-zinc-600 italic flex items-center pr-2">
                              <Phone className="w-3 h-3 mr-2 opacity-50" /> N/A
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 justify-end flex-wrap">

                          {/* Ícone Website - Sempre visível */}
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
                              title="Não encontrado nas informações da busca"
                            >
                              <Globe className="w-4 h-4" />
                            </div>
                          )}

                          {/* Ícone Instagram - Sempre visível */}
                          {((lead.instagram && lead.instagram !== 'N/A') || isInstagramLink(lead.website)) ? (
                            <a
                              href={ensureProtocol((lead.instagram && lead.instagram !== 'N/A') ? lead.instagram : lead.website || '')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-8 h-8 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded hover:bg-pink-600 hover:text-white dark:hover:bg-pink-500 dark:hover:text-white transition-all shadow-sm border border-pink-200 dark:border-pink-800/50 hover:border-pink-600"
                              title="Instagram"
                            >
                              <Instagram className="w-4 h-4" />
                            </a>
                          ) : (
                            <div
                              className="flex items-center justify-center w-8 h-8 bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 rounded border border-zinc-200 dark:border-zinc-700 cursor-not-allowed"
                              title="Não encontrado nas informações da busca"
                            >
                              <Instagram className="w-4 h-4" />
                            </div>
                          )}

                          {/* Botão CRM */}
                          <button
                            onClick={() => !isSaved && onAddToCRM(lead)}
                            disabled={isSaved}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all border ${isSaved
                              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 cursor-default'
                              : hasCRMAccess
                                ? 'bg-success-600 hover:bg-success-700 text-white border-transparent shadow-sm shadow-success-500/20 active:scale-95'
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
                                {hasCRMAccess ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
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
        <span>Fonte: Google Maps</span>
      </div>
    </div>
  );
};