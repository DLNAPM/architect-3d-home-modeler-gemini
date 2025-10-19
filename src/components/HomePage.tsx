import React, { useState, useRef } from 'react';
import { Mic, Upload, Sparkles, AlertTriangle, HelpCircle, X } from 'lucide-react';
import { SavedDesign } from '@/types';

// FIX: Add designs, onSelectDesign, and onDeleteDesign to props to handle display of saved designs, resolving prop type error in App.tsx.
interface HomePageProps {
  onGenerate: (description: string, imageFile: File | null) => void;
  error: string | null;
  designs: SavedDesign[];
  onSelectDesign: (designId: string) => void;
  onDeleteDesign: (designId: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onGenerate, error, designs, onSelectDesign, onDeleteDesign }) => {
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
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
      {showHowTo && (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowHowTo(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-to-title"
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 id="how-to-title" className="text-xl font-bold flex items-center gap-2">
                        <HelpCircle className="text-brand-600 dark:text-brand-400" />
                        How to Get the Best Results
                    </h2>
                    <button onClick={() => setShowHowTo(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <div>
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">1. Write a Great Description</h3>
                            <p className="mb-2">The quality of your initial description is key. Be descriptive but concise. Think like you're talking to an architect.</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li><strong>Start with the big picture:</strong> Begin with the overall style and size.
                                    <p className="text-sm text-gray-500 dark:text-gray-400 pl-4"><em>e.g., "A sprawling single-story mid-century modern home" or "A cozy two-story colonial revival house with a symmetrical facade."</em></p>
                                </li>
                                <li><strong>Mention key features:</strong> Call out important architectural elements.
                                    <p className="text-sm text-gray-500 dark:text-gray-400 pl-4"><em>e.g., "...with a large wrap-around porch," "...featuring floor-to-ceiling windows," "...a gabled roof with dormers."</em></p>
                                </li>
                                <li><strong>List important rooms:</strong> Tell the AI what spaces are most important to you.
                                    <p className="text-sm text-gray-500 dark:text-gray-400 pl-4"><em>e.g., "...an open-concept kitchen and living area, a dedicated home office, and a master suite with a private balcony."</em></p>
                                </li>
                                <li><strong>Add material/color details:</strong> If you have a vision, share it.
                                    <p className="text-sm text-gray-500 dark:text-gray-400 pl-4"><em>e.g., "The exterior is white brick with black trim," "...dark hardwood floors throughout the main level."</em></p>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">2. Upload a Floor Plan (Optional)</h3>
                            <p>You can supplement your description by uploading an image of a floor plan. The AI will analyze the layout to better understand the home's structure and flow. Clear, high-contrast images work best.</p>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">3. Generate & Customize</h3>
                            <p>After the initial generation, you'll land on the results page. From there, you can:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>Select different rooms from the list on the left.</li>
                                <li>Use the customization panel on the right to fine-tune details.</li>
                                <li>Generate new, specific renderings for each room to fully visualize your design.</li>
                            </ul>
                        </div>
                         <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                            <h3 className="font-semibold text-lg text-red-600 dark:text-red-400 mb-2 flex items-center gap-2"><AlertTriangle/> Important: Content Policy</h3>
                            <p>This is a professional architectural design tool. Any attempt to generate pornographic, nude, or sexually explicit content is a violation of our terms of service. All prompts are monitored. Violators will have their access permanently revoked without warning.</p>
                        </div>
                    </div>
                </div>
                 <div className="p-4 border-t dark:border-gray-700 text-right">
                    <button 
                        onClick={() => setShowHowTo(false)}
                        className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
      )}
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
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-brand-700 bg-brand-100 dark:bg-brand-900 dark:text-brand-300 rounded-md hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors"
                >
                    <Upload className="h-5 w-5" />
                    <span>{imageFile ? "Change Image" : "Upload Image / Plan"}</span>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
                {imageFile && <span className="text-sm text-gray-500 truncate max-w-xs">{imageFile.name}</span>}
            </div>
          
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setShowHowTo(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    title="How to use the app"
                >
                    <HelpCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">How To Use</span>
                </button>
                <button
                    onClick={handleGenerateClick}
                    disabled={!description.trim() && !imageFile}
                    className="flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-brand-600 rounded-md hover:bg-brand-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                    <Sparkles className="h-5 w-5" />
                    Generate
                </button>
            </div>
        </div>
      </div>

      <div className="mt-8 w-full max-w-3xl flex items-start p-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">
        <AlertTriangle className="flex-shrink-0 inline w-4 h-4 mr-3 mt-0.5" />
        <div>
          <span className="font-medium">Usage Policy:</span> This application is strictly for architectural and interior design purposes. Generating images of a sexually explicit, nude, or adult nature is prohibited. Violations will be logged and may lead to permanent suspension of access.
        </div>
      </div>
    </div>
  );
};

export default HomePage;