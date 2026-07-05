import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import DynamicForm from '../components/DynamicForm';
import DocumentPreview from '../components/DocumentPreview';

export default function DocumentGenerator() {
  const { templateId } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState(null);
  const [fields, setFields] = useState([]);
  const [htmlTemplate, setHtmlTemplate] = useState('');
  const [fieldValues, setFieldValues] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch all templates to extract metadata for this template
    fetch('/api/templates')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch templates');
        return res.json();
      })
      .then(data => {
        const found = data.find(t => t.id === templateId);
        if (!found) throw new Error('Template not found');
        setTemplate(found);
      })
      .catch(err => {
        console.error(err);
        toast.error('Could not find template metadata.');
      });

    // 2. Fetch template fields config
    const fetchFields = fetch(`/api/templates/${templateId}/fields`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch fields');
        return res.json();
      })
      .then(data => setFields(data));

    // 3. Fetch raw HTML layout
    const fetchHtml = fetch(`/api/templates/${templateId}/html`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch HTML layout');
        return res.text();
      })
      .then(data => setHtmlTemplate(data));

    Promise.all([fetchFields, fetchHtml])
      .then(() => setLoading(false))
      .catch(err => {
        console.error(err);
        toast.error('Failed to load template resources.');
        setLoading(false);
      });
  }, [templateId]);

  const handleFormChange = (values) => {
    setFieldValues(values);
  };

  const handleSubmit = (values) => {
    setIsGenerating(true);
    
    // POST Request to generate PDF
    fetch('/api/documents/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId: templateId,
        fieldValues: values,
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
        // Create download link for PDF
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${templateId}_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span>Document generated &amp; saved!</span>
          </div>
        );

        // Redirect to history page
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

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
              <FileText className="w-6 h-6 text-emerald-600" />
              {template?.name || 'Generate Document'}
            </h1>
            <p className="text-sm text-slate-500">{template?.description}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden min-h-0 pb-4">
        {/* Left Form: Column width 5 */}
        <div className="lg:col-span-5 overflow-y-auto pr-2">
          <DynamicForm
            templateId={templateId}
            fields={fields}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            isGenerating={isGenerating}
          />
        </div>

        {/* Right Preview: Column width 7 */}
        <div className="lg:col-span-7 h-full">
          <DocumentPreview
            htmlTemplate={htmlTemplate}
            fieldValues={fieldValues}
          />
        </div>
      </div>
    </div>
  );
}
