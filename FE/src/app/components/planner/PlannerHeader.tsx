import { BookOpen, NotebookPen } from "lucide-react";

import styles from "./PlannerHeader.module.css";

interface PlannerHeaderProps {
  importFeedback: string | null;
}

export function PlannerHeader({ importFeedback }: PlannerHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.row}>
        <div>
          <div className={styles.badge}>
            <BookOpen className="size-4" />
            <span className={styles.badgeText}>Digital notebook planner</span>
          </div>

          <h1 className={styles.title}>
            Keep the timetable clean, open notes only when you need them.
          </h1>

          <p className={styles.description}>
            Focus on the weekly schedule first, then open a dedicated notebook page for notes,
            homework, and deadlines.
          </p>
        </div>

        <div className={styles.tipCard}>
          <div className={styles.tipTitle}>
            <NotebookPen className="size-4" />
            Quick tip
          </div>

          <p className={styles.tipText}>
            Import from UIT Student or add classes manually, then use the notebook icon on each
            class card to open the notes page.
          </p>
        </div>
      </div>

      {importFeedback ? <div className={styles.feedback}>{importFeedback}</div> : null}
    </header>
  );
}
