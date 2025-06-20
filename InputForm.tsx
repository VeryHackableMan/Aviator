
import React from 'react';
import { REQUIRED_HISTORY_LENGTH } from '../constants';

interface InputFormProps {
  historyInput: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  error?: string | null;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ historyInput, onInputChange, onSubmit, error, isLoading }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl space-y-6 border border-slate-700/50">
      <div>
        <label htmlFor="historyInput" className="block text-sm font-semibold text-slate-300 mb-1.5">
          Last {REQUIRED_HISTORY_LENGTH} Aviator Results
        </label>
        <p className="text-xs text-slate-400 mb-3">Enter values separated by commas (e.g., 1.03, 1.45, 2.10)</p>
        <input
          type="text"
          id="historyInput"
          name="historyInput"
          value={historyInput}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="e.g., 1.03, 1.45, 1.00, 2.10, 4.56, 1.24"
          className="mt-1 block w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-150 placeholder-slate-500"
          aria-describedby="history-error"
          disabled={isLoading}
        />
        {error && (
          <p id="history-error" className="mt-2 text-sm text-red-400 font-medium">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading || !historyInput.trim()}
        className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:bg-indigo-500/50 disabled:cursor-not-allowed transition-all duration-150 ease-in-out group"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
          <span className="mr-2">🔮</span> Analyze & Predict
          </>
        )}
      </button>
    </form>
  );
};

export default InputForm;
    