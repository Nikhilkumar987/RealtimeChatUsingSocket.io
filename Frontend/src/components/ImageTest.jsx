import { useState } from "react";
import { Image, X } from "lucide-react";

const ImageTest = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const [showTest, setShowTest] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    console.log("Test - File selected:", file);
    
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      console.log("Test - Invalid file type:", file.type);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      console.log("Test - File read successfully");
      setImagePreview(reader.result);
    };
    reader.onerror = () => {
      console.error("Test - Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  if (!showTest) {
    return (
      <button
        onClick={() => setShowTest(true)}
        className="fixed bottom-32 right-4 z-50 bg-purple-800 text-white p-2 rounded-full shadow-lg hover:bg-purple-700"
        title="Test Image Upload"
      >
        <Image className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-32 right-4 z-50 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Image Test</h3>
        <button
          onClick={() => setShowTest(false)}
          className="text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="file-input file-input-bordered file-input-sm w-full"
        />
        
        {imagePreview && (
          <div className="mt-2">
            <p className="text-sm text-gray-400 mb-2">Preview:</p>
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-32 object-cover rounded"
            />
            <p className="text-xs text-gray-400 mt-1">
              Data URL length: {imagePreview.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageTest;