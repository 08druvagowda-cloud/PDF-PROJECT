package com.docgen.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public class DocumentGenerationRequest {

    @NotBlank(message = "Template ID is required")
    private String templateId;

    @NotNull(message = "Field values are required")
    private Map<String, Object> fieldValues;

    public DocumentGenerationRequest() {
    }

    // Getters and Setters
    public String getTemplateId() {
        return templateId;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public Map<String, Object> getFieldValues() {
        return fieldValues;
    }

    public void setFieldValues(Map<String, Object> fieldValues) {
        this.fieldValues = fieldValues;
    }
}
