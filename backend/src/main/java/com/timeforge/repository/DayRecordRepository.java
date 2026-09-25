package com.timeforge.repository;

import com.timeforge.model.DayRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DayRecordRepository extends JpaRepository<DayRecord, String> {
    List<DayRecord> findByUserIdOrderByDateDesc(String userId);
    Optional<DayRecord> findByUserIdAndDate(String userId, String date);
}
