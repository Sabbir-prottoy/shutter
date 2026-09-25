package com.shuttershot.repository;

import com.shuttershot.model.Product;
import com.shuttershot.model.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    List<Product> findAllByIdInAndActiveTrue(Collection<Long> ids);

    List<Product> findAllByOrderByCategoryAscIdAsc();

    // Takes stock only if enough is left, in one atomic statement, so two
    // customers buying the last unit at the same moment can't both succeed.
    @Modifying
    @Query("update Product p set p.stock = p.stock - :quantity where p.id = :id and p.stock >= :quantity")
    int decrementStock(@Param("id") Long id, @Param("quantity") int quantity);

    @Modifying
    @Query("update Product p set p.stock = p.stock + :quantity where p.id = :id")
    int incrementStock(@Param("id") Long id, @Param("quantity") int quantity);

    @Query("select p.category as category, count(p) as count from Product p where p.active = true group by p.category")
    List<CategoryCount> countActiveByCategory();

    interface CategoryCount {
        ProductCategory getCategory();

        long getCount();
    }
}
