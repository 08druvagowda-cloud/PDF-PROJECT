import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileCode, CheckCircle2, RefreshCw, Play, Info } from 'lucide-react';
import { toast } from 'react-toastify';

const DEFAULT_XML_TEMPLATE = `<?xml version="1.0" encoding="utf-8"?>
<fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format">
  <fo:layout-master-set>
    <fo:simple-page-master master-name="A4" page-height="29.7cm" page-width="21cm" margin="2cm">
      <fo:region-body margin-top="1cm"/>
      <fo:region-before extent="1.5cm"/>
    </fo:simple-page-master>
  </fo:layout-master-set>
  <fo:page-sequence master-reference="A4">
    <fo:flow flow-name="xsl-region-body">
      <fo:block font-family="Helvetica" font-size="24pt" font-weight="bold" text-align="center" color="#0F172A" space-after="20pt">
        Smart Document Automation
      </fo:block>
      <fo:block font-family="Helvetica" font-size="14pt" font-weight="bold" space-after="10pt" color="#0284C7">
        Generated from XSL-FO XML
      </fo:block>
      <fo:block font-family="Helvetica" font-size="10pt" line-height="1.5" space-after="15pt">
        This document has been dynamically generated using the Apache FOP processor in the Spring Boot backend. Apache FOP allows direct rendering of XML formatted using the XSL-FO vocabulary into standard PDF files.
      </fo:block>
      <fo:block-container border-style="solid" border-width="1pt" padding="10pt">
        <fo:block font-family="Helvetica" font-size="11pt" font-weight="bold" color="#334155" space-after="5pt">
          System Information
        </fo:block>
        <fo:block font-family="Helvetica" font-size="10pt">
          Processor: Apache FOP 2.9
        </fo:block>
        <fo:block font-family="Helvetica" font-size="10pt">
          Document Type: Custom XML
        </fo:block>
      </fo:block-container>
    </fo:flow>
  </fo:page-sequence>
</fo:root>`;

export default function XmlGenerator() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [xmlContent, setXmlContent] = useState(DEFAULT_XML_TEMPLATE);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleReset = () => {
    if (window.confirm('Reset XML editor to default template?')) {
      setXmlContent(DEFAULT_XML_TEMPLATE);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warn('Please enter a document title.');
      return;
    }
    if (!xmlContent.trim()) {
      toast.warn('Please enter some XSL-FO XML content.');
      return;
    }

    setIsGenerating(true);

    fetch('/api/documents/generate-from-xml', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        xmlContent: xmlContent,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || 'Failed to generate PDF');
        }
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.trim().replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span>XML PDF generated &amp; saved!</span>
          </div>
        );

        navigate('/history');
      })
      .catch((err) => {
        console.error(err);
        toast.error(err.message || 'Validation failed on the backend.');
      })
      .finally(() => {
        setIsGenerating(false);
      });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 border border-slate-200 bg-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <FileCode className="w-6 h-6 text-violet-600" />
              XML to PDF Generator
            </h1>
            <p className="text-sm text-slate-500">Design documents using Apache FOP and the XSL-FO vocabulary</p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden min-h-0 pb-4">
        {/* Left Side: XML Editor */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Enter Document Title (e.g. System Architecture Specification)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm font-semibold bg-white"
                required
              />
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="ml-4 p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white transition-all text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Template
            </button>
          </div>

          <div className="flex-1 relative min-h-0">
            <textarea
              value={xmlContent}
              onChange={(e) => setXmlContent(e.target.value)}
              className="w-full h-full p-4 font-mono text-sm text-slate-800 bg-slate-950 text-slate-100 focus:outline-none resize-none focus:ring-0"
              spellCheck="false"
              placeholder="<!-- Write your XSL-FO XML here -->"
            />
          </div>

          <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
            <button
              type="submit"
              disabled={isGenerating}
              className={`px-6 py-2.5 rounded-lg text-white font-semibold shadow-sm transition-all flex items-center gap-2 ${
                isGenerating
                  ? 'bg-violet-400 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-700 hover:shadow-violet-100'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Generate &amp; Save PDF
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Side: Quick Guide / XML documentation */}
        <div className="lg:col-span-5 flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-y-auto">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-violet-600" />
            XSL-FO Syntax Quick Guide
          </h2>
          <div className="space-y-4 text-sm text-slate-600">
            <p>
              Apache FOP accepts <strong>XSL-FO (XSL Formatting Objects)</strong> as input.
              XSL-FO is an XML vocabulary for formatting documents.
            </p>

            <div className="border-l-4 border-violet-500 bg-violet-50 p-3.5 rounded-r-lg">
              <h3 className="font-semibold text-violet-900 mb-1">Key Structure:</h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-violet-850">
                <li><code className="bg-violet-100 px-1 py-0.5 rounded font-mono">&lt;fo:root&gt;</code>: Root element</li>
                <li><code className="bg-violet-100 px-1 py-0.5 rounded font-mono">&lt;fo:layout-master-set&gt;</code>: Defines page layouts</li>
                <li><code className="bg-violet-100 px-1 py-0.5 rounded font-mono">&lt;fo:simple-page-master&gt;</code>: Sets page size &amp; margins</li>
                <li><code className="bg-violet-100 px-1 py-0.5 rounded font-mono">&lt;fo:page-sequence&gt;</code>: Ties content to layout</li>
                <li><code className="bg-violet-100 px-1 py-0.5 rounded font-mono">&lt;fo:flow&gt;</code>: Main content container</li>
              </ul>
            </div>

            <h3 className="font-bold text-slate-800 mt-6">Common Elements</h3>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="font-semibold text-slate-900 font-mono text-xs">&lt;fo:block&gt;</div>
                <div className="text-xs text-slate-500 mt-1">Acts like a paragraph. Supports attributes: font-family, font-size, font-weight, color, text-align, space-after.</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="font-semibold text-slate-900 font-mono text-xs">&lt;fo:block-container&gt;</div>
                <div className="text-xs text-slate-500 mt-1">A block container with styling options like border, background-color, padding, margins, and width/height.</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="font-semibold text-slate-900 font-mono text-xs">&lt;fo:table&gt; &amp; &lt;fo:table-row&gt;</div>
                <div className="text-xs text-slate-500 mt-1">Tables, rows, and columns for tabular layouts. Each cell contains standard blocks.</div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-yellow-50 border border-yellow-100 flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900 text-xs">Aesthetic Formatting Tip</h4>
                <p className="text-xs text-yellow-800 mt-1">
                  Ensure all elements and block structures are valid XML and namespaces match <code>"http://www.w3.org/1999/XSL/Format"</code> to prevent render failures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
