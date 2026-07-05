import React, { useState, useEffect } from 'react';

export default function DynamicForm({ templateId, fields, onChange, onSubmit, isGenerating }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  // Initialize form data when fields load
  useEffect(() => {
    const initialData = {};
    fields.forEach(field => {
      initialData[field.name] = '';
    });
    setFormData(initialData);
    setErrors({});
  }, [fields]);

  // Handle calculations for computed fields
  const handleCalculations = (newData) => {
    const calculatedData = { ...newData };

    if (templateId === 'invoice') {
      const qty = parseFloat(calculatedData.quantity) || 0;
      const price = parseFloat(calculatedData.unitPrice) || 0;
      calculatedData.totalAmount = (qty * price).toFixed(2);
    } else if (templateId === 'salary_slip') {
      const basic = parseFloat(calculatedData.salary) || 0;
      const allowance = parseFloat(calculatedData.bonus) || 0;
      const deduct = parseFloat(calculatedData.deductions) || 0;
      calculatedData.netSalary = (basic + allowance - deduct).toFixed(2);
    }

    return calculatedData;
  };

  const validateField = (name, value, fieldConfig) => {
    let errorMsg = '';
    const strVal = String(value || '').trim();

    if (fieldConfig.required && !strVal) {
      errorMsg = `${fieldConfig.label} is required`;
    } else if (strVal) {
      if (fieldConfig.type === 'email') {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(strVal)) {
          errorMsg = 'Please enter a valid email address';
        }
      } else if (fieldConfig.type === 'phone') {
        const phoneRegex = /^\+?[0-9\s\-()]{10,20}$/;
        if (!phoneRegex.test(strVal)) {
          errorMsg = 'Please enter a valid phone number';
        }
      } else if (fieldConfig.type === 'number') {
        if (isNaN(Number(strVal))) {
          errorMsg = `${fieldConfig.label} must be a number`;
        }
      }

      // Custom Regex check
      if (fieldConfig.validationRegex) {
        const customRegex = new RegExp(fieldConfig.validationRegex);
        if (!customRegex.test(strVal)) {
          errorMsg = fieldConfig.validationMessage || `${fieldConfig.label} format is invalid`;
        }
      }
    }

    return errorMsg;
  };

  const handleChange = (name, value) => {
    const fieldConfig = fields.find(f => f.name === name);
    const errorMsg = validateField(name, value, fieldConfig);

    setErrors(prev => ({
      ...prev,
      [name]: errorMsg
    }));

    setFormData(prev => {
      let updated = { ...prev, [name]: value };
      updated = handleCalculations(updated);
      
      // Notify parent of updated values for live preview
      onChange(updated);
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields before submitting
    const newErrors = {};
    fields.forEach(field => {
      const errorMsg = validateField(field.name, formData[field.name], field);
      if (errorMsg) {
        newErrors[field.name] = errorMsg;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="space-y-4">
        {fields.map((field) => {
          const isCalculated = 
            (templateId === 'invoice' && field.name === 'totalAmount') ||
            (templateId === 'salary_slip' && field.name === 'netSalary');

          return (
            <div key={field.name} className="flex flex-col">
              <label htmlFor={field.name} className="text-sm font-medium text-slate-700 mb-1 flex items-center">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    errors[field.name]
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-slate-300 focus:ring-emerald-200 focus:border-emerald-500'
                  }`}
                  rows={3}
                />
              ) : (
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type === 'phone' ? 'text' : field.type}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  disabled={isCalculated}
                  className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    isCalculated
                      ? 'bg-slate-50 border-slate-200 text-slate-700 font-semibold cursor-not-allowed'
                      : errors[field.name]
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-slate-300 focus:ring-emerald-200 focus:border-emerald-500'
                  }`}
                />
              )}

              {errors[field.name] && (
                <span className="text-xs text-red-500 mt-1">{errors[field.name]}</span>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={isGenerating}
        className="w-full py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        {isGenerating ? 'Generating PDF...' : 'Generate PDF'}
      </button>
    </form>
  );
}
