import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Upload,
  Crown,
  Check,
  SplitSquareHorizontal,
  History,
  RotateCcw,
  Plus,
  Trash2,
  AlertTriangle,
  ZoomIn,
  X,
  Lock,
  ArrowRight,
  FolderOpen,
  Save,
  CheckCircle2,
  Wand2
} from 'lucide-react';
import { User, RoomTransformationProject, TransformationRevision } from '../types';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import {
  ROOM_TYPES,
  COMMON_STYLES,
  COLOR_PALETTES,
  FLOORING_OPTIONS,
  LIGHTING_OPTIONS,
  TRANSFORMATION_MODES,
  SAMPLE_ROOMS,
  SampleRoom
} from '../data/roomTransformationData';
import { generateImageFromImage } from '../services/geminiService';
import { cloudService } from '../services/cloudService';
import LoadingOverlay from './LoadingOverlay';

interface RoomTransformationsPageProps {
  user: User | null;
  onUpgradeToPremium?: () => Promise<void> | void;
  onSignIn?: () => void;
  isKeyReady: boolean;
  onSelectKey: () => void;
}

export const RoomTransformationsPage: React.FC<RoomTransformationsPageProps> = ({
  user,
  onUpgradeToPremium,
  onSignIn,
  isKeyReady,
  onSelectKey,
}) => {
  const isPremium =
    user?.subscriptionLevel === 'premium' ||
    user?.email?.toLowerCase().trim() === 'dlaniger.napm.consulting@gmail.com';

  // Demo bypass mode if user wants to preview the workflow
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // Projects list
  const [savedProjects, setSavedProjects] = useState<RoomTransformationProject[]>([]);
  const [showProjectsDrawer, setShowProjectsDrawer] = useState(false);

  // Active Project State
  const [activeProject, setActiveProject] = useState<RoomTransformationProject | null>(null);

  // Setup Form State (for creating a new transformation)
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);
  const [uploadedImageMime, setUploadedImageMime] = useState<string>('image/jpeg');
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('living-room');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('japandi');
  const [selectedColorId, setSelectedColorId] = useState<string>('warm-cream');
  const [selectedFlooringId, setSelectedFlooringId] = useState<string>('herringbone-oak');
  const [selectedLightingId, setSelectedLightingId] = useState<string>('sunlit-daylight');
  const [selectedModeId, setSelectedModeId] = useState<string>('restyle');
  const [roomSpecificSelections, setRoomSpecificSelections] = useState<Record<string, string>>({});
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Iterative Refinement State
  const [refinementPrompt, setRefinementPrompt] = useState<string>('');
  const [refineMode, setRefineMode] = useState<'build-on-current' | 'fresh-from-original'>('build-on-current');

  // Generation & Status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepMessage, setGenerationStepMessage] = useState<string>('Analyzing room structure...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Enlarge modal
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get active room type config
  const activeRoomTypeConfig = ROOM_TYPES.find((r) => r.id === selectedRoomTypeId) || ROOM_TYPES[0];

  // Initialize room specific selections when room type changes
  useEffect(() => {
    const initialSelections: Record<string, string> = {};
    activeRoomTypeConfig.specificSections.forEach((sec) => {
      if (sec.options.length > 0) {
        initialSelections[sec.id] = sec.options[0].id;
      }
    });
    setRoomSpecificSelections(initialSelections);
  }, [selectedRoomTypeId, activeRoomTypeConfig]);

  // Load saved projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      if (!user?.uid) return;
      try {
        const list = await cloudService.getRoomTransformations(user.uid);
        setSavedProjects(list);
      } catch (err) {
        console.warn('Could not load saved room transformations:', err);
      }
    };
    loadProjects();
  }, [user?.uid]);

  // File upload helper with canvas compression
  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPEG, PNG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;

      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let w = img.width;
        let h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          } else {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.9);
          setUploadedImageUri(compressed);
          setUploadedImageMime('image/jpeg');
          setErrorMessage(null);
        } else {
          setUploadedImageUri(result);
          setUploadedImageMime(file.type || 'image/jpeg');
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Quick select sample room
  const handleSelectSampleRoom = async (sample: SampleRoom) => {
    setSelectedRoomTypeId(sample.roomType);
    setSelectedStyleId(sample.defaultStyle);
    setCustomInstructions(sample.defaultPrompt);

    try {
      // Convert URL to Data URI so it can be passed to Gemini API
      const response = await fetch(sample.thumbnail);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageUri(reader.result as string);
        setUploadedImageMime(blob.type || 'image/jpeg');
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.warn('Could not fetch sample thumbnail directly, using raw URL:', err);
      setUploadedImageUri(sample.thumbnail);
      setUploadedImageMime('image/jpeg');
    }
  };

  // Construct comprehensive architectural prompt
  const buildTransformationPrompt = (isIterative: boolean = false, extraInstructions: string = '') => {
    const styleObj = COMMON_STYLES.find((s) => s.id === selectedStyleId);
    const colorObj = COLOR_PALETTES.find((c) => c.id === selectedColorId);
    const floorObj = FLOORING_OPTIONS.find((f) => f.id === selectedFlooringId);
    const lightObj = LIGHTING_OPTIONS.find((l) => l.id === selectedLightingId);
    const modeObj = TRANSFORMATION_MODES.find((m) => m.id === selectedModeId);

    const specificModifiers = activeRoomTypeConfig.specificSections
      .map((sec) => {
        const selectedOptId = roomSpecificSelections[sec.id];
        const opt = sec.options.find((o) => o.id === selectedOptId);
        return opt ? `${sec.label}: ${opt.promptModifier}` : null;
      })
      .filter(Boolean)
      .join(', ');

    if (isIterative && extraInstructions.trim()) {
      return `Photorealistic interior architectural rendering revision of this ${activeRoomTypeConfig.name}.
Crucial iterative customization: ${extraInstructions.trim()}.
Maintain high architectural integrity, photographic clarity, accurate materials, and seamless lighting.
${styleObj ? `Aesthetic style: ${styleObj.prompt}.` : ''}
${colorObj ? `Color palette: ${colorObj.prompt}.` : ''}`;
    }

    return `${modeObj?.promptPrefix || 'Execute a photo-to-rendering transformation of this room.'}
Room type: ${activeRoomTypeConfig.name}.
Architectural & interior style: ${styleObj?.prompt || 'Modern luxury'}.
Color palette: ${colorObj?.prompt || 'Warm neutral tones'}.
Flooring: ${floorObj?.prompt || 'Natural European oak hardwood'}.
Lighting: ${lightObj?.prompt || 'Abundant natural light with warm ambient glow'}.
Key customized elements: ${specificModifiers}.
${customInstructions.trim() ? `Specific client requests: ${customInstructions.trim()}.` : ''}
Quality requirements: 8k resolution, ultra-photorealistic architectural visualization, perfect geometric alignment with room perspective, realistic shadows, depth, and tactile materials.`;
  };

  // Execute initial transformation
  const handleGenerateTransformation = async () => {
    if (!uploadedImageUri) {
      setErrorMessage('Please upload a photo of your room or choose one of the sample rooms.');
      return;
    }

    if (!isKeyReady) {
      onSelectKey();
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStepMessage('Analyzing room geometry & architectural perspective...');

    try {
      const prompt = buildTransformationPrompt(false);
      const rawBase64 = uploadedImageUri.includes('base64,')
        ? uploadedImageUri.split('base64,')[1]
        : uploadedImageUri;

      setGenerationStepMessage(`Styling ${activeRoomTypeConfig.name} in ${selectedStyleId}...`);

      const renderedResultUri = await generateImageFromImage(
        prompt,
        rawBase64,
        uploadedImageMime,
        undefined,
        '16:9'
      );

      const newRevision: TransformationRevision = {
        id: `rev-${Date.now()}`,
        createdAt: Date.now(),
        label: `Rev 1: ${COMMON_STYLES.find((s) => s.id === selectedStyleId)?.label || 'Transformation'}`,
        prompt,
        roomType: activeRoomTypeConfig.name,
        selectedOptions: {
          style: selectedStyleId,
          color: selectedColorId,
          flooring: selectedFlooringId,
          lighting: selectedLightingId,
          mode: selectedModeId,
          ...roomSpecificSelections,
        },
        customInstructions,
        renderedImageUrl: renderedResultUri,
      };

      const newProject: RoomTransformationProject = {
        id: `proj-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userId: user?.uid || 'guest-user',
        title: `${activeRoomTypeConfig.name} Transformation`,
        roomType: activeRoomTypeConfig.name,
        originalImageUrl: uploadedImageUri,
        originalImageMimeType: uploadedImageMime,
        currentRevisionIndex: 0,
        revisions: [newRevision],
      };

      setActiveProject(newProject);

      // Auto-save to cloud if user is signed in
      if (user?.uid) {
        try {
          await cloudService.saveRoomTransformation(user.uid, newProject);
          setSavedProjects((prev) => [newProject, ...prev.filter((p) => p.id !== newProject.id)]);
        } catch (saveErr) {
          console.warn('Failed to auto-save project to cloud:', saveErr);
        }
      }
    } catch (err: any) {
      console.error('Room transformation failed:', err);
      setErrorMessage(
        err?.message || 'Failed to transform room image. Please verify your connection or API key and try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Execute continuous iterative refinement
  const handleRefineTransformation = async (promptOverride?: string) => {
    if (!activeProject) return;
    const currentRev = activeProject.revisions[activeProject.currentRevisionIndex];
    const instructionsToUse = promptOverride || refinementPrompt;

    if (!instructionsToUse.trim()) {
      setErrorMessage('Please describe the changes you would like to apply to this rendering.');
      return;
    }

    if (!isKeyReady) {
      onSelectKey();
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStepMessage('Applying requested updates to the room rendering...');

    try {
      const nextRevNumber = activeProject.revisions.length + 1;
      const refinedPrompt = buildTransformationPrompt(true, instructionsToUse);

      // Determine which base image to feed Gemini
      const baseUri =
        refineMode === 'build-on-current' && currentRev.renderedImageUrl
          ? currentRev.renderedImageUrl
          : activeProject.originalImageUrl;

      const rawBase64 = baseUri.includes('base64,') ? baseUri.split('base64,')[1] : baseUri;

      setGenerationStepMessage(`Rendering Revision ${nextRevNumber}: "${instructionsToUse.slice(0, 45)}..."`);

      const nextRenderedUri = await generateImageFromImage(
        refinedPrompt,
        rawBase64,
        'image/jpeg',
        undefined,
        '16:9'
      );

      const nextRevision: TransformationRevision = {
        id: `rev-${Date.now()}`,
        createdAt: Date.now(),
        label: `Rev ${nextRevNumber}: ${instructionsToUse.slice(0, 30)}${instructionsToUse.length > 30 ? '...' : ''}`,
        prompt: refinedPrompt,
        roomType: activeProject.roomType,
        selectedOptions: currentRev.selectedOptions,
        customInstructions: instructionsToUse,
        renderedImageUrl: nextRenderedUri,
      };

      const updatedProject: RoomTransformationProject = {
        ...activeProject,
        updatedAt: Date.now(),
        currentRevisionIndex: activeProject.revisions.length,
        revisions: [...activeProject.revisions, nextRevision],
      };

      setActiveProject(updatedProject);
      setRefinementPrompt('');

      // Auto-save to cloud
      if (user?.uid) {
        try {
          await cloudService.saveRoomTransformation(user.uid, updatedProject);
          setSavedProjects((prev) => [
            updatedProject,
            ...prev.filter((p) => p.id !== updatedProject.id),
          ]);
        } catch (saveErr) {
          console.warn('Failed to auto-save revised project:', saveErr);
        }
      }
    } catch (err: any) {
      console.error('Refinement failed:', err);
      setErrorMessage(
        err?.message || 'Failed to apply refinement updates. Please try adjusting your prompt or try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Download transformed image
  const handleDownloadTransformed = () => {
    if (!activeProject) return;
    const currentRev = activeProject.revisions[activeProject.currentRevisionIndex];
    if (!currentRev?.renderedImageUrl) return;

    const link = document.createElement('a');
    link.href = currentRev.renderedImageUrl;
    link.download = `${activeProject.title.replace(/[^a-z0-9]/gi, '_')}_${currentRev.label.replace(/[^a-z0-9]/gi, '_')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download side-by-side comparison collage as single high-res image
  const handleDownloadSideBySide = () => {
    if (!activeProject) return;
    const currentRev = activeProject.revisions[activeProject.currentRevisionIndex];
    if (!currentRev?.renderedImageUrl) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgBefore = new Image();
    const imgAfter = new Image();
    imgBefore.crossOrigin = 'anonymous';
    imgAfter.crossOrigin = 'anonymous';

    let loadedCount = 0;
    const onBothLoaded = () => {
      loadedCount++;
      if (loadedCount < 2) return;

      const targetHeight = 1080;
      const aspectBefore = imgBefore.width / imgBefore.height;
      const aspectAfter = imgAfter.width / imgAfter.height;

      const widthBefore = Math.round(targetHeight * aspectBefore);
      const widthAfter = Math.round(targetHeight * aspectAfter);
      const gap = 16;
      const headerHeight = 90;

      canvas.width = widthBefore + widthAfter + gap;
      canvas.height = targetHeight + headerHeight;

      // Dark background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(activeProject.title, 32, 54);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Before & After Architectural Comparison • ${currentRev.label}`, 32, 80);

      // Draw original
      ctx.drawImage(imgBefore, 0, headerHeight, widthBefore, targetHeight);

      // Draw transformed
      ctx.drawImage(imgAfter, widthBefore + gap, headerHeight, widthAfter, targetHeight);

      // Draw labels overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(20, headerHeight + 20, 180, 44);
      ctx.fillRect(widthBefore + gap + 20, headerHeight + 20, 240, 44);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('ORIGINAL PHOTO', 34, headerHeight + 50);
      ctx.fillText('TRANSFORMED', widthBefore + gap + 34, headerHeight + 50);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.download = `${activeProject.title.replace(/[^a-z0-9]/gi, '_')}_Comparison.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    imgBefore.onload = onBothLoaded;
    imgAfter.onload = onBothLoaded;
    imgBefore.src = activeProject.originalImageUrl;
    imgAfter.src = currentRev.renderedImageUrl;
  };

  // Handle upgrade to Premium
  const handleUpgradeClick = async () => {
    setIsUpgrading(true);
    try {
      if (onUpgradeToPremium) {
        await onUpgradeToPremium();
      } else if (user?.email) {
        await cloudService.updateUserSubscription(user.email, 'premium');
        if (user) {
          user.subscriptionLevel = 'premium';
        }
      }
      setUpgradeSuccess(true);
      setTimeout(() => {
        setUpgradeSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to upgrade subscription:', err);
      alert('Could not complete upgrade at this moment. Please check your network or sign in.');
    } finally {
      setIsUpgrading(false);
    }
  };

  // Quick refinement suggestion chips
  const QUICK_REFINEMENT_CHIPS = [
    'Add lush potted indoor olive tree',
    'Warm up lighting with ambient 2700K cove glow',
    'Change flooring to French herringbone light oak',
    'Make wall color Sherwin Williams Alabaster warm white',
    'Add modern abstract minimalist canvas art on wall',
    'Replace ceiling fixture with sculptural brass chandelier',
    'Declutter surfaces for hyper-clean minimalist finish',
    'Enhance natural morning sunbeam reflections',
  ];

  // ==========================================
  // VIEW: PAID SUBSCRIPTION PAYWALL (IF NOT PREMIUM & NOT DEMO)
  // ==========================================
  if (!isPremium && !isDemoMode) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8" id="room-transformations-paywall">
        {/* Header Badge */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs font-semibold tracking-wide uppercase mb-4 ring-1 ring-purple-300 dark:ring-purple-700">
            <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>Premium Exclusive Feature</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            Room Transformations
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Upload any real photo of an existing room and watch AI re-architect it in your choice of
            luxury styles. Compare before &amp; after side-by-side with an interactive slider, and continue refining
            until you are 100% satisfied.
          </p>
        </div>

        {/* Interactive Before/After Showcase */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-purple-100 dark:border-purple-900/50 mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Live Demonstration Preview
            </h2>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              Dated Living Room → Japandi Restyle
            </span>
          </div>

          <BeforeAfterSlider
            originalImage="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
            transformedImage="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80"
            originalLabel="Original Photo"
            transformedLabel="Japandi Customization"
          />
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
              Upload Any Room Photo
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Transform kitchens, living rooms, master bedrooms, spa bathrooms, home offices, and outdoor patios with real perspective preservation.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
              <SplitSquareHorizontal className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
              Side-by-Side Comparison
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Interactive split-view slider lets you peel smoothly between the original room photo and your customized architectural rendering.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
              <RotateCcw className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
              Iterate Until Satisfied
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Not quite right? Request continuous updates—swap materials, tweak lighting, add plants, or change colors across unlimited revision cycles.
            </p>
          </div>
        </div>

        {/* Subscription Pricing Card */}
        <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-950 text-white rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-purple-500/30 text-center">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-block px-3 py-1 bg-purple-500/30 text-purple-200 text-xs font-semibold uppercase tracking-wider rounded-full mb-4 border border-purple-400/30">
              Architect 3D Pro Pass
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
              Unlock Room Transformations
            </h2>
            <p className="text-purple-200 text-base mb-8">
              Upgrade your subscription to gain unlimited access to Room Transformations, high-resolution downloads, side-by-side comparisons, and advanced marketing video tours.
            </p>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/15 max-w-md mx-auto">
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-4xl font-extrabold">$19.99</span>
                <span className="text-purple-200 text-sm">/ month</span>
              </div>
              <ul className="text-left text-sm space-y-2.5 text-purple-100">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Room Photo Transformations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Dynamic Room-Specific Style &amp; Material Options</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Interactive Split Before/After Comparison Tool</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Continuous Iterative Refinements until satisfied</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Full-Resolution Rendering &amp; Collage Downloads</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <button
                  type="button"
                  onClick={handleUpgradeClick}
                  disabled={isUpgrading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-2"
                  id="btn-upgrade-subscription"
                >
                  <Crown className="h-5 w-5" />
                  <span>{isUpgrading ? 'Upgrading Account...' : 'Upgrade to Premium Now'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="w-full sm:w-auto px-8 py-3.5 bg-white text-gray-900 font-bold rounded-xl shadow-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                  id="btn-signin-to-upgrade"
                >
                  <Lock className="h-5 w-5" />
                  <span>Sign In to Subscribe</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsDemoMode(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-colors flex items-center justify-center gap-2"
                id="btn-demo-mode-preview"
              >
                <span>Try Demo Room Preview</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: ACTIVE WORKSPACE (PREMIUM OR DEMO MODE)
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto px-4 py-8" id="room-transformations-workspace">
      {/* Top Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              Room Transformations
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md shadow-xs">
              PRO
            </span>
            {isDemoMode && !isPremium && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-md">
                Demo Preview Mode
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload any room photo, tailor architectural options, compare before/after, and refine continuously.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {savedProjects.length > 0 && (
            <button
              type="button"
              onClick={() => setShowProjectsDrawer(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-xs transition-colors"
              id="btn-open-saved-projects"
            >
              <FolderOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>Saved Projects ({savedProjects.length})</span>
            </button>
          )}

          {activeProject && (
            <button
              type="button"
              onClick={() => {
                setActiveProject(null);
                setUploadedImageUri(null);
                setRefinementPrompt('');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 shadow-xs transition-colors"
              id="btn-start-new-transformation"
            >
              <Plus className="h-4 w-4" />
              <span>New Room</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div
          className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm flex items-start justify-between"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-800 dark:hover:text-red-200"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isGenerating && <LoadingOverlay message={generationStepMessage} />}

      {/* ==========================================
          BRANCH A: ACTIVE PROJECT COMPARISON & CONTINUOUS REFINEMENT
          ========================================== */}
      {activeProject ? (
        <div className="space-y-8" id="active-transformation-results">
          {/* Top Bar with Revisions Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {activeProject.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Created {new Date(activeProject.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {activeProject.revisions.length} revision{activeProject.revisions.length === 1 ? '' : 's'}
              </p>
            </div>

            {/* Revisions Pills */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <History className="h-3.5 w-3.5" />
                <span>Revisions:</span>
              </span>
              {activeProject.revisions.map((rev, idx) => (
                <button
                  key={rev.id}
                  type="button"
                  onClick={() =>
                    setActiveProject({
                      ...activeProject,
                      currentRevisionIndex: idx,
                    })
                  }
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-all shrink-0 ${
                    activeProject.currentRevisionIndex === idx
                      ? 'bg-purple-600 text-white shadow-xs font-bold'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                  id={`btn-revision-${idx}`}
                >
                  {rev.label.split(':')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Before/After Comparison Component */}
          {activeProject.revisions[activeProject.currentRevisionIndex]?.renderedImageUrl && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <BeforeAfterSlider
                originalImage={activeProject.originalImageUrl}
                transformedImage={
                  activeProject.revisions[activeProject.currentRevisionIndex].renderedImageUrl
                }
                originalLabel={`Original ${activeProject.roomType}`}
                transformedLabel={
                  activeProject.revisions[activeProject.currentRevisionIndex].label
                }
                onEnlarge={(url) => setEnlargedImageUrl(url)}
                onDownloadTransformed={handleDownloadTransformed}
                onDownloadSideBySide={handleDownloadSideBySide}
              />
            </div>
          )}

          {/* ==========================================
              CONTINUE MAKING UPDATES UNTIL SATISFIED (ITERATIVE REFINEMENT)
              ========================================== */}
          <div
            className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800/80 dark:to-gray-800 p-6 sm:p-8 rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-md"
            id="refine-transformation-panel"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-600 text-white rounded-lg shadow-xs">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Refine &amp; Continue Updating Until You Are Satisfied
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Tell the AI exactly what to modify, add, or swap in this rendering. We’ll generate the next revision immediately.
                  </p>
                </div>
              </div>

              {/* Mode Toggle: Build on current vs restart from original photo */}
              <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-lg border border-purple-200 dark:border-purple-900 text-xs">
                <button
                  type="button"
                  onClick={() => setRefineMode('build-on-current')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    refineMode === 'build-on-current'
                      ? 'bg-purple-600 text-white font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                  id="btn-refinemode-current"
                >
                  Build on Current Rendering
                </button>
                <button
                  type="button"
                  onClick={() => setRefineMode('fresh-from-original')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    refineMode === 'fresh-from-original'
                      ? 'bg-purple-600 text-white font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                  id="btn-refinemode-original"
                >
                  Apply to Original Photo
                </button>
              </div>
            </div>

            {/* Quick Refinement Suggestion Chips */}
            <div className="mb-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Quick 1-Click Ideas:
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_REFINEMENT_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleRefineTransformation(chip)}
                    className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-gray-700 dark:text-gray-200 hover:text-purple-800 dark:hover:text-purple-300 rounded-lg border border-gray-200 dark:border-gray-600 shadow-2xs transition-colors text-left"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Written Refinement Input */}
            <div className="space-y-3">
              <textarea
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                placeholder="E.g. Change the sofa to off-white curved bouclé, add two tall fiddle-leaf fig plants by the window, and replace the floor with light herringbone oak..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-sm"
                id="input-refinement-prompt"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Tip: You can refine colors, materials, furniture, lighting, or specific decorative items.
                </span>

                <button
                  type="button"
                  onClick={() => handleRefineTransformation()}
                  disabled={isGenerating || !refinementPrompt.trim()}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  id="btn-apply-refinement"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Render Next Revision</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==========================================
           BRANCH B: SETUP FORM (ROOM PHOTO UPLOAD & SELECTIONS)
           ========================================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="transformation-setup-form">
          {/* Left Column: Photo Upload & Sample Rooms (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Upload className="h-5 w-5 text-purple-600" />
                <span>1. Upload Room Photo</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Upload a clear photo of the room you wish to transform.
              </p>

              {/* Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all aspect-video flex flex-col items-center justify-center overflow-hidden ${
                  isDraggingFile
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 bg-gray-50 dark:bg-gray-900/50'
                }`}
                id="room-upload-dropzone"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processImageFile(e.target.files[0]);
                    }
                  }}
                />

                {uploadedImageUri ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={uploadedImageUri}
                      alt="Uploaded room photo"
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <span className="text-white text-xs font-semibold px-3 py-1.5 bg-black/60 rounded-full">
                        Click to change photo
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center p-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center mb-3">
                      <Upload className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Drop room photo here, or click to browse
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      JPEG, PNG, WEBP (Max 20MB)
                    </span>
                  </div>
                )}
              </div>

              {uploadedImageUri && (
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Photo ready for transformation
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedImageUri(null);
                    }}
                    className="text-red-500 hover:text-red-700 underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Quick Sample Rooms */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
                Or Try a Sample Room Photo:
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {SAMPLE_ROOMS.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => handleSelectSampleRoom(sample)}
                    className="group cursor-pointer rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-purple-500 transition-all shadow-2xs hover:shadow-md"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={sample.thumbnail}
                        alt={sample.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2">
                        <span className="text-white text-xs font-bold leading-tight">
                          {sample.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Tailored Selections & Customization (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 space-y-6">
              {/* Step 2: Room Type Selector */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  <span>Select Room Type</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {ROOM_TYPES.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedRoomTypeId(room.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedRoomTypeId === room.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                      }`}
                      id={`room-type-${room.id}`}
                    >
                      <div className="font-bold text-xs sm:text-sm">{room.name}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {room.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transformation Scope */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Transformation Scope:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {TRANSFORMATION_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setSelectedModeId(mode.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedModeId === mode.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="font-bold text-xs">{mode.label}</div>
                      <div className="text-[11px] text-gray-500 line-clamp-2 mt-1">
                        {mode.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Architectural & Interior Style */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Architectural &amp; Interior Style:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {COMMON_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyleId(style.id)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-all ${
                        selectedStyleId === style.id
                          ? 'border-purple-600 bg-purple-600 text-white shadow-xs font-bold'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Color Palette &amp; Walls:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COLOR_PALETTES.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setSelectedColorId(color.id)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-all ${
                        selectedColorId === color.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500 font-bold'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flooring & Lighting */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Flooring:
                  </label>
                  <select
                    value={selectedFlooringId}
                    onChange={(e) => setSelectedFlooringId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                  >
                    {FLOORING_OPTIONS.map((floor) => (
                      <option key={floor.id} value={floor.id}>
                        {floor.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Lighting &amp; Ambiance:
                  </label>
                  <select
                    value={selectedLightingId}
                    onChange={(e) => setSelectedLightingId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                  >
                    {LIGHTING_OPTIONS.map((light) => (
                      <option key={light.id} value={light.id}>
                        {light.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Tailored Options for Selected Room Type */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
                  Tailored {activeRoomTypeConfig.name} Customizations:
                </h3>
                <div className="space-y-4">
                  {activeRoomTypeConfig.specificSections.map((sec) => (
                    <div key={sec.id}>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {sec.label}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sec.options.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setRoomSpecificSelections((prev) => ({
                                ...prev,
                                [sec.id]: opt.id,
                              }))
                            }
                            className={`px-3 py-2 text-xs text-left rounded-lg border transition-all ${
                              roomSpecificSelections[sec.id] === opt.id
                                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 font-semibold ring-1 ring-purple-500'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Written Description / Custom Instructions */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Written Custom Instructions (Optional):
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder={`Describe any specific changes for this ${activeRoomTypeConfig.name.toLowerCase()} (e.g., "Remove the ceiling fan and install a brass pendant, paint walls Benjamin Moore Swiss Coffee, add an olive tree in ceramic pot...")`}
                  rows={3}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  id="input-custom-transformation-instructions"
                />
              </div>

              {/* Generate Transformation Button */}
              <button
                type="button"
                onClick={handleGenerateTransformation}
                disabled={isGenerating || !uploadedImageUri}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                id="btn-generate-transformation"
              >
                <Sparkles className="h-5 w-5" />
                <span>Transform Room &amp; Compare Side-by-Side</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SAVED PROJECTS DRAWER / MODAL
          ========================================== */}
      {showProjectsDrawer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-purple-600" />
                <span>Your Saved Room Transformations</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowProjectsDrawer(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {savedProjects.length === 0 ? (
                <p className="text-center py-8 text-sm text-gray-500">
                  No saved room transformations yet.
                </p>
              ) : (
                savedProjects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setActiveProject(proj);
                      setShowProjectsDrawer(false);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 bg-gray-50 dark:bg-gray-900/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-950">
                        <img
                          src={proj.revisions[proj.revisions.length - 1]?.renderedImageUrl || proj.originalImageUrl}
                          alt={proj.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                          {proj.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {proj.revisions.length} revision{proj.revisions.length === 1 ? '' : 's'} •{' '}
                          {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this saved room transformation?')) {
                          if (user?.uid) {
                            await cloudService.deleteRoomTransformation(user.uid, proj.id);
                          }
                          setSavedProjects((prev) => prev.filter((p) => p.id !== proj.id));
                          if (activeProject?.id === proj.id) {
                            setActiveProject(null);
                          }
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enlarge Image Modal */}
      {enlargedImageUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setEnlargedImageUrl(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => setEnlargedImageUrl(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={enlargedImageUrl}
              alt="Enlarged Room Rendering"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
