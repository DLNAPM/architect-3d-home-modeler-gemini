import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Trees,
  Home,
  Footprints,
  Sparkles,
  Upload,
  Wand2,
  Lock,
  ArrowRight,
  RotateCcw,
  History,
  CheckCircle2,
  FolderOpen,
  Plus,
  Compass,
  Sun,
  Layers,
  ChevronRight,
  Info,
  X,
  ExternalLink,
  ShieldCheck,
  Flame,
  Waves,
  Maximize2
} from 'lucide-react';
import {
  HOUSE_VIEW_SIDES,
  LANDSCAPING_STYLES,
  LANDSCAPING_LIGHTINGS,
  LANDSCAPING_SCOPES,
  SAMPLE_LANDSCAPING_HOMES,
  HouseViewSideConfig,
  SampleLandscaping
} from '../data/landscapingTransformationData';
import {
  User,
  HouseViewSide,
  LandscapingTransformationProject,
  LandscapingRevision
} from '../types';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { generateImageFromImage } from '../services/geminiService';
import { cloudService } from '../services/cloudService';

interface LandscapingTransformationsPageProps {
  user: User | null;
  onUpgradeToPremium?: () => void;
  onSignIn?: () => void;
  isKeyReady?: boolean;
  onSelectKey?: () => void;
}

