package com.docgen.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class XmlDocumentRequest {

    @NotBlank(message = "Document title is required")
    private String title;

    @NotBlank(message = "XML content is required")
    private String xmlContent;

    public XmlDocumentRequest() {
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getXmlContent() {
        return xmlContent;
    }

    public void setXmlContent(String xmlContent) {
        this.xmlContent = xmlContent;
    }
}
