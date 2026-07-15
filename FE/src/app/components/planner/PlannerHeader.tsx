import { BookOpen, LogOut, NotebookPen, UserRound } from "lucide-react";

import { Button } from "../ui/button";
import styles from "./PlannerHeader.module.css";

interface PlannerHeaderProps {
  importFeedback: string | null;
  isAuthenticated: boolean;
  onLogout: () => void;
  onOpenUserProfile: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}

export function PlannerHeader({
  importFeedback,
  isAuthenticated,
  onLogout,
  onOpenUserProfile,
  onSignIn,
  onSignUp,
}: PlannerHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.badge}>
          <BookOpen className="size-4" />
          <span className={styles.badgeText}>Digital notebook planner</span>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="outline"
            size="icon"
            className={styles.profileButton}
            onClick={onOpenUserProfile}
            aria-label="Open user information"
          >
            <UserRound className="size-5" />
          </Button>
          {isAuthenticated ? (
            <Button variant="outline" className={styles.authButton} onClick={onLogout}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          ) : (
            <>
              <Button variant="outline" className={styles.authButton} onClick={onSignUp}>
                Sign up
              </Button>
              <Button className={styles.signInButton} onClick={onSignIn}>
                Sign in
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={styles.row}>
        <div>
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
