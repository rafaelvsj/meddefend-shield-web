from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import aiofiles
import tempfile
import os
import logging
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import time

# Import all extractors
from extractors.pdf_extractor import PDFExtractor
from extractors.docx_extractor import DOCXExtractor
from extractors.pptx_extractor import PPTXExtractor
from extractors.html_extractor import HTMLExtractor
from extractors.text_extractor import TextExtractor
from extractors.image_extractor import ImageExtractor
from extractors.epub_extractor import EPUBExtractor
from extractors.rtf_extractor import RTFExtractor
from extractors.similarity_calculator import SimilarityCalculator

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Universal Document Extractor",
    version="2.0.0",
    description="High-fidelity text extraction service for Knowledge Base pipeline"
)

# Enhanced CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize extractors with enhanced configuration
extractors = {
    'application/pdf': PDFExtractor(),
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': DOCXExtractor(),
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': PPTXExtractor(),
    'text/html': HTMLExtractor(),
    'text/plain': TextExtractor(),
    'image/jpeg': ImageExtractor(),
    'image/png': ImageExtractor(),
    'image/tiff': ImageExtractor(),
    'image/bmp': ImageExtractor(),
    'application/epub+zip': EPUBExtractor(),
    'application/rtf': RTFExtractor(),
}

similarity_calc = SimilarityCalculator()

def detect_mime_type(file_content: bytes, filename: str) -> str:
    """Enhanced MIME type detection with better accuracy."""
    try:
        # Magic number detection with enhanced patterns
        if file_content[:4] == b'%PDF':
            return 'application/pdf'
        elif file_content[:2] == b'PK':  # ZIP-based formats
            if filename.lower().endswith('.docx'):
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            elif filename.lower().endswith('.pptx'):
                return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            elif filename.lower().endswith('.epub'):
                return 'application/epub+zip'
        elif file_content[:3] == b'\xff\xd8\xff':
            return 'image/jpeg'
        elif file_content[:8] == b'\x89PNG\r\n\x1a\n':
            return 'image/png'
        elif file_content[:2] == b'BM':
            return 'image/bmp'
        elif file_content[:4] in [b'II*\x00', b'MM\x00*']:
            return 'image/tiff'
        elif file_content[:5] == b'{\\rtf':
            return 'application/rtf'
        elif b'<html' in file_content[:2000].lower() or b'<!doctype' in file_content[:2000].lower():
            return 'text/html'
        
        # Enhanced extension fallback
        ext = filename.lower().split('.')[-1] if '.' in filename else ''
        ext_map = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'txt': 'text/plain',
            'html': 'text/html',
            'htm': 'text/html',
            'rtf': 'application/rtf',
            'epub': 'application/epub+zip',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'tiff': 'image/tiff',
            'tif': 'image/tiff',
            'bmp': 'image/bmp'
        }
        
        return ext_map.get(ext, 'application/octet-stream')
    except Exception as e:
        logger.warning(f"MIME detection error: {e}")
        return 'application/octet-stream'

def convert_to_markdown(text: str, filename: str) -> str:
    """Enhanced markdown conversion with better structure preservation."""
    if not text.strip():
        return ""
    
    lines = text.split('\n')
    markdown_lines = []
    
    # Add document title from filename
    title = filename.replace('_', ' ').replace('-', ' ')
    if '.' in title:
        title = title.rsplit('.', 1)[0]
    markdown_lines.append(f"# {title}\n")
    
    # Process lines with enhanced patterns
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            markdown_lines.append("")
            continue
            
        # Enhanced header detection
        if len(line) < 150 and (
            line.isupper() or 
            line.endswith(':') or
            any(word in line.lower() for word in [
                'capítulo', 'seção', 'item', 'artigo', 'anexo', 'apêndice',
                'introdução', 'conclusão', 'resumo', 'abstract', 'título'
            ]) or
            # Check if line looks like a numbered section
            (len(line.split()) <= 8 and any(char.isdigit() for char in line[:5]))
        ):
            # Determine header level
            if any(word in line.lower() for word in ['capítulo', 'chapter']):
                markdown_lines.append(f"# {line}")
            elif any(word in line.lower() for word in ['seção', 'section']):
                markdown_lines.append(f"## {line}")
            else:
                markdown_lines.append(f"### {line}")
        
        # Enhanced list detection
        elif (line.startswith(('•', '-', '*', '◦', '▪', '▫')) or 
              (len(line) > 2 and line[1] in '.)' and line[0].isdigit()) or
              (len(line) > 3 and line[2] in '.)' and line[:2].isdigit())):
            # Clean list marker and add markdown format
            cleaned = line.lstrip('•-*◦▪▫ ')
            if line[0].isdigit():
                # Numbered list
                number = ''.join(filter(str.isdigit, line.split()[0]))
                content = line.split(')', 1)[-1].split('.', 1)[-1].strip()
                markdown_lines.append(f"{number}. {content}")
            else:
                # Bulleted list
                markdown_lines.append(f"- {cleaned}")
        
        # Regular paragraph
        else:
            markdown_lines.append(line)
    
    return '\n'.join(markdown_lines)

