import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import './AppLayout.css';

/** Shared shell: Navbar + routed content + footer. */
export default function AppLayout() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-layout__main app-container" id="main-content">
        <Outlet />
      </main>
      <footer className="app-layout__footer">
        <div className="app-container">
          <p>
            Lost &amp; Found — helping reunite people with their belongings. Keep proof details
            private until a claim is accepted.
          </p>
        </div>
      </footer>
    </div>
  );
}
