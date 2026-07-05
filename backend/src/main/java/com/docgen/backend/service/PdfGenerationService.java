package com.docgen.backend.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Map;

@Service
public class PdfGenerationService {

    public byte[] generatePdf(String htmlTemplate, Map<String, Object> fieldValues) {
        // 1. Substitute placeholders
        String filledHtml = htmlTemplate;
        for (Map.Entry<String, Object> entry : fieldValues.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() == null ? "" : String.valueOf(entry.getValue());
            filledHtml = filledHtml.replace(placeholder, value);
        }

        // Clean up remaining unresolved placeholders to empty strings
        filledHtml = filledHtml.replaceAll("\\{\\{.*?\\}\\}", "");

        // 2. Convert HTML to valid XHTML using JSoup
        Document document = Jsoup.parse(filledHtml, "UTF-8");
        document.outputSettings().syntax(Document.OutputSettings.Syntax.xml); // Output valid XML syntax
        String xhtmlContent = document.html();

        // 3. Render PDF using OpenHTMLToPDF
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(xhtmlContent, "/"); // Root base URI
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF from HTML template: " + e.getMessage(), e);
        }
    }
}
