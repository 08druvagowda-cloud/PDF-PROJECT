package com.docgen.backend.service;

import com.docgen.backend.dto.FieldDTO;
import com.docgen.backend.dto.TemplateDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TemplateService {

    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, TemplateDTO> templateCache = new ConcurrentHashMap<>();

    public TemplateService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<TemplateDTO> getAllTemplates() {
        List<TemplateDTO> templates = new ArrayList<>();
        try {
            ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath*:templates/data/*.json");
            for (Resource resource : resources) {
                try (InputStream is = resource.getInputStream()) {
                    TemplateDTO template = objectMapper.readValue(is, TemplateDTO.class);
                    templates.add(template);
                    templateCache.put(template.getId(), template);
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to load templates from classpath", e);
        }
        return templates;
    }

    public TemplateDTO getTemplateConfig(String templateId) {
        // Refresh cache/load if not present
        if (!templateCache.containsKey(templateId)) {
            getAllTemplates(); // scans and populates cache
        }
        TemplateDTO template = templateCache.get(templateId);
        if (template == null) {
            throw new IllegalArgumentException("Template not found: " + templateId);
        }
        return template;
    }

    public List<FieldDTO> getTemplateFields(String templateId) {
        return getTemplateConfig(templateId).getFields();
    }

    public String getTemplateHtml(String templateId) {
        // Ensure template exists
        getTemplateConfig(templateId);

        String path = "classpath:templates/data/" + templateId + ".html";
        try {
            ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource resource = resolver.getResource(path);
            if (!resource.exists()) {
                throw new IllegalArgumentException("HTML template file not found for ID: " + templateId);
            }
            try (InputStream is = resource.getInputStream()) {
                return StreamUtils.copyToString(is, StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read HTML template file for: " + templateId, e);
        }
    }
}
