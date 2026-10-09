import { HashRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import LibraryPage from './pages/LibraryPage.jsx';
import ActivitiesPage from './pages/ActivitiesPage.jsx';
import FriendsPage from './pages/FriendsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export function AppRoutes() {
  return <Routes>
    <Route element={<AppLayout />}>
      <Route index element={<LibraryPage />} />
      <Route path="atividades" element={<ActivitiesPage />} />
      <Route path="amigos" element={<FriendsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>;
}

// HashRouter keeps refreshes and direct links working on GitHub Pages.
export default function App() {
  return <HashRouter><AppRoutes /></HashRouter>;
}
