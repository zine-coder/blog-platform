import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI, uploadAPI } from '../../services/api';
import { Save, ArrowLeft, Loader2, X, Image, Hash, Plus, MoveUp, MoveDown, Trash } from 'lucide-react';

interface ParagraphBlock {
  text: string;
  image: string | null;
}

const CreatePost: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<ParagraphBlock[]>([{ text: '', image: null }]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const paragraphFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const navigate = useNavigate();

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
      setError('Only image files (JPEG, PNG, GIF) are allowed');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setMainImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMainImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadMainImage = async () => {
    if (!mainImageFile) return;
    
    setUploadingImage(true);
    setError('');
    
    try {
      const result = await uploadAPI.uploadImage(mainImageFile);
      setMainImageUrl(result.imageUrl);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveMainImage = () => {
    setMainImageFile(null);
    setMainImagePreview(null);
    setMainImageUrl('');
    if (mainFileInputRef.current) {
      mainFileInputRef.current.value = '';
    }
  };

  const handleParagraphImageChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
      setError('Only image files (JPEG, PNG, GIF) are allowed');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Upload image immediately
    try {
      setUploadingImage(true);
      const result = await uploadAPI.uploadImage(file);
      
      // Update the paragraph with the new image URL
      const updatedContent = [...content];
      updatedContent[index] = {
        ...updatedContent[index],
        image: result.imageUrl
      };
      setContent(updatedContent);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveParagraphImage = (index: number) => {
    const updatedContent = [...content];
    updatedContent[index] = {
      ...updatedContent[index],
      image: null
    };
    setContent(updatedContent);
    
    // Reset file input
    if (paragraphFileInputRefs.current[index]) {
      paragraphFileInputRefs.current[index]!.value = '';
    }
  };

  const handleParagraphTextChange = (index: number, text: string) => {
    const updatedContent = [...content];
    updatedContent[index] = {
      ...updatedContent[index],
      text
    };
    setContent(updatedContent);
  };

  const addParagraph = () => {
    setContent([...content, { text: '', image: null }]);
  };

  const removeParagraph = (index: number) => {
    if (content.length <= 1) {
      return; // Keep at least one paragraph
    }
    
    const updatedContent = [...content];
    updatedContent.splice(index, 1);
    setContent(updatedContent);
  };

  const moveParagraphUp = (index: number) => {
    if (index === 0) return;
    
    const updatedContent = [...content];
    const temp = updatedContent[index];
    updatedContent[index] = updatedContent[index - 1];
    updatedContent[index - 1] = temp;
    setContent(updatedContent);
  };

  const moveParagraphDown = (index: number) => {
    if (index === content.length - 1) return;
    
    const updatedContent = [...content];
    const temp = updatedContent[index];
    updatedContent[index] = updatedContent[index + 1];
    updatedContent[index + 1] = temp;
    setContent(updatedContent);
  };

  const handleAddHashtag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      
      // Remove # if present and trim whitespace
      let tag = hashtagInput.trim();
      if (tag.startsWith('#')) {
        tag = tag.substring(1);
      }
      
      // Validate tag
      if (tag && !hashtags.includes(tag) && hashtags.length < 5) {
        setHashtags([...hashtags, tag]);
        setHashtagInput('');
      }
    }
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    // Validate content
    const validContent = content.filter(paragraph => paragraph.text.trim() !== '');
    if (validContent.length === 0) {
      setError('At least one paragraph with content is required');
      return;
    }

    // Upload main image first if not already uploaded
    if (mainImageFile && !mainImageUrl) {
      await handleUploadMainImage();
    }

    setLoading(true);

    try {
      // Create post with new content structure
      await postsAPI.createPost(
        title.trim(),
        validContent.map(p => p.text).join('\n\n'), // For backward compatibility
        mainImageUrl,
        hashtags,
        validContent
      );
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 group"
        >
          <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Articles</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h1 className="text-2xl font-bold text-gray-900">Create New Article</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-medium">{error}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Article Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Give your article a catchy title..."
                required
              />
            </div>

            {/* Main Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image
              </label>
              
              {!mainImagePreview ? (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <Image className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="main-image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload an image</span>
                        <input
                          id="main-image-upload"
                          ref={mainFileInputRef}
                          name="image"
                          type="file"
                          accept="image/jpeg, image/png, image/gif"
                          className="sr-only"
                          onChange={handleMainImageChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-1 relative">
                  <div className="relative">
                    <img 
                      src={mainImagePreview} 
                      alt="Preview" 
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveMainImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  {!mainImageUrl && (
                    <button
                      type="button"
                      onClick={handleUploadMainImage}
                      disabled={uploadingImage}
                      className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <span>Upload Image</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Article Content - Paragraphs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Article Content
              </label>
              
              <div className="space-y-6">
                {content.map((paragraph, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">Paragraph {index + 1}</span>
                      <div className="flex space-x-2">
                        <button 
                          type="button"
                          onClick={() => moveParagraphUp(index)}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                          title="Move up"
                        >
                          <MoveUp size={16} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => moveParagraphDown(index)}
                          disabled={index === content.length - 1}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                          title="Move down"
                        >
                          <MoveDown size={16} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => removeParagraph(index)}
                          disabled={content.length <= 1}
                          className="p-1 rounded hover:bg-red-100 text-red-500 disabled:opacity-50"
                          title="Remove paragraph"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                    
              <textarea
                      value={paragraph.text}
                      onChange={(e) => handleParagraphTextChange(index, e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical transition-colors mb-3"
                      placeholder="Write your paragraph here..."
                    />
                    
                    {/* Paragraph Image */}
                    {paragraph.image ? (
                      <div className="relative mt-2">
                        <img 
                          src={paragraph.image} 
                          alt={`Paragraph ${index + 1} image`} 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveParagraphImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <label htmlFor={`paragraph-image-${index}`} className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                          <Image size={16} className="mr-2" />
                          Add Image to Paragraph
                          <input
                            id={`paragraph-image-${index}`}
                            type="file"
                            accept="image/jpeg, image/png, image/gif"
                            className="sr-only"
                            ref={el => paragraphFileInputRefs.current[index] = el}
                            onChange={(e) => handleParagraphImageChange(index, e)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addParagraph}
                  className="flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
                >
                  <Plus size={16} className="mr-2" />
                  <span>Add Paragraph</span>
                </button>
              </div>
            </div>

            {/* Hashtags Section */}
            <div>
              <label htmlFor="hashtags" className="block text-sm font-medium text-gray-700 mb-2">
                Hashtags (up to 5)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {hashtags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    #{tag}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveHashtag(tag)}
                      className="ml-1 text-blue-400 hover:text-blue-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="hashtags"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={handleAddHashtag}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Add hashtags (press Enter or comma to add)"
                  disabled={hashtags.length >= 5}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {hashtags.length}/5 hashtags added. Press Enter or comma to add a hashtag.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (mainImageFile && !mainImageUrl && !uploadingImage) || uploadingImage || !title.trim() || content.every(p => !p.text.trim())}
              className="flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Publish Article</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;