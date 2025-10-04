import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import Button from "./Button";

// Re-export dei componenti Dialog per compatibilità
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};

export default function ConfirmDialog({ 
  open, 
  onOpenChange, 
  title, 
  message, 
  onConfirm,
  confirmText = "Conferma",
  cancelText = "Annulla",
  showCancel = true,
  type = "danger"
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {showCancel && (
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              {cancelText}
            </Button>
          )}
          <Button 
            variant={type === "danger" ? "destructive" : "default"} 
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
