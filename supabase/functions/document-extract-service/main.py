from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import aiofiles
import tempfile
import os
import logging
from typing import Dict, Any
from extractors.pdf_extractor import PDFExtractor
from extractors.docx_extractor import DOCXExtractor
from extractors.pptx_extractor import PPTXExtractor
from extractors.html_extractor import HTMLExtractor
from extractors.text_extractor import TextExtractor
from extractors.image_extractor import ImageExtractor
from extractors.epub_extractor import EPUBExtractor
from extractors.rtf_extractor import RTFExtractor
from extractors.similarity_calculator import SimilarityCalculator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Universal Document Extractor", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize extractors
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
    """Detect MIME type from file content and filename."""
    # Magic number detection
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
    elif file_content[:4] == b'II*\x00' or file_content[:4] == b'MM\x00*':
        return 'image/tiff'
    elif file_content[:5] == b'{\\rtf':
        return 'application/rtf'
    elif b'<html' in file_content[:1000].lower() or b'<!doctype' in file_content[:1000].lower():
        return 'text/html'
    
    # Fallback to extension
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

def convert_to_markdown(text: str, filename: str) -> str:
    """Convert extracted text to markdown format."""
    if not text.strip():
        return ""
    
    lines = text.split('\n')
    markdown_lines = []
    
    # Add title from filename
    title = filename.replace('_', ' ').replace('-', ' ')
    if '.' in title:
        title = title.rsplit('.', 1)[0]
    markdown_lines.append(f"# {title}\n")
    
    for line in lines:
        line = line.strip()
        if not line:
            markdown_lines.append("")
            continue
            
        # Detect headers (lines with certain patterns)
        if len(line) < 100 and (
            line.isupper() or 
            line.endswith(':') or
            any(word in line.lower() for word in ['capítulo', 'seção', 'item', 'artigo'])
        ):
            markdown_lines.append(f"## {line}")
        # Detect list items
        elif line.startswith(('•', '-', '*')) or (len(line) > 2 and line[1] in '.)' and line[0].isdigit()):
            markdown_lines.append(f"- {line.lstrip('•-* ')}")
        else:
            markdown_lines.append(line)
    
    return '\n'.join(markdown_lines)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "document-extractor"}

@app.post("/extract")
async def extract_document(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Extract text from uploaded document and convert to markdown."""
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Detect MIME type
        mime_type = detect_mime_type(file_content, file.filename)
        logger.info(f"Processing {file.filename} as {mime_type}")
        
        # Check if we have an extractor for this type
        if mime_type not in extractors:
            raise HTTPException(
                status_code=415, 
                detail=f"Unsupported file type: {mime_type}"
            )
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp_file:
            tmp_file.write(file_content)
            tmp_file_path = tmp_file.name
        
        try:
            # Extract text using appropriate extractor
            extractor = extractors[mime_type]
            extraction_result = await extractor.extract(tmp_file_path, file.filename)
            
            # Convert to markdown
            markdown_content = convert_to_markdown(extraction_result['text'], file.filename)
            
            # Calculate similarity
            similarity_score = similarity_calc.calculate_similarity(
                extraction_result['text'], 
                markdown_content
            )
            
            logger.info(f"Extraction complete: {len(extraction_result['text'])} chars, similarity: {similarity_score:.4f}")
            
            return {
                'success': True,
                'original_text': extraction_result['text'],
                'markdown': markdown_content,
                'similarity': similarity_score,
                'extraction_method': extraction_result['method'],
                'ocr_used': extraction_result.get('ocr_used', False),
                'mime_type': mime_type,
                'metadata': {
                    'filename': file.filename,
                    'file_size': len(file_content),
                    'text_length': len(extraction_result['text']),
                    'markdown_length': len(markdown_content)
                }
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                
    except Exception as e:
        logger.error(f"Extraction failed for {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)