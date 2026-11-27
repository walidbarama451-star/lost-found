import type { ReactNode } from 'react';
import type { PublicItem } from '@/shared/api/types';
import { ItemCard } from './ItemCard';

interface ItemGridProps {
  items: PublicItem[];
  actionsFor?: (item: PublicItem) => ReactNode;
}

export const ItemGrid = ({ items, actionsFor }: ItemGridProps): ReactNode => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {items.map((item) => (
      <ItemCard key={item.id} item={item} actions={actionsFor?.(item)} />
    ))}
  </div>
);