export const LandscapingTransformationsPage: React.FC<LandscapingTransformationsPageProps> = ({
  user,
  onUpgradeToPremium,
  onSignIn,
  isKeyReady = true,
  onSelectKey,
}) => {
  const isPremium =
    user?.subscriptionLevel === 'premium' ||
    user?.email?.toLowerCase().trim() === 'dlaniger.napm.consulting@gmail.com';

  // Demo bypass mode for previewing the workflow
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // Projects list
  const [savedProjects, setSavedProjects] = useState<LandscapingTransformationProject[]>([]);
  const [showProjectsDrawer, setShowProjectsDrawer] = useState(false);

  // Active Project State (null = setup form; non-null = active comparative workspace)
  const [activeProject, setActiveProject] = useState<LandscapingTransformationProject | null>(null);

  // Setup Form State
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);
  const [uploadedImageMime, setUploadedImageMime] = useState<string>('image/jpeg');
  const [selectedViewSide, setSelectedViewSide] = useState<HouseViewSide>('front');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('modern-minimalist');
  const [selectedLightingId, setSelectedLightingId] = useState<string>('golden-hour');
  const [selectedScopeId, setSelectedScopeId] = useState<string>('complete-overhaul');
  const [viewSpecificSelections, setViewSpecificSelections] = useState<Record<string, string>>({});
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Filtering for Sample Homes
  const [sampleViewTab, setSampleViewTab] = useState<'all' | HouseViewSide>('front');
  const [demoShowcaseIndex, setDemoShowcaseIndex] = useState<number>(0);

  // Iterative Refinement State
  const [refinementPrompt, setRefinementPrompt] = useState<string>('');
  const [refineMode, setRefineMode] = useState<'build-on-current' | 'fresh-from-original'>('build-on-current');

  // Generation & Status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepMessage, setGenerationStepMessage] = useState<string>('Analyzing house exterior & elevation...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Enlarge modal
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active house view side config
  const activeViewConfig: HouseViewSideConfig = useMemo(() => {
    return HOUSE_VIEW_SIDES.find((v) => v.id === selectedViewSide) || HOUSE_VIEW_SIDES[0];
  }, [selectedViewSide]);

  // Initialize view specific selections when view side changes
  useEffect(() => {
    const initialSelections: Record<string, string> = {};
    activeViewConfig.sections.forEach((sec) => {
      if (sec.options.length > 0) {
        initialSelections[sec.id] = sec.options[0].id;
      }
    });
    setViewSpecificSelections(initialSelections);
  }, [selectedViewSide, activeViewConfig]);

  // Load saved projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      if (!user?.uid) return;
      try {
        const list = await cloudService.getLandscapingTransformations(user.uid);
        setSavedProjects(list);
      } catch (err) {
        console.warn('Could not load saved landscaping transformations:', err);
      }
    };
    loadProjects();
  }, [user?.uid]);

  // Helper to render icon for house views
  const renderViewIcon = (viewId: HouseViewSide, className = 'h-5 w-5') => {
    switch (viewId) {
      case 'front':
        return <Home className={className} />;
      case 'back':
        return <Trees className={className} />;
      case 'side':
        return <Footprints className={className} />;
      default:
        return <Home className={className} />;
    }
  };

  // Process uploaded image file with canvas compression
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
          setErrorMessage(null);
        }
      };
      img.onerror = () => {
        setUploadedImageUri(result);
        setUploadedImageMime(file.type || 'image/jpeg');
        setErrorMessage(null);
      };
      img.src = result;
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the selected file. Please try again.');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleSelectSampleHouse = (sample: SampleLandscaping) => {
    setUploadedImageUri(sample.beforeImage);
    setUploadedImageMime('image/jpeg');
    setSelectedViewSide(sample.viewSide);
    setSelectedStyleId(sample.style);
    setErrorMessage(null);
  };

  // Dynamic context-aware 1-click refinement chips
  const activeRefinementChips = useMemo(() => {
    const currentSide = activeProject?.viewSide || selectedViewSide;
    const config = HOUSE_VIEW_SIDES.find((v) => v.id === currentSide);
    return config?.quickRefinements || HOUSE_VIEW_SIDES[0].quickRefinements;
  }, [activeProject?.viewSide, selectedViewSide]);

  // Build the generation prompt for initial transformation
  const buildInitialPrompt = (): string => {
    const viewConfig = HOUSE_VIEW_SIDES.find((v) => v.id === selectedViewSide) || HOUSE_VIEW_SIDES[0];
    const styleObj = LANDSCAPING_STYLES.find((s) => s.id === selectedStyleId) || LANDSCAPING_STYLES[0];
    const lightingObj = LANDSCAPING_LIGHTINGS.find((l) => l.id === selectedLightingId) || LANDSCAPING_LIGHTINGS[0];
    const scopeObj = LANDSCAPING_SCOPES.find((s) => s.id === selectedScopeId) || LANDSCAPING_SCOPES[0];

    const specificSnippets: string[] = [];
    viewConfig.sections.forEach((sec) => {
      const chosenOptionId = viewSpecificSelections[sec.id];
      const opt = sec.options.find((o) => o.id === chosenOptionId);
      if (opt && opt.promptSnippet) {
        specificSnippets.push(`${sec.title}: ${opt.promptSnippet}`);
      }
    });

    return [
      `Photorealistic professional architectural landscape redesign of the ${viewConfig.name.toLowerCase()} of this residential home.`,
      `CRITICAL REQUIREMENT: Maintain the original architectural proportions, roofline, windows, and core structure of the house shown in the photo, but radically upgrade and landscape all ground, gardens, hardscaping, and surrounding exterior grounds.`,
      `View Focus: ${viewConfig.name} (${viewConfig.tagline}).`,
      `Landscaping Style: ${styleObj.promptSnippet}.`,
      `Lighting & Atmospheric Conditions: ${lightingObj.promptSnippet}.`,
      `Transformation Scope: ${scopeObj.promptSnippet}.`,
      `Specific Landscaping Features to Integrate:`,
      specificSnippets.map((s) => `- ${s}`).join('\n'),
      customInstructions ? `Custom User Specific Instructions: ${customInstructions}` : '',
      `Output Specifications: High-end architectural photography, 8k resolution, crisp photorealistic textures for stone, foliage, water, and wood. Pristine curb appeal and luxury outdoor living.`
    ]
      .filter(Boolean)
      .join('\n\n');
  };

  // Initial Transformation Generation Handler
  const handleGenerateTransformation = async () => {
    if (!uploadedImageUri) {
      setErrorMessage('Please upload a photo of your house or pick a sample photo first.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStepMessage('Analyzing house elevation & topography...');

    try {
      setTimeout(() => {
        setGenerationStepMessage('Synthesizing botanical flora, hardscape, and lighting...');
      }, 2500);

      setTimeout(() => {
        setGenerationStepMessage('Rendering high-resolution architectural landscape...');
      }, 5500);

      const prompt = buildInitialPrompt();
      const renderedUrl = await generateImageFromImage(prompt, uploadedImageUri, uploadedImageMime);

      const viewConfig = HOUSE_VIEW_SIDES.find((v) => v.id === selectedViewSide) || HOUSE_VIEW_SIDES[0];
      const styleObj = LANDSCAPING_STYLES.find((s) => s.id === selectedStyleId) || LANDSCAPING_STYLES[0];

      const initialRevision: LandscapingRevision = {
        id: `rev-${Date.now()}`,
        createdAt: Date.now(),
        label: `Initial Redesign (${styleObj.name})`,
        prompt,
        viewSide: selectedViewSide,
        selectedOptions: { ...viewSpecificSelections },
        customInstructions,
        renderedImageUrl: renderedUrl,
      };

      const newProject: LandscapingTransformationProject = {
        id: `landscaping-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userId: user?.uid || 'guest',
        title: `${viewConfig.name} - ${styleObj.name}`,
        viewSide: selectedViewSide,
        originalImageUrl: uploadedImageUri,
        originalImageMimeType: uploadedImageMime,
        currentRevisionIndex: 0,
        revisions: [initialRevision],
      };

      setActiveProject(newProject);

      // Save to cloud if user is signed in
      if (user?.uid) {
        try {
          await cloudService.saveLandscapingTransformation(user.uid, newProject);
          setSavedProjects((prev) => [newProject, ...prev]);
        } catch (saveErr) {
          console.warn('Could not auto-save to cloud:', saveErr);
        }
      }
    } catch (err: any) {
      console.error('Landscaping generation error:', err);
      setErrorMessage(
        err?.message ||
          'Failed to generate the landscaping transformation. Please verify your internet connection or try again.'
      );
    } finally {
      setIsGenerating(false);
      setGenerationStepMessage('');
    }
  };

  // Iterative Refinement Handler: continue making updates until satisfied
  const handleRefineTransformation = async (customPromptOverride?: string) => {
    if (!activeProject) return;

    const instructions = (customPromptOverride || refinementPrompt).trim();
    if (!instructions) {
      setErrorMessage('Please enter what you would like to refine or modify in this rendering.');
      return;
    }

    const currentRevision = activeProject.revisions[activeProject.currentRevisionIndex];
    const baseImage =
      refineMode === 'build-on-current' && currentRevision.renderedImageUrl
        ? currentRevision.renderedImageUrl
        : activeProject.originalImageUrl;
    const baseMime =
      refineMode === 'build-on-current' ? 'image/jpeg' : activeProject.originalImageMimeType;

    const viewConfig = HOUSE_VIEW_SIDES.find((v) => v.id === activeProject.viewSide) || HOUSE_VIEW_SIDES[0];

    const refinementPromptFull = [
      `Iterative professional architectural landscape refinement for the ${viewConfig.name.toLowerCase()} of this home.`,
      `Base Context: Continue from the previous transformation design while strictly executing the following modifications:`,
      `User Requested Refinements: ${instructions}`,
      `Mandatory Requirements: Maintain cohesive architectural perspective, preserve the house geometry, seamlessly integrate new flora, pavers, lighting, or water features with the existing setting. Produce a crisp, luxury architectural photograph.`
    ].join('\n\n');

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStepMessage('Applying your landscape refinements...');

    try {
      const updatedRenderUrl = await generateImageFromImage(refinementPromptFull, baseImage, baseMime);

      const nextRevisionIndex = activeProject.revisions.length;
      const newRevision: LandscapingRevision = {
        id: `rev-${Date.now()}`,
        createdAt: Date.now(),
        label: `Revision ${nextRevisionIndex + 1}: ${instructions.slice(0, 32)}${instructions.length > 32 ? '...' : ''}`,
        prompt: refinementPromptFull,
        viewSide: activeProject.viewSide,
        selectedOptions: { ...currentRevision.selectedOptions },
        customInstructions: instructions,
        renderedImageUrl: updatedRenderUrl,
      };

      const updatedProject: LandscapingTransformationProject = {
        ...activeProject,
        updatedAt: Date.now(),
        currentRevisionIndex: nextRevisionIndex,
        revisions: [...activeProject.revisions, newRevision],
      };

      setActiveProject(updatedProject);
      setRefinementPrompt('');

      // Save to cloud if user is signed in
      if (user?.uid) {
        try {
          await cloudService.saveLandscapingTransformation(user.uid, updatedProject);
          setSavedProjects((prev) =>
            prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
          );
        } catch (saveErr) {
          console.warn('Could not auto-save revision to cloud:', saveErr);
        }
      }
    } catch (err: any) {
      console.error('Refinement generation error:', err);
      setErrorMessage(
        err?.message ||
          'Failed to apply the landscape refinement. Please try again with a slightly different description.'
      );
    } finally {
      setIsGenerating(false);
      setGenerationStepMessage('');
    }
  };

  // Switch between revisions
  const handleSelectRevision = (index: number) => {
    if (!activeProject) return;
    setActiveProject({
      ...activeProject,
      currentRevisionIndex: index,
    });
  };

  // Reset to start a new transformation
  const handleStartNewTransformation = () => {
    setActiveProject(null);
    setUploadedImageUri(null);
    setCustomInstructions('');
    setRefinementPrompt('');
    setErrorMessage(null);
  };

  // Handle Paywall Upgrade
  const handleUpgradeClick = async () => {
    if (!user) {
      if (onSignIn) onSignIn();
      return;
    }
    if (onUpgradeToPremium) {
      setIsUpgrading(true);
      try {
        await onUpgradeToPremium();
        setUpgradeSuccess(true);
      } catch (e) {
        console.error(e);
      } finally {
        setIsUpgrading(false);
      }
    }
  };

  const currentRevision = activeProject?.revisions[activeProject.currentRevisionIndex];

  // =========================================================================
  // PAYWALL & DEMONSTRATION SECTION (For Free Tier Users)
  // =========================================================================
  if (!isPremium && !isDemoMode) {
    const currentDemo = SAMPLE_LANDSCAPING_HOMES[demoShowcaseIndex];

    return (
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8" id="landscaping-paywall-container">
        {/* Header Badge & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold tracking-wide uppercase shadow-xs">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Exclusive Pro Member Feature</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            AI Landscaping Transformations
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600 dark:text-gray-300">
            Upload any photo of the <span className="font-semibold text-emerald-600 dark:text-emerald-400">front</span>,{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">side</span>, or{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">back</span> of your house. Tailor patios, pools, walkways, curb appeal, and iterate side-by-side until you are 100% satisfied.
          </p>
        </div>

        {/* Live Interactive Before & After Showcase */}
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-100 dark:border-gray-700 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                Interactive Before &amp; After Showcase
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {currentDemo.name} ({currentDemo.viewSide.toUpperCase()} VIEW)
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {currentDemo.summary}
              </p>
            </div>

            {/* Showcase Selector Buttons */}
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700/60 p-1.5 rounded-xl">
              {SAMPLE_LANDSCAPING_HOMES.slice(0, 3).map((sample, idx) => (
                <button
                  key={sample.id}
                  onClick={() => setDemoShowcaseIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    demoShowcaseIndex === idx
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {sample.viewSide === 'front' ? 'Front Yard' : sample.viewSide === 'back' ? 'Backyard Pool' : 'Side Walkway'}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Split Comparison Slider */}
          <div className="h-[420px] sm:h-[480px] rounded-2xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700">
            <BeforeAfterSlider
              originalImage={currentDemo.beforeImage}
              transformedImage={currentDemo.afterImage}
              originalLabel="Original House View"
              transformedLabel="AI Landscaped Rendering"
              onEnlarge={(url) => setEnlargedImageUrl(url)}
            />
          </div>

          {/* Applied Transformation Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-gray-500">Applied Enhancements:</span>
            {currentDemo.appliedOptions.map((opt, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
              >
                ✓ {opt}
              </span>
            ))}
          </div>
        </div>

        {/* Feature Grid: What you get with Landscaping Transformations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Home className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Front of the House
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Revitalize curb appeal with paver driveways, flagstone walkways, modern cedar porticos, drought-wise xeriscaping, and dramatic tree up-lighting.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Trees className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Back of the House
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Design dream outdoor living spaces: gunite swimming pools with waterfalls, sunken gas fire pits, outdoor kitchens, dining pergolas, and privacy tree walls.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Footprints className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Side of the House
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Transform narrow, neglected breezeways into floating cedar boardwalks, stone stepping paths, hidden trash enclosures, pet turf runs, and bamboo nooks.
            </p>
          </div>
        </div>

        {/* Subscription Pricing & Action Card */}
        <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-gray-900 text-white p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
              Included in Pro Subscription
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Unlock Unlimited Landscaping &amp; Room Transformations
            </h2>
            <p className="text-sm sm:text-base text-emerald-100">
              Upload unlimited house photos, experiment with various architectural landscape styles, generate high-resolution side-by-side comparisons, and iterate until satisfied.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <button
                type="button"
                onClick={handleUpgradeClick}
                disabled={isUpgrading}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                id="btn-upgrade-landscaping"
              >
                {isUpgrading ? (
                  <>
                    <Wand2 className="h-5 w-5 animate-spin" />
                    <span>Upgrading Account...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5" />
                    <span>{user ? 'Upgrade to Pro Pass' : 'Sign In to Unlock Pro'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsDemoMode(true)}
                className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/25 transition-all flex items-center gap-2 cursor-pointer"
                id="btn-demo-landscaping"
              >
                <span>Try Interactive Demo</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN WORKSPACE (Active Transformation Comparison & Refinement OR Setup Form)
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6" id="landscaping-transformations-workspace">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-xl shadow-sm">
            <Trees className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                Landscaping Transformations
              </h1>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                PRO
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Customize front, side, and back yard views, compare before &amp; after, and refine continuously.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {savedProjects.length > 0 && (
            <button
              type="button"
              onClick={() => setShowProjectsDrawer(true)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition-colors"
              id="btn-open-saved-landscaping"
            >
              <FolderOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Saved Projects ({savedProjects.length})</span>
            </button>
          )}

          {activeProject && (
            <button
              type="button"
              onClick={handleStartNewTransformation}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 transition-colors"
              id="btn-new-landscaping-project"
            >
              <Plus className="h-4 w-4" />
              <span>New Landscaping</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          VIEW A: ACTIVE COMPARATIVE WORKSPACE (BEFORE / AFTER & ITERATIVE REFINEMENT)
          ========================================================================= */}
      {activeProject && currentRevision ? (
        <div className="space-y-6" id="landscaping-active-comparison-view">
          {/* Project Details Bar */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                {renderViewIcon(activeProject.viewSide, 'h-5 w-5')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    {activeProject.title}
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 uppercase">
                    {activeProject.viewSide} view
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {currentRevision.label} • Created{' '}
                  {new Date(currentRevision.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Revision Navigation Timeline */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 pr-1">
                <History className="h-3.5 w-3.5" />
                <span>Revisions:</span>
              </span>
              {activeProject.revisions.map((rev, idx) => (
                <button
                  key={rev.id}
                  type="button"
                  onClick={() => handleSelectRevision(idx)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    activeProject.currentRevisionIndex === idx
                      ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                  title={rev.label}
                >
                  #{idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Core Interactive Comparison Slider */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="h-[480px] sm:h-[580px] rounded-2xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700">
              <BeforeAfterSlider
                originalImage={activeProject.originalImageUrl}
                transformedImage={currentRevision.renderedImageUrl}
                originalLabel={`Original ${activeProject.viewSide.toUpperCase()} View`}
                transformedLabel={`Customized ${activeProject.viewSide.toUpperCase()} Landscaping`}
                onEnlarge={(url) => setEnlargedImageUrl(url)}
              />
            </div>
          </div>

          {/* =========================================================================
              CONTINUE MAKING UPDATES UNTIL SATISFIED (ITERATIVE REFINEMENT PANEL)
              ========================================================================= */}
          <div
            className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-gray-800 dark:via-gray-800/80 dark:to-gray-800 p-6 sm:p-8 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 shadow-md"
            id="refine-landscaping-panel"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-xs">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Refine &amp; Continue Updating Until You Are Satisfied
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Describe any additions, swaps, or stylistic tweaks. We'll generate the next revision immediately.
                  </p>
                </div>
              </div>

              {/* Mode Toggle: Build on Current vs Fresh from Original */}
              <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-lg border border-emerald-200 dark:border-emerald-900 text-xs">
                <button
                  type="button"
                  onClick={() => setRefineMode('build-on-current')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    refineMode === 'build-on-current'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                  id="btn-refine-landscaping-current"
                >
                  Build on Current
                </button>
                <button
                  type="button"
                  onClick={() => setRefineMode('fresh-from-original')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    refineMode === 'fresh-from-original'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                  id="btn-refine-landscaping-original"
                >
                  Apply to Original Photo
                </button>
              </div>
            </div>

            {/* Quick 1-Click Refinement Ideas Tailored to the House View */}
            <div className="mb-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Quick 1-Click Ideas for {activeProject.viewSide.toUpperCase()} View:
              </span>
              <div className="flex flex-wrap gap-2">
                {activeRefinementChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleRefineTransformation(chip)}
                    className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-gray-700 dark:text-gray-200 hover:text-emerald-800 dark:hover:text-emerald-300 rounded-lg border border-gray-200 dark:border-gray-600 shadow-2xs transition-colors text-left"
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
                placeholder="E.g. Add a sheer descent stone waterfall to the pool, extend the travertine deck by 10 feet, and add modern warm up-lighting to the three mature trees..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
                id="input-refine-landscaping"
              />

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500">
                  {refineMode === 'build-on-current'
                    ? 'Refining on top of current revision #' + (activeProject.currentRevisionIndex + 1)
                    : 'Applying new prompt directly to original uploaded photo'}
                </span>

                <button
                  type="button"
                  onClick={() => handleRefineTransformation()}
                  disabled={isGenerating || !refinementPrompt.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  id="btn-generate-landscaping-revision"
                >
                  {isGenerating ? (
                    <>
                      <Wand2 className="h-4 w-4 animate-spin" />
                      <span>{generationStepMessage || 'Generating Revision...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Next Revision</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            VIEW B: SETUP FORM (UPLOAD PHOTO & SELECT VIEW-SPECIFIC CUSTOMIZATIONS)
            ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="landscaping-setup-form">
          {/* Left Column: Image Upload & Sample Selection (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Step 1: Upload House Photo */}
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  <span>Upload House Picture</span>
                </h2>
                {uploadedImageUri && (
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedImageUri(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Upload Drop Zone */}
              {!uploadedImageUri ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    isDraggingFile
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                      : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 bg-gray-50/50 dark:bg-gray-900/30'
                  }`}
                  id="dropzone-landscaping"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <Upload className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Click to upload or drag &amp; drop
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Front elevation, side walkway, or backyard photo (PNG, JPG, WEBP)
                  </p>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm group">
                  <img
                    src={uploadedImageUri}
                    alt="Uploaded House View"
                    className="w-full h-64 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEnlargedImageUrl(uploadedImageUri)}
                      className="px-3 py-1.5 bg-white/90 text-gray-900 rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span>Zoom</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-md"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Sample Houses Gallery */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Or Try a Sample House Photo:
                </h3>
              </div>

              {/* Sample view side tabs */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700/60 rounded-lg mb-3">
                <button
                  type="button"
                  onClick={() => setSampleViewTab('front')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all text-center ${
                    sampleViewTab === 'front'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  Front ({SAMPLE_LANDSCAPING_HOMES.filter((s) => s.viewSide === 'front').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSampleViewTab('back')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all text-center ${
                    sampleViewTab === 'back'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  Back ({SAMPLE_LANDSCAPING_HOMES.filter((s) => s.viewSide === 'back').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSampleViewTab('side')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all text-center ${
                    sampleViewTab === 'side'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  Side ({SAMPLE_LANDSCAPING_HOMES.filter((s) => s.viewSide === 'side').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSampleViewTab('all')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all text-center ${
                    sampleViewTab === 'all'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  All ({SAMPLE_LANDSCAPING_HOMES.length})
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {SAMPLE_LANDSCAPING_HOMES.filter((sample) => {
                  if (sampleViewTab === 'all') return true;
                  return sample.viewSide === sampleViewTab;
                }).map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => handleSelectSampleHouse(sample)}
                    className="group cursor-pointer rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-emerald-500 transition-all shadow-2xs hover:shadow-md"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={sample.beforeImage}
                        alt={sample.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-2">
                        <span className="self-start px-1.5 py-0.5 mb-1 bg-emerald-600/90 text-white font-bold text-[9px] rounded uppercase tracking-wider">
                          {sample.viewSide.toUpperCase()}
                        </span>
                        <span className="text-white text-xs font-bold leading-tight line-clamp-1">
                          {sample.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Selections & Customization Depending on View Side (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 space-y-6">
              {/* Step 2: Select Which Side of the House View is Uploaded */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  <span>Which Side of the House View is This?</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Selections and customization options automatically adjust based on the uploaded elevation.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {HOUSE_VIEW_SIDES.map((side) => (
                    <button
                      key={side.id}
                      type="button"
                      onClick={() => setSelectedViewSide(side.id)}
                      className={`p-4 rounded-xl border text-left transition-all relative ${
                        selectedViewSide === side.id
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                      }`}
                      id={`view-side-${side.id}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            selectedViewSide === side.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {renderViewIcon(side.id, 'h-4 w-4')}
                        </div>
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded">
                          {side.badge}
                        </span>
                      </div>
                      <div className="font-bold text-sm">{side.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {side.tagline}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: View-Specific Customization Sections */}
              <div className="space-y-5 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-600" />
                    <span>Tailored Options for {activeViewConfig.name}</span>
                  </h3>
                  <span className="text-xs text-gray-500">
                    {activeViewConfig.sections.length} categories
                  </span>
                </div>

                {activeViewConfig.sections.map((section) => (
                  <div key={section.id} className="space-y-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      {section.title}:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {section.options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setViewSpecificSelections((prev) => ({
                              ...prev,
                              [section.id]: opt.id,
                            }))
                          }
                          className={`p-3 rounded-xl border text-left transition-all ${
                            viewSpecificSelections[section.id] === opt.id
                              ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs">{opt.label}</span>
                            {viewSpecificSelections[section.id] === opt.id && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {opt.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Step 4: Overall Landscaping Style */}
              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Landscaping Style &amp; Flora Theme:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {LANDSCAPING_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyleId(style.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedStyleId === style.id
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="font-bold text-xs">{style.name}</div>
                      <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                        {style.tagline}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 5: Lighting & Time of Day */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Time of Day &amp; Lighting Atmosphere:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {LANDSCAPING_LIGHTINGS.map((light) => (
                    <button
                      key={light.id}
                      type="button"
                      onClick={() => setSelectedLightingId(light.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedLightingId === light.id
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="font-bold text-xs">{light.name}</div>
                      <div className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">
                        {light.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 6: Written Custom Descriptions */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Specific Custom Instructions (Optional):
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Add a natural stone retaining wall, an olive tree focal point, black slate walkway, and hidden recessed up-lighting along the driveway..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
                  id="input-custom-landscaping"
                />
              </div>

              {/* Primary Action Button: Generate Landscaping Transformation */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleGenerateTransformation}
                  disabled={isGenerating || !uploadedImageUri}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer text-base"
                  id="btn-generate-landscaping-transformation"
                >
                  {isGenerating ? (
                    <>
                      <Wand2 className="h-5 w-5 animate-spin" />
                      <span>{generationStepMessage || 'Transforming Landscaping...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Generate Landscaping Transformation</span>
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-500 mt-2">
                  Once generated, you can inspect the interactive side-by-side comparison and continuously refine updates until satisfied.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SAVED PROJECTS DRAWER / MODAL
          ========================================================================= */}
      {showProjectsDrawer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Saved Landscaping Projects
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProjectsDrawer(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {savedProjects.map((p) => {
                const latestRev = p.revisions[p.currentRevisionIndex] || p.revisions[0];
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveProject(p);
                      setShowProjectsDrawer(false);
                    }}
                    className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500 cursor-pointer transition-all flex gap-3 group"
                  >
                    <img
                      src={latestRev?.renderedImageUrl || p.originalImageUrl}
                      alt={p.title}
                      className="w-20 h-20 rounded-lg object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {p.title}
                        </span>
                      </div>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 mt-1">
                        {p.viewSide} view
                      </span>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {p.revisions.length} revision{p.revisions.length !== 1 ? 's' : ''} •{' '}
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          IMAGE ENLARGE MODAL
          ========================================================================= */}
      {enlargedImageUrl && (
        <div
          onClick={() => setEnlargedImageUrl(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={enlargedImageUrl}
              alt="Enlarged View"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              onClick={() => setEnlargedImageUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
