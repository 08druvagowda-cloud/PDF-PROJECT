import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, FileText, Calendar, Filter, X } from 'lucide-react';
import { toast } from 'react-toastify';

export default function DocumentHistory() {
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [filterTemplate, setFilterTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null); // For viewing metadata detail

  // Fetch templates for the dropdown filter options
  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => setTemplates(data))
      .catch(err => console.error(err));
  }, []);

  // Fetch history list
  const fetchHistory = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (filterTemplate) query.append('templateId', filterTemplate);
    if (search) query.append('search', search);

    fetch(`/api/documents?${query.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch document history');
        return res.json();
      })
      .then(data => {
        setDocuments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load document history log.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, [filterTemplate, search]);

  const handleDownload = (id, templateName, docNumber) => {
    fetch(`/api/documents/${id}/download`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to download PDF');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanNumber = String(docNumber).replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `${templateName.replace(/\s+/g, '_')}_${cleanNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('PDF download started!');
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to download document PDF file.');
      });
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Convert raw json metadata to a readable list
  const renderMetadata = (jsonString) => {
    try {
      const data = JSON.parse(jsonString || '{}');
      return (
        <div className="space-y-3">
          {Object.entries(data).map(([key, value]) => {
            // camelCase to title conversion
            const label = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase());
            return (
              <div key={key} className="border-b border-slate-100 pb-2 flex flex-col">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
                <span className="text-sm font-medium text-slate-800 whitespace-pre-wrap mt-0.5">{String(value)}</span>
              </div>
            );
          })}
        </div>
      );
    } catch (e) {
      return <span className="text-slate-500 italic">No structured data available</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Document History</h1>
        <p className="mt-2 text-slate-500">View logs of all generated documents, inspect filled data payloads, and re-download PDFs.</p>
      </div>

      {/* Filters Row */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by client or document number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* Template Filter */}
          <div className="relative w-full md:w-60">
            <select
              value={filterTemplate}
              onChange={(e) => setFilterTemplate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 bg-white appearance-none cursor-pointer text-slate-700 font-medium"
            >
              <option value="">All Template Types</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <button
          onClick={fetchHistory}
          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50/50 border border-emerald-200/50 hover:bg-emerald-50 rounded-lg px-4 py-2 transition-all w-full md:w-auto"
        >
          Refresh Log
        </button>
      </div>

      {/* History Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium italic">No generated documents found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-250">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Template Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Document No.</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Client / Beneficiary</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Generated At</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                      #{doc.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {doc.templateName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                      {doc.documentNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-semibold">
                      {doc.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 flex items-center gap-1.5 pt-4">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-700 border border-slate-200 bg-white transition-colors flex items-center gap-1 text-xs"
                          title="View Data Payload"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Data
                        </button>
                        <button
                          onClick={() => handleDownload(doc.id, doc.templateName, doc.documentNumber)}
                          className="p-1.5 hover:bg-emerald-50 rounded-md text-emerald-600 hover:text-emerald-700 border border-emerald-200 bg-white transition-colors flex items-center gap-1 text-xs font-semibold"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Data Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Submitted Metadata</h3>
                <p className="text-xs text-slate-500">Record #{selectedDoc.id} &bull; {selectedDoc.templateName}</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {renderMetadata(selectedDoc.metadataJson)}
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-sm font-semibold text-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
