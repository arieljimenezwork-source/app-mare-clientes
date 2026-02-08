import { Product, Category } from '../types/menu';

export const CATEGORIES: Category[] = [
    { id: 'coffee', name: 'Café de Especialidad' },
    { id: 'bakery', name: 'Pastelería' },
    { id: 'brunch', name: 'Brunch' },
    { id: 'drinks', name: 'Bebidas Frías' },
];

export const PRODUCTS: Product[] = [
    {
        id: '1',
        name: 'Espresso Doble',
        description: 'Intenso y concentrado, con notas de chocolate amargo.',
        price: 3500,
        image: '/images/espresso.jpg',
        category: 'coffee',
        attributes: {
            origin: 'Colombia - Huila',
            tastingNotes: ['Cacao', 'Nuez', 'Caramelo'],
            sizes: ['60ml'],
        },
    },
    {
        id: '2',
        name: 'Cappuccino Italiano',
        description: 'Espresso, leche vaporizada y espuma de leche en partes iguales.',
        price: 4500,
        image: '/images/cappuccino.jpg',
        category: 'coffee',
        attributes: {
            origin: 'Blend de la Casa',
            tastingNotes: ['Suave', 'Cremoso'],
            allergens: ['Lácteos'],
            sizes: ['240ml'],
        },
    },
    {
        id: '3',
        name: 'Latte Vainilla',
        description: 'Espresso con leche texturizada y un toque de jarabe de vainilla artesanal.',
        price: 5200,
        image: '/images/latte.jpg',
        category: 'coffee',
        attributes: {
            origin: 'Brasil - Cerrado',
            tastingNotes: ['Dulce', 'Aromatizado'],
            allergens: ['Lácteos'],
            sizes: ['300ml'],
        },
    },
    {
        id: '4',
        name: 'Croissant de Almendras',
        description: 'Masa madre hojaldrada, relleno de crema de almendras y decorado con almendras fileteadas.',
        price: 3800,
        image: '/images/croissant.jpg',
        category: 'bakery',
        attributes: {
            allergens: ['Gluten', 'Lácteos', 'Frutos Secos'],
        },
    },
    {
        id: '5',
        name: 'Tostada de Aguacate',
        description: 'Pan de masa madre, aguacate triturado, huevo pochado y semillas.',
        price: 7500,
        image: '/images/avocado-toast.jpg',
        category: 'brunch',
        attributes: {
            allergens: ['Gluten', 'Huevo'],
        },
    },
    {
        id: '6',
        name: 'Cold Brew',
        description: 'Maceración en frío por 18 horas. Notas frutales y baja acidez.',
        price: 4800,
        image: '/images/cold-brew.jpg',
        category: 'drinks',
        attributes: {
            origin: 'Etiopía - Yirgacheffe',
            tastingNotes: ['Floral', 'Cítrico', 'Miel'],
            sizes: ['350ml'],
        },
    },
];
