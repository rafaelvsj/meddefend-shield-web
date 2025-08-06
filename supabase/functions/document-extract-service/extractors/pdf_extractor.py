import pdfplumber
import logging
from typing import Dict, Any
from .base_extractor import BaseExtractor

logger = logging.getLogger(__name__)

class PDFExtractor(BaseExtractor):
    """Extract text from PDF files using pdfplumber."""
    
    async def extract(self, file_path: str, filename: str) -> Dict[str, Any]:
        """Extract text from PDF using pdfplumber."""
        
        try:
            text_content = []
            
            with pdfplumber.open(file_path) as pdf:
                logger.info(f"PDF has {len(pdf.pages)} pages")
                
                for page_num, page in enumerate(pdf.pages, 1):
                    # Extract text from page
                    page_text = page.extract_text()
                    
                    if page_text:
                        text_content.append(f"--- Página {page_num} ---\n{page_text}")
                    
                    # Try to extract tables if text extraction was poor
                    if not page_text or len(page_text.strip()) < 50:
                        tables = page.extract_tables()
                        if tables:
                            for table in tables:
                                table_text = "\n".join([
                                    " | ".join([cell or "" for cell in row])
                                    for row in table if row
                                ])
                                text_content.append(f"--- Tabela Página {page_num} ---\n{table_text}")
            
            full_text = "\n\n".join(text_content)
            
            if len(full_text.strip()) < 50:
                raise Exception("Insufficient text extracted from PDF")
            
            logger.info(f"Extracted {len(full_text)} characters from PDF")
            
            return {
                'text': full_text,
                'method': 'pdfplumber',
                'ocr_used': False
            }
            
        except Exception as e:
            logger.error(f"PDF extraction failed: {str(e)}")
            raise Exception(f"PDF extraction failed: {str(e)}")