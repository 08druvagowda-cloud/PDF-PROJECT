package com.docgen.backend.service;

import com.docgen.backend.entity.DocumentHistory;
import com.docgen.backend.repository.DocumentHistoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.apache.fop.apps.FOUserAgent;
import org.apache.fop.apps.Fop;
import org.apache.fop.apps.FopFactory;
import org.apache.fop.apps.MimeConstants;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.xml.transform.*;
import javax.xml.transform.sax.SAXResult;
import javax.xml.transform.stream.StreamSource;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@Service
public class XmlPdfService {

    private final DocumentHistoryRepository documentHistoryRepository;
    private final ObjectMapper objectMapper;
    private FopFactory fopFactory;

    @Value("${pdf.storage.dir:./generated_pdfs}")
    private String storageDir;

    public XmlPdfService(DocumentHistoryRepository documentHistoryRepository, ObjectMapper objectMapper) {
        this.documentHistoryRepository = documentHistoryRepository;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(storageDir));
            // Initialize FOP Factory with default configuration
            this.fopFactory = FopFactory.newInstance(new File(".").toURI());
        } catch (Exception e) {
            throw new RuntimeException("Could not initialize storage directory or FOP Factory", e);
        }
    }

    public byte[] generateAndSaveXmlDocument(String title, String xmlContent) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            FOUserAgent foUserAgent = fopFactory.newFOUserAgent();
            Fop fop = fopFactory.newFop(MimeConstants.MIME_PDF, foUserAgent, out);

            TransformerFactory factory = TransformerFactory.newInstance();
            Transformer transformer = factory.newTransformer(); // Identity transformer

            Source src = new StreamSource(new StringReader(xmlContent));
            Result res = new SAXResult(fop.getDefaultHandler());

            transformer.transform(src, res);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF from XML (XSL-FO): " + e.getMessage(), e);
        }

        byte[] pdfBytes = out.toByteArray();

        // Save PDF file to disk
        String fileName = "xml_custom_" + UUID.randomUUID() + ".pdf";
        Path targetPath = Paths.get(storageDir, fileName);
        try {
            Files.write(targetPath, pdfBytes);
        } catch (IOException e) {
            throw new RuntimeException("Failed to write PDF file to disk", e);
        }

        // Save history metadata to DB
        DocumentHistory history = new DocumentHistory();
        history.setTemplateId("xml_custom");
        history.setTemplateName("XML Document");
        
        // Extract a document number if any, or generate/use N/A
        history.setDocumentNumber("N/A");
        history.setClientName("XML Input");
        history.setFilePath(targetPath.toString());

        try {
            String metaJson = objectMapper.writeValueAsString(Map.of(
                    "title", title,
                    "sourceType", "XML"
            ));
            history.setMetadataJson(metaJson);
        } catch (Exception e) {
            history.setMetadataJson("{}");
        }

        documentHistoryRepository.save(history);

        return pdfBytes;
    }
}
