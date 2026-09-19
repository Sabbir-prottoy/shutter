package com.shuttershot.repository;

import com.shuttershot.model.Package;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PackageRepository extends JpaRepository<Package, Long> {

    List<Package> findByPhotographerId(Long photographerId);
}
