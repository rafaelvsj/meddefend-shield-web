import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
import logging
from typing import Dict, Any
from .base_extractor import BaseExtractor

logger = logging.getLogger(__name__)

class EPUBExtractor(BaseExtractor):
    """Extract text from EPUB files using ebooklib."""
    
    async def extract(self, file_path: str, filename: str) -> Dict[str, Any]:
        """Extract text from EPUB chapters."""
        
        try:
            book = epub.read_epub(file_path)
            chapters = []
            
            # Get book title
            title = book.get_metadata('DC', 'title')
            if title:
                chapters.append(f"# {title[0][0]}")
            
            # Extract text from each chapter
            for item in book.get_items():
                if item.get_type() == ebooklib.ITEM_DOCUMENT:
                    content = item.get_body_content()
                    
                    if content:
                        # Parse HTML content
                        soup = BeautifulSoup(content, 'html.parser')
                        
                        # Remove scripts and styles
                        for script in soup(["script", "style"]):
                            script.decompose()
                        
                        # Extract text
                        text = soup.get_text()
                        
                        # Clean up text
                        lines = text.split('\n')
                        cleaned_lines = []
                        
                        for line in lines:
                            line = line.strip()
                            if line and len(line) > 3:
                                cleaned_lines.append(line)
                        
                        chapter_text = '\n'.join(cleaned_lines)
                        
                        if chapter_text:
                            chapters.append(f"## {item.get_name()}")
                            chapters.append(chapter_text)
            
            full_text = '\n\n'.join(chapters)
            
            if len(full_text.strip()) < 50:
                raise Exception("No meaningful text content found in EPUB")
            
            logger.info(f"Extracted {len(full_text)} characters from EPUB")
            
            return {
                'text': full_text,
                'method': 'ebooklib',
                'ocr_used': False
            }
            
        except Exception as e:
            logger.error(f"EPUB extraction failed: {str(e)}")
            raise Exception(f"EPUB extraction failed: {str(e)}")