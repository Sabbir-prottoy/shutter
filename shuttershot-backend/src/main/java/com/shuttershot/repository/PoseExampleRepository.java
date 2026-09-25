package com.shuttershot.repository;

import com.shuttershot.model.PoseExample;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PoseExampleRepository extends JpaRepository<PoseExample, Long> {

    List<PoseExample> findAllByOrderBySubsectionAscCreatedAtAsc();
}
