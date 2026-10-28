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
  RefreshCw,
  Copy,
  MapPin,
  ArrowLeftRight
} from 'lucide-react';
import { generateImageFromImage } from '../services/geminiService';

export type RegionActionType = 'remove' | 'replace' | 'edit' | 'copy';

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

  // Copy & Place specific state
  const [copyTargetPoint, setCopyTargetPoint] = useState<NormalizedPoint | null>(null);
  const [copyPreset, setCopyPreset] = useState<
    'opposite-symmetrical' | 'adjacent-right' | 'adjacent-left' | 'foreground' | 'background' | 'custom'
  >('opposite-symmetrical');
  const [copyDestinationDescription, setCopyDestinationDescription] = useState<string>('');
  const [copyMirror, setCopyMirror] = useState<boolean>(false);
  const [copyScale, setCopyScale] = useState<'100%' | '75%' | '125%'>('100%');
  const [canvasPlacementMode, setCanvasPlacementMode] = useState<'source' | 'destination'>('source');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Canvas and image refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Preset calculation helper for destination positioning
  const calculatePresetDestination = useCallback(
    (
      preset: 'opposite-symmetrical' | 'adjacent-right' | 'adjacent-left' | 'foreground' | 'background',
      currentRegion: CircledRegion
    ): NormalizedPoint => {
      const cx = (currentRegion.minX + currentRegion.maxX) / 2;
      const cy = (currentRegion.minY + currentRegion.maxY) / 2;
      const w = currentRegion.maxX - currentRegion.minX;
      const h = currentRegion.maxY - currentRegion.minY;

      switch (preset) {
        case 'opposite-symmetrical':
          return {
            x: Math.max(0.1, Math.min(0.9, 1 - cx)),
            y: cy,
          };
        case 'adjacent-right':
          return {
            x: Math.max(0.08, Math.min(0.92, cx + Math.max(0.12, w * 1.35))),
            y: cy,
          };
        case 'adjacent-left':
          return {
            x: Math.max(0.08, Math.min(0.92, cx - Math.max(0.12, w * 1.35))),
            y: cy,
          };
        case 'foreground':
          return {
            x: cx,
            y: Math.max(0.1, Math.min(0.92, cy + Math.max(0.16, h * 1.15))),
          };
        case 'background':
          return {
            x: cx,
            y: Math.max(0.08, Math.min(0.9, cy - Math.max(0.16, h * 1.15))),
          };
        default:
          return { x: 0.5, y: 0.5 };
      }
    },
    []
  );

  // Load source image
  useEffect(() => {
    if (!isOpen || !sourceImageUrl) return;

    setImageLoaded(false);
    setRegion(null);
    setLassoPoints([]);
    setCircleStart(null);
    setCircleCurrent(null);
    setCurrentItemDescription('');
    setCopyTargetPoint(null);
    setCopyDestinationDescription('');
    setCopyMirror(false);
    setCopyScale('100%');
    setCopyPreset('opposite-symmetrical');
    setCanvasPlacementMode('source');
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
      if (!copyDestinationDescription) {
        setCopyDestinationDescription('Place symmetrical duplicate on the opposite side to balance the room layout');
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
      if (!copyDestinationDescription) {
        setCopyDestinationDescription('Place matching duplicate on opposite side of walkway/patio for balanced curb appeal');
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

      let scx = 0;
      let scy = 0;

      if (region.mode === 'circle' && region.center && region.radiusX && region.radiusY) {
        scx = region.center.x * w;
        scy = region.center.y * h;
        const rx = region.radiusX * w;
        const ry = region.radiusY * h;

        // Darken outside slightly or highlight inside
        ctx.beginPath();
        ctx.ellipse(scx, scy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = actionType === 'copy' ? 'rgba(147, 51, 234, 0.22)' : 'rgba(168, 85, 247, 0.25)';
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
        ctx.arc(scx, scy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      } else if (region.mode === 'lasso' && region.points && region.points.length > 2) {
        scx = ((region.minX + region.maxX) / 2) * w;
        scy = ((region.minY + region.maxY) / 2) * h;

        ctx.beginPath();
        ctx.moveTo(region.points[0].x * w, region.points[0].y * h);
        for (let i = 1; i < region.points.length; i++) {
          ctx.lineTo(region.points[i].x * w, region.points[i].y * h);
        }
        ctx.closePath();

        ctx.fillStyle = actionType === 'copy' ? 'rgba(147, 51, 234, 0.22)' : 'rgba(168, 85, 247, 0.25)';
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

      // If action is copy, draw source badge label
      if (actionType === 'copy') {
        const srcText = '① Source (To Copy)';
        ctx.font = 'bold 12px sans-serif';
        const srcTextW = ctx.measureText(srcText).width;
        const bW = srcTextW + 16;
        const bH = 22;
        const bX = Math.max(8, Math.min(w - bW - 8, scx - bW / 2));
        const bY = Math.max(8, region.minY * h - bH - 6);

        ctx.fillStyle = 'rgba(76, 29, 149, 0.92)';
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(bX, bY, bW, bH, 5);
          ctx.fill();
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.fillRect(bX, bY, bW, bH);
        }
        ctx.fillStyle = '#f3e8ff';
        ctx.fillText(srcText, bX + 8, bY + 15);
      }

      // If action is copy and destination point is set, draw arrow and target placement zone
      if (actionType === 'copy' && copyTargetPoint) {
        const tx = copyTargetPoint.x * w;
        const ty = copyTargetPoint.y * h;

        const scaleMultiplier = copyScale === '75%' ? 0.75 : copyScale === '125%' ? 1.25 : 1.0;
        const baseRx = region.radiusX ? region.radiusX * w : ((region.maxX - region.minX) / 2) * w;
        const baseRy = region.radiusY ? region.radiusY * h : ((region.maxY - region.minY) / 2) * h;
        const targetRx = Math.max(16, baseRx * scaleMultiplier);
        const targetRy = Math.max(16, baseRy * scaleMultiplier);

        // Connecting dashed trajectory line with arrow
        ctx.beginPath();
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.moveTo(scx, scy);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Arrow head at target
        const angle = Math.atan2(ty - scy, tx - scx);
        const headLen = 14;
        ctx.setLineDash([]);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(
          tx - headLen * Math.cos(angle - Math.PI / 6),
          ty - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          tx - headLen * Math.cos(angle + Math.PI / 6),
          ty - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // Target placement zone ellipse
        ctx.beginPath();
        ctx.ellipse(tx, ty, targetRx, targetRy, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
        ctx.fill();

        ctx.shadowColor = '#059669';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([8, 5]);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        // Target crosshair pin
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(tx, ty, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Destination badge tag
        const destTagText = copyMirror ? '② Target Placement (Mirrored ⇄)' : '② Target Placement';
        ctx.font = 'bold 12px sans-serif';
        const destTagW = ctx.measureText(destTagText).width + 18;
        const destTagH = 24;
        const destTagX = Math.max(8, Math.min(w - destTagW - 8, tx - destTagW / 2));
        const destTagY = Math.max(8, ty - targetRy - destTagH - 6);

        ctx.fillStyle = 'rgba(6, 78, 59, 0.95)';
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(destTagX, destTagY, destTagW, destTagH, 6);
          ctx.fill();
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.fillRect(destTagX, destTagY, destTagW, destTagH);
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillText(destTagText, destTagX + 9, destTagY + 16);
      }

      ctx.restore();
    }
  }, [
    imageLoaded,
    isDrawing,
    drawingMode,
    circleStart,
    circleCurrent,
    lassoPoints,
    region,
    actionType,
    copyTargetPoint,
    copyScale,
    copyMirror
  ]);

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

  // Mouse / Touch handlers for drawing and destination positioning
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pt = getNormalizedCoords(e);
    if (!pt) return;

    if (actionType === 'copy' && region && canvasPlacementMode === 'destination') {
      setCopyTargetPoint(pt);
      setCopyPreset('custom');
      return;
    }

    setIsDrawing(true);
    if (drawingMode === 'circle') {
      setCircleStart(pt);
      setCircleCurrent(pt);
    } else {
      setLassoPoints([pt]);
    }
  };

  const handleMoveDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (actionType === 'copy' && region && canvasPlacementMode === 'destination') {
      e.preventDefault();
      if (('buttons' in e && e.buttons > 0) || 'touches' in e) {
        const pt = getNormalizedCoords(e);
        if (!pt) return;
        setCopyTargetPoint(pt);
        setCopyPreset('custom');
      }
      return;
    }

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
    if (actionType === 'copy' && region && canvasPlacementMode === 'destination') {
      e.preventDefault();
      const pt = getNormalizedCoords(e);
      if (pt) {
        setCopyTargetPoint(pt);
        setCopyPreset('custom');
      }
      return;
    }

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

        const newRegion: CircledRegion = {
          mode: 'circle',
          center,
          radiusX,
          radiusY,
          minX,
          minY,
          maxX,
          maxY,
        };
        setRegion(newRegion);
        if (actionType === 'copy') {
          const defaultPt = calculatePresetDestination('opposite-symmetrical', newRegion);
          setCopyTargetPoint(defaultPt);
          setCanvasPlacementMode('destination');
        }
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
        const newLassoRegion: CircledRegion = {
          mode: 'lasso',
          points: lassoPoints,
          minX,
          minY,
          maxX,
          maxY,
        };
        setRegion(newLassoRegion);
        if (actionType === 'copy') {
          const defaultPt = calculatePresetDestination('opposite-symmetrical', newLassoRegion);
          setCopyTargetPoint(defaultPt);
          setCanvasPlacementMode('destination');
        }
      }
    }
  };

  const handleClearRegion = () => {
    setRegion(null);
    setLassoPoints([]);
    setCircleStart(null);
    setCircleCurrent(null);
    setCopyTargetPoint(null);
    setCanvasPlacementMode('source');
  };

  // Target Location description calculation
  const getTargetLocationDescription = (
    target: NormalizedPoint,
    sourceRegion: CircledRegion,
    scale: '100%' | '75%' | '125%'
  ): string => {
    const scaleMultiplier = scale === '75%' ? 0.75 : scale === '125%' ? 1.25 : 1.0;
    const sourceW = sourceRegion.maxX - sourceRegion.minX;
    const sourceH = sourceRegion.maxY - sourceRegion.minY;
    const targetW = sourceW * scaleMultiplier;
    const targetH = sourceH * scaleMultiplier;

    const minX = Math.max(0, target.x - targetW / 2);
    const maxX = Math.min(1, target.x + targetW / 2);
    const minY = Math.max(0, target.y - targetH / 2);
    const maxY = Math.min(1, target.y + targetH / 2);

    const horizontal = target.x < 0.35 ? 'left side' : target.x > 0.65 ? 'right side' : 'center';
    const vertical = target.y < 0.35 ? 'upper background / rear area' : target.y > 0.65 ? 'foreground / lower area' : 'mid-ground';

    const minXPercent = Math.round(minX * 100);
    const maxXPercent = Math.round(maxX * 100);
    const minYPercent = Math.round(minY * 100);
    const maxYPercent = Math.round(maxY * 100);

    return `${vertical}, ${horizontal} (target zone coordinates: ${minXPercent}% to ${maxXPercent}% width, ${minYPercent}% to ${maxYPercent}% height of frame)`;
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
      } else if (actionType === 'edit') {
        const editText = editModificationsDescription.trim() || 'restyle to luxury contemporary finish';
        customDirectiveText = `Edit ${currentItemText}: ${editText}`;
        revisionLabelSummary = `Edited: ${editText.slice(0, 30)}${editText.length > 30 ? '...' : ''}`;
        actionPromptDirective = `PRIMARY TASK - EDIT & RESTYLE ITEM:
- Target area location: ${locDesc} (bounding box coordinates: ${minXPercent}% to ${maxXPercent}% width, ${minYPercent}% to ${maxYPercent}% height of frame).
- Targeted item: ${currentItemText}.
- MANDATORY INSTRUCTION: Boldly modify and restyle the ${currentItemText} according to: ${editText}.
- The change in color, material finish, texture, or styling must be prominently and visibly transformed, clearly noticeable compared to the original.`;
      } else if (actionType === 'copy') {
        const targetPt = copyTargetPoint || calculatePresetDestination('opposite-symmetrical', region);
        const scaleFactor = copyScale === '75%' ? 0.75 : copyScale === '125%' ? 1.25 : 1.0;
        const sourceW = region.maxX - region.minX;
        const sourceH = region.maxY - region.minY;
        const targetW = sourceW * scaleFactor;
        const targetH = sourceH * scaleFactor;
        const targetMinXPercent = Math.round(Math.max(0, targetPt.x - targetW / 2) * 100);
        const targetMaxXPercent = Math.round(Math.min(1, targetPt.x + targetW / 2) * 100);
        const targetMinYPercent = Math.round(Math.max(0, targetPt.y - targetH / 2) * 100);
        const targetMaxYPercent = Math.round(Math.min(1, targetPt.y + targetH / 2) * 100);

        const targetLocationDesc = getTargetLocationDescription(targetPt, region, copyScale);
        const userPlacementNote =
          copyDestinationDescription.trim() || 'Place matching duplicate in the designated target zone';
        const mirrorInstruction = copyMirror
          ? 'MIRROR FLIP: Horizontally mirror and flip the duplicated item so it faces symmetrically inward toward the scene center.'
          : 'ORIENTATION: Preserve natural perspective-matched orientation suitable for this placement.';
        const scaleInstruction =
          copyScale === '75%'
            ? 'SCALE: Render at approx 75% scale to simulate deeper background perspective distance.'
            : copyScale === '125%'
            ? 'SCALE: Render at approx 125% scale to reflect closer foreground perspective.'
            : 'SCALE: Render at 100% matching real-world architectural scale.';

        customDirectiveText = `Copy ${currentItemText} to ${targetLocationDesc}. Note: ${userPlacementNote}. ${mirrorInstruction} ${scaleInstruction}`;
        const destPresetLabel =
          copyPreset === 'opposite-symmetrical'
            ? 'opposite side'
            : copyPreset === 'adjacent-right'
            ? 'adjacent right'
            : copyPreset === 'adjacent-left'
            ? 'adjacent left'
            : copyPreset === 'foreground'
            ? 'foreground'
            : copyPreset === 'background'
            ? 'background'
            : 'new spot';
        revisionLabelSummary = `Copied ${currentItemText.slice(0, 20)} to ${destPresetLabel}`;

        actionPromptDirective = `PRIMARY TASK - DUPLICATE & COPY CIRCLED ELEMENT TO TARGET AREA:
- SOURCE ITEM TO DUPLICATE: Identify the ${currentItemText} in the circled source area at ${locDesc} (bounding box coordinates: ${minXPercent}% to ${maxXPercent}% width, ${minYPercent}% to ${maxYPercent}% height of frame).
- TARGET DESTINATION LOCATION: Replicate an exact duplicate copy of this ${currentItemText} into the destination area: ${targetLocationDesc} (bounding box coordinates: ${targetMinXPercent}% to ${targetMaxXPercent}% width, ${targetMinYPercent}% to ${targetMaxYPercent}% height).
- PLACEMENT DIRECTIVE: ${userPlacementNote}.
- ${mirrorInstruction}
- ${scaleInstruction}
- MANDATORY RETENTION OF ORIGINAL: The original source ${currentItemText} MUST BE 100% PRESERVED in its current position. Do NOT delete, erase, or move the original. BOTH the original item and the newly placed duplicate copy must coexist naturally together in the finished space.
- PHOTOREALISTIC BLENDING & SHADOWS: Calculate authentic ambient occlusion, physical ground contact shadows, realistic light reflections, and true 3D spatial perspective for the new copied item matching the room/landscape lighting.
- ARCHITECTURAL CONTINUITY: Preserve all other walls, flooring, plants, structures, and surrounding areas pristine and intact.`;
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

              {actionType === 'copy' && region && (
                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 text-[11px]">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    Click/drag image to move target
                  </span>
                </div>
              )}

              {region && (
                <button
                  type="button"
                  onClick={handleClearRegion}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Clear circled area and redraw"
                  id="btn-clear-circle"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Redraw Source</span>
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
                    <span className="font-semibold">
                      {actionType === 'copy'
                        ? 'Click & drag on the image to circle the item you want to copy'
                        : 'Click & drag on the image to circle any object or area'}
                    </span>
                  </div>
                </div>
              )}

              {/* Region confirmed tags */}
              {region && (
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 max-w-[90%] pointer-events-none">
                  <div className="bg-purple-900/90 backdrop-blur-xs text-purple-100 text-xs px-3 py-1.5 rounded-lg shadow-md border border-purple-400/40 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-300 shrink-0" />
                    <span className="font-bold shrink-0">
                      {actionType === 'copy' ? '① Source Item:' : 'Area Circled:'}
                    </span>
                    <span className="text-purple-200 truncate">{getRegionLocationDescription(region)}</span>
                  </div>

                  {actionType === 'copy' && copyTargetPoint && (
                    <div className="bg-emerald-950/90 backdrop-blur-xs text-emerald-100 text-xs px-3 py-1.5 rounded-lg shadow-md border border-emerald-400/40 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-300 shrink-0" />
                      <span className="font-bold shrink-0">② Target Placement:</span>
                      <span className="text-emerald-200 truncate">
                        {getTargetLocationDescription(copyTargetPoint, region, copyScale)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 px-1">
              <span>
                {actionType === 'copy'
                  ? '💡 Tip: Click/drag on image to reposition destination, or choose a preset on the right.'
                  : '💡 Tip: Click and drag around a sofa, chandelier, fireplace, tree, patio, or wall.'}
              </span>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                    <div className="text-[10px] text-gray-500 font-normal">Swap with new</div>
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
                    <div className="text-[10px] text-gray-500 font-normal">Erase &amp; fill</div>
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
                    <div className="text-xs">Edit</div>
                    <div className="text-[10px] text-gray-500 font-normal">Change style</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionType('copy');
                      if (region) {
                        if (!copyTargetPoint) {
                          const defaultPt = calculatePresetDestination('opposite-symmetrical', region);
                          setCopyTargetPoint(defaultPt);
                        }
                        setCanvasPlacementMode('destination');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      actionType === 'copy'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500 font-bold'
                        : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 text-gray-700 dark:text-gray-300'
                    }`}
                    id="btn-action-copy"
                  >
                    <Copy className="h-4 w-4 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
                    <div className="text-xs">Copy &amp; Place</div>
                    <div className="text-[10px] text-gray-500 font-normal">Duplicate spot</div>
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

              {/* Step 3 (Copy & Place Options) */}
              {actionType === 'copy' && (
                <div className="space-y-4 p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Copy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        3. Placement &amp; Duplication Settings:
                      </label>
                    </div>
                    {copyTargetPoint && (
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Target: {Math.round(copyTargetPoint.x * 100)}% X, {Math.round(copyTargetPoint.y * 100)}% Y
                      </span>
                    )}
                  </div>

                  {/* Canvas interactive placement helper */}
                  <div className="p-2.5 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-emerald-200 dark:border-emerald-700 text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-emerald-900 dark:text-emerald-300">
                        Canvas Interactive Placement:
                      </p>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                        Click or drag anywhere on the image preview on the left to move the green target placement circle.
                      </p>
                    </div>
                  </div>

                  {/* Quick placement presets */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                      Quick Placement Presets:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {[
                        { id: 'opposite-symmetrical', label: 'Opposite Side (Symmetrical)' },
                        { id: 'adjacent-right', label: 'Adjacent Right (Beside)' },
                        { id: 'adjacent-left', label: 'Adjacent Left (Beside)' },
                        { id: 'foreground', label: 'Foreground (Lower)' },
                        { id: 'background', label: 'Background (Upper)' },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setCopyPreset(preset.id as any);
                            if (region) {
                              const newPt = calculatePresetDestination(preset.id as any, region);
                              setCopyTargetPoint(newPt);
                            }
                          }}
                          className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg border text-left transition-colors cursor-pointer ${
                            copyPreset === preset.id
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-semibold'
                              : 'bg-white dark:bg-gray-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Destination description input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Placement details / notes (optional):
                    </label>
                    <input
                      type="text"
                      value={copyDestinationDescription}
                      onChange={(e) => setCopyDestinationDescription(e.target.value)}
                      placeholder={
                        contextType === 'room'
                          ? 'E.g. Place matching duplicate chair on the right side of fireplace...'
                          : 'E.g. Symmetrical duplicate planter flanking the entry walkway...'
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      id="input-copy-destination"
                    />
                  </div>

                  {/* 1-Click quick copy placement ideas */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                      Popular Duplication Ideas:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {(contextType === 'room'
                        ? [
                            'Symmetrical pair on opposite side of fireplace',
                            'Second matching chair to complete conversation nook',
                            'Twin bedside wall sconce on other side of bed',
                            'Matching potted olive tree in opposite corner',
                            'Second matching barstool along the island counter',
                            'Twin nightstand on the other side of master bed',
                          ]
                        : [
                            'Second matching chaise lounge along the pool sun shelf',
                            'Twin decorative planter on opposite side of walkway',
                            'Matching specimen tree in opposite corner of lawn',
                            'Symmetrical coach lantern on opposite side of garage',
                            'Matching outdoor armchair around fire pit seating circle',
                            'Duplicate pathway bollard light along the walk',
                          ]
                      ).map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCopyDestinationDescription(chip)}
                          className="px-2 py-0.5 text-[11px] font-medium bg-white dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-gray-700 dark:text-gray-200 rounded border border-gray-200 dark:border-gray-600 text-left cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mirror and scale options */}
                  <div className="pt-2 border-t border-emerald-200/80 dark:border-emerald-800/80 space-y-2.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={copyMirror}
                        onChange={(e) => setCopyMirror(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        id="checkbox-copy-mirror"
                      />
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                        <ArrowLeftRight className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Mirror duplicate horizontally (flip orientation for symmetrical pairs)</span>
                      </span>
                    </label>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Perspective Scale Adjustment:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: '100%', label: '100% (Same scale)' },
                          { val: '75%', label: '75% (Deeper / further)' },
                          { val: '125%', label: '125% (Foreground)' },
                        ].map((s) => (
                          <button
                            key={s.val}
                            type="button"
                            onClick={() => setCopyScale(s.val as any)}
                            className={`px-2 py-1.5 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                              copyScale === s.val
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-semibold'
                                : 'bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
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
                      : actionType === 'copy'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25 active:scale-98'
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
                      {actionType === 'copy' ? (
                        <Copy className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      <span>
                        {region
                          ? actionType === 'copy'
                            ? `Copy & Place in Revision ${nextRevisionNumber}`
                            : `Apply & Render Revision ${nextRevisionNumber}`
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
