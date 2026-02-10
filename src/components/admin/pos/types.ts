export interface POSProduct {
    id: string;
    name: string;
    base_price: number;
    image_url?: string;
    category_id?: string;
    variants?: POSVariant[];
}

export interface POSVariant {
    id: string;
    name: string;
    price_modifier: number;
}

export interface CartItem {
    uuid: string;
    product: POSProduct;
    variant?: POSVariant;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes?: string;
    addons?: any;
}
