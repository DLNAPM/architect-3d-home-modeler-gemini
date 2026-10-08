import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CircleDot,
  PenTool,
  RotateCcw,
  Sparkles,
  X,
  CheckCircle2,
  ShieldCheck,
  Wand2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { generateImageFromImage } from '../services/geminiService';

export type RegionActionType = 'remove' | 'replace' | 'edit';

export interface CircleRegionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceImageUrl: string;
  projectTitle: string;
  contextType: 'room' | 'landscaping';
  roomOrViewLabel: string;
  revisionLabel: string;
  nextRevisionNumber: number;
  onApplySuccess: (
    newRenderedImageUrl: string,
    promptUsed: string,
    newLabel: string,
    actionType: RegionActionType,
    customDirective: string
  ) => Promise<void> | void;
  isKeyReady: boolean;
  onSelectKey: () => void;
}

interface NormalizedPoint {
  x: number; // 0 to 1
  y: number; // 0 to 1
}

interface CircledRegion {
  mode: 'circle' | 'lasso';
  // For circle / ellipse:
  center?: NormalizedPoint;
  radiusX?: number; // 0 to 1
  radiusY?: number; // 0 to 1
  // For lasso:
  points?: NormalizedPoint[];
  // Bounding box (0 to 1)
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const CircleRegionEditModal: React.FC<CircleRegionEditModalProps> = ({
  isOpen,
  onClose,
  sourceImageUrl,
  projectTitle,
  contextType,
  roomOrViewLabel,
  revisionLabel,
  nextRevisionNumber,
  onApplySuccess,
  isKeyReady,
  onSelectKey,
}) => {
  // Tool state
  const [drawingMode, setDrawingMode] = useState<'circle' | 'lasso'>('circle');
  const [region, setRegion] = useState<CircledRegion | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lassoPoints, setLassoPoints] = useState<NormalizedPoint[]>([]);
  const [circleStart, setCircleStart] = useState<NormalizedPoint | null>(null);
  const [circleCurrent, setCircleCurrent] = useState<NormalizedPoint | null>(null);

  // Action configuration state
  const [actionType, setActionType] = useState<RegionActionType>('replace');
  const [currentItemDescription, setCurrentItemDescription] = useState<string>('');
  const [removeFillDescription, setRemoveFillDescription] = useState<string>('');
  const [replaceWithDescription, setReplaceWithDescription] = useState<string>('');
  const [editModificationsDescription, setEditModificationsDescription] = useState<string>('');
  const [strictPreservation, setStrictPreservation] = useState<boolean>(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Canvas and image refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load source image
  useEffect(() => {
    if (!isOpen || !sourceImageUrl) return;

    setImageLoaded(false);
    setRegion(null);
    setLassoPoints([]);
    setCircleStart(null);
    setCircleCurrent(null);
    setCurrentItemDescription('');
    setErrorMessage(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageObjRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      // If crossOrigin fails, try without crossOrigin
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        imageObjRef.current = fallbackImg;
        setImageLoaded(true);
      };
      fallbackImg.src = sourceImageUrl;
    };
    img.src = sourceImageUrl;
  }, [isOpen, sourceImageUrl]);

  // Set default action descriptions based on context
  useEffect(() => {
    if (contextType === 'room') {
      if (!replaceWithDescription) {
        setReplaceWithDescription('Low-profile monolithic honed travertine stone coffee table');
      }
      if (!removeFillDescription) {
        setRemoveFillDescription('Seamless matching natural oak hardwood flooring with natural room lighting');
      }
      if (!editModificationsDescription) {
        setEditModificationsDescription('Change finish to warm fluted white oak with subtle ambient warm brass accents');
      }
    } else {
      if (!replaceWithDescription) {
        setReplaceWithDescription('Modern rectangular plunge pool with blue waterline tiles and integrated underwater lights');
      }
      if (!removeFillDescription) {
        setRemoveFillDescription('Lush manicured green lawn with clean edging and natural ground shadows');
      }
      if (!editModificationsDescription) {
        setEditModificationsDescription('Upgrade to dark smoked timber with warm outdoor recessed perimeter pathway downlighting');
      }
    }
  }, [contextType]);

