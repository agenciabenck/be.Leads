
import { Lead } from '@/types/types';

export const cnpjService = {
    async fetchByCnpj(cnpj: string): Promise<Lead | null> {
        const cleanCnpj = cnpj.replace(/\D/g, '');
        if (cleanCnpj.length !== 14) return null;

        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
            if (!response.ok) return null;

            const data = await response.json();

            return {
                id: `cnpj-${data.cnpj}`,
                name: data.nome_fantasia || data.razao_social,
                category: data.cnae_fiscal_descricao || 'Empresa',
                address: `${data.logradouro}, ${data.numero}${data.complemento ? ' - ' + data.complemento : ''}, ${data.bairro}, ${data.municipio} - ${data.uf}, ${data.cep}`,
                rating: 0,
                reviews: 0,
                phone: data.ddd_telefone_1 || 'N/A',
                website: 'N/A',
                instagram: 'N/A',
                googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.razao_social + ' ' + data.municipio)}`
            };
        } catch (error) {
            console.error('Error fetching CNPJ:', error);
            return null;
        }
    }
};
