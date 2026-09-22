import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  X,
  Sparkles,
  Wand2,
  Check,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { LandscapingTransformationProject, LandscapingRevision, User } from '../types';
import {
  LANDSCAPING_STYLES,
  HOUSE_VIEW_SIDES
} from '../data/landscapingTransformationData';
import { generateImageFromImage, AdditionalImageInput } from '../services/geminiService';
import { cloudService } from '../services/cloudService';

interface MergeLandscapingRevisionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: LandscapingTransformationProject;
  user: User | null;
  initialRevAIndex?: number;
  initialRevBIndex?: number;
  onMergeSuccess: (newRevision: LandscapingRevision, updatedProject: LandscapingTransformationProject) => void;
  isKeyReady: boolean;
  onSelectKey: () => void;
}

const COMMON_LANDSCAPING_SAVE_TAGS = [
  'Patio & Pavers',
  'Pergola & Trellis',
  'Mature Trees & Privacy Hedge',
  'Outdoor Kitchen Island',
  'Pathway Illumination',
  'Lush Grass & Sod',
  'Retaining Wall'
];

const COMMON_LANDSCAPING_REPLACE_TAGS = [
  'Pool & Water Feature',
  'Sunken Fire Pit',
  'Travertine Decking',
  'Drought-Wise Flora',
  'Modern Concrete Planters',
  'Outdoor Dining Set',
  'Accent Uplighting'
];

