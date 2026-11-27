import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import type { PublicItem } from '@/shared/api/types';
import { resolveImageUrl } from '@/shared/api/client';
import { ItemStatusBadge } from './ItemStatusBadge';

interface ItemCardProps {
  item: PublicItem;
  actions?: ReactNode;
}

export const ItemCard = ({ item, actions }: ItemCardProps): ReactNode => {
  const cover = item.images[0]?.url ?? null;
  const src = resolveImageUrl(cover);

  return (
    <article className="group overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-ink-faint/40">
      <Link
        to={`/items/${item.id}`}
        className="block aspect-[4/3] overflow-hidden bg-overlay"
        tabIndex={-1}
        aria-hidden="true"
      >
        {src ? (
          <img
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            src={src}
            alt={item.title}
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-ink-faint">
            <ImageOff size={26} aria-hidden />
          </div>
        )}
      </Link>

      <div className="space-y-3 p-4">
        <ItemStatusBadge status={item.status} />
        <h3 className="line-clamp-2 text-sm font-medium text-ink">
          <Link to={`/items/${item.id}`} className="transition-colors hover:text-accent-600">
            {item.title}
          </Link>
        </h3>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </article>
  );
};
