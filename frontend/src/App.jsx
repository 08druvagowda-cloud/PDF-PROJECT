import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import DocumentGenerator from './pages/DocumentGenerator';
import DocumentHistory from './pages/DocumentHistory';
import XmlGenerator from './pages/XmlGenerator';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/generate/:templateId" element={<DocumentGenerator />} />
            <Route path="/xml-generator" element={<XmlGenerator />} />
            <Route path="/history" element={<DocumentHistory />} />
          </Routes>
        </main>
        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </Router>
  );
}
