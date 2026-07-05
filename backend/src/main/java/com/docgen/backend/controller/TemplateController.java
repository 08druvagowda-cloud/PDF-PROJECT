package com.docgen.backend.controller;

import com.docgen.backend.dto.FieldDTO;
import com.docgen.backend.dto.TemplateDTO;
import com.docgen.backend.service.TemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
@CrossOrigin(origins = "*")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public ResponseEntity<List<TemplateDTO>> getAllTemplates() {
        return ResponseEntity.ok(templateService.getAllTemplates());
    }

    @GetMapping("/{id}/fields")
    public ResponseEntity<List<FieldDTO>> getTemplateFields(@PathVariable("id") String id) {
        try {
            return ResponseEntity.ok(templateService.getTemplateFields(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/html")
    public ResponseEntity<String> getTemplateHtml(@PathVariable("id") String id) {
        try {
            return ResponseEntity.ok(templateService.getTemplateHtml(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
