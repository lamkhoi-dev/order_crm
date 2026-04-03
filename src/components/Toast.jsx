import useStore from '../store/useStore';
import './Toast.css';

const TOAST_ICONS = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
};

export default function ToastContainer() {
  const toasts = useStore(s => s.toasts);

  if (!toasts.length) return null;

  return (
    <div className="toast-container" id="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast__icon">{TOAST_ICONS[t.type] || '✅'}</span>
          <span className="toast__msg">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
