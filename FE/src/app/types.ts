export interface Subject {
  id: string;
  name: string;
  color: string;
  day: number; // 0-6 (Monday-Sunday)
  startTime: string; // e.g., "08:00"
  endTime: string; // e.g., "10:00"
  room?: string;
  courseCode?: string;
  source?: "manual" | "uit";
  note?: string;
  startDate?: string;
  endDate?: string;
}

export interface Assignment {
  id: string;
  subjectId: string;
  lessonNotes: string;
  homework: HomeworkItem[];
  deadline: string;
}

export interface HomeworkItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface UserProfile {
  userId: number;
  profileId?: number;
  name?: string;
  fullName?: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string | null;
}
