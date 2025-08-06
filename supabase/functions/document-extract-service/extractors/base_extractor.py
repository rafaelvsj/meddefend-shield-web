from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseExtractor(ABC):
    """Base class for all document extractors."""
    
    @abstractmethod
    async def extract(self, file_path: str, filename: str) -> Dict[str, Any]:
        """
        Extract text from a document file.
        
        Args:
            file_path: Path to the temporary file
            filename: Original filename
            
        Returns:
            Dict with 'text', 'method', and optionally 'ocr_used'
        """
        pass