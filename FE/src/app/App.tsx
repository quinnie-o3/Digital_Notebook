import { useState } from "react";

import { AddSubjectDialog } from "./components/dialogs/AddSubjectDialog";
import { ImportUITScheduleDialog } from "./components/dialogs/ImportUITScheduleDialog";
import { UserProfileDialog } from "./components/dialogs/UserProfileDialog";
import { NotebookSheet } from "./components/planner/NotebookSheet";
import { PlannerHeader } from "./components/planner/PlannerHeader";
import { WeeklySchedule } from "./components/planner/WeeklySchedule";
import { usePlannerState } from "./hooks/usePlannerState";
import styles from "./App.module.css";

export default function App() {
  const planner = usePlannerState();
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <PlannerHeader
          importFeedback={planner.importFeedback}
          onOpenUserProfile={() => setIsUserProfileOpen(true)}
        />

        <main className={styles.main}>
          <WeeklySchedule
            subjects={planner.subjects}
            activeSubjectId={planner.selectedSubject?.id}
            onOpenNotebook={planner.handleOpenNotebook}
            onAddSubject={() => planner.setIsAddDialogOpen(true)}
            onImportSchedule={() => planner.setIsImportDialogOpen(true)}
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
