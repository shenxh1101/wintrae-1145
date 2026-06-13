import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { ToastContainer } from './components/Toast/ToastContainer';
import Library from './pages/Library';
import Borrow from './pages/Borrow';
import Shelf from './pages/Shelf';
import Wishlist from './pages/Wishlist';
import Stats from './pages/Stats';

export default function App() {
  return (
    <>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/library" replace />} />
            <Route path="/library" element={<Library />} />
            <Route path="/borrow" element={<Borrow />} />
            <Route path="/shelf" element={<Shelf />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="*" element={<Navigate to="/library" replace />} />
          </Routes>
        </Layout>
      </Router>
      <ToastContainer />
    </>
  );
}
