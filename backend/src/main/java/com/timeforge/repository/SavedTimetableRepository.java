package com.timeforge.repository;

import com.timeforge.model.SavedTimetable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SavedTimetableRepository extends JpaRepository<SavedTimetable, String> {
    List<SavedTimetable> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<SavedTimetable> findByIdAndUserId(String id, String userId);
}
