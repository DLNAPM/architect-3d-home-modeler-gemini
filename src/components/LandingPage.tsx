import React from 'react';
import { Sparkles, LayoutTemplate, Home, ArrowRight, User } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  onSignInGuest: () => void;
  isKeyReady: boolean;
  onSelectKey: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, onSignInGuest, isKeyReady, onSelectKey }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Hero Section */}
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-500 blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500 blur-[100px]"></div>
        </div>

        <div className="z-10 max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-brand-100 dark:bg-brand-900/30 rounded-2xl">
              <Home className="h-12 w-12 text-brand-600 dark:text-brand-400" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
            Design Your Dream Home <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600">
              Powered by AI
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Transform ideas into photorealistic 3D renderings instantly. 
            Describe your vision, upload floor plans, and let our advanced AI architect bring your concepts to life.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onSignIn}
              className="group relative flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-full hover:scale-105 transition-transform duration-200 shadow-xl"
            >
               <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
               <span>Continue with Google</span>
               <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={onSignInGuest}
              className="group relative flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-gray-700 bg-white border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-md"
            >
               <User className="w-5 h-5" />
               <span>Continue as Guest</span>
            </button>
          </div>
          
          {!isKeyReady && (
             <div className="mt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Need to configure your AI access?</p>
                <button 
                    onClick={onSelectKey}
                    className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
                >
                    Set API Key
                </button>
             </div>
          )}

          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Sign in to save your sessions and access designs on any device.
          </p>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="bg-gray-50 dark:bg-gray-800/50 py-16 px-6 z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI-Powered Rendering</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Generate stunning exterior and interior visualizations from simple text descriptions or voice commands.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <LayoutTemplate className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Detailed Floor Plans</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Upload existing architectural plans or sketches to guide the AI in creating accurate 3D models.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
              <Home className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cross-Device Cloud Sync</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your designs are saved to your account. Start on your desktop and show your clients on a tablet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;