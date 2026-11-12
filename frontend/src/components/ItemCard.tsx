import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { resolveImageUrl } from '../lib/api';
import type { PublicItem } from '../types';
import StatusBadge from './StatusBadge';
import './ItemCard.css';

interface ItemCardProps {
  item: PublicItem;
  /** Optional row of owner actions rendered in the card footer. */
  actions?: ReactNode;
}

/** Browse card: strong photo and clear status. */
export default function ItemCard({ item, actions }: ItemCardProps) {
  const cover = item.images[0]?.url ?? null;
  const src = resolveImageUrl(cover);

  return (
    <article className="item-card">
      <Link to={`/items/${item.id}`} className="item-card__media" tabIndex={-1} aria-hidden="true">
        {src ? (
          <img className="item-card__image" src={src} alt={item.title} loading="lazy" />
        ) : (
          <div className="item-card__placeholder">No photo</div>
        )}
      </Link>
      <div className="item-card__body">
        <div className="item-card__badges">
          <StatusBadge status={item.status} />
        </div>
        <h3 className="item-card__title">
          <Link to={`/items/${item.id}`}>{item.title}</Link>
        </h3>
        {actions ? <div className="item-card__actions">{actions}</div> : null}
      </div>
    </article>
  );
}
