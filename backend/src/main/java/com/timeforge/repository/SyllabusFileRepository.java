package com.timeforge.repository;

import com.timeforge.model.SyllabusFile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SyllabusFileRepository extends JpaRepository<SyllabusFile, String> {
    List<SyllabusFile> findByUserIdOrderByUploadedAtDesc(String userId);
    List<SyllabusFile> findByUserId(String userId);
    Optional<SyllabusFile> findByIdAndUserId(String id, String userId);
}
