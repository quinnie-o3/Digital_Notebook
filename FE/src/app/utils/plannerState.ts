import { Assignment, Subject } from "../types";

export interface PlannerBootstrapState {
  subjects: Subject[];
  assignments: Assignment[];
}

export const createDefaultAssignment = (subjectId: string): Assignment => ({
  id: `assignment-${subjectId}`,
  subjectId,
  lessonNotes: "",
  homework: [],
  deadline: "",
});

export const buildAssignmentsForSubjects = (
  subjects: Subject[],
  assignments: Assignment[] = [],
) =>
  subjects.map(
    (subject) =>
      assignments.find((assignment) => assignment.subjectId === subject.id) ||
      createDefaultAssignment(subject.id),
  );

export const mergeSubjectsById = (subjects: Subject[]) =>
  Array.from(new Map(subjects.map((subject) => [subject.id, subject])).values());

function createDefaultBootstrapState(): PlannerBootstrapState {
  return {
    subjects: [],
    assignments: [],
  };
}

export function loadInitialPlannerState(): PlannerBootstrapState {
  return createDefaultBootstrapState();
}
