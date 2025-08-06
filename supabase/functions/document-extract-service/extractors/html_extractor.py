from bs4 import BeautifulSoup
import logging
from typing import Dict, Any
from .base_extractor import BaseExtractor

logger = logging.getLogger(__name__)

class HTMLExtractor(BaseExtractor):
    """Extract text from HTML files using BeautifulSoup."""
    
    async def extract(self, file_path: str, filename: str) -> Dict[str, Any]:
        """Extract clean text from HTML."""
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                html_content = file.read()
            
            soup = BeautifulSoup(html_content, 'lxml')
            
            # Remove script and style elements
            for script in soup(["script", "style", "meta", "link"]):
                script.decompose()
            
            # Extract text with structure
            text_parts = []
            
            # Extract title
            title = soup.find('title')
            if title and title.text.strip():
                text_parts.append(f"# {title.text.strip()}")
            
            # Extract headings and content
            for element in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'article', 'section']):
                text = element.get_text(strip=True)
                if text and len(text) > 3:
                    if element.name.startswith('h'):
                        level = int(element.name[1])
                        text_parts.append('#' * (level + 1) + f" {text}")
                    else:
                        text_parts.append(text)
            
            # Extract lists
            for ul in soup.find_all(['ul', 'ol']):
                for li in ul.find_all('li'):
                    text = li.get_text(strip=True)
                    if text:
                        text_parts.append(f"- {text}")
            
            # Extract tables
            for table in soup.find_all('table'):
                for row in table.find_all('tr'):
                    cells = row.find_all(['td', 'th'])
                    if cells:
                        row_text = " | ".join([cell.get_text(strip=True) for cell in cells])
                        if row_text.strip():
                            text_parts.append(row_text)
            
            full_text = "\n\n".join(text_parts)
            
            if len(full_text.strip()) < 10:
                raise Exception("No meaningful text content found in HTML")
            
            logger.info(f"Extracted {len(full_text)} characters from HTML")
            
            return {
                'text': full_text,
                'method': 'beautifulsoup',
                'ocr_used': False
            }
            
        except Exception as e:
            logger.error(f"HTML extraction failed: {str(e)}")
            raise Exception(f"HTML extraction failed: {str(e)}")