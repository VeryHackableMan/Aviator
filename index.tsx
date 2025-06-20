
import React, { useState, useCallback, FC, FormEvent, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// --- START OF types.ts content ---
enum PredictionCategory {
  BREAKOUT = 'BREAKOUT',
  COOLDOWN = 'COOLDOWN',
  STABLE = 'STABLE',
  LOW = 'LOW',
  NONE = 'NONE',
}

interface PredictionResult {
  category: PredictionCategory;
  range: string;
  label: string;
  colorClass: string;
  textColorClass: string;
  borderColorClass: string;
}
// --- END OF types.ts content ---

// --- START OF constants.ts content ---
const PREDICTION_RULES = {
  BREAKOUT_THRESHOLD_COUNT_LT_2X: 5, // Requires at least 5 values in history
  BREAKOUT_THRESHOLD_COUNT_LTE_1_2X: 2,
  COOLDOWN_THRESHOLD_GT_5X: 5,
  STABLE_LOWER_BOUND: 2,
  STABLE_UPPER_BOUND: 4,
  STABLE_HISTORY_COUNT: 3, // Requires at least 3 values in history
};

// This constant is still useful for default text or if we want a "max" history length concept.
// However, selectedHistoryLength state will primarily drive the logic.
const DEFAULT_HISTORY_LENGTH = 6;


const PREDICTION_DETAILS: Record<PredictionCategory, Omit<PredictionResult, 'category'>> = {
  [PredictionCategory.BREAKOUT]: {
    range: '3.00x – 8.00x',
    label: 'Breakout Likely!',
    colorClass: 'bg-green-800/40',
    textColorClass: 'text-green-300',
    borderColorClass: 'border-green-500',
  },
  [PredictionCategory.COOLDOWN]: {
    range: '1.10x – 2.00x',
    label: 'Cooldown Period',
    colorClass: 'bg-red-800/40',
    textColorClass: 'text-red-300',
    borderColorClass: 'border-red-500',
  },
  [PredictionCategory.STABLE]: {
    range: '2.00x – 4.00x',
    label: 'Stable Pattern',
    colorClass: 'bg-blue-800/40',
    textColorClass: 'text-blue-300',
    borderColorClass: 'border-blue-500',
  },
  [PredictionCategory.LOW]: {
    range: '1.10x – 1.80x',
    label: 'Low Multiplier Expected',
    colorClass: 'bg-yellow-800/40',
    textColorClass: 'text-yellow-300',
    borderColorClass: 'border-yellow-500',
  },
  [PredictionCategory.NONE]: {
    range: 'N/A',
    label: 'Enter history to predict',
    colorClass: 'bg-slate-700',
    textColorClass: 'text-slate-300',
    borderColorClass: 'border-slate-600',
  },
};
// --- END OF constants.ts content ---

// --- START OF services/predictionService.ts content ---
const analyzeHistory = (history: number[]): PredictionResult => {
  const currentHistoryLength = history.length;

  // Basic validation: requires at least 2 results for meaningful (albeit limited) analysis
  if (currentHistoryLength < 2) {
    // This case should ideally be caught by input validation before calling analyzeHistory
    return { category: PredictionCategory.LOW, ...PREDICTION_DETAILS[PredictionCategory.LOW] };
  }

  const lastValue = history[history.length - 1];

  // Rule: Cooldown (If last value > 5x → Predict cooldown (1.10x–2.0x))
  // This rule takes precedence and can apply to any history length >= 1 (but we require >=2).
  if (lastValue > PREDICTION_RULES.COOLDOWN_THRESHOLD_GT_5X) {
    return { category: PredictionCategory.COOLDOWN, ...PREDICTION_DETAILS[PredictionCategory.COOLDOWN] };
  }

  // Rule: Breakout (If 5 or more values are < 2x and at least 2 are ≤ 1.20x → Predict breakout (3x–8x))
  // Only applicable if history length allows for this many checks (i.e., >= 5).
  if (currentHistoryLength >= PREDICTION_RULES.BREAKOUT_THRESHOLD_COUNT_LT_2X) {
    const countLessThan2x = history.filter(val => val < 2).length;
    const countLessThanOrEqualTo1_20x = history.filter(val => val <= 1.20).length;

    if (countLessThan2x >= PREDICTION_RULES.BREAKOUT_THRESHOLD_COUNT_LT_2X &&
        countLessThanOrEqualTo1_20x >= PREDICTION_RULES.BREAKOUT_THRESHOLD_COUNT_LTE_1_2X) {
      return { category: PredictionCategory.BREAKOUT, ...PREDICTION_DETAILS[PredictionCategory.BREAKOUT] };
    }
  }
  
  // Rule: Stable (If last N values (defined by STABLE_HISTORY_COUNT) are between 2x and 4x → Predict stable (2.0x–4.0x))
  // Only applicable if history length is at least STABLE_HISTORY_COUNT.
  if (currentHistoryLength >= PREDICTION_RULES.STABLE_HISTORY_COUNT) {
    const lastNValuesForStableRule = history.slice(-PREDICTION_RULES.STABLE_HISTORY_COUNT);
    // Ensure we actually have enough elements after slicing, though currentHistoryLength check should cover this.
    if (lastNValuesForStableRule.length === PREDICTION_RULES.STABLE_HISTORY_COUNT) {
        const areLastNStable = lastNValuesForStableRule.every(
            val => val >= PREDICTION_RULES.STABLE_LOWER_BOUND && val <= PREDICTION_RULES.STABLE_UPPER_BOUND
        );
        if (areLastNStable) {
            return { category: PredictionCategory.STABLE, ...PREDICTION_DETAILS[PredictionCategory.STABLE] };
        }
    }
  }

  // Fallback Rule: Low (Otherwise → Predict low (1.10x–1.80x))
  return { category: PredictionCategory.LOW, ...PREDICTION_DETAILS[PredictionCategory.LOW] };
};
// --- END OF services/predictionService.ts content ---

// --- START OF components/InputForm.tsx content ---
interface InputFormProps {
  historyInput: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  error?: string | null;
  isLoading: boolean;
  selectedHistoryLength: number;
  onHistoryLengthChange: (length: number) => void;
}

const InputForm: FC<InputFormProps> = ({ 
    historyInput, 
    onInputChange, 
    onSubmit, 
    error, 
    isLoading,
    selectedHistoryLength,
    onHistoryLengthChange
}) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const historyLengthOptions = [2, 3, 6];

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl space-y-6 border border-slate-700/50">
      <fieldset>
        <legend className="block text-sm font-semibold text-slate-300 mb-2">
          Number of Past Results to Analyze:
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {historyLengthOptions.map((len) => (
            <div key={len} className="flex items-center">
              <input
                id={`historyLength-${len}`}
                name="historyLength"
                type="radio"
                value={len}
                checked={selectedHistoryLength === len}
                onChange={() => onHistoryLengthChange(len)}
                className="h-4 w-4 text-indigo-600 border-slate-500 focus:ring-indigo-500 bg-slate-700 cursor-pointer"
                disabled={isLoading}
              />
              <label htmlFor={`historyLength-${len}`} className="ml-2 block text-sm text-slate-300 cursor-pointer">
                {len} results
              </label>
            </div>
          ))}
        </div>
      </fieldset>
      
      <div>
        <label htmlFor="historyInput" className="block text-sm font-semibold text-slate-300 mb-1.5">
          Last {selectedHistoryLength} Aviator Results
        </label>
        <p className="text-xs text-slate-400 mb-3">Enter values separated by commas (e.g., 1.03, 1.45, 2.10)</p>
        <input
          type="text"
          id="historyInput"
          name="historyInput"
          value={historyInput}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={`e.g., ${Array(selectedHistoryLength).fill(0).map((_,i) => (1 + Math.random()).toFixed(2)).join(', ')}`}
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
// --- END OF components/InputForm.tsx content ---

// --- START OF components/PredictionCard.tsx content ---
interface PredictionCardProps {
  prediction: PredictionResult;
}

const PredictionCard: FC<PredictionCardProps> = ({ prediction }) => {
  return (
    <div className={`w-full max-w-md mt-0 p-6 sm:p-8 rounded-xl shadow-xl border-2 ${prediction.borderColorClass} ${prediction.colorClass} transition-all duration-300 ease-in-out transform hover:scale-[1.02]`}>
      <h3 className={`text-xl sm:text-2xl font-semibold ${prediction.textColorClass} mb-2 flex items-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 mr-2 opacity-80">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.875 9l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 1.875l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.125 9l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.25 10.5h1.5m.75 4.5h-1.5m1.5 0a3 3 0 0 0-3-3m0 0a3 3 0 0 0-3 3m3-3V1.5m0 9V7.5M3 12h1.5m.75 4.5H3m5.25 0V18m0-3.75a3 3 0 0 0-3-3m0 0a3 3 0 0 0-3 3m3-3V6.75m0 9v-5.25" />
        </svg>
        AI Prediction:
      </h3>
      <p className={`text-3xl sm:text-4xl font-bold ${prediction.textColorClass} mb-1 drop-shadow-md`}>
        {prediction.range}
      </p>
      <p className={`text-md sm:text-lg font-medium ${prediction.textColorClass} opacity-90`}>
        ({prediction.label})
      </p>
    </div>
  );
};
// --- END OF components/PredictionCard.tsx content ---

// --- START OF App.tsx content ---
const App: FC = () => {
  const [historyInput, setHistoryInput] = useState<string>('');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedHistoryLength, setSelectedHistoryLength] = useState<number>(DEFAULT_HISTORY_LENGTH);
  
  const [showFeedbackOptions, setShowFeedbackOptions] = useState<boolean>(false);
  const [lastPredictionForFeedback, setLastPredictionForFeedback] = useState<PredictionResult | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);


  const handleHistoryLengthChange = (length: number) => {
    setSelectedHistoryLength(length);
    setHistoryInput(''); // Clear input when length changes
    setError(null);
    setPrediction(null);
    setShowFeedbackOptions(false);
    setFeedbackMessage(null);
  };

  const validateAndParseInput = (input: string): number[] | null => {
    const values = input.split(',').map(val => val.trim()).filter(val => val !== '');
    
    if (values.length !== selectedHistoryLength) {
      setError(`Please enter exactly ${selectedHistoryLength} results separated by commas.`);
      return null;
    }

    const numbers = values.map(val => parseFloat(val));
    if (numbers.some(isNaN)) {
      setError('Invalid input. Please ensure all values are numbers (e.g., 1.03, 2.5).');
      return null;
    }
    if (numbers.some(num => num < 0)) {
        setError('Multiplier values cannot be negative.');
        return null;
    }
     if (numbers.some(num => num === 0)) {
        setError('Multiplier values must be greater than 0 (typically >= 1.00).');
        return null;
    }

    setError(null);
    return numbers;
  };

  const handlePredict = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setPrediction(null); 
    setShowFeedbackOptions(false);
    setFeedbackMessage(null);

    setTimeout(() => {
      const parsedHistory = validateAndParseInput(historyInput);
      if (parsedHistory) {
        const result = analyzeHistory(parsedHistory);
        setPrediction(result);
        setLastPredictionForFeedback(result); // Store for feedback
        setShowFeedbackOptions(true); // Show feedback options
      } else {
        setPrediction(null);
        setShowFeedbackOptions(false);
      }
      setIsLoading(false);
    }, 700);
  }, [historyInput, selectedHistoryLength]);

  const handleFeedback = (wasCorrect: boolean) => {
    // For now, just display a message. Could be extended later.
    setFeedbackMessage(wasCorrect ? "Thanks! Glad the AI was on point." : "Thanks for the feedback! The AI is always learning (figuratively!).");
    setShowFeedbackOptions(false); // Hide feedback options after submission
    // Optionally, clear lastPredictionForFeedback if not needed anymore
    // setLastPredictionForFeedback(null);
    setTimeout(() => setFeedbackMessage(null), 3000); // Clear message after a few seconds
  };

  useEffect(() => {
    // Clear prediction and feedback when history input changes
    setPrediction(null);
    setShowFeedbackOptions(false);
    setFeedbackMessage(null);
    setError(null); // Also clear error when input changes
  }, [historyInput]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <header className="mb-8 sm:mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Aviator AI
          </span>
          <span className="block sm:inline text-slate-300"> Predictor</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-xl mx-auto">
          Enter the last game multipliers to get a simulated AI prediction for the next round. Select how many results to analyze below.
        </p>
      </header>

      <main className="w-full flex flex-col items-center space-y-8">
        <InputForm
          historyInput={historyInput}
          onInputChange={setHistoryInput}
          onSubmit={handlePredict}
          error={error}
          isLoading={isLoading}
          selectedHistoryLength={selectedHistoryLength}
          onHistoryLengthChange={handleHistoryLengthChange}
        />
        
        {isLoading && (
            <div className="w-full max-w-md mt-0 p-6 sm:p-8 rounded-xl shadow-xl border-2 border-slate-700 bg-slate-800/80 flex flex-col items-center justify-center animate-pulse">
                <svg className="animate-spin h-10 w-10 text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg text-slate-400">Analyzing patterns...</p>
            </div>
        )}

        {!isLoading && prediction && prediction.category !== PredictionCategory.NONE && (
          <PredictionCard prediction={prediction} />
        )}
        
        {/* Initial "Ready to Predict" state or message after feedback */}
        {!isLoading && !prediction && !error && !feedbackMessage && (
             <div className="w-full max-w-md mt-0 p-6 sm:p-8 rounded-xl shadow-xl border-2 border-slate-700 bg-slate-800">
                <div className="flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-indigo-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.142.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.78.93l-.15.894c-.09.542-.56.94-1.11-.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0-.55.398-1.019.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.142-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.93l.15-.893Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-slate-200 mb-2 text-center">Ready to Predict</h3>
                <p className="text-md sm:text-lg text-slate-400 text-center">
                    Select the number of past results, enter them above, and click "Analyze & Predict".
                </p>
            </div>
        )}
        
        {/* Feedback Section */}
        {!isLoading && showFeedbackOptions && lastPredictionForFeedback && (
          <div className="w-full max-w-md p-6 rounded-xl shadow-lg border border-slate-700/50 bg-slate-800 transition-all duration-300 ease-in-out">
            <h4 className="text-lg font-semibold text-slate-200 mb-3">Feedback on AI Prediction:</h4>
            <p className="text-sm text-slate-400 mb-1">AI Predicted: <span className={`font-semibold ${lastPredictionForFeedback.textColorClass}`}>{lastPredictionForFeedback.range} ({lastPredictionForFeedback.label})</span></p>
            <p className="text-sm text-slate-400 mb-4">Was this prediction accurate for the actual game round that followed?</p>
            <div className="flex space-x-3 sm:space-x-4">
              <button
                onClick={() => handleFeedback(true)}
                aria-label="Prediction was accurate"
                className="flex-1 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500 transition-colors"
              >
                👍 Yes, Accurate!
              </button>
              <button
                onClick={() => handleFeedback(false)}
                aria-label="Prediction was not accurate"
                className="flex-1 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-500 transition-colors"
              >
                👎 No, Different
              </button>
            </div>
          </div>
        )}

        {/* Display feedback message */}
        {feedbackMessage && (
            <div className="w-full max-w-md mt-0 p-4 rounded-xl shadow-lg border border-indigo-700 bg-indigo-800/50 text-center">
                <p className="text-sm text-indigo-200">{feedbackMessage}</p>
            </div>
        )}

      </main>

      <footer className="mt-10 sm:mt-16 text-center text-slate-500 text-xs sm:text-sm">
        <p>&copy; {new Date().getFullYear()} Aviator AI Predictor. For entertainment purposes only.</p>
        <p>This simulation uses simple rule-based logic and does not guarantee any real game outcomes.</p>
      </footer>
    </div>
  );
};
// --- END OF App.tsx content ---

// Mount the app
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
