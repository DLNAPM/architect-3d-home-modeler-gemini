import React, { useState, useRef, useCallback } from 'react';
import { Mic, Upload, Sparkles, AlertTriangle, HelpCircle, X, Trash2, KeyRound } from 'lucide-react';
import { SavedDesign, User } from '../types';

interface UploadedFiles {
    frontPlan: File | null;
    backPlan: File | null;
    facadeImage: File | null;
}

interface HomePageProps {
  onGenerate: (description: string, files: UploadedFiles) => void;
  error: string | null;
  designs: SavedDesign[];
  onSelectDesign: (designId: string) => void;
  onDeleteDesign: (designId: string) => void;
  onErrorClear: () => void;
  isKeyReady: boolean;
  onSelectKey: () => void;
  user: User | null;
}

// Memoized component for displaying a single design card.
const DesignCard = React.memo(({ design, onSelect, onDelete }: { design: SavedDesign, onSelect: (id: string) => void, onDelete: (id: string) => void }) => {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(design.housePlan.id)}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(design.housePlan.id)}
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-400 flex flex-col justify-between"
        >
            <div className="p-4">
                <h4 className="font-bold text-lg text-gray-800 dark:text-white truncate group-hover:text-brand-700 dark:group-hover:text-brand-300">{design.housePlan.title}</h4>
                <p className="text-sm text-brand-600 dark:text-brand-400 font-medium">{design.housePlan.style}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{design.initialPrompt}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 mt-auto flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(design.housePlan.createdAt).toLocaleDateString()}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(design.housePlan.id);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                    aria-label={`Delete design: ${design.housePlan.title}`}
                >
                    <Trash2 className="h-4 w-4" />
                    Delete
                </button>
            </div>
        </div>
    );
});

// Memoized list component.
// This separates the heavy rendering of the list from the parent HomePage state (input text updates).
const DesignList = React.memo(({ designs, onSelectDesign, onDeleteDesign, user }: { designs: SavedDesign[], onSelectDesign: (id: string) => void, onDeleteDesign: (id: string) => void, user: User | null }) => {
    if (designs.length === 0) {
        return (
            <div className="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                    {user ? "You haven't created any designs yet." : "No guest designs found."}
                </h4>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                    Create your first design using the form above to get started!
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map(design => (
                <DesignCard
                    key={design.housePlan.id}
                    design={design}
                    onSelect={onSelectDesign}
                    onDelete={onDeleteDesign}
                />
            ))}
        </div>
    );
});

