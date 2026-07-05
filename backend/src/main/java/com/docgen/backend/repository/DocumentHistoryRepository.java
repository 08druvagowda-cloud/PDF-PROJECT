package com.docgen.backend.repository;

import com.docgen.backend.entity.DocumentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentHistoryRepository extends JpaRepository<DocumentHistory, Long> {

    @Query("SELECT d FROM DocumentHistory d WHERE " +
           "(:templateId IS NULL OR d.templateId = :templateId) AND " +
           "(:search IS NULL OR LOWER(d.clientName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.documentNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.templateName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY d.createdAt DESC")
    List<DocumentHistory> searchDocuments(
            @Param("templateId") String templateId,
            @Param("search") String search
    );
}
