import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Trash2, Camera, Check, AlertCircle, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl?: string;
  userName: string;
  onSavePhoto: (newPhotoUrl: string) => void;
  onRemovePhoto: () => void;
}

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({
  isOpen,
  onClose,
  currentPhotoUrl,
  userName,
  onSavePhoto,
  onRemovePhoto
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setZoom(1);
      setErrorMsg(null);
      setShowRemoveConfirm(false);
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (JPG/JPEG, PNG, WEBP)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMsg('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    // Validate max file size (5 MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg('Image must be smaller than 5 MB.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewUrl(result);

      // Preload image object for canvas rendering
      const img = new Image();
      img.src = result;
      img.onload = () => {
        imageRef.current = img;
      };
    };
    reader.readAsDataURL(file);
  };

  // Draw Cropped Circular / Square Image to Canvas
  const handleSave = () => {
    if (!previewUrl) return;

    setIsProcessing(true);
    setTimeout(() => {
      try {
        const canvas = canvasRef.current || document.createElement('canvas');
        const size = 350; // High resolution square avatar
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (ctx && imageRef.current) {
          const img = imageRef.current;
          ctx.clearRect(0, 0, size, size);

          // Calculate aspect ratio crop
          const minDim = Math.min(img.width, img.height);
          const sourceWidth = minDim / zoom;
          const sourceHeight = minDim / zoom;
          const sourceX = (img.width - sourceWidth) / 2;
          const sourceY = (img.height - sourceHeight) / 2;

          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            size,
            size
          );

          const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          onSavePhoto(croppedDataUrl);
          onClose();
        } else if (previewUrl) {
          onSavePhoto(previewUrl);
          onClose();
        }
      } catch {
        setErrorMsg("Couldn't update your profile photo. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    }, 400);
  };

  const handleConfirmRemove = () => {
    onRemovePhoto();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-orange-400/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md bg-[#0a0a0a] border border-orange-400/25 rounded-3xl shadow-2xl p-6 overflow-hidden z-10 text-white">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-extrabold text-white">Profile Photo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Hidden Canvas for Cropping */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Error Notification Banner */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Content Body */}
        {!showRemoveConfirm ? (
          <div className="py-6 space-y-6">
            
            {/* Photo Preview / Crop Display */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative group">
                <div className="w-36 h-36 rounded-full p-1 bg-gradient-to-tr from-orange-400 via-amber-400 to-rose-400 shadow-xl overflow-hidden flex items-center justify-center">
                  <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950 flex items-center justify-center relative">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        style={{ transform: `scale(${zoom})` }}
                        className="w-full h-full object-cover transition-transform duration-100"
                      />
                    ) : (
                      <UserAvatar
                        name={userName}
                        src={currentPhotoUrl}
                        size="2xl"
                        className="w-full h-full text-2xl"
                      />
                    )}
                  </div>
                </div>

                {/* Overlay Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2.5 rounded-full bg-orange-400 text-zinc-950 shadow-lg border-2 border-zinc-950 hover:scale-105 active:scale-95 transition-all"
                  title="Choose new photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-400 font-medium">
                {previewUrl ? 'Adjust photo frame before saving' : 'JPG, PNG or WEBP (Max 5 MB)'}
              </p>
            </div>

            {/* Zoom / Scale Controls if image selected */}
            {previewUrl && (
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-amber-300">Zoom & Framing</span>
                  <span className="font-mono text-zinc-400">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-4 h-4 text-zinc-500" />
                  <input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-orange-400 cursor-pointer"
                  />
                  <ZoomIn className="w-4 h-4 text-zinc-500" />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {previewUrl ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                      setZoom(1);
                    }}
                    className="flex-1 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs border border-zinc-800 transition-all"
                  >
                    Cancel Selection
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isProcessing}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 text-zinc-950 font-extrabold text-xs shadow-md shadow-orange-400/15 hover:brightness-105 transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Photo</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 text-zinc-950 font-extrabold text-xs shadow-md shadow-orange-400/15 hover:brightness-105 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload New Photo</span>
                  </button>

                  {currentPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setShowRemoveConfirm(true)}
                      className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Profile Photo</span>
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Remove Photo Confirmation State */
          <div className="py-6 space-y-5 text-center animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-white">Remove your profile photo?</h4>
              <p className="text-xs text-zinc-400">
                Your account photo will revert to your default initials avatar.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRemoveConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs border border-zinc-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs transition-all shadow-md shadow-rose-500/20"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <p className="pt-3 border-t border-zinc-900 text-[10px] text-center text-zinc-500">
          Only visible on your verified Eventra account & tickets.
        </p>

      </div>
    </div>
  );
};
