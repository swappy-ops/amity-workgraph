import { useEffect } from 'react';

export default function ErrorToast({ message, type = 'error', onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      id="toast"
      role="alert"
      className={`toast ${type}`}
      onClick={onDismiss}
      style={{ cursor: 'pointer' }}
    >
      {message}
    </div>
  );
}
