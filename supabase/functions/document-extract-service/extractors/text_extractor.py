import logging
from typing import Dict, Any
from .base_extractor import BaseExtractor

logger = logging.getLogger(__name__)

class TextExtractor(BaseExtractor):
    """Extract text from plain text files."""
    
    async def extract(self, file_path: str, filename: str) -> Dict[str, Any]:
        """Extract text from plain text file with encoding detection."""
        
        try:
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
            content = None
            
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as file:
                        content = file.read()
                    break
                except UnicodeDecodeError:
                    continue
            
            if content is None:
                # Last resort: read as binary and decode with errors='ignore'
                with open(file_path, 'rb') as file:
                    content = file.read().decode('utf-8', errors='ignore')
            
            if len(content.strip()) < 5:
                raise Exception("File appears to be empty or contains no readable text")
            
            logger.info(f"Extracted {len(content)} characters from text file")
            
            return {
                'text': content,
                'method': 'plain-text',
                'ocr_used': False
            }
            
        except Exception as e:
            logger.error(f"Text extraction failed: {str(e)}")
            raise Exception(f"Text extraction failed: {str(e)}")