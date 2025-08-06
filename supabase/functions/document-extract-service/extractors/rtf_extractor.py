import subprocess
import tempfile
import os
import logging
from typing import Dict, Any
from .base_extractor import BaseExtractor

logger = logging.getLogger(__name__)

class RTFExtractor(BaseExtractor):
    """Extract text from RTF files using pandoc."""
    
    async def extract(self, file_path: str, filename: str) -> Dict[str, Any]:
        """Extract text from RTF using pandoc."""
        
        try:
            # Use pandoc to convert RTF to plain text
            result = subprocess.run([
                'pandoc', file_path, '-t', 'plain', '--wrap=none'
            ], capture_output=True, text=True, encoding='utf-8')
            
            if result.returncode != 0:
                raise Exception(f"Pandoc failed: {result.stderr}")
            
            text = result.stdout
            
            # Clean up the text
            lines = text.split('\n')
            cleaned_lines = []
            
            for line in lines:
                line = line.strip()
                if line:
                    cleaned_lines.append(line)
            
            full_text = '\n'.join(cleaned_lines)
            
            if len(full_text.strip()) < 10:
                raise Exception("No meaningful text content found in RTF")
            
            logger.info(f"Extracted {len(full_text)} characters from RTF")
            
            return {
                'text': full_text,
                'method': 'pandoc',
                'ocr_used': False
            }
            
        except Exception as e:
            logger.error(f"RTF extraction failed: {str(e)}")
            
            # Fallback: try simple text extraction
            try:
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                # Simple RTF parsing (very basic)
                text = content.decode('latin-1', errors='ignore')
                
                # Remove RTF control words
                import re
                text = re.sub(r'\\[a-z]+\d*\s?', ' ', text)
                text = re.sub(r'[{}]', ' ', text)
                text = re.sub(r'\s+', ' ', text)
                
                if len(text.strip()) < 10:
                    raise Exception("Fallback RTF extraction also failed")
                
                logger.info(f"Extracted {len(text)} characters from RTF using fallback")
                
                return {
                    'text': text,
                    'method': 'rtf-fallback',
                    'ocr_used': False
                }
                
            except Exception as fallback_error:
                raise Exception(f"RTF extraction failed: {str(e)}, Fallback also failed: {str(fallback_error)}")