import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, FileText, PackagePlus, Search } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { buttonClasses } from '@/shared/ui/Button';

const actions = [
  {
    to: '/',
    icon: Search,
    title: 'Search for a lost item',
    description: 'Upload a photo and check every private found-item listing for a match.',
  },
  {
    to: '/items/new',
    icon: PackagePlus,
    title: 'Post a found item',
    description: 'Publish something you found. It stays private until an owner searches for it.',
  },
  {
    to: '/lost-reports',
    icon: FileText,
    title: 'My lost reports',
    description: 'Review saved searches and re-run them when new items are published.',
  },
  {
    to: '/claims',
    icon: ClipboardCheck,
    title: 'My claims',
    description: 'Track the claims you submitted and withdraw any that are still pending.',
  },
] as const;

const DashboardPage = (): ReactNode => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent-700">
            Your workspace
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
            Ready to find what you lost, {user?.username ?? 'there'}?
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Start with a photo of your lost item, or publish something you found so its owner
            can find it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/" className={buttonClasses('primary', 'md')}>
            <Search size={16} aria-hidden />
            Search for a lost item
          </Link>
          <Link to="/items/new" className={buttonClasses('secondary', 'md')}>
            <PackagePlus size={16} aria-hidden />
            Post a found item
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className="group flex items-start gap-4 rounded-xl border border-line bg-surface p-5 transition-colors hover:bg-overlay/50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-overlay text-accent-600">
                <Icon size={18} aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-medium text-ink">{action.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-muted">
                  {action.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardPage;
