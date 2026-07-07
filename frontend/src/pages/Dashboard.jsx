import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, FileCheck, FileCode, Landmark, FileSpreadsheet } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/templates')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch templates');
        return res.json();
      })
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Could not load templates. Make sure the backend is running!');
        setLoading(false);
      });
  }, []);

  const getTemplateIcon = (id) => {
    switch (id) {
      case 'invoice':
        return <FileCheck className="w-6 h-6 text-blue-600" />;
      case 'quotation':
        return <FileCode className="w-6 h-6 text-teal-600" />;
      case 'student_application':
        return <Landmark className="w-6 h-6 text-indigo-600" />;
      case 'salary_slip':
        return <FileSpreadsheet className="w-6 h-6 text-emerald-600" />;
      default:
        return <FileCheck className="w-6 h-6 text-slate-600" />;
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Document Templates</h1>
          <p className="mt-2 text-slate-500">Select a template to generate dynamically formatted invoices, quotations, application forms, or payslips.</p>
        </div>
        
        <div className="relative max-w-md w-full md:w-80">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-500 font-medium italic">No templates found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 shadow-sm">
                    {getTemplateIcon(template.id)}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-800">{template.name}</h2>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                      ID: {template.id}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  {template.description}
                </p>

                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Input Fields</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {template.fields?.slice(0, 5).map(f => (
                      <span key={f.name} className="text-xs px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-150">
                        {f.label}
                      </span>
                    ))}
                    {template.fields?.length > 5 && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 font-medium">
                        +{template.fields.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/generate/${template.id}`)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all"
              >
                Use Template
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}

          {(!searchTerm || 'xml to pdf custom fo apache fop'.includes(searchTerm.toLowerCase())) && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border-violet-100 hover:border-violet-300">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-violet-50 rounded-lg border border-violet-100 shadow-sm">
                    <FileCode className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-800">XML to PDF (Custom FO)</h2>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-750 rounded-full border border-violet-200">
                      ID: xml_custom
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  Create a custom PDF document by supplying your own XML formatted with standard XSL-FO elements. Powered by Apache FOP engine.
                </p>

                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Input Fields</h4>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-150">
                      Document Title
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-150 font-mono">
                      XSL-FO XML
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/xml-generator')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-violet-200 rounded-lg text-sm font-semibold text-violet-700 hover:text-violet-600 hover:border-violet-500 hover:bg-violet-50/20 transition-all"
              >
                Use XML Input
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
