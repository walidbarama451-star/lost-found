import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import './AppLayout.css';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <TopNav />
      <div className="app-layout__body">
        <main className="app-layout__main app-container" id="main-content">
          <Outlet />
        </main>
        <footer className="app-layout__footer">
          <div className="app-container">
            <p>
              Found It — helping reunite people with their belongings. Keep proof details
              private until a claim is accepted.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
