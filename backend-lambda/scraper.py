"""
Web scraping functionality using Firecrawl API
"""

import os
import logging
from typing import Dict, Any, Optional
from firecrawl import FirecrawlApp

logger = logging.getLogger(__name__)

# Initialize Firecrawl client outside handler for connection reuse
api_key = os.getenv('FIRECRAWL_API_KEY')
firecrawl_client = FirecrawlApp(api_key=api_key) if api_key else None
logger.info(f"Firecrawl client initialized at module level: {id(firecrawl_client)}")


def scrape_with_firecrawl(url: str) -> Optional[Dict[str, Any]]:
    """
    Scrape job page using Firecrawl API
    """
    try:
        logger.info(f"Scraping URL with Firecrawl: {url}")
        logger.info(f"Using Firecrawl client ID: {id(firecrawl_client)}")

        # Check if client is initialized
        if not firecrawl_client:
            logger.error("FIRECRAWL_API_KEY not found in environment")
            return None

        # Scrape the URL
        scrape_result = firecrawl_client.scrape_url(
            url=url,
            params={
                'formats': ['html', 'markdown'],
                'onlyMainContent': True,
                'extractMetadata': True
            }
        )
        
        # Extract relevant data
        scraped_content = {
            "url": url,
            "html": scrape_result.get("html", ""),
            "markdown": scrape_result.get("markdown", ""),
            "metadata": scrape_result.get("metadata", {}),
            "success": scrape_result.get("success", True)
        }
        
        logger.info(f"Successfully scraped content from: {url}")
        return scraped_content
        
    except Exception as e:
        logger.error(f"Firecrawl scraping error: {str(e)}", exc_info=True)
        return None


def extract_job_content(scraped_data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Extract job-specific content from scraped data
    """
    try:
        if not scraped_data or not scraped_data.get("success"):
            return None
        
        # Extract text content (prefer markdown, fallback to HTML)
        content = scraped_data.get("markdown", "")
        if not content:
            content = scraped_data.get("html", "")
        
        # Extract metadata
        metadata = scraped_data.get("metadata", {})
        
        return {
            "content": content,
            "title": metadata.get("title", ""),
            "description": metadata.get("description", ""),
            "url": scraped_data.get("url", ""),
            "scraped_at": metadata.get("scrapedAt", "")
        }
        
    except Exception as e:
        logger.error(f"Error extracting job content: {str(e)}", exc_info=True)
        return None
