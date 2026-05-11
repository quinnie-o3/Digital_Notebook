import { useEffect, useState } from "react";

import { getAllAssignments, saveAssignment, saveAssignments } from "../lib/assignmentDatabase";
import { UITScheduleImportResult } from "../lib/uitSchedule";
import { Assignment, Subject } from "../types";
import {
  buildAssignmentsForSubjects,
  createDefaultAssignment,
  loadInitialPlannerState,
  mergeSubjectsById,
  STORAGE_KEY,
} from "../utils/plannerState";

export function usePlannerState() {
  const [bootstrap] = useState(loadInitialPlannerState);
  const [subjects, setSubjects] = useState<Subject[]>(bootstrap.subjects);
  const [assignments, setAssignments] = useState<Assignment[]>(bootstrap.assignments);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        subjects,
        assignments,
      }),
    );
  }, [assignments, subjects]);

  useEffect(() => {
    let isCancelled = false;

    const hydrateAssignmentsFromDatabase = async () => {
      try {
        const storedAssignments = await getAllAssignments();

        if (isCancelled) {
          return;
        }

        if (storedAssignments.length === 0) {
          await saveAssignments(bootstrap.assignments);
          return;
        }

        setAssignments(buildAssignmentsForSubjects(bootstrap.subjects, storedAssignments));
      } catch (error) {
        console.error("Failed to hydrate assignments from IndexedDB.", error);
      }
    };

    void hydrateAssignmentsFromDatabase();

    return () => {
      isCancelled = true;
    };
  }, [bootstrap.assignments, bootstrap.subjects]);

  useEffect(() => {
    if (!selectedSubject) {
      return;
    }

    const nextSelectedSubject =
      subjects.find((subject) => subject.id === selectedSubject.id) || null;

    setSelectedSubject(nextSelectedSubject);
  }, [selectedSubject, subjects]);

  const handleAddSubject = (subjectData: Omit<Subject, "id">) => {
    const newSubject: Subject = {
      ...subjectData,
      id: Date.now().toString(),
      source: "manual",
    };

    setSubjects((previous) => [...previous, newSubject]);
    setAssignments((previous) => [...previous, createDefaultAssignment(newSubject.id)]);
  };

  const handleSaveAssignment = async (assignment: Assignment) => {
    await saveAssignment(assignment);
    setAssignments((previous) => {
      const hasExistingAssignment = previous.some((item) => item.id === assignment.id);

      if (!hasExistingAssignment) {
        return [...previous, assignment];
      }

      return previous.map((item) => (item.id === assignment.id ? assignment : item));
    });
  };

  const handleOpenNotebook = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsNotebookOpen(true);
  };

  const handleImportSchedule = (
    result: UITScheduleImportResult,
    mode: "replace" | "append",
  ) => {
    const nextSubjects =
      mode === "replace"
        ? result.subjects
        : mergeSubjectsById([...subjects, ...result.subjects]);
    const nextAssignments = buildAssignmentsForSubjects(nextSubjects, assignments);

    setSubjects(nextSubjects);
    setAssignments(nextAssignments);

    if (selectedSubject && !nextSubjects.some((subject) => subject.id === selectedSubject.id)) {
      setSelectedSubject(null);
      setIsNotebookOpen(false);
    }

    setImportFeedback(
      result.warnings.length
        ? `Imported ${result.subjects.length} classes. Note: ${result.warnings.join(" ")}`
        : `Imported ${result.subjects.length} classes from UIT Student.`,
    );
  };

  const currentAssignment = selectedSubject
    ? assignments.find((assignment) => assignment.subjectId === selectedSubject.id) || null
    : null;

  return {
    assignments,
    currentAssignment,
    handleAddSubject,
    handleImportSchedule,
    handleOpenNotebook,
    handleSaveAssignment,
    importFeedback,
    isAddDialogOpen,
    isImportDialogOpen,
    isNotebookOpen,
    selectedSubject,
    setIsAddDialogOpen,
    setIsImportDialogOpen,
    setIsNotebookOpen,
    subjects,
  };
}
