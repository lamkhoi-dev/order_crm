import useStore from '../store/useStore';
import { CircleCheck, AlertTriangle, XCircle, Info } from 'lucide-react';
import './Toast.css';

const TOAST_ICONS = {
  success: CircleCheck,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

export default function ToastContainer() {
  const toasts = useStore(s => s.toasts);

  if (!toasts.length) return null;

  return (
    <div className="toast-container" id="toast-container">
      {toasts.map(t => {
        const Icon = TOAST_ICONS[t.type] || CircleCheck;
        return (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <Icon size={16} className="toast__icon" />
            <span className="toast__msg">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
