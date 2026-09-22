import React, { useState, useEffect, useMemo } from 'react';
import {
  GitMerge,
  X,
  Sparkles,
  Wand2,
  Check,
  Layers,
  ArrowRight,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { RoomTransformationProject, TransformationRevision, User } from '../types';
import {
  COMMON_STYLES,
  COLOR_PALETTES,
  FLOORING_OPTIONS,
  LIGHTING_OPTIONS,
  FEATURE_WALL_CATEGORIES,
  ROOM_TYPES
} from '../data/roomTransformationData';
import { generateImageFromImage, AdditionalImageInput } from '../services/geminiService';
import { cloudService } from '../services/cloudService';

interface MergeRoomRevisionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: RoomTransformationProject;
  user: User | null;
  initialRevAIndex?: number;
  initialRevBIndex?: number;
  onMergeSuccess: (newRevision: TransformationRevision, updatedProject: RoomTransformationProject) => void;
  isKeyReady: boolean;
  onSelectKey: () => void;
}

const COMMON_SAVE_TAGS = [
  'Flooring & Material',
  'Wall Color & Paint',
  'Lighting & Daylight',
  'Seating & Furniture',
  'Window Treatments',
  'Ceiling Design',
  'Cabinetry & Built-ins'
];

const COMMON_REPLACE_TAGS = [
  'Fireplace & Hearth',
  'Feature Wall & Slats',
  'Color Accent & Palette',
  'Furniture Arrangement',
  'Light Fixtures & Chandelier',
  'Wall Art & Decor',
  'Media Unit & Shelving'
];

