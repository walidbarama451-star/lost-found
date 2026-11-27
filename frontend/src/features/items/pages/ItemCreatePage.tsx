import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { ItemForm } from '@/features/items/components/ItemForm';
import type { ItemFormValues } from '@/features/items/itemSchemas';
import { createItem } from '@/features/items/itemsService';
import { buttonClasses } from '@/shared/ui/Button';

const ItemCreatePage = (): ReactNode => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (values: ItemFormValues, files: File[]) => {
    const form = new FormData();
    form.append('title', values.title);
    for (const file of files) form.append('images', file);
    const created = await createItem(form);
    navigate(`/items/${created.id}`, { replace: true });
  };

  if (!user) {
    return (
      <div className="space-y-10">
        <section className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-wider text-accent-700">
            Private photo matching
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Found something?{' '}
            <span className="text-ink-muted">Help it get home.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
            Found items stay private on Found It. Sign in to post what you found, and we&apos;ll
            reveal it only when the rightful owner searches for a match.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/login" className={buttonClasses('primary', 'md')}>
              Sign in to post
            </Link>
            <Link to="/register" className={buttonClasses('secondary', 'md')}>
              Create account
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink-faint">
            No public browsing. Your photos and claims stay between you and the claimant.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="How Found It works for finders">
          {[
            ['01', 'Take a photo', 'Show what you found — a clear photo helps us match with the owner.'],
            ['02', 'Listing stays private', 'Your item is only revealed to owners whose search photo matches it.'],
            ['03', 'Return it securely', 'Review the owner’s claim and proof before handing it over.'],
          ].map(([number, title, description]) => (
            <article key={number} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
              <span className="text-xs font-bold text-accent-700 tabular">{number}</span>
              <h2 className="mt-2 text-sm font-semibold text-ink">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-accent-700">
            Private by design
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
            Ready to help return what you found?
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
            Create an account and post a photo. Listings stay hidden until a match is found.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/register" className={buttonClasses('primary', 'md')}>
              Create account
            </Link>
            <Link to="/login" className={buttonClasses('secondary', 'md')}>
              Sign in
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-accent-400">
          Post a found item
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Found something? <span className="text-ink-muted">Help it get home.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Upload a photo of what you found and add a quick title. We&apos;ll privately match it
          whenever the owner searches.
        </p>
      </div>

      <div className="max-w-2xl rounded-xl border border-line bg-surface p-5 sm:p-6">
        <ItemForm submitLabel="Publish listing" onSubmit={handleSubmit} />
      </div>

      <p className="text-xs text-ink-faint">
        Found items are hidden from everyone until a search matches them.
      </p>
    </div>
  );
};

export default ItemCreatePage;
