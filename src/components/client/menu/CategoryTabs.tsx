import { Category } from '@/types/menu';

interface CategoryTabsProps {
    categories: Category[];
    selectedCategory: string;
    onSelect: (id: string) => void;
}

export default function CategoryTabs({ categories, selectedCategory, onSelect }: CategoryTabsProps) {
    return (
        <div className="sticky top-16 bg-white z-10 shadow-sm border-t border-gray-100">
            <div className="max-w-2xl mx-auto overflow-x-auto no-scrollbar py-3 px-4 flex gap-2">
                <button
                    onClick={() => onSelect('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === 'all'
                            ? 'bg-black text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Todos
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onSelect(cat.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id
                                ? 'bg-black text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
