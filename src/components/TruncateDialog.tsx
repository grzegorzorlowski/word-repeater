import { Button } from './ui/button';

interface TruncateDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Minimal confirm dialog to trim input to 5000 chars.
 */
export default function TruncateDialog({ open, onConfirm, onCancel }: TruncateDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="truncate-dialog-title"
    >
      <div className="relative mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-950">
        <h2 id="truncate-dialog-title" className="text-lg font-semibold">
          Text Too Long
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your text exceeds the maximum limit of 5000 characters. Would you like to automatically
          shorten it to 5000 characters?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Shorten to 5000</Button>
        </div>
      </div>
    </div>
  );
}

