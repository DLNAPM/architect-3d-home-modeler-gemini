import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Columns, SplitSquareHorizontal, ZoomIn, Download, Sparkles } from 'lucide-react';

interface BeforeAfterSliderProps {
  originalImage: string;
  transformedImage: string;
  originalLabel?: string;
  transformedLabel?: string;
  onEnlarge?: (imageUrl: string) => void;
  onDownloadTransformed?: () => void;
  onDownloadSideBySide?: () => void;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  originalImage,
  transformedImage,
  originalLabel = 'Original Photo',
  transformedLabel = 'Customized Rendering',
  onEnlarge,
  onDownloadTransformed,
  onDownloadSideBySide,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage from left
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    },
    []
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      handleMove(e.touches[0].clientX);
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
    }

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging, handleMove]);

  return (
    <div className="w-full flex flex-col space-y-3" id="room-transformation-comparison">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center space-x-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'slider'
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-xs font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            id="btn-viewmode-slider"
          >
            <SplitSquareHorizontal className="h-3.5 w-3.5" />
            <span>Split Slider</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-xs font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            id="btn-viewmode-sidebyside"
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Side-by-Side</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {onDownloadSideBySide && (
            <button
              type="button"
              onClick={onDownloadSideBySide}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 shadow-xs transition-colors"
              title="Download comparison collage"
              id="btn-download-comparison"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save Comparison</span>
            </button>
          )}

          {onDownloadTransformed && (
            <button
              type="button"
              onClick={onDownloadTransformed}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-xs transition-colors"
              title="Download transformed image"
              id="btn-download-transformed"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Rendering</span>
            </button>
          )}

          {onEnlarge && (
            <button
              type="button"
              onClick={() => onEnlarge(transformedImage)}
              className="p-1.5 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 shadow-xs transition-colors"
              title="Enlarge rendering"
              aria-label="Enlarge rendering"
              id="btn-enlarge-transformed"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Visualizer Area */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          className="relative w-full aspect-video md:aspect-[16/10] max-h-[620px] rounded-xl overflow-hidden select-none shadow-xl border border-gray-200 dark:border-gray-700 bg-gray-950 cursor-ew-resize"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          id="before-after-slider-container"
        >
          {/* Base: Transformed (After) Image */}
          <img
            src={transformedImage}
            alt="Transformed Room Rendering"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            referrerPolicy="no-referrer"
          />

          {/* Overlay: Original (Before) Image with clip-path */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={originalImage}
              alt="Original Room Photo"
              className="absolute inset-0 w-full h-full object-cover max-w-none pointer-events-none"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                height: '100%',
              }}
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] z-20 pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* Center Draggable Knob */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-gray-800 shadow-2xl flex items-center justify-center border-2 border-purple-600 transition-transform active:scale-110">
              <SplitSquareHorizontal className="h-5 w-5 text-purple-600" />
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <span className="px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-black/70 text-white backdrop-blur-md rounded-full shadow-md border border-white/20">
              {originalLabel}
            </span>
          </div>
          <div className="absolute top-4 right-4 z-10 pointer-events-none">
            <span className="flex items-center space-x-1 px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-purple-900/80 text-purple-100 backdrop-blur-md rounded-full shadow-md border border-purple-400/40">
              <Sparkles className="h-3 w-3 text-purple-300" />
              <span>{transformedLabel}</span>
            </span>
          </div>

          {/* Hint Footer */}
          <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none z-10">
            <span className="px-3 py-1 text-[11px] font-medium bg-black/60 text-white/90 backdrop-blur-xs rounded-full shadow-xs">
              Drag slider left or right to compare
            </span>
          </div>
        </div>
      ) : (
        /* Side-by-Side View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full" id="side-by-side-comparison-grid">
          {/* Original Card */}
          <div className="relative group rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-gray-900 aspect-video flex flex-col justify-between">
            <img
              src={originalImage}
              alt="Original Room Photo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-black/70 text-white backdrop-blur-md rounded-full border border-white/20 shadow-md">
                {originalLabel}
              </span>
            </div>
            {onEnlarge && (
              <button
                type="button"
                onClick={() => onEnlarge(originalImage)}
                className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="Enlarge original photo"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Transformed Card */}
          <div className="relative group rounded-xl overflow-hidden shadow-lg border-2 border-purple-500/50 dark:border-purple-400/50 bg-gray-900 aspect-video flex flex-col justify-between">
            <img
              src={transformedImage}
              alt="Customized Transformed Room Rendering"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-3 left-3">
              <span className="flex items-center space-x-1 px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-purple-700 text-white backdrop-blur-md rounded-full border border-purple-400/40 shadow-md">
                <Sparkles className="h-3 w-3 text-purple-200" />
                <span>{transformedLabel}</span>
              </span>
            </div>
            {onEnlarge && (
              <button
                type="button"
                onClick={() => onEnlarge(transformedImage)}
                className="absolute bottom-3 right-3 p-2 bg-purple-900/80 hover:bg-purple-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="Enlarge rendering"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
