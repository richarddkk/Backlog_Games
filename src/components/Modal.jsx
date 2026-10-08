import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export default function Modal({ open, onOpenChange, title, description, children, className = '', busy = false }) {
  return <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
    <Dialog.Portal><Dialog.Overlay className="modal-overlay" />
      <Dialog.Content className={`modal ${className}`} onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }} onPointerDownOutside={(event) => { if (busy) event.preventDefault(); }}>
        <div className="modal-heading"><div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div>
          <Dialog.Close className="icon-button" disabled={busy} aria-label="Fechar"><X size={20} /></Dialog.Close>
        </div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
