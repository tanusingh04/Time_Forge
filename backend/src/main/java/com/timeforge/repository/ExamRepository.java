package com.timeforge.repository;

import com.timeforge.model.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ExamRepository extends JpaRepository<Exam, String> {
    List<Exam> findByUserIdOrderByDateAsc(String userId);
    List<Exam> findByUserId(String userId);
    Optional<Exam> findByIdAndUserId(String id, String userId);
}
