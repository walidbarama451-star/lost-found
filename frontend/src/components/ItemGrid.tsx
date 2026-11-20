import type { ReactNode } from 'react';
import ItemCard from './ItemCard';
import type { PublicItem } from '../types';
import './ItemGrid.css';

interface ItemGridProps {
  items: PublicItem[];
  actionsFor?: (item: PublicItem) => ReactNode;
}

export default function ItemGrid({ items, actionsFor }: ItemGridProps) {
  return (
    <div className="item-grid">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} actions={actionsFor?.(item)} />
      ))}
    </div>
  );
}
