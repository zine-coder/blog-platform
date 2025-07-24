import React, { useState, useRef } from 'react';
import { Image, X, Upload, Loader2 } from 'lucide-react';
import { uploadAPI, authAPI } from '../../services/api';

interface ProfileImageUploadProps {
  type: 'profile' | 'banner';
  currentImageUrl?: string;
  onSuccess: (imageUrl: string) => void;
  onCancel: () => void;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({ 
  type, 
  currentImageUrl = '', 
  onSuccess, 
  onCancel 
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProfile = type === 'profile';
  const title = isProfile ? 'Profile Picture' : 'Banner Image';
  const description = isProfile 
    ? 'Upload a square image for your profile picture.' 
    : 'Upload a wide image for your profile banner.';
  const maxSize = 5 * 1024 * 1024; // 5MB

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
      setError('Only image files (JPEG, PNG, GIF) are allowed');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);
    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null); // Set to null instead of currentImageUrl to indicate removal
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!imageFile && imagePreview === null) {
      // If no file is selected and preview is null, it means we want to remove the image
      setUploading(true);
      setError('');
      
      try {
        // Update the user profile with empty string to remove the image
        if (isProfile) {
          await authAPI.updateProfileImage('');
        } else {
          await authAPI.updateBannerImage('');
        }
        
        // Notify parent component of success with empty string
        onSuccess('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error removing image');
      } finally {
        setUploading(false);
      }
      return;
    }
    
    if (!imageFile) return;
    
    setUploading(true);
    setError('');
    
    try {
      // Upload the image to Cloudinary
      const result = await uploadAPI.uploadImage(imageFile);
      
      // Update the user profile with the new image URL
      if (isProfile) {
        await authAPI.updateProfileImage(result.imageUrl);
      } else {
        await authAPI.updateBannerImage(result.imageUrl);
      }
      
      // Set the image preview to the uploaded image URL for immediate feedback
      setImagePreview(result.imageUrl);
      
      // Notify parent component of success
      onSuccess(result.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      <div className={`mb-6 ${isProfile ? 'aspect-square' : 'aspect-[3/1]'} relative`}>
        {imagePreview ? (
          <div className="relative w-full h-full">
            <img 
              src={imagePreview} 
              alt={title}
              className={`w-full h-full object-cover ${isProfile ? 'rounded-full' : 'rounded-lg'}`}
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors flex items-center"
              title={`Remove ${isProfile ? 'profile' : 'banner'} image`}
            >
              <X size={18} />
              <span className="ml-1 text-xs font-medium"></span>
            </button>
          </div>
        ) : (
          <div 
            className={`w-full h-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center ${isProfile ? 'rounded-full' : 'rounded-lg'}`}
          >
            <Image className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">No image selected</p>
          </div>
        )}
      </div>
      
      <div className="flex flex-col space-y-4">
        <label className="flex flex-col items-center px-4 py-2 bg-white text-blue-600 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors">
          <div className="flex items-center">
            <Upload size={16} className="mr-2" />
            <span>Select Image</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg, image/png, image/gif"
            onChange={handleImageChange}
          />
        </label>
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={(!imageFile && imagePreview !== null) || uploading}
            className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                <span>Uploading...</span>
              </>
            ) : imagePreview === null && currentImageUrl ? (
              <span>Remove Image</span>
            ) : (
              <span>Upload</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileImageUpload; 