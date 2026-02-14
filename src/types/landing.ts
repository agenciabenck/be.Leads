export interface PricingTier {
    name: string;
    priceMonthly: number;
    priceAnnual: number;
    description: string;
    features: string[];
    stripeIdMonthly: string;
    stripeIdAnnual: string;
    highlight?: boolean;
    buttonText?: string;
}

export interface Testimonial {
    id: number;
    name: string;
    role: string;
    image: string;
    content: string;
    rating: number;
}

export interface FAQItem {
    question: string;
    answer: string;
}
