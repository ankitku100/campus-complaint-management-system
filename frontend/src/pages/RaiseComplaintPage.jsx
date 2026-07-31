import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input, TextArea, Select } from '../components/FormControls';
import { FileUpload } from '../components/FileUpload';
import { FiAlertCircle, FiCpu, FiCheck } from 'react-icons/fi';
import { getCategoriesRequest } from '../services/categoryService';

export const RaiseComplaintPage = () => {
  const { addComplaint } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Simulated AI Priority Detection State
  const [aiDetectedPriority, setAiDetectedPriority] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategoriesRequest();
        setCategories(data);
        if (data.length > 0) {
          setCategory(data[0].name);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
        const defaults = ['Hostel', 'Academic', 'Infrastructure', 'IT Services', 'Security', 'Other'];
        setCategories(defaults.map((c, i) => ({ id: i.toString(), name: c })));
        setCategory(defaults[0]);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const textToScan = `${title} ${description}`.toLowerCase();
    
    if (textToScan.includes('fire') || textToScan.includes('critical') || textToScan.includes('broken pipe') || textToScan.includes('pipe burst')) {
      setAiDetectedPriority('Critical');
    } else if (textToScan.includes('leak') || textToScan.includes('electricity') || textToScan.includes('power cut') || textToScan.includes('stolen') || textToScan.includes('theft')) {
      setAiDetectedPriority('High');
    } else if (textToScan.includes('wifi') || textToScan.includes('internet') || textToScan.includes('air conditioning') || textToScan.includes('ac not working')) {
      setAiDetectedPriority('Medium');
    } else if (textToScan.length > 5) {
      setAiDetectedPriority('Low');
    } else {
      setAiDetectedPriority(null);
    }
  }, [title, description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (title.trim().length < 3) {
      setError('Complaint Title must be at least 3 characters long.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Detailed Description must be at least 10 characters long.');
      return;
    }
    if (location.trim().length < 2) {
      setError('Specific Location must be at least 2 characters long.');
      return;
    }
    setError('');
    setLoading(true);

    const complaintData = {
      title,
      description,
      category,
      priority,
      location,
      images: image ? [image] : []
    };

    try {
      const newComplaint = await addComplaint(complaintData);
      setLoading(false);
      navigate(`/complaints/${newComplaint.id}`);
    } catch (requestError) {
      setLoading(false);
      setError(requestError.response?.data?.message || 'Unable to submit complaint.');
    }
  };

  const applyAiPriority = () => {
    if (aiDetectedPriority) {
      setPriority(aiDetectedPriority);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Raise a Complaint
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Submit details about the issue you are facing. Our system will route it to the appropriate maintenance staff.
        </p>
      </div>

      <Card variant="dark" className="border border-slate-800 p-6 sm:p-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <FiAlertCircle className="text-lg flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Complaint Title *"
            type="text"
            placeholder="e.g., Water leakage in washroom"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* AI Priority Recommendation Bar */}
          {aiDetectedPriority && aiDetectedPriority !== priority && (
            <div className="bg-neon/5 border border-neon/20 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-slate-350">
              <div className="flex items-center gap-2">
                <FiCpu className="text-neon text-lg animate-pulse" />
                <span>
                  AI Suggestion: Based on your description, we recommend setting priority to{' '}
                  <span className="text-neon font-black uppercase">{aiDetectedPriority}</span>.
                </span>
              </div>
              <button
                type="button"
                onClick={applyAiPriority}
                className="bg-neon text-slate-900 font-bold px-3 py-1.5 rounded-lg hover:bg-neon-dark transition-all flex items-center gap-1 flex-shrink-0"
              >
                Apply <FiCheck className="text-xs" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categories.map(c => c.name)}
            />

            <Select
              label="Priority Level"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={['Low', 'Medium', 'High', 'Critical']}
            />
          </div>

          <Input
            label="Specific Location *"
            type="text"
            placeholder="e.g., Hostel B, 2nd Floor, Room 204"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />

          <TextArea
            label="Detailed Description *"
            placeholder="Please explain the issue. Mention any helpful details for the repair technician..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
          />

          <FileUpload
            label="Upload Visual Evidence"
            value={image}
            onFileSelect={setImage}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="neon"
              loading={loading}
            >
              Submit Ticket
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
