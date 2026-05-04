import React, { useState, useRef } from 'react';
import { UploadCloud, FileText } from 'lucide-react';

export default function FastaUpload({ label, onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
          isDragging 
            ? 'border-emerald-500 bg-emerald-500/10' 
            : fileName 
              ? 'border-indigo-500/50 bg-indigo-500/5 hover:border-indigo-500' 
              : 'border-slate-600 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-800'
        }`}
      >
        <input 
          type="file" 
          accept=".fasta,.txt,.fa" 
          ref={fileInputRef} 
          onChange={handleChange} 
          className="hidden" 
        />
        
        {fileName ? (
          <div className="flex items-center gap-2 text-indigo-300">
            <FileText className="w-5 h-5" />
            <span className="text-sm font-medium truncate max-w-[200px]">{fileName}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <UploadCloud className="w-6 h-6 mb-1 opacity-70" />
            <span className="text-xs font-medium text-center">
              Drag & Drop or <span className="text-indigo-400">Browse</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
