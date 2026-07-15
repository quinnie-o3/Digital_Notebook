import { useEffect, useState } from "react";
import { differenceInCalendarDays, isValid, parseISO, startOfDay } from "date-fns";
import { AlertTriangle, BellRing, CalendarCheck2, X } from "lucide-react";

import { AuthPage } from "./components/auth/AuthPage";
import { AddSubjectDialog } from "./components/dialogs/AddSubjectDialog";
import { ChangePasswordDialog } from "./components/dialogs/ChangePasswordDialog";
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
  const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);

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

  useEffect(() => {
    const handleExpiredSession = () => {
      setAuthenticatedUser(null);
      setAuthMode("login");
    };

    window.addEventListener("auth-session-expired", handleExpiredSession);
    return () => window.removeEventListener("auth-session-expired", handleExpiredSession);
  }, []);

  if (isRestoringSession) {
    return <div className={styles.loadingPage}>Loading planner...</div>;
  }

  if (authMode) {
    return (
      <AuthPage
        initialMode={authMode}
        onCancel={() => setAuthMode(null)}
        onAuthenticated={(user) => {
          setAuthenticatedUser(user);
          setAuthMode(null);
        }}
      />
    );
  }

  return (
    <PlannerApp
      authenticatedUser={authenticatedUser}
      onLogout={() => setAuthenticatedUser(null)}
      onRequestSignIn={() => setAuthMode("login")}
      onRequestSignUp={() => setAuthMode("signup")}
    />
  );
}

interface PlannerAppProps {
  authenticatedUser: ApiUser | null;
  onLogout: () => void;
  onRequestSignIn: () => void;
  onRequestSignUp: () => void;
}

function PlannerApp({ authenticatedUser, onLogout, onRequestSignIn, onRequestSignUp }: PlannerAppProps) {
  const planner = usePlannerState(Boolean(authenticatedUser));
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
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
          isAuthenticated={Boolean(authenticatedUser)}
          onLogout={handleLogout}
          onOpenUserProfile={() =>
            authenticatedUser ? setIsUserProfileOpen(true) : onRequestSignUp()
          }
          onSignIn={onRequestSignIn}
          onSignUp={onRequestSignUp}
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
            onOpenNotebook={(subject) =>
              authenticatedUser ? planner.handleOpenNotebook(subject) : onRequestSignUp()
            }
            onAddSubject={() =>
              authenticatedUser ? planner.setIsAddDialogOpen(true) : onRequestSignUp()
            }
            onImportSchedule={() =>
              authenticatedUser ? planner.setIsImportDialogOpen(true) : onRequestSignUp()
            }
            onMoveWeek={(direction) =>
              authenticatedUser ? planner.handleMoveWeek(direction) : onRequestSignUp()
            }
            onSelectedDateChange={(date) =>
              authenticatedUser ? planner.setSelectedDate(date) : onRequestSignUp()
            }
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

      {authenticatedUser ? (
        <>
          <UserProfileDialog
            open={isUserProfileOpen}
            onOpenChange={setIsUserProfileOpen}
            onEditPassword={() => {
              setIsUserProfileOpen(false);
              setIsChangePasswordOpen(true);
            }}
          />
          <ChangePasswordDialog
            open={isChangePasswordOpen}
            onOpenChange={setIsChangePasswordOpen}
            onBack={() => {
              setIsChangePasswordOpen(false);
              setIsUserProfileOpen(true);
            }}
          />
        </>
      ) : null}
    </div>
  );
}
