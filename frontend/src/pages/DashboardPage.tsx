import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <section className="dashboard__hero gradient-canvas">
        <div className="dashboard__hero-inner">
          <span className="eyebrow">Your workspace</span>
          <h1>Ready to find what you lost, {user?.username ?? 'there'}?</h1>
          <p>
            Start with a photo of your lost item, or publish something you found so its owner
            can find it.
          </p>
          <div className="dashboard__hero-actions">
            <Link className="btn btn-primary" to="/">
              Search for a lost item
            </Link>
            <Link className="btn btn-secondary" to="/items/new">
              + Post a found item
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
