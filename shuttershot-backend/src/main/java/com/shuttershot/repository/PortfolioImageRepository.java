package com.shuttershot.repository;

import com.shuttershot.model.PortfolioImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PortfolioImageRepository extends JpaRepository<PortfolioImage, Long> {

    List<PortfolioImage> findByPhotographerId(Long photographerId);
}
