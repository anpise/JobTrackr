"""
Main job processing orchestrator
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from scraper import scrape_with_firecrawl, extract_job_content
from analyzer import analyze_with_bedrock
from db import create_job_item, put_job

logger = logging.getLogger(__name__)


def process_job(url: str, user_id: str, resume_url: Optional[str] = None) -> Dict[str, Any]:
    """
    Process job URL with web scraping, analysis, and DynamoDB storage

    Args:
        url: Job posting URL
        user_id: User identifier
        resume_url: Optional S3 URL of resume

    Returns:
        Processing result with job_id if successful
    """
    try:
        logger.info(f"Starting processing for URL: {url}, user: {user_id}")

        # Step 1: Web scraping with Firecrawl
        scraped_data = scrape_with_firecrawl(url)
        if not scraped_data:
            return {
                "status": "failed",
                "error": "Failed to scrape content",
                "step": "scraping"
            }

        # Step 2: Extract job content
        job_content = extract_job_content(scraped_data)
        if not job_content:
            return {
                "status": "failed",
                "error": "Failed to extract job content",
                "step": "extraction"
            }

        # Step 3: Analyze content with Bedrock
        analyzed_data = analyze_with_bedrock(job_content)
        if not analyzed_data:
            return {
                "status": "failed",
                "error": "Failed to analyze content",
                "step": "analysis"
            }

        # Step 4: Create DynamoDB item
        job_item = create_job_item(
            user_id=user_id,
            job_url=url,
            analyzed_data=analyzed_data,
            resume_url=resume_url,
            status="Applied"
        )

        # Step 5: Store in DynamoDB
        success = put_job(job_item)
        if not success:
            return {
                "status": "failed",
                "error": "Failed to store job in database",
                "step": "storage"
            }

        result = {
            "status": "completed",
            "job_id": job_item["job_id"],
            "company": job_item["company"],
            "title": job_item["title"],
            "location": job_item["location"]
        }

        logger.info(f"Job processing completed for: {url}, job_id: {job_item['job_id']}")
        return result

    except Exception as e:
        logger.error(f"Error in processing: {str(e)}", exc_info=True)
        return {
            "status": "failed",
            "error": str(e),
            "step": "processing"
        }


