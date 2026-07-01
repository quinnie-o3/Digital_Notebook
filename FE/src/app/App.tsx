import { useEffect, useState } from "react";
import { differenceInCalendarDays, isValid, parseISO, startOfDay } from "date-fns";
import { AlertTriangle, BellRing, CalendarCheck2, X } from "lucide-react";

import { AuthPage } from "./components/auth/AuthPage";
import { AddSubjectDialog } from "./components/dialogs/AddSubjectDialog";
import { ImportUITScheduleDialog } from "./components/dialogs/ImportUITScheduleDialog";
import { UserProfileDialog } from "./components/dialogs/UserProfileDialog";
import { NotebookSheet } from "./components/planner/NotebookSheet";
import { PlannerHeader } from "./components/planner/PlannerHeader";
import { WeeklySchedule } from "./components/planner/WeeklySchedule";
import { usePlannerState } from "./hooks/usePlannerState";
import { ApiUser, logout, restoreAuthSession } from "./lib/authApi";
import { Assignment, Subject } from "./types";
import { Button } from "./components/ui/button";
import { cn } from "./components/ui/utils";
import styles from "./App.module.css";

interface DeadlineAlert {
  assignment: Assignment;
  subject: Subject | undefined;
  daysUntilDeadline: number;
  tone: "overdue" | "today" | "soon";
  title: string;
}

function buildDeadlineAlerts(assignments: Assignment[], subjects: Subject[]) {
  const today = startOfDay(new Date());

  return assignments
    .map((assignment): DeadlineAlert | null => {
      if (!assignment.deadline) {
        return null;
      }

      const parsedDeadline = parseISO(assignment.deadline);

      if (!isValid(parsedDeadline)) {
        return null;
      }

      const hasOpenHomework = assignment.homework.some((item) => !item.completed);

      if (!hasOpenHomework) {
        return null;
      }

      const daysUntilDeadline = differenceInCalendarDays(startOfDay(parsedDeadline), today);

      if (daysUntilDeadline > 3) {
        return null;
      }

      const subject = subjects.find((item) => item.id === assignment.subjectId);

      if (daysUntilDeadline < 0) {
        return {
          assignment,
          subject,
          daysUntilDeadline,
          tone: "overdue",
          title: `${Math.abs(daysUntilDeadline)} day${Math.abs(daysUntilDeadline) === 1 ? "" : "s"} overdue`,
        };
      }

      if (daysUntilDeadline === 0) {
        return {
          assignment,
          subject,
          daysUntilDeadline,
          tone: "today",
          title: "Due today",
        };
      }

      return {
        assignment,
        subject,
        daysUntilDeadline,
        tone: "soon",
        title: daysUntilDeadline === 1 ? "Due tomorrow" : `Due in ${daysUntilDeadline} days`,
      };
    })
    .filter((alert): alert is DeadlineAlert => alert !== null)
    .sort((firstAlert, secondAlert) => firstAlert.daysUntilDeadline - secondAlert.daysUntilDeadline);
}

export default function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState<ApiUser | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    restoreAuthSession()
      .then((user) => {
        if (!isCancelled) {
          setAuthenticatedUser(user);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsRestoringSession(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  if (isRestoringSession) {
    return <div className={styles.loadingPage}>Loading planner...</div>;
  }

  if (!authenticatedUser) {
    return <AuthPage onAuthenticated={setAuthenticatedUser} />;
  }

  return <PlannerApp onLogout={() => setAuthenticatedUser(null)} />;
}

function PlannerApp({ onLogout }: { onLogout: () => void }) {
  const planner = usePlannerState();
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isDeadlineDigestDismissed, setIsDeadlineDigestDismissed] = useState(false);
  const deadlineAlerts = buildDeadlineAlerts(planner.assignments, planner.subjects);

  useEffect(() => {
    setIsDeadlineDigestDismissed(false);
  }, [deadlineAlerts.length]);

  async function handleLogout() {
    await logout();
    onLogout();
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <PlannerHeader
          importFeedback={planner.importFeedback}
          onLogout={handleLogout}
          onOpenUserProfile={() => setIsUserProfileOpen(true)}
        />

        {planner.isPlannerHydrated && deadlineAlerts.length > 0 && !isDeadlineDigestDismissed ? (
          <section className={styles.deadlineDigest} aria-live="polite">
            <div className={styles.deadlineDigestHeader}>
              <div className={styles.deadlineDigestTitleWrap}>
                <div className={styles.deadlineDigestIcon}>
                  <BellRing className="size-4" />
                </div>
                <div>
                  <p className={styles.deadlineDigestLabel}>Deadline alerts</p>
                  <h2 className={styles.deadlineDigestTitle}>
                    {deadlineAlerts.length === 1
                      ? "1 item needs attention"
                      : `${deadlineAlerts.length} items need attention`}
                  </h2>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={styles.deadlineDigestDismiss}
                onClick={() => setIsDeadlineDigestDismissed(true)}
                aria-label="Dismiss deadline alerts"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className={styles.deadlineDigestList}>
              {deadlineAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.assignment.subjectId}
                  className={cn(
                    styles.deadlineDigestItem,
                    alert.tone === "overdue"
                      ? styles.deadlineDigestItemOverdue
                      : alert.tone === "today"
                        ? styles.deadlineDigestItemToday
                        : styles.deadlineDigestItemSoon,
                  )}
                >
                  {alert.tone === "overdue" ? (
                    <AlertTriangle className="size-4" />
                  ) : alert.daysUntilDeadline === 0 ? (
                    <BellRing className="size-4" />
                  ) : (
                    <CalendarCheck2 className="size-4" />
                  )}
                  <div className={styles.deadlineDigestItemText}>
                    <p className={styles.deadlineDigestItemTitle}>
                      {alert.subject?.name || "Notebook item"} - {alert.title}
                    </p>
                    <p className={styles.deadlineDigestItemMeta}>
                      {alert.assignment.homework.filter((item) => !item.completed).length} unfinished task
                      {alert.assignment.homework.filter((item) => !item.completed).length === 1 ? "" : "s"} -{" "}
                      {alert.assignment.deadline}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <main className={styles.main}>
          <WeeklySchedule
            subjects={planner.visibleSubjects}
            activeSubjectId={planner.selectedSubject?.id}
            selectedDate={planner.selectedDate}
            selectedWeekLabel={planner.selectedWeekLabel}
            onOpenNotebook={planner.handleOpenNotebook}
            onAddSubject={() => planner.setIsAddDialogOpen(true)}
            onImportSchedule={() => planner.setIsImportDialogOpen(true)}
            onMoveWeek={planner.handleMoveWeek}
            onSelectedDateChange={planner.setSelectedDate}
          />
        </main>
      </div>

      <AddSubjectDialog
        open={planner.isAddDialogOpen}
        onOpenChange={planner.setIsAddDialogOpen}
        onAddSubject={planner.handleAddSubject}
      />

      <ImportUITScheduleDialog
        open={planner.isImportDialogOpen}
        onOpenChange={planner.setIsImportDialogOpen}
        onImport={planner.handleImportSchedule}
      />

      <NotebookSheet
        open={planner.isNotebookOpen}
        onOpenChange={planner.setIsNotebookOpen}
        selectedSubject={planner.selectedSubject}
        assignment={planner.currentAssignment}
        onSaveAssignment={planner.handleSaveAssignment}
      />

      <UserProfileDialog open={isUserProfileOpen} onOpenChange={setIsUserProfileOpen} />
    </div>
  );
}
