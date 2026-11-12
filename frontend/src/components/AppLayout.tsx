import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './AppLayout.css';

/** Shared shell: side dashboard + routed content + footer. */
export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-layout__body">
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
    </div>
  );
}
