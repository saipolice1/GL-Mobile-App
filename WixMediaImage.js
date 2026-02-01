import { media as wixMedia } from "@wix/sdk";

function getImageUrlForMedia(media, width, height) {
  // Handle null/undefined
  if (!media) {
    return 'https://via.placeholder.com/300';
  }
  
  // If it's already a valid HTTP URL, return it
  if (typeof media === 'string' && media.startsWith('http')) {
    return media;
  }
  
  // If it's a wix:image:// URL, try to convert it
  try {
    const result = wixMedia.getScaledToFillImageUrl(media, width, height, {});
    // Verify it's a valid URL
    if (result && result.startsWith('http')) {
      return result;
    }
    return 'https://via.placeholder.com/300';
  } catch (error) {
    console.log('Image URL conversion error:', error);
    return 'https://via.placeholder.com/300';
  }
}

export function WixMediaImage({ media, height = 320, width = 640, children }) {
  const url = getImageUrlForMedia(media || "", width, height);
  return children({ url });
}
