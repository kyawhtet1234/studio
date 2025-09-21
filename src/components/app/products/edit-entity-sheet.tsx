
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="py-4">{children(handleSuccess)}</div>
      </SheetContent>
    </Sheet>
  );
}