  // Redraw canvas overlay whenever region or drawing state updates
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear and draw base image
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    // Active circle in progress
    if (isDrawing && drawingMode === 'circle' && circleStart && circleCurrent) {
      const startX = circleStart.x * w;
      const startY = circleStart.y * h;
      const currX = circleCurrent.x * w;
      const currY = circleCurrent.y * h;

      const centerX = (startX + currX) / 2;
      const centerY = (startY + currY) / 2;
      const rx = Math.abs(currX - startX) / 2;
      const ry = Math.abs(currY - startY) / 2;

      if (rx > 3 && ry > 3) {
        // Draw glow backdrop
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.22)';
        ctx.fill();

        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Active lasso in progress
    if (isDrawing && drawingMode === 'lasso' && lassoPoints.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(lassoPoints[0].x * w, lassoPoints[0].y * h);
      for (let i = 1; i < lassoPoints.length; i++) {
        ctx.lineTo(lassoPoints[i].x * w, lassoPoints[i].y * h);
      }
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.restore();
    }

    // Committed Region
    if (region && !isDrawing) {
      ctx.save();

      if (region.mode === 'circle' && region.center && region.radiusX && region.radiusY) {
        const cx = region.center.x * w;
        const cy = region.center.y * h;
        const rx = region.radiusX * w;
        const ry = region.radiusY * h;

        // Darken outside slightly or highlight inside
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
        ctx.fill();

        // Glowing outer stroke
        ctx.shadowColor = '#9333ea';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([8, 5]);
        ctx.stroke();

        // White inner accent
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        // Center crosshair / pin
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      } else if (region.mode === 'lasso' && region.points && region.points.length > 2) {
        ctx.beginPath();
        ctx.moveTo(region.points[0].x * w, region.points[0].y * h);
        for (let i = 1; i < region.points.length; i++) {
          ctx.lineTo(region.points[i].x * w, region.points[i].y * h);
        }
        ctx.closePath();

        ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
        ctx.fill();

        ctx.shadowColor = '#9333ea';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([8, 5]);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
      }

      ctx.restore();
    }
  }, [imageLoaded, isDrawing, drawingMode, circleStart, circleCurrent, lassoPoints, region]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Coordinate helper
  const getNormalizedCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): NormalizedPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    return { x, y };
  };

  // Mouse / Touch handlers for drawing
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pt = getNormalizedCoords(e);
    if (!pt) return;

    setIsDrawing(true);
    if (drawingMode === 'circle') {
      setCircleStart(pt);
      setCircleCurrent(pt);
    } else {
      setLassoPoints([pt]);
    }
  };

  const handleMoveDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pt = getNormalizedCoords(e);
    if (!pt) return;

    if (drawingMode === 'circle') {
      setCircleCurrent(pt);
    } else {
      setLassoPoints((prev) => [...prev, pt]);
    }
  };

  const handleEndDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);

    if (drawingMode === 'circle' && circleStart && circleCurrent) {
      const minX = Math.min(circleStart.x, circleCurrent.x);
      const maxX = Math.max(circleStart.x, circleCurrent.x);
      const minY = Math.min(circleStart.y, circleCurrent.y);
      const maxY = Math.max(circleStart.y, circleCurrent.y);

      const width = maxX - minX;
      const height = maxY - minY;

      // Minimum valid circle size (at least 2% of dimension)
      if (width > 0.02 && height > 0.02) {
        const center = {
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2,
        };
        const radiusX = width / 2;
        const radiusY = height / 2;

        setRegion({
          mode: 'circle',
          center,
          radiusX,
          radiusY,
          minX,
          minY,
          maxX,
          maxY,
        });
      }
    } else if (drawingMode === 'lasso' && lassoPoints.length > 3) {
      let minX = 1;
      let maxX = 0;
      let minY = 1;
      let maxY = 0;

      lassoPoints.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });

      if (maxX - minX > 0.02 && maxY - minY > 0.02) {
        setRegion({
          mode: 'lasso',
          points: lassoPoints,
          minX,
          minY,
          maxX,
          maxY,
        });
      }
    }
  };

  const handleClearRegion = () => {
    setRegion(null);
    setLassoPoints([]);
    setCircleStart(null);
    setCircleCurrent(null);
  };

  // Region description calculation
  const getRegionLocationDescription = (r: CircledRegion): string => {
    const cx = (r.minX + r.maxX) / 2;
    const cy = (r.minY + r.maxY) / 2;

    const horizontal = cx < 0.35 ? 'left side' : cx > 0.65 ? 'right side' : 'center';
    const vertical = cy < 0.35 ? 'upper area / ceiling' : cy > 0.65 ? 'lower area / foreground' : 'mid-level';

    const widthPercent = Math.round((r.maxX - r.minX) * 100);
    const heightPercent = Math.round((r.maxY - r.minY) * 100);

    return `${vertical}, ${horizontal} (occupying approx ${widthPercent}% width × ${heightPercent}% height)`;
  };

  // Execute inpainting / region modification
  const handleApplyRegionEdit = async () => {
    if (!region) {
      setErrorMessage('Please click and drag on the image to circle the area you want to change.');
      return;
    }

    if (!isKeyReady) {
      onSelectKey();
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStep('Analyzing circled region & perspective geometry...');

    try {
      const locDesc = getRegionLocationDescription(region);
      const minXPercent = Math.round(region.minX * 100);
      const maxXPercent = Math.round(region.maxX * 100);
      const minYPercent = Math.round(region.minY * 100);
      const maxYPercent = Math.round(region.maxY * 100);
      const currentItemText = currentItemDescription.trim() || 'the existing element / furniture';

      let actionPromptDirective = '';
      let revisionLabelSummary = '';
      let customDirectiveText = '';

      if (actionType === 'remove') {
        const fillText = removeFillDescription.trim() || 'seamless matching surrounding flooring, walls, and natural background textures';
        customDirectiveText = `Remove ${currentItemText} and fill with: ${fillText}`;
        revisionLabelSummary = `Removed ${currentItemText}`;
        actionPromptDirective = `PRIMARY TASK - REMOVE ELEMENT & INPAINT BACKGROUND:
- Target area location: ${locDesc} (bounding box coordinates: ${minXPercent}% to ${maxXPercent}% width, ${minYPercent}% to ${maxYPercent}% height of frame).
- Targeted item to erase: ${currentItemText}.
- MANDATORY INSTRUCTION: Completely REMOVE AND ERASE the ${currentItemText} from this specified target zone.
- Seamlessly inpaint and extend the surrounding background into the emptied area using: ${fillText}.
- Do NOT leave any trace, outline, ghosting, or artifact of the removed item. Blend the flooring, walls, ambient light, and shadows naturally.`;
      } else if (actionType === 'replace') {
        const replaceText = replaceWithDescription.trim() || 'contemporary architectural centerpiece';
        customDirectiveText = `Replace ${currentItemText} with: ${replaceText}`;
        revisionLabelSummary = `Replaced with ${replaceText.slice(0, 30)}${replaceText.length > 30 ? '...' : ''}`;
        actionPromptDirective = `PRIMARY TASK - REPLACE ITEM IN TARGET ZONE:
- Target area location: ${locDesc} (bounding box coordinates: ${minXPercent}% to ${maxXPercent}% width, ${minYPercent}% to ${maxYPercent}% height of frame).
- Existing item to remove: ${currentItemText}.
- New item to render: ${replaceText}.
- MANDATORY INSTRUCTION: Completely remove and erase the ${currentItemText} from the specified target zone, and IN ITS PLACE RENDER: ${replaceText}.
- The replacement ${replaceText} MUST BE BOLDLY VISIBLE, PROMINENT, and CLEARLY DIFFERENT from the original image. Do NOT output the old item.
- Render the new ${replaceText} with realistic tactile materials, appropriate perspective scaling for this ${roomOrViewLabel}, and accurate cast lighting shadows.`;
      } else {
        const editText = editModificationsDescription.trim() || 'restyle to luxury contemporary finish';
        customDirectiveText = `Edit ${currentItemText}: ${editText}`;
        revisionLabelSummary = `Edited: ${editText.slice(0, 30)}${editText.length > 30 ? '...' : ''}`;
        actionPromptDirective = `PRIMARY TASK - EDIT & RESTYLE ITEM:
- Target area location: ${locDesc} (bounding box coordinates: ${minXPercent}% to ${maxXPercent}% width, ${minYPercent}% to ${maxYPercent}% height of frame).
- Targeted item: ${currentItemText}.
- MANDATORY INSTRUCTION: Boldly modify and restyle the ${currentItemText} according to: ${editText}.
- The change in color, material finish, texture, or styling must be prominently and visibly transformed, clearly noticeable compared to the original.`;
      }

      const preservationDirective = strictPreservation
        ? `CONTEXT INTEGRATION: Maintain the room's surrounding walls, flooring continuity, and perspective geometry while ensuring the requested transformation in the target zone is boldly and visibly applied.`
        : `Ensure the requested transformation is boldly applied with realistic materials and natural scene lighting.`;

      const fullPrompt = [
        `High-fidelity architectural rendering modification of this ${roomOrViewLabel}.`,
        `TARGET ZONE: ${locDesc} (bounding box coordinates: ${minXPercent}% to ${maxXPercent}% width, ${minYPercent}% to ${maxYPercent}% height of frame).`,
        actionPromptDirective,
        preservationDirective,
        `OUTPUT REQUIREMENT: Return a photorealistic 8k architectural visualization where the requested change in the circled zone is clearly visible, unmistakable, and seamlessly integrated into the space.`
      ].join('\n\n');

      setGenerationStep('Synthesizing targeted edit with Gemini image engine...');

      const rawSourceBase64 = sourceImageUrl.includes('base64,') ? sourceImageUrl.split('base64,')[1] : sourceImageUrl;

      // Pass single clean image to ensure Gemini vision-language model applies targeted transformation
      const renderedResultUri = await generateImageFromImage(
        fullPrompt,
        rawSourceBase64,
        'image/jpeg',
        undefined,
        '16:9'
      );

      const generatedLabel = `Rev ${nextRevisionNumber}: ${revisionLabelSummary}`;

      setGenerationStep('Updating project revisions...');

      await onApplySuccess(
        renderedResultUri,
        fullPrompt,
        generatedLabel,
        actionType,
        customDirectiveText
      );

      onClose();
    } catch (err: any) {
      console.error('Targeted region edit failed:', err);
      setErrorMessage(
        err?.message || 'Failed to generate region modification. Please verify your circled selection and try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Preset chips for quick ideas
  const roomQuickReplaceSuggestions = [
    'Painted & color-blocked geometric accent wall in deep navy',
    'Vertical natural white oak acoustic slat wood accent wall with LED',
    'Scenic panoramic misty forest wallpaper mural',
    'Dry-stacked natural stone & 3D tile statement wall',
    'Lush faux green botanical living wall with warm glowing neon',
    'Commercial brand wall with 3D backlit acrylic logo & company signage',
    'Celebratory floral arch & glowing script neon event backdrop',
    'Floor-to-ceiling channel-upholstered bouclé fabric accent wall',
    'Curved cream bouclé sofa',
    'Monolithic honed travertine coffee table',
    'Linear modern electric fireplace with Venetian plaster',
    'Sculptural multi-tier brass mobile chandelier',
    'Tall potted Mediterranean olive tree in fiberstone planter',
    '7-foot arched thin black iron floor leaner mirror',
  ];

  const landscapingQuickReplaceSuggestions = [
    'Modern rectangular plunge pool with blue waterline tile',
    'Sleek cast concrete gas fire pit table with glowing lava rock',
    'Motorized matte black louvered pergola with downlights',
    'Natural bluestone flagstone patio with creeping thyme',
    'Specimen Japanese maple tree surrounded by river pebbles',
    'Curved teak outdoor sectional lounge with sunbrella cushions',
    'Tiered dry-stacked limestone retaining wall garden beds',
    'Integrated outdoor kitchen station with BBQ grill and quartzite counter',
    'Illuminated modern fluted water fountain cascade',
    'Lush ornamental feather reed grasses and lavender border',
  ];

  const quickReplaceChips = contextType === 'room' ? roomQuickReplaceSuggestions : landscapingQuickReplaceSuggestions;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="circle-region-title"
    >
      <div className="bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-900/60 rounded-2xl shadow-2xl max-w-6xl w-full my-auto overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-purple-50/60 dark:bg-purple-950/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <CircleDot className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="circle-region-title"
                className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"
              >
                <span>Circle Area to Remove, Edit, or Replace</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold hidden sm:inline">
                  {projectTitle ? `${projectTitle} • ${revisionLabel}` : revisionLabel}
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Draw a circle or lasso around any item in this rendering, then choose to erase, replace, or restyle that exact spot.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            aria-label="Close circle edit modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Split view (Canvas on Left, Action Controls on Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Canvas Workspace (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            {/* Drawing Tools Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-gray-100 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1 mr-1">
                  Tool:
                </span>
                <button
                  type="button"
                  onClick={() => setDrawingMode('circle')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    drawingMode === 'circle'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  id="btn-tool-circle"
                >
                  <CircleDot className="h-3.5 w-3.5" />
                  <span>Circle / Oval</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawingMode('lasso')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    drawingMode === 'lasso'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  id="btn-tool-lasso"
                >
                  <PenTool className="h-3.5 w-3.5" />
                  <span>Freehand Loop</span>
                </button>
              </div>

              {region && (
                <button
                  type="button"
                  onClick={handleClearRegion}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Clear circled area and redraw"
                  id="btn-clear-circle"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Redraw Circle</span>
                </button>
              )}
            </div>

            {/* Canvas Interactive Container */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-inner select-none cursor-crosshair">
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                onMouseDown={handleStartDraw}
                onMouseMove={handleMoveDraw}
                onMouseUp={handleEndDraw}
                onTouchStart={handleStartDraw}
                onTouchMove={handleMoveDraw}
                onTouchEnd={handleEndDraw}
                className="w-full h-full object-contain block touch-none"
                id="circle-region-canvas"
              />

              {/* Instructions banner when no region is selected */}
              {!region && !isDrawing && (
                <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none px-4">
                  <div className="bg-black/85 backdrop-blur-xs text-white text-xs px-4 py-2 rounded-full shadow-lg border border-purple-500/40 flex items-center gap-2 animate-bounce">
                    <CircleDot className="h-4 w-4 text-purple-400 animate-pulse" />
                    <span className="font-semibold">Click &amp; drag on the image to circle any object or area</span>
                  </div>
                </div>
              )}

              {/* Region confirmed tag */}
              {region && (
                <div className="absolute top-3 left-3 bg-purple-900/90 backdrop-blur-xs text-purple-100 text-xs px-3 py-1.5 rounded-lg shadow-md border border-purple-400/40 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-300" />
                  <span className="font-bold">Area Circled:</span>
                  <span className="text-purple-200">{getRegionLocationDescription(region)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 px-1">
              <span>💡 Tip: Click and drag around a sofa, chandelier, fireplace, tree, patio, or wall.</span>
              {region && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Ready for action
                </span>
              )}
            </div>
          </div>

          {/* Right Action Config Column (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Step 1: Action Choice */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  1. Choose What to Do with the Circled Area:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('replace')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      actionType === 'replace'
                        ? 'bg-purple-50 dark:bg-purple-900/40 border-purple-600 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500 font-bold'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 text-gray-700 dark:text-gray-300'
                    }`}
                    id="btn-action-replace"
                  >
                    <RefreshCw className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                    <div className="text-xs">Replace</div>
                    <div className="text-[10px] text-gray-500 font-normal">Swap with new item</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('remove')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      actionType === 'remove'
                        ? 'bg-purple-50 dark:bg-purple-900/40 border-purple-600 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500 font-bold'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 text-gray-700 dark:text-gray-300'
                    }`}
                    id="btn-action-remove"
                  >
                    <Trash2 className="h-4 w-4 mx-auto mb-1 text-red-500" />
                    <div className="text-xs">Remove</div>
                    <div className="text-[10px] text-gray-500 font-normal">Erase &amp; fill in</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('edit')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      actionType === 'edit'
                        ? 'bg-purple-50 dark:bg-purple-900/40 border-purple-600 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500 font-bold'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 text-gray-700 dark:text-gray-300'
                    }`}
                    id="btn-action-edit"
                  >
                    <Wand2 className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                    <div className="text-xs">Edit / Restyle</div>
                    <div className="text-[10px] text-gray-500 font-normal">Change color/style</div>
                  </button>
                </div>
              </div>

              {/* Step 2: What is in the circled area? (Optional) */}
              <div className="space-y-2 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    2. What is in the circled area? (Optional)
                  </label>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                    Helps AI pinpoint exact item
                  </span>
                </div>
                <input
                  type="text"
                  value={currentItemDescription}
                  onChange={(e) => setCurrentItemDescription(e.target.value)}
                  placeholder={
                    contextType === 'room'
                      ? 'e.g. Coffee table, Sofa, Chandelier, Rug, Fireplace...'
                      : 'e.g. Patio, Lawn, Swimming pool, Trees, Walkway...'
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  id="input-current-item-description"
                />
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {(contextType === 'room'
                    ? [
                        'Coffee table',
                        'Sofa / Couch',
                        'Chandelier / Light',
                        'Fireplace',
                        'Accent chair',
                        'Area rug',
                        'Wall art',
                        'Accent wall',
                        'Dining table',
                        'Flooring',
                      ]
                    : [
                        'Patio / Pavers',
                        'Lawn / Grass',
                        'Swimming pool',
                        'Tree / Shrub',
                        'Walkway / Path',
                        'Garden bed',
                        'Fence / Wall',
                        'Outdoor furniture',
                        'Pergola / Deck',
                        'Fire pit',
                      ]
                  ).map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentItemDescription(item)}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                        currentItemDescription.toLowerCase() === item.toLowerCase()
                          ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                          : 'bg-white dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Action Specific Details */}
              {actionType === 'replace' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      3. Replace Circled Item With:
                    </label>
                    <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                      Custom item or feature
                    </span>
                  </div>

                  <input
                    type="text"
                    value={replaceWithDescription}
                    onChange={(e) => setReplaceWithDescription(e.target.value)}
                    placeholder="E.g. Monolithic travertine coffee table with stone bowls..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    id="input-replace-description"
                  />

                  {/* 1-Click quick ideas */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                      Popular Ideas to Put Here:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {quickReplaceChips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReplaceWithDescription(chip)}
                          className="px-2 py-1 text-[11px] font-medium bg-white dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-gray-700 dark:text-gray-200 hover:text-purple-800 rounded-md border border-gray-200 dark:border-gray-600 transition-colors text-left"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {actionType === 'remove' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-red-500" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Remove Circled Object &amp; Inpaint Background:
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    The item in the circled zone will be completely erased. The background will be filled seamlessly with matching materials.
                  </p>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Seamless background fill instructions (optional):
                    </label>
                    <input
                      type="text"
                      value={removeFillDescription}
                      onChange={(e) => setRemoveFillDescription(e.target.value)}
                      placeholder="E.g. Seamless natural European oak parquet flooring..."
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      id="input-remove-fill"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      contextType === 'room' ? 'Matching hardwood floor' : 'Continuous green grass lawn',
                      contextType === 'room' ? 'Clean gallery white wall' : 'Matching stone flagstone patio',
                      contextType === 'room' ? 'Open walking clearance' : 'Clean garden gravel mulch',
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRemoveFillDescription(chip)}
                        className="px-2 py-0.5 text-[11px] font-medium bg-white dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {actionType === 'edit' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Edit / Restyle This Item:
                    </label>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      Color, texture, finish
                    </span>
                  </div>

                  <input
                    type="text"
                    value={editModificationsDescription}
                    onChange={(e) => setEditModificationsDescription(e.target.value)}
                    placeholder="E.g. Change color to deep forest green velvet with brass legs..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    id="input-edit-description"
                  />

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Change color to warm cream bouclé',
                      'Finish in dark smoked walnut',
                      'Add warm 2700K ambient LED uplight glow',
                      'Make it modern minimalist matte black',
                      'Upgrade to polished Calacatta gold marble',
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditModificationsDescription(chip)}
                        className="px-2 py-0.5 text-[11px] font-medium bg-white dark:bg-gray-700 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Perimeter Preservation Toggle */}
              <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Preserve Surrounding Architecture
                    </span>
                    <input
                      type="checkbox"
                      checked={strictPreservation}
                      onChange={(e) => setStrictPreservation(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4 cursor-pointer"
                      id="checkbox-preservation"
                    />
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                    Maintains the room's surrounding walls, flooring, layout perspective, and lighting, while applying your circled changes clearly and prominently.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions & Error */}
            <div className="space-y-3 pt-2">
              {errorMessage && (
                <div
                  className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs"
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isGenerating}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleApplyRegionEdit}
                  disabled={isGenerating || !region}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                    isGenerating || !region
                      ? 'bg-purple-400 dark:bg-purple-800 cursor-not-allowed opacity-60'
                      : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/25 active:scale-98'
                  }`}
                  id="btn-apply-region-edit"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{generationStep || 'Generating Revision...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>
                        {region
                          ? `Apply & Render Revision ${nextRevisionNumber}`
                          : 'Circle an Area First'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
