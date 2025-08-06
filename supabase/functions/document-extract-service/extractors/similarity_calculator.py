import re
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
import logging

logger = logging.getLogger(__name__)

class SimilarityCalculator:
    """Calculate similarity between original text and markdown conversion."""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            stop_words=None,  # Keep all words for medical documents
            ngram_range=(1, 2),
            max_features=5000
        )
    
    def normalize_text(self, text: str) -> str:
        """Normalize text for comparison."""
        # Convert to lowercase
        text = text.lower()
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove markdown syntax for comparison
        text = re.sub(r'[#*`\-_]', '', text)
        
        # Remove page markers and headers
        text = re.sub(r'--- (página|slide|tabela) \d+ ---', '', text)
        
        return text.strip()
    
    def levenshtein_distance(self, s1: str, s2: str) -> int:
        """Calculate Levenshtein distance between two strings."""
        if len(s1) > len(s2):
            s1, s2 = s2, s1
        
        distances = range(len(s1) + 1)
        for i2, c2 in enumerate(s2):
            distances_ = [i2 + 1]
            for i1, c1 in enumerate(s1):
                if c1 == c2:
                    distances_.append(distances[i1])
                else:
                    distances_.append(1 + min((distances[i1], distances[i1 + 1], distances_[-1])))
            distances = distances_
        return distances[-1]
    
    def calculate_similarity(self, original_text: str, markdown_text: str) -> float:
        """
        Calculate similarity between original and markdown text.
        Returns a score between 0 and 1, where 1 is perfect similarity.
        """
        try:
            # Normalize both texts
            norm_original = self.normalize_text(original_text)
            norm_markdown = self.normalize_text(markdown_text)
            
            if not norm_original or not norm_markdown:
                return 0.0
            
            # Calculate Levenshtein similarity
            max_len = max(len(norm_original), len(norm_markdown))
            if max_len == 0:
                return 1.0
            
            lev_distance = self.levenshtein_distance(norm_original, norm_markdown)
            lev_similarity = 1 - (lev_distance / max_len)
            
            # Calculate TF-IDF cosine similarity
            try:
                vectors = self.vectorizer.fit_transform([norm_original, norm_markdown])
                cosine_sim = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
            except Exception as e:
                logger.warning(f"TF-IDF similarity calculation failed: {e}")
                cosine_sim = lev_similarity  # Fallback to Levenshtein
            
            # Combine both similarities (weighted average)
            final_similarity = (0.6 * lev_similarity + 0.4 * cosine_sim)
            
            # Ensure the score is between 0 and 1
            final_similarity = max(0.0, min(1.0, final_similarity))
            
            logger.info(f"Similarity scores - Levenshtein: {lev_similarity:.4f}, Cosine: {cosine_sim:.4f}, Final: {final_similarity:.4f}")
            
            return final_similarity
            
        except Exception as e:
            logger.error(f"Similarity calculation failed: {e}")
            # Return a conservative similarity score
            return 0.5