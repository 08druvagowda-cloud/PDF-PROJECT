package com.docgen.backend.service;

import com.docgen.backend.dto.DocumentGenerationRequest;
import com.docgen.backend.dto.DocumentHistoryDTO;
import com.docgen.backend.dto.FieldDTO;
import com.docgen.backend.dto.TemplateDTO;
import com.docgen.backend.entity.DocumentHistory;
import com.docgen.backend.repository.DocumentHistoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private final TemplateService templateService;
    private final PdfGenerationService pdfGenerationService;
    private final DocumentHistoryRepository documentHistoryRepository;
    private final ObjectMapper objectMapper;

    // Configurable via application.properties (pdf.storage.dir) or PDF_STORAGE_DIR env var.
    // Defaults to ./generated_pdfs relative to the working directory.
    @Value("${pdf.storage.dir:./generated_pdfs}")
    private String storageDir;

    public DocumentService(TemplateService templateService,
                           PdfGenerationService pdfGenerationService,
                           DocumentHistoryRepository documentHistoryRepository,
                           ObjectMapper objectMapper) {
        this.templateService = templateService;
        this.pdfGenerationService = pdfGenerationService;
        this.documentHistoryRepository = documentHistoryRepository;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(storageDir));
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory for generated PDFs: " + storageDir, e);
        }
    }


    public byte[] generateAndSaveDocument(DocumentGenerationRequest request) {
        // 1. Fetch template config
        TemplateDTO template = templateService.getTemplateConfig(request.getTemplateId());

        // 2. Validate input values against JSON rules
        validateFieldValues(template, request.getFieldValues());

        // 3. Fetch raw HTML layout
        String htmlTemplate = templateService.getTemplateHtml(request.getTemplateId());

        // 4. Render PDF
        byte[] pdfBytes = pdfGenerationService.generatePdf(htmlTemplate, request.getFieldValues());

        // 5. Save PDF file to disk
        String fileName = template.getId() + "_" + UUID.randomUUID() + ".pdf";
        Path targetPath = Paths.get(storageDir, fileName);
        try {
            Files.write(targetPath, pdfBytes);
        } catch (IOException e) {
            throw new RuntimeException("Failed to write PDF file to disk", e);
        }

        // 6. Save history metadata to DB
        DocumentHistory history = new DocumentHistory();
        history.setTemplateId(template.getId());
        history.setTemplateName(template.getName());
        history.setDocumentNumber(extractDocumentNumber(request.getFieldValues()));
        history.setClientName(extractClientName(request.getFieldValues()));
        history.setFilePath(targetPath.toString());

        try {
            String metaJson = objectMapper.writeValueAsString(request.getFieldValues());
            history.setMetadataJson(metaJson);
        } catch (Exception e) {
            history.setMetadataJson("{}");
        }

        documentHistoryRepository.save(history);

        return pdfBytes;
    }

    public List<DocumentHistoryDTO> listHistory(String templateId, String search) {
        List<DocumentHistory> list = documentHistoryRepository.searchDocuments(
                (templateId == null || templateId.trim().isEmpty()) ? null : templateId,
                (search == null || search.trim().isEmpty()) ? null : search
        );

        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public byte[] getDocumentFile(Long id) {
        DocumentHistory history = documentHistoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document history record not found for ID: " + id));

        Path path = Paths.get(history.getFilePath());
        if (!Files.exists(path)) {
            throw new RuntimeException("PDF file not found on disk at: " + history.getFilePath());
        }

        try {
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read PDF file from disk", e);
        }
    }

    private void validateFieldValues(TemplateDTO template, Map<String, Object> fieldValues) {
        List<String> errors = new ArrayList<>();

        for (FieldDTO field : template.getFields()) {
            Object val = fieldValues.get(field.getName());
            String strVal = val == null ? "" : String.valueOf(val).trim();

            // Required check
            if (field.isRequired() && strVal.isEmpty()) {
                errors.add(field.getLabel() + " is required");
                continue;
            }

            if (!strVal.isEmpty()) {
                // Type specific validation
                if ("number".equalsIgnoreCase(field.getType())) {
                    try {
                        Double.parseDouble(strVal);
                    } catch (NumberFormatException e) {
                        errors.add(field.getLabel() + " must be a numeric value");
                    }
                } else if ("email".equalsIgnoreCase(field.getType())) {
                    if (!strVal.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")) {
                        errors.add(field.getLabel() + " must be a valid email address");
                    }
                } else if ("phone".equalsIgnoreCase(field.getType())) {
                    if (!strVal.matches("^\\+?[0-9\\s\\-\\(\\)]{10,20}$")) {
                        errors.add(field.getLabel() + " must be a valid phone number");
                    }
                }

                // Custom regex check if present
                if (field.getValidationRegex() != null && !field.getValidationRegex().trim().isEmpty()) {
                    if (!strVal.matches(field.getValidationRegex())) {
                        String errMsg = (field.getValidationMessage() != null && !field.getValidationMessage().trim().isEmpty())
                                ? field.getValidationMessage()
                                : field.getLabel() + " format is invalid";
                        errors.add(errMsg);
                    }
                }
            }
        }

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException("Validation Errors: " + String.join(", ", errors));
        }
    }

    private String extractClientName(Map<String, Object> fieldValues) {
        String[] keys = {"customerName", "clientName", "studentName", "employeeName"};
        for (String key : keys) {
            if (fieldValues.containsKey(key) && fieldValues.get(key) != null) {
                return String.valueOf(fieldValues.get(key));
            }
        }
        return "Unknown Client";
    }

    private String extractDocumentNumber(Map<String, Object> fieldValues) {
        String[] keys = {"invoiceNumber", "quotationNumber", "employeeId"};
        for (String key : keys) {
            if (fieldValues.containsKey(key) && fieldValues.get(key) != null) {
                return String.valueOf(fieldValues.get(key));
            }
        }
        return "N/A";
    }

    private DocumentHistoryDTO toDTO(DocumentHistory entity) {
        DocumentHistoryDTO dto = new DocumentHistoryDTO();
        dto.setId(entity.getId());
        dto.setTemplateId(entity.getTemplateId());
        dto.setTemplateName(entity.getTemplateName());
        dto.setDocumentNumber(entity.getDocumentNumber());
        dto.setClientName(entity.getClientName());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setMetadataJson(entity.getMetadataJson());
        return dto;
    }
}
