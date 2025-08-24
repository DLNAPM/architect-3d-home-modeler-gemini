
import React, { useState, useRef } from 'react';
import { Mic, Upload, Sparkles, AlertTriangle } from 'lucide-react';

interface HomePageProps {
  onGenerate: (description: string, imageFile: File | null) => void;
  error: string | null;
}

const HomePage: React.FC<HomePageProps> = ({ onGenerate, error }) => {
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
    }
  };

  const handleGenerateClick = () => {
    if (description.trim() || imageFile) {
      onGenerate(description, imageFile);
    }
  };
  
  const handleVoiceInput = () => {
    const recognition = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
    if (!recognition) {
        alert("Speech recognition not supported in this browser.");
        return;
    }

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    if (isListening) {
        recognition.stop();
        setIsListening(false);
        return;
    }
    
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        setDescription(prev => prev ? `${prev} ${speechResult}`: speechResult);
    };

    recognition.onspeechend = () => {
        recognition.stop();
        setIsListening(false);
    };

    recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
    };
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-3xl text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold text-gray-800 dark:text-white">
          Design Your Dream Home with AI
        </h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Describe your vision, upload a floor plan, or use your voice. Let our AI architect bring your ideas to life.
        </p>
      </div>

      <div className="mt-10 w-full max-w-3xl bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg">
        {error && (
            <div className="mb-4 flex items-center p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-700 dark:text-red-400" role="alert">
                <AlertTriangle className="flex-shrink-0 inline w-4 h-4 mr-3" />
                <span className="font-medium">Error:</span> {error}
            </div>
        )}
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., A two-story modern farmhouse with a wrap-around porch, open-concept living area, and a large kitchen island..."
            className="w-full h-40 p-4 pr-12 text-base text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
          />
          <button 
            onClick={handleVoiceInput}
            className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            title="Use Voice Prompt"
            >
            <Mic className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-brand-700 bg-brand-100 dark:bg-brand-900 dark:text-brand-300 rounded-md hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors"
          >
            <Upload className="h-5 w-5" />
            <span>{imageFile ? "Change Plan" : "Upload Architectural Plan"}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          {imageFile && <span className="text-sm text-gray-500 truncate max-w-xs">{imageFile.name}</span>}
          
          <button
            onClick={handleGenerateClick}
            disabled={!description.trim() && !imageFile}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-brand-600 rounded-md hover:bg-brand-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            <Sparkles className="h-5 w-5" />
            Generate House Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
