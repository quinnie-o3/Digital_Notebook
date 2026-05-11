import { Subject } from "../types";

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: "1",
    name: "Calculus 1",
    color: "#FFD8E6",
    day: 0,
    startTime: "07:30",
    endTime: "09:45",
    room: "P E3.1",
    source: "manual",
  },
  {
    id: "2",
    name: "Web Programming",
    color: "#D8E8FF",
    day: 1,
    startTime: "13:00",
    endTime: "15:15",
    room: "P C309",
    source: "manual",
  },
  {
    id: "3",
    name: "English",
    color: "#DFF6DD",
    day: 2,
    startTime: "09:00",
    endTime: "10:45",
    room: "P A201",
    source: "manual",
  },
];
