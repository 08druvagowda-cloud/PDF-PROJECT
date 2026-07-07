package com.docgen.backend.controller;

import com.docgen.backend.dto.DocumentGenerationRequest;
import com.docgen.backend.dto.DocumentHistoryDTO;
import com.docgen.backend.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.docgen.backend.dto.XmlDocumentRequest;
import com.docgen.backend.service.XmlPdfService;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*")
public class DocumentController {

    private final DocumentService documentService;
    private final XmlPdfService xmlPdfService;

    public DocumentController(DocumentService documentService, XmlPdfService xmlPdfService) {
        this.documentService = documentService;
        this.xmlPdfService = xmlPdfService;
    }

    @PostMapping("/generate")
    public ResponseEntity<byte[]> generateDocument(@Valid @RequestBody DocumentGenerationRequest request) {
        try {
            byte[] pdfBytes = documentService.generateAndSaveDocument(request);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            String filename = request.getTemplateId() + "_document.pdf";
            headers.setContentDispositionFormData("attachment", filename);
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage().getBytes());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("Failed to generate document: " + e.getMessage()).getBytes());
        }
    }

    @PostMapping("/generate-from-xml")
    public ResponseEntity<byte[]> generateDocumentFromXml(@Valid @RequestBody XmlDocumentRequest request) {
        try {
            byte[] pdfBytes = xmlPdfService.generateAndSaveXmlDocument(request.getTitle(), request.getXmlContent());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "xml_document.pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage().getBytes());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("Failed to generate document: " + e.getMessage()).getBytes());
        }
    }

    @GetMapping
    public ResponseEntity<List<DocumentHistoryDTO>> getDocuments(
            @RequestParam(value = "templateId", required = false) String templateId,
            @RequestParam(value = "search", required = false) String search) {
        return ResponseEntity.ok(documentService.listHistory(templateId, search));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable("id") Long id) {
        try {
            byte[] pdfBytes = documentService.getDocumentFile(id);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "document_" + id + ".pdf");
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
