import { useState } from 'react';
import { testApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const AuthTest = () => {
  const { isAuthenticated, user } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAuthTest = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await testApi.testAuth();
      setTestResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-700">
          Please sign in to test authentication
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
      <h3 className="text-sm font-medium text-gray-900 mb-2">
        Authentication Test
      </h3>
      <p className="text-xs text-gray-600 mb-3">
        Signed in as: {user?.name || user?.email}
      </p>
      
      <button
        onClick={runAuthTest}
        disabled={loading}
        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Auth Header'}
      </button>
      
      {error && (
        <div className="mt-2 text-red-600 text-xs bg-red-50 p-2 rounded border border-red-200">
          Error: {error}
        </div>
      )}
      
      {testResult && (
        <div className="mt-2 text-green-600 text-xs bg-green-50 p-2 rounded border border-green-200">
          ✓ Auth test successful! User: {testResult.user?.name}
        </div>
      )}
    </div>
  );
};

export default AuthTest; 