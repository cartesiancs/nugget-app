import { useState } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { useAuth } from "../hooks/useAuth";

function CreditWidget() {
  const { user } = useAuth();
  const { creditBalance, fetchBalance, addCredits, loadingData } = useProjectStore();
  const [showAddCredit, setShowAddCredit] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCredit = async (e) => {
    e.preventDefault();
    if (!creditAmount || !user?.id) return;

    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsAdding(true);
    try {
      await addCredits({
        userId: user.id,
        amount,
        type: "PURCHASE",
        description: "Manual credit purchase"
      });
      setCreditAmount("");
      setShowAddCredit(false);
    } catch (error) {
      console.error("Failed to add credits:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const loadBalance = () => {
    if (user?.id) {
      fetchBalance(user.id);
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Credit Balance */}
      <div className="flex items-center gap-1">
        <span className="text-gray-300">💰</span>
        <span className="text-white font-medium">
          {loadingData.balance ? "..." : creditBalance.toFixed(1)}
        </span>
        <span className="text-gray-400">credits</span>
      </div>

      {/* Add Credit Button */}
      <button
        onClick={() => setShowAddCredit(!showAddCredit)}
        className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition-colors"
        disabled={isAdding}
      >
        {showAddCredit ? "✕" : "+"}
      </button>

      {/* Add Credit Form */}
      {showAddCredit && (
        <form onSubmit={handleAddCredit} className="flex items-center gap-1">
          <input
            type="number"
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
            placeholder="Amount"
            className="w-16 px-2 py-1 bg-gray-700 text-white rounded text-xs border border-gray-600 focus:outline-none focus:border-blue-500"
            min="0.1"
            step="0.1"
            disabled={isAdding}
          />
          <button
            type="submit"
            className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs transition-colors disabled:opacity-50"
            disabled={isAdding || !creditAmount}
          >
            {isAdding ? "..." : "Add"}
          </button>
        </form>
      )}

      {/* Refresh Button */}
      <button
        onClick={loadBalance}
        className="px-1 py-1 text-gray-400 hover:text-white transition-colors"
        disabled={loadingData.balance}
        title="Refresh balance"
      >
        🔄
      </button>
    </div>
  );
}

export default CreditWidget;