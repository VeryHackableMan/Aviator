
import React, { useState, useCallback } from 'react';
import InputForm from './components/InputForm';
import PredictionCard from './components/PredictionCard';
import { analyzeHistory } from './services/predictionService';
import { PredictionResult, PredictionCategory } from './types';
import { REQUIRED_HISTORY_LENGTH } from './constants';

const App: React.FC = () => {
  const [historyInput, setHistoryInput] = useState<string>('');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const validateAndParseInput = (input: string): number[] | null => {
    const values = input.split(',').map(val => val.trim()).filter(val => val !== ''); // Filter out empty strings from multiple commas
    
    if (values.length !== REQUIRED_HISTORY_LENGTH) {
      setError(`Please enter exactly ${REQUIRED_HISTORY_LENGTH} results separated by commas.`);
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

    setTimeout(() => {
      const parsedHistory = validateAndParseInput(historyInput);
      if (parsedHistory) {
        const result = analyzeHistory(parsedHistory);
        setPrediction(result);
      } else {
        setPrediction(null); // Ensure no old prediction shows if new input is invalid
      }
      setIsLoading(false);
    }, 700); // Simulate AI thinking
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
          Enter the last {REQUIRED_HISTORY_LENGTH} game multipliers to get a simulated AI prediction for the next round.
        </p>
      </header>

      <main className="w-full flex flex-col items-center space-y-8">
        <InputForm
          historyInput={historyInput}
          onInputChange={setHistoryInput}
          onSubmit={handlePredict}
          error={error}
          isLoading={isLoading}
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

        {!isLoading && !prediction && !error && (
             <div className="w-full max-w-md mt-0 p-6 sm:p-8 rounded-xl shadow-xl border-2 border-slate-700 bg-slate-800">
                <div className="flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-indigo-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.142.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.78.93l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0-.55.398-1.019.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.142-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.93l.15-.893Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-slate-200 mb-2 text-center">Ready to Predict</h3>
                <p className="text-md sm:text-lg text-slate-400 text-center">
                    Enter the last {REQUIRED_HISTORY_LENGTH} game multipliers in the form above and click "Analyze & Predict" to see the magic.
                </p>
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

export default App;
    