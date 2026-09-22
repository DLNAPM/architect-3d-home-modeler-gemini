import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Wand2,
  Gamepad2,
  Mic,
  Wine,
  Film,
  Dumbbell,
  Sofa,
  Utensils,
  Bed,
  Bath,
  Coffee,
  Briefcase,
  Sun,
  Tv,
  Fan,
  DoorOpen,
  Info,
  Pencil
} from 'lucide-react';
import { User, RoomTransformationProject, TransformationRevision } from '../types';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import {
  ROOM_TYPES,
  COMMON_STYLES,
  COLOR_PALETTES,
  FLOORING_OPTIONS,
  LIGHTING_OPTIONS,
  FEATURE_WALL_CATEGORIES,
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
  const [selectedFeatureWallCategory, setSelectedFeatureWallCategory] = useState<string>('none');
  const [selectedFeatureWallOptionId, setSelectedFeatureWallOptionId] = useState<string>('standard-matching');
  const [selectedModeId, setSelectedModeId] = useState<string>('restyle');
  const [roomSpecificSelections, setRoomSpecificSelections] = useState<Record<string, string>>({});
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Category Filtering for Room Types and Sample Gallery
  const [roomCategoryTab, setRoomCategoryTab] = useState<'basement' | 'all' | 'main'>('basement');
  const [sampleCategoryTab, setSampleCategoryTab] = useState<'basement' | 'all' | 'main'>('basement');
  const [demoShowcaseIndex, setDemoShowcaseIndex] = useState<number>(0);

  // Iterative Refinement State
  const [refinementPrompt, setRefinementPrompt] = useState<string>('');
  const [refineMode, setRefineMode] = useState<'build-on-current' | 'fresh-from-original'>('build-on-current');

  // Generation & Status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepMessage, setGenerationStepMessage] = useState<string>('Analyzing room structure...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Enlarge modal
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);

  // Revisions management state
  const [revisionToDelete, setRevisionToDelete] = useState<{ index: number; revision: TransformationRevision } | null>(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);

  // Project Rename State
  const [projectToRename, setProjectToRename] = useState<{ id: string; currentTitle: string } | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState<string>('');
  const [isRenamingProject, setIsRenamingProject] = useState(false);
  const [renameSuccessMessage, setRenameSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get active room type config
  const activeRoomTypeConfig = ROOM_TYPES.find((r) => r.id === selectedRoomTypeId) || ROOM_TYPES[0];

  // When Room Type is Hallway and Water Feature is selected for Feature Wall,
  // disable all Tailored Feature Wall Customizations while keeping Written Customization enabled
  const isHallwayWaterFeature = activeRoomTypeConfig.id === 'hallway' && selectedFeatureWallCategory === 'water-feature';

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

    // Feature wall modifier
    let featureWallModifier = '';
    if (selectedFeatureWallCategory && selectedFeatureWallCategory !== 'none') {
      const featCat = FEATURE_WALL_CATEGORIES.find((c) => c.id === selectedFeatureWallCategory);
      if (featCat) {
        const featOpt = featCat.options.find((o) => o.id === selectedFeatureWallOptionId) || featCat.options[0];
        if (featOpt) {
          featureWallModifier = `Feature Wall (${featCat.label}): ${featOpt.promptModifier}`;
        }
      }
    }

    const specificModifiersList = (isHallwayWaterFeature ? [] : activeRoomTypeConfig.specificSections
      .map((sec) => {
        const selectedOptId = roomSpecificSelections[sec.id];
        const opt = sec.options.find((o) => o.id === selectedOptId);
        return opt ? `${sec.label}: ${opt.promptModifier}` : null;
      })
      .filter(Boolean)) as string[];

    if (featureWallModifier) {
      specificModifiersList.unshift(featureWallModifier);
    }

    const specificModifiers = specificModifiersList.join(', ');

    if (isIterative && extraInstructions.trim()) {
      return `Photorealistic interior architectural rendering revision of this ${activeRoomTypeConfig.name}.
Crucial iterative customization: ${extraInstructions.trim()}.
Maintain high architectural integrity, photographic clarity, accurate materials, and seamless lighting.
${styleObj ? `Aesthetic style: ${styleObj.prompt}.` : ''}
${colorObj ? `Color palette: ${colorObj.prompt}.` : ''}
${featureWallModifier ? `Feature Wall specification: ${featureWallModifier}.` : ''}`;
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
          featureWallCategory: selectedFeatureWallCategory,
          featureWallOption: selectedFeatureWallOptionId,
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

  // Delete revision handlers
  const handleDeleteRevision = (idx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeProject || !activeProject.revisions[idx]) return;
    setRevisionToDelete({
      index: idx,
      revision: activeProject.revisions[idx],
    });
  };

  const confirmDeleteRevision = async () => {
    if (!activeProject || !revisionToDelete) return;
    const { index: delIdx, revision } = revisionToDelete;
    setRevisionToDelete(null);

    // If this is the only revision in the project
    if (activeProject.revisions.length <= 1) {
      if (user?.uid) {
        try {
          await cloudService.deleteRoomTransformation(user.uid, activeProject.id);
          setSavedProjects((prev) => prev.filter((p) => p.id !== activeProject.id));
        } catch (err) {
          console.warn('Failed to delete empty project from cloud:', err);
        }
      }
      setActiveProject(null);
      setUploadedImageUri(null);
      setDeleteSuccessMessage('Revision deleted. Project cleared.');
      setTimeout(() => setDeleteSuccessMessage(null), 3500);
      return;
    }

    // Multiple revisions exist: remove the target revision
    const updatedRevisions = activeProject.revisions.filter((_, i) => i !== delIdx);
    let nextCurrentIndex = activeProject.currentRevisionIndex;

    if (nextCurrentIndex === delIdx) {
      // If we deleted the revision currently being viewed, step back or stay at boundary
      nextCurrentIndex = Math.max(0, delIdx - 1);
    } else if (nextCurrentIndex > delIdx) {
      // Shift active index back by 1 because an item preceding it was removed
      nextCurrentIndex = nextCurrentIndex - 1;
    }

    const updatedProject: RoomTransformationProject = {
      ...activeProject,
      revisions: updatedRevisions,
      currentRevisionIndex: nextCurrentIndex,
      updatedAt: Date.now(),
    };

    setActiveProject(updatedProject);

    if (user?.uid) {
      try {
        await cloudService.saveRoomTransformation(user.uid, updatedProject);
        setSavedProjects((prev) =>
          prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
        );
      } catch (saveErr) {
        console.warn('Failed to save updated revisions to cloud:', saveErr);
      }
    }

    setDeleteSuccessMessage(`Deleted ${revision.label.split(':')[0] || 'revision'}.`);
    setTimeout(() => setDeleteSuccessMessage(null), 3500);
  };

  // Open rename modal
  const handleOpenRenameModal = (id: string, currentTitle: string) => {
    setProjectToRename({ id, currentTitle });
    setNewProjectTitle(currentTitle);
  };

  // Save renamed project
  const handleSaveRename = async () => {
    if (!projectToRename || !newProjectTitle.trim()) return;
    const trimmedTitle = newProjectTitle.trim();
    const targetId = projectToRename.id;
    setIsRenamingProject(true);

    try {
      if (user?.uid) {
        await cloudService.renameRoomTransformation(user.uid, targetId, trimmedTitle);
      }

      setSavedProjects((prev) =>
        prev.map((p) => (p.id === targetId ? { ...p, title: trimmedTitle, updatedAt: Date.now() } : p))
      );

      if (activeProject?.id === targetId) {
        setActiveProject((prev) => (prev ? { ...prev, title: trimmedTitle, updatedAt: Date.now() } : null));
      }

      setRenameSuccessMessage(`Transformation renamed to "${trimmedTitle}"`);
      setTimeout(() => setRenameSuccessMessage(null), 3500);
      setProjectToRename(null);
    } catch (err) {
      console.error('Failed to rename room transformation:', err);
      alert('Failed to rename room transformation. Please try again.');
    } finally {
      setIsRenamingProject(false);
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

  // Icon helper for room types
  const renderRoomIcon = (iconName: string, className = 'h-4 w-4') => {
    switch (iconName) {
      case 'Gamepad2':
        return <Gamepad2 className={className} />;
      case 'Mic':
        return <Mic className={className} />;
      case 'Wine':
        return <Wine className={className} />;
      case 'Film':
        return <Film className={className} />;
      case 'Dumbbell':
        return <Dumbbell className={className} />;
      case 'Sofa':
        return <Sofa className={className} />;
      case 'Utensils':
        return <Utensils className={className} />;
      case 'Bed':
        return <Bed className={className} />;
      case 'Bath':
        return <Bath className={className} />;
      case 'Coffee':
        return <Coffee className={className} />;
      case 'Briefcase':
        return <Briefcase className={className} />;
      case 'Sun':
        return <Sun className={className} />;
      case 'Tv':
        return <Tv className={className} />;
      case 'Fan':
        return <Fan className={className} />;
      case 'DoorOpen':
        return <DoorOpen className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  // Demo showcase items for the paywall preview
  const DEMO_SHOWCASE_ITEMS = [
    {
      id: 'game-room',
      title: 'Game Room with Pool Table & Arcades',
      badge: 'Basement Transformation',
      original: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1200&q=80',
      transformed: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?auto=format&fit=crop&w=1200&q=80',
      originalLabel: 'Unfinished Basement Space',
      transformedLabel: 'Luxury Game Room with Pool Table & Stand-Up Arcades',
    },
    {
      id: 'soundproof-studio',
      title: 'Soundproof Studio & Acoustic Booth',
      badge: 'Basement Transformation',
      original: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
      transformed: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
      originalLabel: 'Bare Basement Nook',
      transformedLabel: 'Acoustic Soundproof Studio & Vocal Booth',
    },
    {
      id: 'basement-bar',
      title: 'Basement Bar with Stools & High-Top Table',
      badge: 'Basement Transformation',
      original: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      transformed: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1200&q=80',
      originalLabel: 'Empty Corner Space',
      transformedLabel: 'Custom Wet Bar, Stools & High-Top Pub Table',
    },
    {
      id: 'movie-room',
      title: 'Movie Room with Studio Sound & Lounge Chairs',
      badge: 'Basement Transformation',
      original: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      transformed: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?auto=format&fit=crop&w=1200&q=80',
      originalLabel: 'Dark Storage Room',
      transformedLabel: 'Private Cinema with Starlight Ceiling & Lounge Recliners',
    },
    {
      id: 'exercise-room',
      title: 'Exercise Room with TV & Ceiling Fan(s)',
      badge: 'Basement Transformation',
      original: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
      transformed: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=80',
      originalLabel: 'Unfinished Concrete Room',
      transformedLabel: 'Commercial Fitness Gym with Smart TV & Dual Ceiling Fans',
    },
    {
      id: 'wine-room',
      title: 'Wine Room with Wine Wall, Bucket Chairs & Coffee Table',
      badge: 'Basement Transformation',
      original: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      transformed: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80',
      originalLabel: 'Unused Basement Alcove',
      transformedLabel: 'Luxury Wine Room with Climate Wall & Bucket Chairs',
    },
    {
      id: 'hallway',
      title: 'Hallway with Feature Wall & Picture Gallery',
      badge: 'Main Living Space',
      original: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      transformed: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      originalLabel: 'Plain Residential Hallway',
      transformedLabel: 'Luxury Gallery Hallway with Feature Wall & Accent Lighting',
    },
    {
      id: 'living-room',
      title: 'Living Room Japandi Restyle',
      badge: 'Main Living Space',
      original: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      transformed: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
      originalLabel: 'Dated 1990s Living Room',
      transformedLabel: 'Modern Japandi Restyle',
    },
  ];

  // Quick refinement suggestion chips based on active room type
  const activeRefinementChips = useMemo(() => {
    const currentRoomId = activeProject?.roomType || selectedRoomTypeId;
    switch (currentRoomId) {
      case 'game-room':
        return [
          'Add custom neon arcade sign on brick accent wall',
          'Switch pool table felt to tournament charcoal gray',
          'Add stand-up retro pinball machine in corner',
          'Add bar-height spectator rail along perimeter wall',
          'Install low-hung matte black linear pool table pendant',
          'Add illuminated cue rack and framed vintage sports art',
        ];
      case 'soundproof-studio':
        return [
          'Add vertical oak acoustic slat wall diffusors',
          'Add Shure SM7B broadcast microphones on boom arms',
          'Suspend fabric acoustic ceiling cloud with warm downlights',
          'Add dimmable dual-tone amber & indigo LED cove backlighting',
          'Add Yamaha HS8 studio monitors on isolation pads',
          'Upgrade glass vocal booth with heavy acoustic seal',
        ];
      case 'basement-bar':
        return [
          'Add waterfall quartzite edge to bar counter',
          'Add matching high-top pub table with two leather bar stools',
          'Install hanging brushed brass stemware wine glass racks',
          'Add antiqued mirrored back-bar with floating glass shelves',
          'Add under-counter warm amber LED ribbon glow',
          'Add dual glass-door wine and beverage cooler units',
        ];
      case 'movie-room':
        return [
          'Add twinkling fiber-optic starlight constellation ceiling',
          'Add tiered motorized black leather cinema lounge recliners',
          'Install hidden in-wall Dolby Atmos studio surround sound speakers',
          'Add vertical brushed brass cinema wall sconces (dimmed)',
          'Upgrade to 150-inch acoustically transparent projector screen',
          'Add concession counter with vintage popcorn cart',
        ];
      case 'exercise-room':
        return [
          'Install dual industrial matte black multi-blade ceiling fans',
          'Mount 65-inch smart fitness workout TV on main wall',
          'Add commercial speckled rubber gym flooring with turf strip',
          'Add full-wall mirror with commercial half-rack & barbell',
          'Add connected stationary spin bike & 3-tier dumbbell rack',
          'Add serene yoga cork mats and Swedish ladder wall',
        ];
      case 'wine-room':
      case 'Wine Room':
        return [
          'Add backlit acrylic rods to climate wine wall display',
          'Upgrade to deep curved bouclé swivel bucket chairs',
          'Add fluted travertine low plinth coffee table',
          'Place Italian Carrara marble wine glass coasters on table',
          'Add sheer water feature wall with recirculating ripple lighting',
          'Install triple-deep black metal wine peg racking',
        ];
      case 'hallway':
      case 'Hallway':
        return [
          'Add symmetrical grid gallery with black matted picture frames',
          'Install vertical white oak acoustic slat feature wall with LED cove',
          'Add flush-mounted modern linear electric fireplace',
          'Add geometric preserved vibrant green reindeer moss wall panel',
          'Add vintage sepia cartographic world map mural',
          'Install floating hardwood wall hangers for acoustic guitars',
          'Add signed sports jersey shadow box frames with LED edge glow',
        ];
      default:
        return [
          'Add lush potted indoor olive tree',
          'Warm up lighting with ambient 2700K cove glow',
          'Change flooring to French herringbone light oak',
          'Make wall color Sherwin Williams Alabaster warm white',
          'Add modern abstract minimalist canvas art on wall',
          'Replace ceiling fixture with sculptural brass chandelier',
          'Declutter surfaces for hyper-clean minimalist finish',
          'Enhance natural morning sunbeam reflections',
        ];
    }
  }, [activeProject?.roomType, selectedRoomTypeId]);

  // ==========================================
  // VIEW: PAID SUBSCRIPTION PAYWALL (IF NOT PREMIUM & NOT DEMO)
  // ==========================================
  if (!isPremium && !isDemoMode) {
    const activeDemo = DEMO_SHOWCASE_ITEMS[demoShowcaseIndex] || DEMO_SHOWCASE_ITEMS[0];

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
            Upload any real photo of an existing room—including unfinished basements, entertainment dens, game rooms, studios, bars, home theaters, and gyms—and watch AI re-architect it in your choice of luxury styles. Compare before &amp; after side-by-side with an interactive slider, and continue refining until you are 100% satisfied.
          </p>
        </div>

        {/* Interactive Before/After Showcase */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-purple-100 dark:border-purple-900/50 mb-12">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Live Demonstration Preview
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                  {activeDemo.badge}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  {activeDemo.title}
                </span>
              </div>
            </div>

            {/* Showcase selector tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 dark:bg-gray-700/60 rounded-xl">
              {DEMO_SHOWCASE_ITEMS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDemoShowcaseIndex(idx)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    demoShowcaseIndex === idx
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {item.title.split(' ')[0]} {item.title.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          <BeforeAfterSlider
            originalImage={activeDemo.original}
            transformedImage={activeDemo.transformed}
            originalLabel={activeDemo.originalLabel}
            transformedLabel={activeDemo.transformedLabel}
          />
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
              Upload Any Room or Basement
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Transform basement game rooms with pool tables, soundproof audio studios, custom bars with pub tables, home movie theaters, exercise rooms with ceiling fans, kitchens, and living rooms.
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
              Interactive split-view slider lets you peel smoothly between the original room photo and your customized architectural rendering in high fidelity.
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
              Request continuous updates—swap materials, add retro pinball games, tune studio soundproofing, adjust bar seating, or add ceiling fans across unlimited revision cycles.
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
              Upgrade your subscription to gain unlimited access to Room Transformations, high-resolution downloads, side-by-side comparisons, and basement entertainment packages.
            </p>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/15 max-w-md mx-auto">
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-4xl font-extrabold">$19.99</span>
                <span className="text-purple-200 text-sm">/ month</span>
              </div>
              <ul className="text-left text-sm space-y-2.5 text-purple-100">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Room &amp; Basement Photo Transformations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Basement Options (Game Room, Soundproof Studio, Bar, Theater, Gym)</span>
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

      {/* Success Notification Banners */}
      {deleteSuccessMessage && (
        <div
          className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between shadow-xs animate-in fade-in"
          role="status"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{deleteSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {renameSuccessMessage && (
        <div
          className="mb-6 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-sm flex items-center justify-between shadow-xs animate-in fade-in"
          role="status"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0" />
            <span>{renameSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setRenameSuccessMessage(null)}
            className="text-purple-600 hover:text-purple-800 dark:hover:text-purple-200"
            aria-label="Dismiss notification"
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
          {/* Top Bar with Revisions Navigation & Delete Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {activeProject.title}
                </h2>
                <button
                  type="button"
                  onClick={() => handleOpenRenameModal(activeProject.id, activeProject.title)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                  title="Rename room transformation"
                  aria-label="Rename room transformation"
                  id="btn-rename-active-room-transformation"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Created {new Date(activeProject.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {activeProject.revisions.length} revision{activeProject.revisions.length === 1 ? '' : 's'}
              </p>
            </div>

            {/* Revisions Pills with Integrated Delete Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <History className="h-3.5 w-3.5" />
                <span>Revisions:</span>
              </span>
              {activeProject.revisions.map((rev, idx) => (
                <div
                  key={rev.id}
                  className={`inline-flex items-center rounded-full transition-all shrink-0 pl-3 pr-1 py-1 text-xs font-medium border ${
                    activeProject.currentRevisionIndex === idx
                      ? 'bg-purple-600 border-purple-700 text-white shadow-xs font-bold'
                      : 'bg-gray-100 dark:bg-gray-700/80 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  id={`revision-pill-container-${idx}`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setActiveProject({
                        ...activeProject,
                        currentRevisionIndex: idx,
                      })
                    }
                    className="cursor-pointer pr-1 text-left focus:outline-hidden"
                    id={`btn-revision-${idx}`}
                    title={`Compare ${rev.label}`}
                  >
                    {rev.label.split(':')[0]}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteRevision(idx, e)}
                    className={`p-1 rounded-full transition-colors cursor-pointer ml-1 ${
                      activeProject.currentRevisionIndex === idx
                        ? 'text-purple-200 hover:text-white hover:bg-purple-700'
                        : 'text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-500'
                    }`}
                    title={`Delete ${rev.label.split(':')[0]}`}
                    aria-label={`Delete ${rev.label.split(':')[0]}`}
                    id={`btn-delete-revision-pill-${idx}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Revision Header & Quick Action Bar */}
          {activeProject.revisions[activeProject.currentRevisionIndex] && (
            <div className="bg-purple-50/80 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 px-4 py-3 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-purple-600 text-white font-bold text-xs rounded-md">
                  Revision {activeProject.currentRevisionIndex + 1} of {activeProject.revisions.length}
                </span>
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-1 max-w-md">
                  {activeProject.revisions[activeProject.currentRevisionIndex].label}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:inline">
                  • {new Date(activeProject.revisions[activeProject.currentRevisionIndex].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleDeleteRevision(activeProject.currentRevisionIndex, e)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900/60 shadow-2xs transition-colors cursor-pointer"
                  title="Delete this active revision"
                  id="btn-delete-active-revision"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete This Revision</span>
                </button>
              </div>
            </div>
          )}

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
              ALL REVISIONS GALLERY & COMPARISON STRIP
              ========================================== */}
          <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <History className="h-4 w-4 text-purple-600" />
                  <span>All Transformation Revisions ({activeProject.revisions.length})</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select any revision to compare against the original photo, or delete revisions you no longer need.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {activeProject.revisions.map((rev, idx) => {
                const isCurrent = activeProject.currentRevisionIndex === idx;
                return (
                  <div
                    key={rev.id}
                    onClick={() =>
                      setActiveProject({
                        ...activeProject,
                        currentRevisionIndex: idx,
                      })
                    }
                    className={`group relative rounded-xl border p-2.5 transition-all cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? 'border-purple-600 ring-2 ring-purple-500/30 bg-purple-50/40 dark:bg-purple-950/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 bg-gray-50/50 dark:bg-gray-900/40'
                    }`}
                    id={`revision-card-${idx}`}
                  >
                    <div>
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-950 mb-2">
                        <img
                          src={rev.renderedImageUrl}
                          alt={rev.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                            isCurrent
                              ? 'bg-purple-600 text-white'
                              : 'bg-black/70 text-white'
                          }`}>
                            Rev {idx + 1}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500 text-white rounded">
                              Comparing
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="font-bold text-xs text-gray-900 dark:text-white line-clamp-1">
                          {rev.label}
                        </div>
                        {rev.customInstructions && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 italic">
                            "{rev.customInstructions}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-200/80 dark:border-gray-700/80 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-gray-400">
                        {new Date(rev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <div className="flex items-center gap-1">
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveProject({
                                ...activeProject,
                                currentRevisionIndex: idx,
                              });
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded transition-colors"
                          >
                            Compare
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteRevision(idx, e)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                          title={`Delete Revision ${idx + 1}`}
                          id={`btn-delete-card-rev-${idx}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
                Quick 1-Click Ideas for this Room:
              </span>
              <div className="flex flex-wrap gap-2">
                {activeRefinementChips.map((chip, idx) => (
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
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Or Try a Sample Room Photo:
                </h3>
              </div>

              {/* Sample category toggle tabs */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700/60 rounded-lg mb-3">
                <button
                  type="button"
                  onClick={() => setSampleCategoryTab('basement')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all text-center ${
                    sampleCategoryTab === 'basement'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Basement ({SAMPLE_ROOMS.filter(s => ['game-room', 'soundproof-studio', 'basement-bar', 'movie-room', 'exercise-room'].includes(s.roomType)).length})
                </button>
                <button
                  type="button"
                  onClick={() => setSampleCategoryTab('main')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all text-center ${
                    sampleCategoryTab === 'main'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Main ({SAMPLE_ROOMS.filter(s => !['game-room', 'soundproof-studio', 'basement-bar', 'movie-room', 'exercise-room'].includes(s.roomType)).length})
                </button>
                <button
                  type="button"
                  onClick={() => setSampleCategoryTab('all')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all text-center ${
                    sampleCategoryTab === 'all'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  All ({SAMPLE_ROOMS.length})
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {SAMPLE_ROOMS
                  .filter((sample) => {
                    const isBasement = ['game-room', 'soundproof-studio', 'basement-bar', 'movie-room', 'exercise-room', 'wine-room'].includes(sample.roomType);
                    if (sampleCategoryTab === 'basement') return isBasement;
                    if (sampleCategoryTab === 'main') return !isBasement;
                    return true;
                  })
                  .map((sample) => (
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-2">
                        {['game-room', 'soundproof-studio', 'basement-bar', 'movie-room', 'exercise-room', 'wine-room'].includes(sample.roomType) && (
                          <span className="self-start px-1.5 py-0.5 mb-1 bg-amber-500/90 text-white font-bold text-[9px] rounded uppercase tracking-wider">
                            Basement
                          </span>
                        )}
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

          {/* Right Column: Tailored Selections & Customization (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 space-y-6">
              {/* Step 2: Room Type Selector */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">
                      2
                    </span>
                    <span>Select Room Type</span>
                  </h2>

                  {/* Category Filter Tabs */}
                  <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700/60 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setRoomCategoryTab('basement')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                        roomCategoryTab === 'basement'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      id="tab-rooms-basement"
                    >
                      <span>Basement Rooms</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${roomCategoryTab === 'basement' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}>
                        {ROOM_TYPES.filter(r => r.category === 'basement').length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoomCategoryTab('all')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                        roomCategoryTab === 'all'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      id="tab-rooms-all"
                    >
                      <span>All Rooms</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${roomCategoryTab === 'all' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}>
                        {ROOM_TYPES.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoomCategoryTab('main')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                        roomCategoryTab === 'main'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      id="tab-rooms-main"
                    >
                      <span>Main Living</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${roomCategoryTab === 'main' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}>
                        {ROOM_TYPES.filter(r => r.category !== 'basement').length}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {ROOM_TYPES
                    .filter((room) => {
                      if (roomCategoryTab === 'basement') return room.category === 'basement';
                      if (roomCategoryTab === 'main') return room.category !== 'basement';
                      return true;
                    })
                    .map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedRoomTypeId(room.id)}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        selectedRoomTypeId === room.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                      }`}
                      id={`room-type-${room.id}`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          selectedRoomTypeId === room.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                          {renderRoomIcon(room.iconName, 'h-3.5 w-3.5')}
                        </div>
                        {room.category === 'basement' && (
                          <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 rounded">
                            Basement
                          </span>
                        )}
                      </div>
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

              {/* Feature Wall Section */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Feature Wall (Optional Accent):
                  </label>
                  {selectedFeatureWallCategory !== 'none' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFeatureWallCategory('none');
                        setSelectedFeatureWallOptionId('standard-matching');
                      }}
                      className="text-[11px] text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium"
                    >
                      Clear Feature Wall
                    </button>
                  )}
                </div>

                {/* Feature Wall Category Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFeatureWallCategory('none');
                      setSelectedFeatureWallOptionId('standard-matching');
                    }}
                    className={`px-3 py-2 text-xs rounded-lg border text-left transition-all ${
                      selectedFeatureWallCategory === 'none'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 font-bold ring-1 ring-purple-500'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="font-semibold">Standard / No Accent Wall</div>
                    <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">Uniform room walls</div>
                  </button>

                  {FEATURE_WALL_CATEGORIES.map((featCat) => (
                    <button
                      key={featCat.id}
                      type="button"
                      onClick={() => {
                        setSelectedFeatureWallCategory(featCat.id);
                        setSelectedFeatureWallOptionId(featCat.options[0].id);
                      }}
                      className={`px-3 py-2 text-xs rounded-lg border text-left transition-all ${
                        selectedFeatureWallCategory === featCat.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 font-bold ring-1 ring-purple-500'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="font-semibold">{featCat.label}</div>
                      <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{featCat.description}</div>
                    </button>
                  ))}
                </div>

                {/* Feature Wall Specific Style Options (when a category is selected) */}
                {selectedFeatureWallCategory !== 'none' && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                    <span className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-2">
                      Choose {FEATURE_WALL_CATEGORIES.find((c) => c.id === selectedFeatureWallCategory)?.label} Style:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {FEATURE_WALL_CATEGORIES.find((c) => c.id === selectedFeatureWallCategory)?.options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedFeatureWallOptionId(opt.id)}
                          className={`p-2.5 text-xs text-left rounded-lg border transition-all ${
                            selectedFeatureWallOptionId === opt.id
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 font-semibold ring-1 ring-purple-500'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{opt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Tailored Options for Selected Room Type */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    {activeRoomTypeConfig.id === 'hallway'
                      ? 'Tailored Feature Wall Customizations:'
                      : `Tailored ${activeRoomTypeConfig.name} Customizations:`}
                  </h3>
                  {isHallwayWaterFeature && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                      Disabled (Water Feature Active)
                    </span>
                  )}
                </div>

                {isHallwayWaterFeature && (
                  <div className="mb-3.5 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs flex items-start gap-2.5">
                    <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-sky-800 dark:text-sky-300">
                        Tailored Feature Wall Customizations are Disabled
                      </p>
                      <p className="text-[11px] text-sky-700 dark:text-sky-300/80 leading-relaxed">
                        Because <strong>Water Feature</strong> is selected for the Feature Wall, the tailored feature wall customizations below are disabled so the indoor water cascade remains the primary architectural focal point.
                      </p>
                      <p className="text-[11px] text-sky-800 dark:text-sky-300 font-medium">
                        ✨ <strong>Written Custom Instructions below remain fully enabled</strong> for any specific requests or accents.
                      </p>
                    </div>
                  </div>
                )}

                <div className={`space-y-4 transition-opacity ${isHallwayWaterFeature ? 'opacity-40 pointer-events-none select-none' : ''}`}>
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
                            disabled={isHallwayWaterFeature}
                            onClick={() =>
                              setRoomSpecificSelections((prev) => ({
                                ...prev,
                                [sec.id]: opt.id,
                              }))
                            }
                            className={`px-3 py-2 text-xs text-left rounded-lg border transition-all ${
                              isHallwayWaterFeature
                                ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/40 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                : roomSpecificSelections[sec.id] === opt.id
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Written Custom Instructions (Optional):
                  </label>
                  {isHallwayWaterFeature && (
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="h-3 w-3" /> Enabled
                    </span>
                  )}
                </div>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder={
                    isHallwayWaterFeature
                      ? `Describe any custom details for your Hallway & Water Feature (e.g., "Add river pebble basin with soft amber uplighting, narrow floating oak bench on opposite wall, soft warm white walls...")`
                      : `Describe any specific changes for this ${activeRoomTypeConfig.name.toLowerCase()} (e.g., "Remove the ceiling fan and install a brass pendant, paint walls Benjamin Moore Swiss Coffee, add an olive tree in ceramic pot...")`
                  }
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

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenRenameModal(proj.id, proj.title);
                        }}
                        className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Rename transformation"
                        aria-label="Rename transformation"
                        id={`btn-rename-saved-project-${proj.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
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
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Delete project"
                        aria-label="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rename Transformation Modal */}
      {projectToRename && (
        <div
          className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isRenamingProject && setProjectToRename(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-room-modal-title"
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="rename-room-modal-title" className="text-base font-bold text-gray-900 dark:text-white">
                    Rename Transformation
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Give this room transformation a descriptive title.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isRenamingProject}
                onClick={() => setProjectToRename(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveRename();
              }}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="rename-room-input"
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
                >
                  Project Title
                </label>
                <input
                  id="rename-room-input"
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="e.g. Modern Japandi Living Room"
                  autoFocus
                  maxLength={80}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-hidden transition-all shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                <button
                  type="button"
                  disabled={isRenamingProject}
                  onClick={() => setProjectToRename(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isRenamingProject ||
                    !newProjectTitle.trim() ||
                    newProjectTitle.trim() === projectToRename.currentTitle
                  }
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  id="btn-save-room-rename"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{isRenamingProject ? 'Saving...' : 'Save Name'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Revision Confirmation Modal */}
      {revisionToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Delete {revisionToDelete.revision.label.split(':')[0] || 'Revision'}?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {activeProject && activeProject.revisions.length <= 1
                    ? 'This is the only revision in this room transformation. Deleting it will clear the transformation and return you to the room setup.'
                    : `Are you sure you want to permanently delete this revision (${revisionToDelete.revision.label})? It will be removed from your comparison history.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRevisionToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
                id="btn-cancel-delete-revision"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteRevision}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                id="btn-confirm-delete-revision"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Revision</span>
              </button>
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