export const MergeRoomRevisionsModal: React.FC<MergeRoomRevisionsModalProps> = ({
  isOpen,
  onClose,
  project,
  user,
  initialRevAIndex = 0,
  initialRevBIndex = 1,
  onMergeSuccess,
  isKeyReady,
  onSelectKey
}) => {
  // Available revisions in project
  const revisions = project.revisions;

  // Selected revision indices (ensure valid and distinct)
  const [revAIndex, setRevAIndex] = useState<number>(() => {
    const idx = Math.min(Math.max(0, initialRevAIndex), revisions.length - 1);
    return idx;
  });

  const [revBIndex, setRevBIndex] = useState<number>(() => {
    if (revisions.length > 1) {
      if (initialRevBIndex !== revAIndex && initialRevBIndex < revisions.length) {
        return initialRevBIndex;
      }
      return revAIndex === 0 ? 1 : 0;
    }
    return 0;
  });

  // Base canvas choice: 'revA' | 'revB' | 'original'
  const [baseCanvas, setBaseCanvas] = useState<'revA' | 'revB' | 'original'>('revB');

  // Option choices: 'revA' | 'revB'
  const [chosenStyle, setChosenStyle] = useState<'revA' | 'revB'>('revA');
  const [chosenColor, setChosenColor] = useState<'revA' | 'revB'>('revB');
  const [chosenFlooring, setChosenFlooring] = useState<'revA' | 'revB'>('revA');
  const [chosenLighting, setChosenLighting] = useState<'revA' | 'revB'>('revB');
  const [chosenFeatureWall, setChosenFeatureWall] = useState<'revA' | 'revB'>('revB');

  // Custom textual directives for what to save & what to replace
  const [saveFromRevAText, setSaveFromRevAText] = useState<string>('');
  const [replaceFromRevBText, setReplaceFromRevBText] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [mergedRevisionTitle, setMergedRevisionTitle] = useState<string>('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active revisions objects
  const revA = revisions[revAIndex] || revisions[0];
  const revB = revisions[revBIndex] || revisions[revisions.length - 1];

  // Initialize or update fields when revisions change
  useEffect(() => {
    if (!revA || !revB) return;

    const nextRevNum = revisions.length + 1;
    setMergedRevisionTitle(
      `Rev ${nextRevNum}: Merged (${revA.label.split(':')[0]} + ${revB.label.split(':')[0]})`
    );

    // Provide helpful initial defaults based on the chosen revisions
    const revAStyle = COMMON_STYLES.find((s) => s.id === revA.selectedOptions?.style)?.label || 'Style';
    const revBStyle = COMMON_STYLES.find((s) => s.id === revB.selectedOptions?.style)?.label || 'Style';

    setSaveFromRevAText((prev) => {
      if (prev.trim()) return prev;
      return `Preserve the architectural layout, flooring, and room ambiance from ${revA.label.split(':')[0]} (${revAStyle}).`;
    });

    setReplaceFromRevBText((prev) => {
      if (prev.trim()) return prev;
      return `Replace the accent features, wall styling, and focal decor with elements from ${revB.label.split(':')[0]} (${revBStyle}).`;
    });
  }, [revAIndex, revBIndex, revisions.length, revA?.id, revB?.id]);

  if (!isOpen) return null;

  // Helpers to resolve human-readable option labels
  const getStyleLabel = (rev: TransformationRevision) =>
    COMMON_STYLES.find((s) => s.id === rev.selectedOptions?.style)?.label ||
    rev.selectedOptions?.style ||
    'Standard Style';

  const getColorLabel = (rev: TransformationRevision) =>
    COLOR_PALETTES.find((c) => c.id === rev.selectedOptions?.color)?.label ||
    rev.selectedOptions?.color ||
    'Neutral Palette';

  const getFlooringLabel = (rev: TransformationRevision) =>
    FLOORING_OPTIONS.find((f) => f.id === rev.selectedOptions?.flooring)?.label ||
    rev.selectedOptions?.flooring ||
    'Existing Flooring';

  const getLightingLabel = (rev: TransformationRevision) =>
    LIGHTING_OPTIONS.find((l) => l.id === rev.selectedOptions?.lighting)?.label ||
    rev.selectedOptions?.lighting ||
    'Ambient Daylight';

  const getFeatureWallLabel = (rev: TransformationRevision) => {
    const cat = FEATURE_WALL_CATEGORIES.find(
      (c) => c.id === rev.selectedOptions?.featureWallCategory
    );
    if (!cat || cat.id === 'none') return 'None';
    const opt = cat.options.find((o) => o.id === rev.selectedOptions?.featureWallOption);
    return `${cat.label}${opt ? ` (${opt.label})` : ''}`;
  };

  // Quick tag toggle helpers
  const handleToggleSaveTag = (tag: string) => {
    if (saveFromRevAText.includes(tag)) {
      setSaveFromRevAText((prev) =>
        prev
          .replace(new RegExp(`,?\\s*${tag}`, 'gi'), '')
          .replace(/^,\s*/, '')
          .trim()
      );
    } else {
      setSaveFromRevAText((prev) =>
        prev.trim() ? `${prev.trim()}, save ${tag.toLowerCase()}` : `Save ${tag.toLowerCase()}`
      );
    }
  };

  const handleToggleReplaceTag = (tag: string) => {
    if (replaceFromRevBText.includes(tag)) {
      setReplaceFromRevBText((prev) =>
        prev
          .replace(new RegExp(`,?\\s*${tag}`, 'gi'), '')
          .replace(/^,\s*/, '')
          .trim()
      );
    } else {
      setReplaceFromRevBText((prev) =>
        prev.trim() ? `${prev.trim()}, replace with ${tag.toLowerCase()}` : `Replace with ${tag.toLowerCase()}`
      );
    }
  };

  // Execute Merge
  const handleExecuteMerge = async () => {
    if (!isKeyReady) {
      onSelectKey();
      return;
    }

    if (revAIndex === revBIndex) {
      setErrorMessage('Please select two distinct revisions to merge.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStep('Analyzing Revision elements and preparing synthesis...');

    try {
      const revAObj = revisions[revAIndex];
      const revBObj = revisions[revBIndex];

      // Resolve options
      const chosenStyleId =
        chosenStyle === 'revA' ? revAObj.selectedOptions?.style : revBObj.selectedOptions?.style;
      const chosenColorId =
        chosenColor === 'revA' ? revAObj.selectedOptions?.color : revBObj.selectedOptions?.color;
      const chosenFlooringId =
        chosenFlooring === 'revA' ? revAObj.selectedOptions?.flooring : revBObj.selectedOptions?.flooring;
      const chosenLightingId =
        chosenLighting === 'revA' ? revAObj.selectedOptions?.lighting : revBObj.selectedOptions?.lighting;
      const chosenFeatureWallCat =
        chosenFeatureWall === 'revA'
          ? revAObj.selectedOptions?.featureWallCategory
          : revBObj.selectedOptions?.featureWallCategory;
      const chosenFeatureWallOpt =
        chosenFeatureWall === 'revA'
          ? revAObj.selectedOptions?.featureWallOption
          : revBObj.selectedOptions?.featureWallOption;

      // Determine base visual image
      let primaryBaseUri = revBObj.renderedImageUrl || project.originalImageUrl;
      let secondaryImageUri = revAObj.renderedImageUrl || project.originalImageUrl;

      if (baseCanvas === 'revA') {
        primaryBaseUri = revAObj.renderedImageUrl || project.originalImageUrl;
        secondaryImageUri = revBObj.renderedImageUrl || project.originalImageUrl;
      } else if (baseCanvas === 'original') {
        primaryBaseUri = project.originalImageUrl;
        secondaryImageUri = revBObj.renderedImageUrl || revAObj.renderedImageUrl;
      }

      const styleObj = COMMON_STYLES.find((s) => s.id === chosenStyleId);
      const colorObj = COLOR_PALETTES.find((c) => c.id === chosenColorId);
      const floorObj = FLOORING_OPTIONS.find((f) => f.id === chosenFlooringId);
      const lightObj = LIGHTING_OPTIONS.find((l) => l.id === chosenLightingId);

      let featureWallModifier = '';
      if (chosenFeatureWallCat && chosenFeatureWallCat !== 'none') {
        const featCat = FEATURE_WALL_CATEGORIES.find((c) => c.id === chosenFeatureWallCat);
        if (featCat) {
          const featOpt =
            featCat.options.find((o) => o.id === chosenFeatureWallOpt) || featCat.options[0];
          if (featOpt) {
            featureWallModifier = `Feature Wall (${featCat.label}): ${featOpt.promptModifier}`;
          }
        }
      }

      // Build comprehensive synthesis prompt
      const mergePrompt = [
        `Photorealistic interior architectural rendering revision of this ${project.roomType}.`,
        `SYNTHESIS & MERGE TASK: Seamlessly combine and merge two previous design revisions (${revAObj.label.split(':')[0]} and ${revBObj.label.split(':')[0]}) into a unified, high-end design.`,
        `WHAT TO SAVE / KEEP (from ${revAObj.label.split(':')[0]}): ${saveFromRevAText.trim() || 'Keep overall spatial balance, natural illumination, and materials.'}`,
        `WHAT TO REPLACE / ADOPT (from ${revBObj.label.split(':')[0]}): ${replaceFromRevBText.trim() || 'Integrate the focal wall and styling accents.'}`,
        additionalNotes.trim() ? `ADDITIONAL MERGE INSTRUCTIONS: ${additionalNotes.trim()}` : '',
        `CHOSEN RESOLVED DESIGN SPECIFICATIONS:`,
        styleObj ? `- Aesthetic Style: ${styleObj.prompt}` : '',
        colorObj ? `- Color Palette: ${colorObj.prompt}` : '',
        floorObj ? `- Flooring: ${floorObj.prompt}` : '',
        lightObj ? `- Lighting Ambiance: ${lightObj.prompt}` : '',
        featureWallModifier ? `- ${featureWallModifier}` : '',
        `MANDATORY: Produce an impeccably rendered, coherent architectural photograph. Harmonize all textures, materials, and lighting seamlessly so the merged elements appear natural and custom-tailored to the space.`
      ]
        .filter(Boolean)
        .join('\n');

      setGenerationStep('Synthesizing materials and rendering merged revision...');

      // Prepare image base64s
      const primaryBase64 = primaryBaseUri.includes('base64,')
        ? primaryBaseUri.split('base64,')[1]
        : primaryBaseUri;

      let additionalImageInput: AdditionalImageInput | undefined;
      if (secondaryImageUri && secondaryImageUri !== primaryBaseUri) {
        const secBase64 = secondaryImageUri.includes('base64,')
          ? secondaryImageUri.split('base64,')[1]
          : secondaryImageUri;
        additionalImageInput = {
          base64: secBase64,
          mimeType: 'image/jpeg'
        };
      }

      const mergedImageUrl = await generateImageFromImage(
        mergePrompt,
        primaryBase64,
        'image/jpeg',
        additionalImageInput,
        '16:9'
      );

      setGenerationStep('Finalizing new revision and updating project...');

      const nextRevNumber = revisions.length + 1;
      const finalTitle =
        mergedRevisionTitle.trim() ||
        `Rev ${nextRevNumber}: Merged (${revAObj.label.split(':')[0]} + ${revBObj.label.split(':')[0]})`;

      const mergedOptions: Record<string, string> = {
        ...(chosenStyle === 'revA' ? revAObj.selectedOptions : revBObj.selectedOptions),
        style: chosenStyleId || '',
        color: chosenColorId || '',
        flooring: chosenFlooringId || '',
        lighting: chosenLightingId || '',
        featureWallCategory: chosenFeatureWallCat || 'none',
        featureWallOption: chosenFeatureWallOpt || '',
        mergeSourceA: revAObj.id,
        mergeSourceB: revBObj.id
      };

      const newRevision: TransformationRevision = {
        id: `rev-${Date.now()}`,
        createdAt: Date.now(),
        label: finalTitle,
        prompt: mergePrompt,
        roomType: project.roomType,
        selectedOptions: mergedOptions,
        customInstructions: `Merged ${revAObj.label.split(':')[0]} & ${revBObj.label.split(':')[0]}. Kept: ${saveFromRevAText.slice(0, 40)}... Replaced: ${replaceFromRevBText.slice(0, 40)}...`,
        renderedImageUrl: mergedImageUrl
      };

      const updatedProject: RoomTransformationProject = {
        ...project,
        updatedAt: Date.now(),
        currentRevisionIndex: revisions.length,
        revisions: [...revisions, newRevision]
      };

      // Auto-save to cloud
      if (user?.uid) {
        try {
          await cloudService.saveRoomTransformation(user.uid, updatedProject);
        } catch (cloudErr) {
          console.warn('Failed to save merged revision to cloud:', cloudErr);
        }
      }

      onMergeSuccess(newRevision, updatedProject);
      onClose();
    } catch (err: any) {
      console.error('Failed to merge revisions:', err);
      setErrorMessage(
        err?.message || 'Failed to generate merged revision. Please verify your connection or key and try again.'
      );
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 z-[90] flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="merge-modal-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl max-w-4xl w-full my-auto shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 via-white to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600 text-white rounded-2xl shadow-sm">
              <GitMerge className="h-5 w-5" />
            </div>
            <div>
              <h2 id="merge-modal-title" className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Merge Transformation Revisions</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold">
                  {project.roomType}
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Choose any 2 revisions to synthesize. Select what to save or replace from each to generate an updated revision.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isGenerating}
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            aria-label="Close merge dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-gray-900 dark:text-white">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* 1. SELECT REVISIONS TO MERGE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] flex items-center justify-center font-bold">
                  1
                </span>
                <span>Select 2 Revisions to Merge</span>
              </label>
              <span className="text-xs text-gray-400">
                {revisions.length} revision{revisions.length === 1 ? '' : 's'} available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Revision A Card */}
              <div className="p-4 rounded-2xl border-2 border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/10 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    <span>Revision A (Source A)</span>
                  </span>
                  <select
                    value={revAIndex}
                    onChange={(e) => {
                      const newIdx = parseInt(e.target.value, 10);
                      setRevAIndex(newIdx);
                      if (newIdx === revBIndex) {
                        setRevBIndex((newIdx + 1) % revisions.length);
                      }
                    }}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    {revisions.map((r, i) => (
                      <option key={r.id} value={i}>
                        Rev {i + 1}: {r.label.split(':')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <img
                    src={revA.renderedImageUrl}
                    alt={revA.label}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-bold">
                    Rev {revAIndex + 1}
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <div className="font-bold text-gray-900 dark:text-white line-clamp-1">{revA.label}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-[11px] grid grid-cols-2 gap-x-2 gap-y-0.5">
                    <span>Style: <strong>{getStyleLabel(revA)}</strong></span>
                    <span>Floor: <strong>{getFlooringLabel(revA)}</strong></span>
                    <span>Palette: <strong>{getColorLabel(revA)}</strong></span>
                    <span>Wall: <strong>{getFeatureWallLabel(revA)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Revision B Card */}
              <div className="p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/10 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <span>Revision B (Source B)</span>
                  </span>
                  <select
                    value={revBIndex}
                    onChange={(e) => {
                      const newIdx = parseInt(e.target.value, 10);
                      setRevBIndex(newIdx);
                      if (newIdx === revAIndex) {
                        setRevAIndex((newIdx + 1) % revisions.length);
                      }
                    }}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {revisions.map((r, i) => (
                      <option key={r.id} value={i} disabled={i === revAIndex}>
                        Rev {i + 1}: {r.label.split(':')[0]} {i === revAIndex ? '(Chosen for A)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <img
                    src={revB.renderedImageUrl}
                    alt={revB.label}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold">
                    Rev {revBIndex + 1}
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <div className="font-bold text-gray-900 dark:text-white line-clamp-1">{revB.label}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-[11px] grid grid-cols-2 gap-x-2 gap-y-0.5">
                    <span>Style: <strong>{getStyleLabel(revB)}</strong></span>
                    <span>Floor: <strong>{getFlooringLabel(revB)}</strong></span>
                    <span>Palette: <strong>{getColorLabel(revB)}</strong></span>
                    <span>Wall: <strong>{getFeatureWallLabel(revB)}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. PRIMARY VISUAL FOUNDATION */}
          <div className="space-y-2.5 pt-2 border-t border-gray-200 dark:border-gray-700">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] flex items-center justify-center font-bold">
                2
              </span>
              <span>Primary Visual Perspective &amp; Foundation</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select which image geometry serves as the rendering canvas to apply the merged updates on.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setBaseCanvas('revA')}
                className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  baseCanvas === 'revA'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 ring-2 ring-purple-500/20 font-semibold'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-purple-700 dark:text-purple-300">Rev {revAIndex + 1} Canvas</span>
                  {baseCanvas === 'revA' && <Check className="h-4 w-4 text-purple-600" />}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Build upon Revision {revAIndex + 1}'s perspective &amp; architecture.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setBaseCanvas('revB')}
                className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  baseCanvas === 'revB'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 font-semibold'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">Rev {revBIndex + 1} Canvas</span>
                  {baseCanvas === 'revB' && <Check className="h-4 w-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Build upon Revision {revBIndex + 1}'s perspective &amp; architecture.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setBaseCanvas('original')}
                className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  baseCanvas === 'original'
                    ? 'border-gray-600 bg-gray-100 dark:bg-gray-700/60 ring-2 ring-gray-500/20 font-semibold'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-900 dark:text-white">Original Photo Canvas</span>
                  {baseCanvas === 'original' && <Check className="h-4 w-4 text-gray-700 dark:text-gray-300" />}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Synthesize both revisions afresh onto your original room picture.
                </p>
              </button>
            </div>
          </div>

          {/* 3. DESIGN ATTRIBUTES RESOLUTION MATRIX */}
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] flex items-center justify-center font-bold">
                  3
                </span>
                <span>Decision Matrix: Choose What to Keep from Each Revision</span>
              </label>
              <span className="text-[11px] text-gray-400">Click to switch preference</span>
            </div>

            <div className="space-y-2 bg-gray-50/80 dark:bg-gray-900/40 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700">
              {/* Style Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-32 shrink-0">
                  Aesthetic Style
                </div>
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setChosenStyle('revA')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenStyle === 'revA'
                        ? 'bg-purple-600 text-white font-bold border-purple-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">Rev {revAIndex + 1}: {getStyleLabel(revA)}</span>
                    {chosenStyle === 'revA' && <Check className="h-3.5 w-3.5 shrink-0 ml-1" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChosenStyle('revB')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenStyle === 'revB'
                        ? 'bg-indigo-600 text-white font-bold border-indigo-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">Rev {revBIndex + 1}: {getStyleLabel(revB)}</span>
                    {chosenStyle === 'revB' && <Check className="h-3.5 w-3.5 shrink-0 ml-1" />}
                  </button>
                </div>
              </div>

              {/* Color Palette Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-32 shrink-0">
                  Color Palette
                </div>
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setChosenColor('revA')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenColor === 'revA'
                        ? 'bg-purple-600 text-white font-bold border-purple-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">Rev {revAIndex + 1}: {getColorLabel(revA)}</span>
                    {chosenColor === 'revA' && <Check className="h-3.5 w-3.5 shrink-0 ml-1" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChosenColor('revB')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenColor === 'revB'
                        ? 'bg-indigo-600 text-white font-bold border-indigo-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">Rev {revBIndex + 1}: {getColorLabel(revB)}</span>
                    {chosenColor === 'revB' && <Check className="h-3.5 w-3.5 shrink-0 ml-1" />}
                  </button>
                </div>
              </div>

              {/* Flooring Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-32 shrink-0">
                  Flooring
                </div>
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setChosenFlooring('revA')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenFlooring === 'revA'
                        ? 'bg-purple-600 text-white font-bold border-purple-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">Rev {revAIndex + 1}: {getFlooringLabel(revA)}</span>
                    {chosenFlooring === 'revA' && <Check className="h-3.5 w-3.5 shrink-0 ml-1" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChosenFlooring('revB')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenFlooring === 'revB'
                        ? 'bg-indigo-600 text-white font-bold border-indigo-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">Rev {revBIndex + 1}: {getFlooringLabel(revB)}</span>
                    {chosenFlooring === 'revB' && <Check className="h-3.5 w-3.5 shrink-0 ml-1" />}
                  </button>
                </div>
              </div>

              {/* Lighting Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-32 shrink-0">
                  Lighting
                </div>
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setChosenLighting('revA')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenLighting === 'revA'
                        ? 'bg-purple-600 text-white font-bold border-purple-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">Rev {revAIndex + 1}: {getLightingLabel(revA)}</span>
                    {chosenLighting === 'revA' && <Check className="h-3.5 w-3.5 shrink-0 ml-1" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChosenLighting('revB')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenLighting === 'revB'
                        ? 'bg-indigo-600 text-white font-bold border-indigo-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">Rev {revBIndex + 1}: {getLightingLabel(revB)}</span>
                    {chosenLighting === 'revB' && <Check className="h-3.5 w-3.5 shrink-0 ml-1" />}
                  </button>
                </div>
              </div>

              {/* Feature Wall Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-32 shrink-0">
                  Feature Wall
                </div>
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setChosenFeatureWall('revA')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenFeatureWall === 'revA'
                        ? 'bg-purple-600 text-white font-bold border-purple-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">Rev {revAIndex + 1}: {getFeatureWallLabel(revA)}</span>
                    {chosenFeatureWall === 'revA' && <Check className="h-3.5 w-3.5 shrink-0 ml-1" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChosenFeatureWall('revB')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenFeatureWall === 'revB'
                        ? 'bg-indigo-600 text-white font-bold border-indigo-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">Rev {revBIndex + 1}: {getFeatureWallLabel(revB)}</span>
                    {chosenFeatureWall === 'revB' && <Check className="h-3.5 w-3.5 shrink-0 ml-1" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. SPECIFIC DIRECTIVES: WHAT TO SAVE FROM REV A & WHAT TO REPLACE WITH REV B */}
          <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] flex items-center justify-center font-bold">
                4
              </span>
              <span>Detailed Save &amp; Replace Directives</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Save from Rev A */}
              <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/20 dark:bg-purple-950/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    <span>What to SAVE / KEEP from Rev {revAIndex + 1}</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SAVE_TAGS.map((tag) => {
                    const isSelected = saveFromRevAText.toLowerCase().includes(tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleSaveTag(tag)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-700'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={saveFromRevAText}
                  onChange={(e) => setSaveFromRevAText(e.target.value)}
                  placeholder="E.g. Keep the light oak herringbone flooring, wall color, and natural morning daylight..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-hidden resize-none"
                />
              </div>

              {/* Replace with Rev B */}
              <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/20 dark:bg-indigo-950/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span>What to REPLACE / TAKE from Rev {revBIndex + 1}</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {COMMON_REPLACE_TAGS.map((tag) => {
                    const isSelected = replaceFromRevBText.toLowerCase().includes(tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleReplaceTag(tag)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-700'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={replaceFromRevBText}
                  onChange={(e) => setReplaceFromRevBText(e.target.value)}
                  placeholder="E.g. Replace the entertainment center and accent wall with Revision B's stone fireplace and floating shelves..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
                />
              </div>
            </div>

            {/* Additional blending notes */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                Additional Merge Adjustments / Fine-Tuning (Optional)
              </label>
              <input
                type="text"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="E.g. Ensure the warm lighting casts natural reflections on the new flooring, and blend wood stains seamlessly."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* 5. MERGED REVISION TITLE */}
          <div className="space-y-1.5 pt-2 border-t border-gray-200 dark:border-gray-700">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              New Merged Revision Name
            </label>
            <input
              type="text"
              value={mergedRevisionTitle}
              onChange={(e) => setMergedRevisionTitle(e.target.value)}
              placeholder="e.g. Rev 3: Merged (Rev 1 + Rev 2)"
              maxLength={80}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-semibold"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-purple-600 shrink-0" />
            <span>
              Generates a new revision combining saved and replaced elements via high-precision visual AI.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isGenerating}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isGenerating || revAIndex === revBIndex}
              onClick={handleExecuteMerge}
              className="px-5 py-2 text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              id="btn-confirm-merge-room-revisions"
            >
              {isGenerating ? (
                <>
                  <Wand2 className="h-4 w-4 animate-spin" />
                  <span>{generationStep || 'Merging Revisions...'}</span>
                </>
              ) : (
                <>
                  <GitMerge className="h-4 w-4" />
                  <span>Generate Merged Revision</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