export const MergeLandscapingRevisionsModal: React.FC<MergeLandscapingRevisionsModalProps> = ({
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
  const revisions = project.revisions;

  const [revAIndex, setRevAIndex] = useState<number>(() => {
    return Math.min(Math.max(0, initialRevAIndex), revisions.length - 1);
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

  // Specific preferences
  const [chosenHardscape, setChosenHardscape] = useState<'revA' | 'revB'>('revA');
  const [chosenFlora, setChosenFlora] = useState<'revA' | 'revB'>('revB');
  const [chosenLighting, setChosenLighting] = useState<'revA' | 'revB'>('revA');
  const [chosenWaterFire, setChosenWaterFire] = useState<'revA' | 'revB'>('revB');

  // Directives for what to save & replace
  const [saveFromRevAText, setSaveFromRevAText] = useState<string>('');
  const [replaceFromRevBText, setReplaceFromRevBText] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [mergedRevisionTitle, setMergedRevisionTitle] = useState<string>('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const revA = revisions[revAIndex] || revisions[0];
  const revB = revisions[revBIndex] || revisions[revisions.length - 1];

  useEffect(() => {
    if (!revA || !revB) return;

    const nextRevNum = revisions.length + 1;
    setMergedRevisionTitle(
      `Rev ${nextRevNum}: Merged (${revA.label.split(':')[0]} + ${revB.label.split(':')[0]})`
    );

    setSaveFromRevAText((prev) => {
      if (prev.trim()) return prev;
      return `Preserve the hardscape layout, patio stone pavers, and property boundary landscaping from ${revA.label.split(':')[0]}.`;
    });

    setReplaceFromRevBText((prev) => {
      if (prev.trim()) return prev;
      return `Replace the garden beds and central focal points with the water features, fire element, and plant palette from ${revB.label.split(':')[0]}.`;
    });
  }, [revAIndex, revBIndex, revisions.length, revA?.id, revB?.id]);

  if (!isOpen) return null;

  // Toggle helpers
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
    setGenerationStep('Analyzing landscape revisions and structuring architectural synthesis...');

    try {
      const revAObj = revisions[revAIndex];
      const revBObj = revisions[revBIndex];

      let primaryBaseUri = revBObj.renderedImageUrl || project.originalImageUrl;
      let secondaryImageUri = revAObj.renderedImageUrl || project.originalImageUrl;

      if (baseCanvas === 'revA') {
        primaryBaseUri = revAObj.renderedImageUrl || project.originalImageUrl;
        secondaryImageUri = revBObj.renderedImageUrl || project.originalImageUrl;
      } else if (baseCanvas === 'original') {
        primaryBaseUri = project.originalImageUrl;
        secondaryImageUri = revBObj.renderedImageUrl || revAObj.renderedImageUrl;
      }

      const viewConfig = HOUSE_VIEW_SIDES.find((v) => v.id === project.viewSide);

      const mergePrompt = [
        `Photorealistic high-end landscape architecture rendering for the ${viewConfig?.name || project.viewSide} view of the house.`,
        `SYNTHESIS & MERGE TASK: Seamlessly combine and merge two previous landscape design revisions (${revAObj.label.split(':')[0]} and ${revBObj.label.split(':')[0]}) into a unified, award-winning exterior.`,
        `WHAT TO SAVE / KEEP (from ${revAObj.label.split(':')[0]}): ${saveFromRevAText.trim() || 'Preserve key hardscape pavers, perimeter privacy, and pathway geometry.'}`,
        `WHAT TO REPLACE / ADOPT (from ${revBObj.label.split(':')[0]}): ${replaceFromRevBText.trim() || 'Integrate the water features, fire elements, and botanical flora.'}`,
        additionalNotes.trim() ? `ADDITIONAL MERGE INSTRUCTIONS: ${additionalNotes.trim()}` : '',
        `DESIGN HARMONIZATION:`,
        `- Hardscaping: ${chosenHardscape === 'revA' ? `Prioritize ${revAObj.label.split(':')[0]} patio and deck design` : `Prioritize ${revBObj.label.split(':')[0]} patio and deck design`}`,
        `- Flora & Plants: ${chosenFlora === 'revA' ? `Prioritize ${revAObj.label.split(':')[0]} garden palette` : `Prioritize ${revBObj.label.split(':')[0]} garden palette`}`,
        `- Lighting: ${chosenLighting === 'revA' ? `Prioritize ${revAObj.label.split(':')[0]} illumination ambiance` : `Prioritize ${revBObj.label.split(':')[0]} illumination ambiance`}`,
        `- Water & Fire: ${chosenWaterFire === 'revA' ? `Adopt ${revAObj.label.split(':')[0]} features` : `Adopt ${revBObj.label.split(':')[0]} features`}`,
        `MANDATORY: Produce an impeccably rendered architectural photograph. Preserve house structure and perspective while integrating new vegetation, materials, water, and outdoor living elements flawlessly.`
      ]
        .filter(Boolean)
        .join('\n\n');

      setGenerationStep('Synthesizing botanical flora, pavers, and lighting into new revision...');

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

      setGenerationStep('Saving merged landscape revision to your project...');

      const nextRevNumber = revisions.length + 1;
      const finalTitle =
        mergedRevisionTitle.trim() ||
        `Rev ${nextRevNumber}: Merged (${revAObj.label.split(':')[0]} + ${revBObj.label.split(':')[0]})`;

      const newRevision: LandscapingRevision = {
        id: `rev-${Date.now()}`,
        createdAt: Date.now(),
        label: finalTitle,
        prompt: mergePrompt,
        viewSide: project.viewSide,
        selectedOptions: {
          ...revBObj.selectedOptions,
          mergeSourceA: revAObj.id,
          mergeSourceB: revBObj.id
        },
        customInstructions: `Merged ${revAObj.label.split(':')[0]} & ${revBObj.label.split(':')[0]}. Kept: ${saveFromRevAText.slice(0, 40)}... Replaced: ${replaceFromRevBText.slice(0, 40)}...`,
        renderedImageUrl: mergedImageUrl
      };

      const updatedProject: LandscapingTransformationProject = {
        ...project,
        updatedAt: Date.now(),
        currentRevisionIndex: revisions.length,
        revisions: [...revisions, newRevision]
      };

      if (user?.uid) {
        try {
          await cloudService.saveLandscapingTransformation(user.uid, updatedProject);
        } catch (cloudErr) {
          console.warn('Failed to save merged landscaping revision to cloud:', cloudErr);
        }
      }

      onMergeSuccess(newRevision, updatedProject);
      onClose();
    } catch (err: any) {
      console.error('Failed to merge landscaping revisions:', err);
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
      aria-labelledby="merge-landscaping-modal-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl max-w-4xl w-full my-auto shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-sm">
              <GitMerge className="h-5 w-5" />
            </div>
            <div>
              <h2 id="merge-landscaping-modal-title" className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Merge Landscaping Revisions</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold uppercase">
                  {project.viewSide} view
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Synthesize any two landscaping revisions. Select which hardscaping, flora, water, and lighting features to save or replace.
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

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-gray-900 dark:text-white">
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

          {/* 1. SELECT REVISIONS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">
                  1
                </span>
                <span>Select 2 Landscaping Revisions to Merge</span>
              </label>
              <span className="text-xs text-gray-400">
                {revisions.length} revision{revisions.length === 1 ? '' : 's'} available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rev A Card */}
              <div className="p-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span>Revision A</span>
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
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
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
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                    Rev {revAIndex + 1}
                  </div>
                </div>

                <div className="font-bold text-xs text-gray-900 dark:text-white line-clamp-1">
                  {revA.label}
                </div>
              </div>

              {/* Rev B Card */}
              <div className="p-4 rounded-2xl border-2 border-teal-200 dark:border-teal-900/60 bg-teal-50/30 dark:bg-teal-950/10 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    <span>Revision B</span>
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
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
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
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-teal-600 text-white text-[10px] font-bold">
                    Rev {revBIndex + 1}
                  </div>
                </div>

                <div className="font-bold text-xs text-gray-900 dark:text-white line-clamp-1">
                  {revB.label}
                </div>
              </div>
            </div>
          </div>

          {/* 2. BASE CANVAS */}
          <div className="space-y-2.5 pt-2 border-t border-gray-200 dark:border-gray-700">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">
                2
              </span>
              <span>Primary Visual Landscape Canvas</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setBaseCanvas('revA')}
                className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  baseCanvas === 'revA'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 font-semibold'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">Rev {revAIndex + 1} Canvas</span>
                  {baseCanvas === 'revA' && <Check className="h-4 w-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Build upon Revision {revAIndex + 1}'s landscape perspective.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setBaseCanvas('revB')}
                className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  baseCanvas === 'revB'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 ring-2 ring-teal-500/20 font-semibold'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-teal-700 dark:text-teal-300">Rev {revBIndex + 1} Canvas</span>
                  {baseCanvas === 'revB' && <Check className="h-4 w-4 text-teal-600" />}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Build upon Revision {revBIndex + 1}'s landscape perspective.
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
                  <span className="font-bold text-gray-900 dark:text-white">Original House Photo</span>
                  {baseCanvas === 'original' && <Check className="h-4 w-4 text-gray-700 dark:text-gray-300" />}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Synthesize both revisions afresh onto your original house photo.
                </p>
              </button>
            </div>
          </div>

          {/* 3. ELEMENT DECISION MATRIX */}
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">
                3
              </span>
              <span>Feature Matrix: Choose Preferences</span>
            </label>

            <div className="space-y-2 bg-gray-50/80 dark:bg-gray-900/40 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700">
              {/* Hardscape */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-32 shrink-0">
                  Patio &amp; Hardscape
                </div>
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setChosenHardscape('revA')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenHardscape === 'revA'
                        ? 'bg-emerald-600 text-white font-bold border-emerald-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>Keep from Rev {revAIndex + 1}</span>
                    {chosenHardscape === 'revA' && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChosenHardscape('revB')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenHardscape === 'revB'
                        ? 'bg-teal-600 text-white font-bold border-teal-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>Take from Rev {revBIndex + 1}</span>
                    {chosenHardscape === 'revB' && <Check className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Plants */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-32 shrink-0">
                  Flora &amp; Plantings
                </div>
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setChosenFlora('revA')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenFlora === 'revA'
                        ? 'bg-emerald-600 text-white font-bold border-emerald-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>Keep from Rev {revAIndex + 1}</span>
                    {chosenFlora === 'revA' && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChosenFlora('revB')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenFlora === 'revB'
                        ? 'bg-teal-600 text-white font-bold border-teal-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>Take from Rev {revBIndex + 1}</span>
                    {chosenFlora === 'revB' && <Check className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Water / Fire */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-32 shrink-0">
                  Water &amp; Fire Elements
                </div>
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setChosenWaterFire('revA')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenWaterFire === 'revA'
                        ? 'bg-emerald-600 text-white font-bold border-emerald-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>Keep from Rev {revAIndex + 1}</span>
                    {chosenWaterFire === 'revA' && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChosenWaterFire('revB')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenWaterFire === 'revB'
                        ? 'bg-teal-600 text-white font-bold border-teal-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>Take from Rev {revBIndex + 1}</span>
                    {chosenWaterFire === 'revB' && <Check className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Lighting */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-32 shrink-0">
                  Exterior Lighting
                </div>
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setChosenLighting('revA')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenLighting === 'revA'
                        ? 'bg-emerald-600 text-white font-bold border-emerald-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>Keep from Rev {revAIndex + 1}</span>
                    {chosenLighting === 'revA' && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChosenLighting('revB')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer border ${
                      chosenLighting === 'revB'
                        ? 'bg-teal-600 text-white font-bold border-teal-700 shadow-2xs'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>Take from Rev {revBIndex + 1}</span>
                    {chosenLighting === 'revB' && <Check className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. SAVE & REPLACE DIRECTIVES */}
          <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">
                4
              </span>
              <span>Detailed Save &amp; Replace Directives</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Save from Rev A */}
              <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>What to SAVE / KEEP from Rev {revAIndex + 1}</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {COMMON_LANDSCAPING_SAVE_TAGS.map((tag) => {
                    const isSelected = saveFromRevAText.toLowerCase().includes(tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleSaveTag(tag)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-300'
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
                  placeholder="E.g. Keep the natural bluestone patio pavers, pergola, and boundary arborvitae trees..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
                />
              </div>

              {/* Replace with Rev B */}
              <div className="p-4 rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/20 dark:bg-teal-950/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-teal-600" />
                    <span>What to REPLACE / TAKE from Rev {revBIndex + 1}</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {COMMON_LANDSCAPING_REPLACE_TAGS.map((tag) => {
                    const isSelected = replaceFromRevBText.toLowerCase().includes(tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleReplaceTag(tag)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-700'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-teal-300'
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
                  placeholder="E.g. Replace the lawn area with the luxury heated pool, sheer descent waterfall, and sunken fire pit..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                Additional Landscaping Merge Adjustments (Optional)
              </label>
              <input
                type="text"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="E.g. Add smooth transition steps between the patio and pool deck, with seamless night lighting."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* 5. TITLE */}
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
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-semibold"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Generates a new landscaping revision combining saved and replaced elements via visual AI.
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
              className="px-5 py-2 text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              id="btn-confirm-merge-landscaping-revisions"
            >
              {isGenerating ? (
                <>
                  <Wand2 className="h-4 w-4 animate-spin" />
                  <span>{generationStep || 'Merging Landscape...'}</span>
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
