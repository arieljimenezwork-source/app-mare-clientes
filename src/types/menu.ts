export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    attributes?: {
        origin?: string;
        tastingNotes?: string[];
        allergens?: string[];
        sizes?: string[];
    };
}

export interface Category {
    id: string;
    name: string;
}
