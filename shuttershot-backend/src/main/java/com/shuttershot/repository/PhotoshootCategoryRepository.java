package com.shuttershot.repository;

import com.shuttershot.model.PhotoshootCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhotoshootCategoryRepository extends JpaRepository<PhotoshootCategory, Long> {

    List<PhotoshootCategory> findAllByOrderByIdAsc();

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    boolean existsBySearchValue(String searchValue);
}
