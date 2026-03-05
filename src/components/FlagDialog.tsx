import React, { useState } from 'react';
import { X } from 'lucide-react';
import { FLAG_REASONS, NewFlag } from '../types/comment';

interface FlagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (flag: NewFlag) => void;
}

export const FlagDialog: React.FC<FlagDialogProps> = ({ isOpen, onClose, onSubmit }) => {
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason) return;
    const flag: NewFlag = {
      reason: reason as NewFlag['reason'],
      ...(details.trim() && { details: details.trim() }),
    };
    onSubmit(flag);
    setReason('');
    setDetails('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Flag Comment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {FLAG_REASONS.map((r) => (
            <label key={r.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="flag-reason"
                value={r.value}
                checked={reason === r.value}
                onChange={(e) => setReason(e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700">{r.label}</span>
            </label>
          ))}
        </div>

        {reason === 'other' && (
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Please provide details..."
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="flag-details"
          />
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || (reason === 'other' && !details.trim())}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            Submit Flag
          </button>
        </div>
      </div>
    </div>
  );
};