@app.get("/health")
async def health_check():
    """Enhanced health check with extractor status."""
    extractor_status = {}
    for mime_type, extractor in extractors.items():
        try:
            extractor_status[mime_type] = "ready"
        except Exception as e:
            extractor_status[mime_type] = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "service": "universal-document-extractor",
        "version": "2.0.0",
        "supported_formats": list(extractors.keys()),
        "extractor_status": extractor_status,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/extract")
async def extract_document(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Universal document extraction with high fidelity and structured logging.
    
    Returns:
    - success: bool
    - original_text: str
    - markdown: str
    - similarity: float (0.0-1.0)
    - extraction_method: str
    - ocr_used: bool
    - mime_type: str
    - processing_time: float (seconds)
    - metadata: dict
    """
    
    start_time = time.time()
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    logger.info(f"[EXTRACT] Starting extraction for: {file.filename}")
    
    try:
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        logger.info(f"[EXTRACT] File size: {file_size} bytes")
        
        # Enhanced MIME type detection
        mime_type = detect_mime_type(file_content, file.filename)
        logger.info(f"[EXTRACT] Detected MIME type: {mime_type}")
        
        # Validate supported format
        if mime_type not in extractors:
            logger.error(f"[EXTRACT] Unsupported format: {mime_type}")
            raise HTTPException(
                status_code=415, 
                detail=f"Unsupported file type: {mime_type}. Supported: {list(extractors.keys())}"
            )
        
        # Save to temporary file with proper naming
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp_file:
            tmp_file.write(file_content)
            tmp_file_path = tmp_file.name
        
        try:
            logger.info(f"[EXTRACT] Using extractor: {extractors[mime_type].__class__.__name__}")
            
            # Extract text using appropriate extractor
            extractor = extractors[mime_type]
            extraction_result = await extractor.extract(tmp_file_path, file.filename)
            
            original_text = extraction_result['text']
            extraction_method = extraction_result['method']
            ocr_used = extraction_result.get('ocr_used', False)
            
            logger.info(f"[EXTRACT] Extracted {len(original_text)} characters using {extraction_method}")
            
            if ocr_used:
                logger.info(f"[EXTRACT] OCR was used for text extraction")
            
            # Enhanced markdown conversion
            markdown_content = convert_to_markdown(original_text, file.filename)
            
            # Calculate high-precision similarity
            similarity_score = similarity_calc.calculate_similarity(
                original_text, 
                markdown_content
            )
            
            processing_time = time.time() - start_time
            
            logger.info(f"[EXTRACT] Processing complete: similarity={similarity_score:.4f}, time={processing_time:.2f}s")
            
            # Prepare comprehensive response
            response = {
                'success': True,
                'original_text': original_text,
                'markdown': markdown_content,
                'similarity': similarity_score,
                'extraction_method': extraction_method,
                'ocr_used': ocr_used,
                'mime_type': mime_type,
                'processing_time': processing_time,
                'metadata': {
                    'filename': file.filename,
                    'file_size': file_size,
                    'text_length': len(original_text),
                    'markdown_length': len(markdown_content),
                    'extractor_class': extractor.__class__.__name__,
                    'extraction_timestamp': datetime.utcnow().isoformat()
                }
            }
            
            # Log success metrics
            logger.info(f"[EXTRACT] SUCCESS: {file.filename} -> {len(original_text)} chars, {similarity_score:.4f} similarity")
            
            return response
            
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        processing_time = time.time() - start_time
        error_msg = f"Extraction failed for {file.filename}: {str(e)}"
        
        logger.error(f"[EXTRACT] ERROR: {error_msg} (time: {processing_time:.2f}s)")
        logger.exception("Full error traceback:")
        
        raise HTTPException(
            status_code=500, 
            detail={
                "error": error_msg,
                "processing_time": processing_time,
                "file_size": len(file_content) if 'file_content' in locals() else 0
            }
        )

@app.get("/formats")
async def list_supported_formats():
    """List all supported file formats with their extractors."""
    formats = {}
    for mime_type, extractor in extractors.items():
        formats[mime_type] = {
            "extractor": extractor.__class__.__name__,
            "description": getattr(extractor, 'description', 'No description available')
        }
    
    return {
        "supported_formats": formats,
        "total_count": len(formats)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )