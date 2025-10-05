package com.project.trading_platform_backend.controller;

import com.project.trading_platform_backend.model.CommentModel;
import com.project.trading_platform_backend.repository.CommentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/profile/comments")
public class ProfileCommentController {

    private final CommentRepository commentRepo;

    public ProfileCommentController(CommentRepository commentRepo) {
        this.commentRepo = commentRepo;
    }

    @GetMapping("/{profileUserId}")
    public List<CommentModel> getComments(@PathVariable Long profileUserId) {
        return commentRepo.findByProfileUserIdOrderByTimestampDesc(profileUserId);
    }

    @PostMapping
    public CommentModel postComment(@RequestBody CommentModel comment) {
        comment.setTimestamp(LocalDateTime.now());
        return commentRepo.save(comment);
    }

    @PutMapping("/like/{id}")
    public ResponseEntity<?> likeComment(@PathVariable Long id) {
        CommentModel comment = commentRepo.findById(id).orElse(null);
        if (comment == null) return ResponseEntity.status(404).body("Comment not found");

        comment.setLikes(comment.getLikes() + 1);
        commentRepo.save(comment);
        return ResponseEntity.ok("Liked");
    }
}
