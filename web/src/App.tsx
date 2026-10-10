import { NavLink, Route, Routes } from 'react-router-dom';
import QueuePage from './pages/QueuePage';
import CompletedPage from './pages/CompletedPage';
import AddProjectPage from './pages/AddProjectPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import YarnInventoryPage from './pages/YarnInventoryPage';
import MatchPage from './pages/MatchPage';

export default function App() {
  return (
    <div className="shell">
      <nav className="main-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Queue
        </NavLink>
        <NavLink to="/completed" className={({ isActive }) => (isActive ? 'active' : '')}>
          Completed
        </NavLink>
        <NavLink to="/add" className={({ isActive }) => `button${isActive ? ' active' : ''}`}>
          + Add project
        </NavLink>
        <NavLink to="/yarn" className={({ isActive }) => (isActive ? 'active' : '')}>
          Yarn inventory
        </NavLink>
        <NavLink to="/match" className={({ isActive }) => (isActive ? 'active' : '')}>
          What can I make?
        </NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<QueuePage />} />
        <Route path="/completed" element={<CompletedPage />} />
        <Route path="/add" element={<AddProjectPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/yarn" element={<YarnInventoryPage />} />
        <Route path="/match" element={<MatchPage />} />
      </Routes>
    </div>
  );
}
