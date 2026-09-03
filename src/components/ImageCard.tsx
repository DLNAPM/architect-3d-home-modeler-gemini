
import React, { useState, useRef } from 'react';
import { Rendering } from '../types';
import { 
  Heart, 
  Star, 
  Download, 
  Send, 
  CheckSquare, 
  Square, 
  ZoomIn, 
  Pencil, 
  X, 
  Wand2, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface AttachedImageState {
  base64: string;
  mimeType: string;
  dataUrl: string;
  size: number;
  name: string;
}

interface ImageCardProps {
  rendering: Rendering;
  onRefine?: (
    id: string, 
    instructions: string, 
    attachedImage?: { base64: string; mimeType: string; mode?: 'ai' | 'direct'; fileName?: string }
  ) => void;
  onUpdate: (id: string, updates: Partial<Rendering>) => void;
  isSelected: boolean;
  onSelectToggle: (id: string) => void;
  onEnlarge: (imageUrl: string) => void;
  isPremium?: boolean;
  isHighlighted?: boolean;
  canEdit?: boolean;
}

function processImageFile(file: File): Promise<AttachedImageState> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please upload an image file (PNG, JPG, WebP, etc.).'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = 1600;
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const rawDataUrl = e.target?.result as string;
          const [header, base64] = rawDataUrl.split(',');
          const mimeType = header.split(';')[0].split(':')[1] || 'image/jpeg';
          resolve({ base64, mimeType, dataUrl: rawDataUrl, size: file.size, name: file.name });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.92);
        const base64 = dataUrl.split(',')[1];
        resolve({
          base64,
          mimeType,
          dataUrl,
          size: Math.round((base64.length * 3) / 4),
          name: file.name,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ImageCard: React.FC<ImageCardProps> = ({ 
  rendering, 
  onRefine, 
  onUpdate, 
  isSelected, 
  onSelectToggle, 
  onEnlarge, 
  isPremium = false, 
  isHighlighted = false,
  canEdit = true
}) => {
  const { id, category, imageUrl, liked, favorited } = rendering;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editInstructions, setEditInstructions] = useState('');
  const [attachedImage, setAttachedImage] = useState<AttachedImageState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLike = () => onUpdate(id, { liked: !liked });
  const handleFavorite = () => onUpdate(id, { favorited: !favorited });

  const handleDownload = () => {
    if (!liked) {
      alert("Please 'Like' the rendering to enable download.");
      return;
    }
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${category.replace(/\s+/g, '_')}_${id.substring(0, 6)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmail = async () => {
    if (!liked) {
      alert("Please 'Like' the rendering to enable email sharing.");
      return;
    }

    const fileName = `${category.replace(/\s+/g, '_')}_${id.substring(0, 6)}.jpg`;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Architectural Rendering: ${category}`,
          text: `Check out this ${category} rendering I created with Architect 3D!`,
        });
      } else {
        handleDownload();
        const subject = encodeURIComponent(`Architectural Rendering: ${category}`);
        const body = encodeURIComponent(`Hello,\n\nI've attached the architectural rendering for the ${category}.\n\n(Note: If the file didn't attach automatically, please attach the recently downloaded file: ${fileName})\n\nSent via Architect 3D Home Modeler.`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      }
    } catch (err) {
      console.error("Error sharing rendering:", err);
      alert("Failed to share image. Please try downloading it manually.");
    }
  };

  const handleFileSelect = async (file: File) => {
    setFileError(null);
    if (!file.type.startsWith('image/')) {
      setFileError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    try {
      setIsProcessingFile(true);
      const processed = await processImageFile(file);
      setAttachedImage(processed);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Could not process selected image.');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditInstructions('');
    setAttachedImage(null);
    setFileError(null);
    setIsDragging(false);
  };

  const handleRefineSubmit = () => {
    if (onRefine && (editInstructions.trim() || attachedImage)) {
      onRefine(
        id, 
        editInstructions.trim(), 
        attachedImage ? { 
          base64: attachedImage.base64, 
          mimeType: attachedImage.mimeType, 
          mode: 'ai',
          fileName: attachedImage.name 
        } : undefined
      );
      handleCloseModal();
    }
  };

  const handleDirectApply = () => {
    if (!attachedImage) return;
    if (onRefine) {
      onRefine(
        id,
        editInstructions.trim(),
        {
          base64: attachedImage.base64,
          mimeType: attachedImage.mimeType,
          mode: 'direct',
          fileName: attachedImage.name,
        }
      );
    } else {
      onUpdate(id, {
        imageUrl: attachedImage.dataUrl,
        prompt: editInstructions.trim() 
          ? `${rendering.prompt} | Uploaded Image: ${editInstructions.trim()}`
          : `${rendering.prompt} | Replaced with uploaded image: ${attachedImage.name}`
      });
    }
    handleCloseModal();
  };

  return (
    <div className={`group relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-2 ${isSelected ? 'border-brand-500' : 'border-transparent'} ${isHighlighted ? 'ring-4 ring-brand-300 dark:ring-brand-500 ring-opacity-50' : ''}`}>
      <img src={imageUrl} alt={`Rendering of ${category}`} className="w-full h-64 object-cover" />
      
      <div
        role="button"
        tabIndex={0}
        onClick={() => onEnlarge(imageUrl)}
        onKeyDown={(e) => e.key === 'Enter' && onEnlarge(imageUrl)}
        className="absolute top-0 left-0 w-full h-64 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center cursor-pointer transition-all duration-300"
        aria-label={`Enlarge rendering of ${category}`}
      >
        <ZoomIn className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
         <button onClick={() => onSelectToggle(id)} className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity">
            {isSelected ? <CheckSquare className="h-5 w-5 text-brand-400"/> : <Square className="h-5 w-5"/>}
        </button>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start">
            <h4 className="font-bold text-lg">{category}</h4>
            {canEdit && (
                <button 
                    onClick={() => {
                      if (!isPremium) {
                        alert("Edit Rendering is a Premium feature. Please upgrade your account to access this service.");
                        return;
                      }
                      setIsEditModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 px-2 py-1 rounded transition-colors"
                    id={`btn-edit-rendering-${id}`}
                >
                    <Pencil className="h-3 w-3" /> Edit Rendering
                </button>
            )}
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button onClick={handleLike} className={`p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors ${liked ? 'text-red-500' : 'text-gray-400'}`}>
              <Heart className="h-5 w-5" />
            </button>
            <button onClick={handleFavorite} className={`p-2 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors ${favorited ? 'text-yellow-400' : 'text-gray-400'}`}>
              <Star className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
             <button onClick={handleDownload} disabled={!liked} className="p-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Download Image">
                <Download className="h-5 w-5" />
            </button>
            <button onClick={handleEmail} disabled={!liked} className="p-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Email Image">
                <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Rendering Modal with Image Upload / Attachment */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400">
                          <Pencil className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base leading-tight">Edit Rendering</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{category}</p>
                        </div>
                    </div>
                    <button 
                      onClick={handleCloseModal} 
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      id="btn-close-edit-modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-4">
                    {/* Visual Comparison / Current Rendering Preview */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <img 
                          src={imageUrl} 
                          alt="Current rendering" 
                          className="w-16 h-12 object-cover rounded border border-gray-200 dark:border-gray-600 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Current Rendering</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300 truncate block font-medium">{category}</span>
                        </div>
                    </div>

                    {/* Image Upload / Attachment Section */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                                <ImageIcon className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                                Attach Reference or Replacement Image
                            </label>
                            <span className="text-[11px] text-gray-400">Optional</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Upload a photo, architectural sketch, or material sample to use for this rendering.
                        </p>

                        {!attachedImage ? (
                          <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                              isDragging 
                                ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-900/30' 
                                : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500 bg-gray-50/50 dark:bg-gray-700/30'
                            }`}
                            id="dropzone-edit-rendering"
                          >
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  handleFileSelect(e.target.files[0]);
                                }
                              }} 
                              className="hidden" 
                              accept="image/*"
                              id="input-edit-rendering-file"
                            />
                            <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                              <div className="p-2 rounded-full bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400">
                                <Upload className="h-5 w-5" />
                              </div>
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
                                <span className="text-brand-600 dark:text-brand-400 font-semibold underline">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-[11px] text-gray-400">PNG, JPG, or WebP up to 10MB</p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="relative flex-shrink-0">
                                <img 
                                  src={attachedImage.dataUrl} 
                                  alt="Attached reference" 
                                  className="w-16 h-16 object-cover rounded-lg border border-brand-300 dark:border-brand-700 shadow-sm"
                                />
                                <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white rounded-full p-0.5 shadow">
                                  <Check className="h-3 w-3" />
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-200/70 dark:bg-brand-800 text-brand-800 dark:text-brand-200">
                                    Attached Image
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate mt-1">
                                  {attachedImage.name}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                  {formatFileSize(attachedImage.size)} • Ready to use
                                </p>
                              </div>
                              <button 
                                type="button"
                                onClick={() => setAttachedImage(null)}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                title="Remove attached image"
                                id="btn-remove-attached-image"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {fileError && (
                          <div className="flex items-center gap-1.5 text-xs text-red-500 mt-2">
                            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{fileError}</span>
                          </div>
                        )}
                    </div>

                    {/* Instructions Textarea */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Instructions {attachedImage ? '(Optional)' : '(Required)'}
                            </label>
                        </div>
                        <textarea 
                            value={editInstructions}
                            onChange={(e) => setEditInstructions(e.target.value)}
                            placeholder={
                              attachedImage 
                                ? "e.g., Use the texture, colors, or materials from this attached image, change the door style to match..."
                                : "e.g., Change the front door to dark mahogany wood, add vibrant purple flowers to the garden beds..."
                            }
                            className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-xs focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
                            id="textarea-edit-instructions"
                        />
                    </div>
                </div>

                <div className="p-4 border-t dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-2.5">
                    <button 
                        type="button"
                        onClick={handleCloseModal}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors order-last sm:order-first"
                        id="btn-cancel-edit"
                    >
                        Cancel
                    </button>

                    <div className="flex-1 flex flex-col sm:flex-row gap-2 justify-end">
                      {attachedImage && (
                        <button 
                            type="button"
                            onClick={handleDirectApply}
                            className="px-3.5 py-2 border border-brand-500 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            title="Directly replace the rendering with your uploaded image"
                            id="btn-direct-apply-image"
                        >
                            <Check className="h-3.5 w-3.5" />
                            Use as Rendering Image
                        </button>
                      )}

                      <button 
                          type="button"
                          onClick={handleRefineSubmit}
                          disabled={!editInstructions.trim() && !attachedImage}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                          id="btn-refine-image-submit"
                      >
                          <Wand2 className="h-3.5 w-3.5" />
                          {attachedImage ? 'Refine with AI' : 'Refine Image'}
                      </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ImageCard;
