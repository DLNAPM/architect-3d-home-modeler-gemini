import React from 'react';
import { X, HelpCircle } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            About Architect 3D
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">How it Works</h3>
            <p className="mb-2">Architect 3D uses advanced AI to transform your ideas into photorealistic 3D renderings instantly. Here's the basic workflow:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li><strong>Describe your vision:</strong> Start by providing a detailed description of the house or room you want to design.</li>
              <li><strong>Upload plans (Optional):</strong> Add floor plans or inspiration images to guide the AI.</li>
              <li><strong>Generate renderings:</strong> The AI will create realistic images based on your inputs.</li>
              <li><strong>Customize & Refine:</strong> Use the customization panel to tweak specific rooms or use natural language to refine an existing rendering.</li>
            </ol>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Advanced Features (Premium)</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Visual Shopping:</strong> Select items within your generated designs to find real-world products.</li>
              <li><strong>Multiple Wish Lists:</strong> Organize your found items into different wish lists (e.g., 'Exterior', 'Interior', 'Builder').</li>
              <li><strong>Custom Sharing:</strong> Share specific wish lists with varying levels of detail (e.g., hide delivery addresses for builders).</li>
              <li><strong>Video Tours:</strong> Generate an AI video tour moving through your rendered rooms.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Intended Audience</h3>
            <p className="mb-2">This app is designed for:</p>
            <ul className="list-disc pl-5">
              <li>Homeowners looking for inspiration for remodels or new builds.</li>
              <li>Interior designers and architects who want to rapidly prototype concepts for clients.</li>
              <li>Real estate agents looking to visualize potential layouts for empty properties.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-brand-600 dark:text-brand-400">Pro Tip</h3>
            <p className="bg-brand-50 dark:bg-brand-900/30 p-4 rounded-lg border border-brand-100 dark:border-brand-800 text-sm italic">
              When refining an image, be as specific as possible. Instead of saying "make it better", try describing exactly what you want changed: "change the cabinets to dark mahogany and add a farmhouse sink."
            </p>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Disclaimer</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <strong>What it IS intended for:</strong> Rapid visualization, concept generation, and finding inspiration. The generated images are artistic representations.
              <br /><br />
              <strong>What it is NOT intended for:</strong> Creating actual building blueprints or construction-ready documents. AI-generated architectural layouts may contain physical impossibilities or structural inaccuracies. Always consult with a licensed architect and contractor before beginning any real-world construction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
