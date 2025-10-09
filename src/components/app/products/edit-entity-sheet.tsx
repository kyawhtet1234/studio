
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditEntitySheetProps {
  title: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
  children: (onSuccess: () => void) => React.ReactNode;
}

export function EditEntitySheet({
  title,
  description,
  isOpen,
  onClose,
  children,
}: EditEntitySheetProps) {

  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">{children(handleSuccess)}</div>
      </DialogContent>
    </Dialog>
  );
}
