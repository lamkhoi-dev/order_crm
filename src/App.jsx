import { useEffect } from 'react';
import useStore from './store/useStore';
import Header from './components/Header';
import OrderView from './components/OrderView';
import KitchenView from './components/KitchenView';
import AdminView from './components/AdminView';
import ToastContainer from './components/Toast';

export default function App() {
  const role = useStore(s => s.role);
  const serverLoading = useStore(s => s.serverLoading);
  const loadFromServer = useStore(s => s.loadFromServer);

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  return (
    <div className="app" id="app-root">
      <Header />
      <main className="app__main">
        {serverLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--color-text-muted)', fontSize: 'var(--text-base)' }}>
            Đang kết nối...
          </div>
        ) : (
          <>
            {role === 'order' && <OrderView />}
            {role === 'kitchen' && <KitchenView />}
            {role === 'admin' && <AdminView />}
          </>
        )}
      </main>
      <ToastContainer />
    </div>
  );
}
