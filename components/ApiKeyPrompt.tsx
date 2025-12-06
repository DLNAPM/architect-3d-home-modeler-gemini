import React from 'react';
import { KeyRound } from 'lucide-react';

interface ApiKeyPromptProps {
  onSelectKey: () => void;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onSelectKey }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-brand-100 dark:bg-brand-900">
          <KeyRound className="h-6 w-6 text-brand-600 dark:text-brand-400" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">API Key Required</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          This application uses powerful AI models for image and video generation which require a billing-enabled Google AI Studio API key.
        </p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Please select a key from a project with billing enabled to proceed. For more information on setting up billing, please visit the official documentation.
        </p>
        <a
          href="https://ai.google.dev/gemini-api/docs/billing"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-brand-600 dark:text-brand-400 hover:underline"
        >
          Learn more about billing
        </a>
        <div className="mt-6">
          <button
            onClick={onSelectKey}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-600 text-base font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:text-sm"
          >
            Select API Key
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyPrompt;
