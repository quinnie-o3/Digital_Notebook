import { Assignment, Subject } from "../../types";
import { Sheet, SheetContent } from "../ui/sheet";
import { AssignmentPanel } from "./AssignmentPanel";
import styles from "./NotebookSheet.module.css";

interface NotebookSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSubject: Subject | null;
  assignment: Assignment | null;
  onSaveAssignment: (assignment: Assignment) => Promise<void>;
}

export function NotebookSheet({
  open,
  onOpenChange,
  selectedSubject,
  assignment,
  onSaveAssignment,
}: NotebookSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={styles.content}>
        <div className={styles.frame}>
          <div className={styles.handleWrap}>
            <div className={styles.handle} />
          </div>

          <div className={styles.body}>
            <AssignmentPanel
              selectedSubject={selectedSubject}
              assignment={assignment}
              onSaveAssignment={onSaveAssignment}
              onClose={() => onOpenChange(false)}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
