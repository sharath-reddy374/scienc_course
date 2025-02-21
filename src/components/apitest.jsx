// src/components/ApiTest.jsx
import React, { useState } from 'react';
import { generateSlideContent } from '../services/openai';

const ApiTest = () => {
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const testApi = async () => {
        setLoading(true);
        setError(null);
        try {
            const testContext = {
                subject: "Test Subject",
                topic: "Test Topic"
            };
            
            const response = await generateSlideContent('TOC', testContext);
            setResult(response);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">API Test</h2>
            <button 
                onClick={testApi}
                className="bg-blue-500 text-white px-4 py-2 rounded"
                disabled={loading}
            >
                {loading ? 'Testing...' : 'Test API Connection'}
            </button>

            {error && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <h3 className="font-bold">Error:</h3>
                    <pre className="mt-2 whitespace-pre-wrap">{error}</pre>
                </div>
            )}

            {result && (
                <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    <h3 className="font-bold">Success:</h3>
                    <pre className="mt-2 whitespace-pre-wrap">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default ApiTest;