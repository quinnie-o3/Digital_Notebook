package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.Note;
import com.uit.studentplanner.repository.NoteRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    @Autowired
    private NoteRepository noteRepository;

    @GetMapping("/course/{courseId}")
    public List<Note> getNotesByCourse(@PathVariable Long courseId) {
        return noteRepository.findByCourseId(courseId);
    }

    @PostMapping
    public Note createNote(@RequestBody Note note) {
        return noteRepository.save(note);
    }

    @PutMapping("/{id}")
    public Note updateNote(@PathVariable Long id, @RequestBody Note noteDetails) {
        return noteRepository.findById(id).map(note -> {
            note.setLessonSummary(noteDetails.getLessonSummary());
            note.setHomeworkTasks(noteDetails.getHomeworkTasks());
            note.setDeadline(noteDetails.getDeadline());
            return noteRepository.save(note);
        }).orElseThrow(() -> new RuntimeException("Note not found"));
    }

    @DeleteMapping("/{id}")
    public String deleteNote(@PathVariable Long id) {
        noteRepository.deleteById(id);
        return "Note deleted successfully";
    }
}
