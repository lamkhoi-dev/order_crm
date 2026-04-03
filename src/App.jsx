import useStore from './store/useStore';
import Header from './components/Header';
import OrderView from './components/OrderView';
import KitchenView from './components/KitchenView';
import AdminView from './components/AdminView';
import ToastContainer from './components/Toast';

export default function App() {
  const role = useStore(s => s.role);

  return (
    <div className="app" id="app-root">
      <Header />
      <main className="app__main">
        {role === 'order' && <OrderView />}
        {role === 'kitchen' && <KitchenView />}
        {role === 'admin' && <AdminView />}
      </main>
      <ToastContainer />
    </div>
  );
}
