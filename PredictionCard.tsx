
import React from 'react';
import { PredictionResult } from '../types';

interface PredictionCardProps {
  prediction: PredictionResult; // Made non-nullable as App.tsx handles null state
}

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction }) => {
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

export default PredictionCard;
    