import React, { useEffect, useRef } from 'react';

export default function DocumentPreview({ htmlTemplate, fieldValues }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!htmlTemplate) return;

    // Substitute placeholders
    let filledHtml = htmlTemplate;
    for (const [key, value] of Object.entries(fieldValues)) {
      const placeholder = `{{${key}}}`;
      filledHtml = filledHtml.replaceAll(placeholder, value || '');
    }

    // Clean up remaining unresolved placeholders
    filledHtml = filledHtml.replace(/\{\{.*?\}\}/g, '');

    // Write to the iframe document
    const iframe = iframeRef.current;
    if (iframe) {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(filledHtml);
      doc.close();
    }
  }, [htmlTemplate, fieldValues]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Live Preview</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-slate-500 font-medium">Synchronized</span>
        </div>
      </div>
      <div className="flex-1 bg-slate-100 p-4 min-h-[500px]">
        {htmlTemplate ? (
          <iframe
            ref={iframeRef}
            title="Document Live Preview"
            className="w-full h-full border border-slate-200 rounded-lg bg-white shadow-sm"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">
            Select a template and start typing to view preview
          </div>
        )}
      </div>
    </div>
  );
}
