import { useEffect, useState } from "react";

import { AuthPage } from "./components/auth/AuthPage";
import { AddSubjectDialog } from "./components/dialogs/AddSubjectDialog";
import { ImportUITScheduleDialog } from "./components/dialogs/ImportUITScheduleDialog";
import { UserProfileDialog } from "./components/dialogs/UserProfileDialog";
import { NotebookSheet } from "./components/planner/NotebookSheet";
import { PlannerHeader } from "./components/planner/PlannerHeader";
import { WeeklySchedule } from "./components/planner/WeeklySchedule";
import { usePlannerState } from "./hooks/usePlannerState";
import { ApiUser, logout, restoreAuthSession } from "./lib/authApi";
import styles from "./App.module.css";

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
