package com.timeforge.repository;

import com.timeforge.model.CollegeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CollegeSlotRepository extends JpaRepository<CollegeSlot, String> {
    List<CollegeSlot> findByUserId(String userId);
    List<CollegeSlot> findByUserIdOrderByDayAscStartTimeAsc(String userId);
    Optional<CollegeSlot> findByIdAndUserId(String id, String userId);
}