const HomePage: React.FC<HomePageProps> = ({ onGenerate, error, designs, onSelectDesign, onDeleteDesign, onErrorClear, isKeyReady, onSelectKey, user }) => {
  const [description, setDescription] = useState('');
  const [frontPlan, setFrontPlan] = useState<File | null>(null);
  const [backPlan, setBackPlan] = useState<File | null>(null);
  const [facadeImage, setFacadeImage] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  
  const frontPlanInputRef = useRef<HTMLInputElement>(null);
  const backPlanInputRef = useRef<HTMLInputElement>(null);
  const facadeImageInputRef = useRef<HTMLInputElement>(null);

  const handleFrontPlanChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFrontPlan(event.target.files[0]);
    } else {
      setFrontPlan(null);
    }
  }, []);

  const handleBackPlanChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setBackPlan(event.target.files[0]);
    } else {
      setBackPlan(null);
    }
  }, []);

  const handleFacadeImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFacadeImage(event.target.files[0]);
    } else {
      setFacadeImage(null);
    }
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  }, []);

  const handleGenerateClick = useCallback(() => {
    if (description.trim() || frontPlan || backPlan || facadeImage) {
      onGenerate(description, { frontPlan, backPlan, facadeImage });
    }
  }, [description, frontPlan, backPlan, facadeImage, onGenerate]);
  
  const handleVoiceInput = useCallback(() => {
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
  }, [isListening]);

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
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">2. Upload Plans & Images (Optional)</h3>
                            <p>Supplement your description by uploading images. Clear, high-contrast images work best.</p>
                             <ul className="list-disc list-inside space-y-1 pl-2">
                                <li><strong>Architectural Plans:</strong> Upload front and back floor plans for the AI to understand the layout.</li>
                                <li><strong>Example Facade:</strong> Upload a photo of a house you like. The AI will use it as a primary style reference for the initial 3D rendering.</li>
                            </ul>
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
          {user ? `Welcome back, ${user.name}!` : "Design Your Dream Home with AI"}
        </h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Describe your vision, upload a floor plan, or use your voice. Let our AI architect bring your ideas to life.
        </p>
      </div>

      <div className="mt-10 w-full max-w-3xl bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg">
        <div className="relative">
            {isKeyReady === false && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 z-10 flex flex-col items-center justify-center p-4 rounded-2xl text-center">
                    <KeyRound className="h-8 w-8 text-brand-600 dark:text-brand-400 mx-auto" />
                    <h3 className="mt-2 text-lg font-bold text-gray-900 dark:text-white">API Key Required</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        Please select a billing-enabled API key to generate new designs.
                    </p>
                    <button
                        onClick={onSelectKey}
                        className="mt-4 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-600 text-base font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:text-sm"
                    >
                        Select API Key
                    </button>
                    <a
                      href="https://ai.google.dev/gemini-api/docs/billing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-xs text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Learn more about billing
                    </a>
                </div>
            )}
            {error && (
                <div className="mb-4 flex items-center justify-between p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-700 dark:text-red-400" role="alert">
                    <div className='flex items-center'>
                        <AlertTriangle className="flex-shrink-0 inline w-4 h-4 mr-3" />
                        <span className="font-medium">Error:</span> {error}
                    </div>
                    <button onClick={onErrorClear} className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-gray-700" aria-label="Dismiss error">
                        <X className="h-4 w-4"/>
                    </button>
                </div>
            )}
            <div className="relative">
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                placeholder="e.g., A two-story modern farmhouse with a wrap-around porch, open-concept living area, and a large kitchen island..."
                className="w-full h-40 p-4 pr-12 text-base text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                disabled={!isKeyReady}
              />
              <button 
                onClick={handleVoiceInput}
                className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Use Voice Prompt"
                disabled={!isKeyReady}
                >
                <Mic className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 w-full space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Front Architectural Plan</span>
                    <div className="flex items-center gap-3">
                        {frontPlan && <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{frontPlan.name}</span>}
                        <button onClick={() => frontPlanInputRef.current?.click()} className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-100 dark:bg-brand-900 dark:text-brand-300 rounded-md hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors" disabled={!isKeyReady}>
                            <Upload className="h-4 w-4" />
                            <span>{frontPlan ? "Change" : "Upload"}</span>
                        </button>
                        <input type="file" ref={frontPlanInputRef} onChange={handleFrontPlanChange} className="hidden" accept="image/*"/>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Back Architectural Plan</span>
                    <div className="flex items-center gap-3">
                        {backPlan && <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{backPlan.name}</span>}
                        <button onClick={() => backPlanInputRef.current?.click()} className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-100 dark:bg-brand-900 dark:text-brand-300 rounded-md hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors" disabled={!isKeyReady}>
                            <Upload className="h-4 w-4" />
                            <span>{backPlan ? "Change" : "Upload"}</span>
                        </button>
                        <input type="file" ref={backPlanInputRef} onChange={handleBackPlanChange} className="hidden" accept="image/*"/>
                    </div>
                </div>
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Example Facade of Property</span>
                    <div className="flex items-center gap-3">
                        {facadeImage && <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{facadeImage.name}</span>}
                        <button onClick={() => facadeImageInputRef.current?.click()} className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-100 dark:bg-brand-900 dark:text-brand-300 rounded-md hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors" disabled={!isKeyReady}>
                            <Upload className="h-4 w-4" />
                            <span>{facadeImage ? "Change" : "Upload"}</span>
                        </button>
                        <input type="file" ref={facadeImageInputRef} onChange={handleFacadeImageChange} className="hidden" accept="image/*"/>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                    disabled={!isKeyReady || (!description.trim() && !frontPlan && !backPlan && !facadeImage)}
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

      <div className="mt-12 w-full max-w-5xl">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Your Saved Designs</h3>
        <DesignList 
            designs={designs} 
            onSelectDesign={onSelectDesign} 
            onDeleteDesign={onDeleteDesign} 
            user={user} 
        />
      </div>
    </div>
  );
};

export default HomePage;