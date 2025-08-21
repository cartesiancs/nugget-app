import React from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useAuth } from '../hooks/useAuth';
import { 
  getTextCreditCost, 
  getImageCreditCost, 
  getVideoCreditCost,
  formatCreditDeduction 
} from '../lib/pricing';

const CreditSummary = ({ showDetailed = false }) => {
  const { user } = useAuth();
  const { creditBalance, loadingData, fetchBalance } = useProjectStore();

  const refreshBalance = () => {
    if (user?.id) {
      fetchBalance(user.id);
    }
  };

  if (!user) return null;

  const creditCosts = {
    'Web Research': getTextCreditCost('web-info'),
    'Concept Generation': getTextCreditCost('concept generator'),
    'Script Generation': getTextCreditCost('script & segmentation'),
    'Image Generation (Imagen)': getImageCreditCost('imagen'),
    'Image Generation (Recraft)': getImageCreditCost('recraft-v3'),
    'Video Generation (VEO2, 5s)': getVideoCreditCost('veo2', 5),
    'Video Generation (Runway, 5s)': getVideoCreditCost('gen4_turbo', 5),
    'Video Generation (Kling, 5s)': getVideoCreditCost('kling v2.1-master', 5),
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium flex items-center gap-2">
          <span>💰</span>
          Credit Balance
        </h3>
        <button
          onClick={refreshBalance}
          disabled={loadingData?.balance}
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          🔄
        </button>
      </div>
      
      <div className="text-2xl font-bold text-green-400 mb-2">
        {loadingData?.balance ? "..." : `${(creditBalance || 0).toFixed(1)} credits`}
      </div>

      {showDetailed && (
        <div className="mt-4">
          <h4 className="text-gray-300 text-sm font-medium mb-2">Credit Costs:</h4>
          <div className="space-y-1 text-xs">
            {Object.entries(creditCosts).map(([service, cost]) => (
              <div key={service} className="flex justify-between text-gray-400">
                <span>{service}</span>
                <span>{cost} credits</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditSummary;
