import { useState } from 'react';
import Button from '@/components/Button';

export default function AddScheduleModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    teams: '',
    dateTime: '',
    location: '',
    sport: '',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Add Schedule</h2>

        <div className="space-y-4">
          <input
            name="teams"
            placeholder="Teams (e.g. NYU vs Columbia)"
            className="w-full border rounded px-3 py-2"
            value={form.teams}
            onChange={handleChange}
          />

          <input
            name="dateTime"
            type="datetime-local"
            className="w-full border rounded px-3 py-2"
            value={form.dateTime}
            onChange={handleChange}
          />

          <input
            name="location"
            placeholder="Location"
            className="w-full border rounded px-3 py-2"
            value={form.location}
            onChange={handleChange}
          />

          <input
            name="sport"
            placeholder="Sport"
            className="w-full border rounded px-3 py-2"
            value={form.sport}
            onChange={handleChange}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
