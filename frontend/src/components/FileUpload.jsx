import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiFile, FiX, FiCheck } from 'react-icons/fi';

export const FileUpload = ({
  onFileSelect,
  value = '',
  accept = 'image/*',
  maxSizeMB = 2,
  label = 'Upload attachment (max 2MB)'
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;

    // Validate type
    if (accept.includes('image') && !file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds the ${maxSizeMB}MB limit.`);
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      onFileSelect(uploadEvent.target.result); // Base64 data URL
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const removeFile = () => {
    onFileSelect('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </label>

      {value ? (
        /* Image Preview Box */
        <div className="relative border border-slate-800 bg-slate-900 rounded-xl overflow-hidden p-2 group">
          <img
            src={value}
            alt="Upload Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={removeFile}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              title="Remove File"
            >
              <FiX className="text-lg" />
            </button>
            <div className="flex items-center gap-1 bg-neon/25 text-neon border border-neon/50 px-2.5 py-1.5 rounded-lg text-xs font-semibold">
              <FiCheck /> Uploaded
            </div>
          </div>
        </div>
      ) : (
        /* Drag and Drop Zone */
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
          className={`
            border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200
            ${dragActive ? 'border-neon bg-neon/5 shadow-glow' : 'border-slate-800 hover:border-neon hover:bg-slate-900/50'}
            ${error ? 'border-red-500/50 hover:border-red-500' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />

          <FiUploadCloud className={`text-4xl mb-3 ${dragActive ? 'text-neon animate-bounce' : 'text-slate-500'}`} />

          <p className="text-sm font-semibold text-white mb-1">
            Drag and drop your file here, or <span className="text-neon underline">browse</span>
          </p>
          <p className="text-xs text-slate-400">
            Supports JPEG, PNG, WEBP (Max {maxSizeMB}MB)
          </p>

          {error && (
            <p className="text-xs text-red-400 font-semibold mt-2 bg-red-500/10 border border-red-500/25 px-2.5 py-1 rounded-md">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
