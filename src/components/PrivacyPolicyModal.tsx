import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            Privacy Policy
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
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1. Information We Collect</h3>
            <p className="mb-2">We collect information that you configure when logging into our application via third-party providers (like Google) and any media/images you explicitly upload to utilize the rendering engine.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Information:</strong> Name, Email address, and profile picture provided via standard authentication.</li>
              <li><strong>User Content:</strong> Any floor plans, images, texts, wish lists, or design descriptions that you upload or input to generate 3D interiors/exteriors.</li>
              <li><strong>Usage Data:</strong> Basic application usage telemetry to improve system and application performance.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">2. How We Use Your Information</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide, maintain, and improve the application's AI design generation and visual shopping toolings.</li>
              <li>To securely hold, sync, and persist your AI renderings and wish lists across different devices tied to your account.</li>
              <li>To communicate with you regarding security alerts or important account updates.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3. Third-Party Integrations & Security</h3>
            <p>
              Our systems integrate directly with third-party Machine Learning / Generative AI APIs to function (such as Google’s Gemini API). Your text prompts, design choices, and uploaded base images are transmitted securely to these APIs exclusively to generate your required designs and do not become public automatically. We utilize state-of-the-art cloud security databases (Firebase) to keep your personal data accessible only to you or those you explicitly share a link/wish list with.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">4. User Rights and Data Deletion</h3>
            <p>
              As a user, you have the right to access, edit, or completely securely delete any designs, rooms, renderings, and wish list data linked to your account via the app interface. If you wish to delete your entire account including all user content simultaneously, you may contact our administrators.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">5. Policy Updates</h3>
            <p>
               We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy onto this modal component. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
