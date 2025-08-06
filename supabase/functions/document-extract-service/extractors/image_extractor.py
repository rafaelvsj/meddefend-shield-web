import pytesseract
import cv2
import numpy as np
from PIL import Image
import logging
from typing import Dict, Any
from .base_extractor import BaseExtractor

logger = logging.getLogger(__name__)

class ImageExtractor(BaseExtractor):
    """Extract text from images using OCR (tesseract)."""
    
    def preprocess_image(self, image_path: str) -> str:
        """Preprocess image for better OCR results."""
        
        # Read image
        img = cv2.imread(image_path)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply denoising
        denoised = cv2.fastNlMeansDenoising(gray)
        
        # Apply thresholding to get binary image
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Save preprocessed image
        processed_path = image_path + "_processed.png"
        cv2.imwrite(processed_path, thresh)
        
        return processed_path
    
    async def extract(self, file_path: str, filename: str) -> Dict[str, Any]:
        """Extract text from image using OCR."""
        
        try:
            # Configure tesseract for Portuguese and English
            custom_config = r'--oem 3 --psm 6 -l por+eng'
            
            # Try direct OCR first
            try:
                with Image.open(file_path) as img:
                    text = pytesseract.image_to_string(img, config=custom_config)
            except Exception as e:
                logger.warning(f"Direct OCR failed: {e}, trying preprocessing")
                
                # Preprocess and try again
                processed_path = self.preprocess_image(file_path)
                try:
                    with Image.open(processed_path) as img:
                        text = pytesseract.image_to_string(img, config=custom_config)
                finally:
                    # Clean up processed image
                    import os
                    if os.path.exists(processed_path):
                        os.unlink(processed_path)
            
            # Clean up the text
            lines = text.split('\n')
            cleaned_lines = []
            
            for line in lines:
                line = line.strip()
                if line and len(line) > 2:  # Filter out noise
                    cleaned_lines.append(line)
            
            full_text = '\n'.join(cleaned_lines)
            
            if len(full_text.strip()) < 10:
                raise Exception("OCR extracted insufficient text from image")
            
            logger.info(f"OCR extracted {len(full_text)} characters from image")
            
            return {
                'text': full_text,
                'method': 'tesseract-ocr',
                'ocr_used': True
            }
            
        except Exception as e:
            logger.error(f"Image OCR failed: {str(e)}")
            raise Exception(f"Image OCR failed: {str(e)}")