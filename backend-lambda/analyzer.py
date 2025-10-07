"""
Job content analysis using Amazon Bedrock
"""

import os
import json
import logging
import boto3
from botocore.exceptions import ClientError
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

# Configuration constants
MAX_TOKENS = int(os.getenv('BEDROCK_MAX_TOKENS', '2000'))
DEFAULT_MODEL_ID = 'us.anthropic.claude-sonnet-4-20250514-v1:0'
DEFAULT_AWS_REGION = 'us-east-2'

# Initialize Bedrock client outside handler for connection reuse
aws_region = os.getenv('AWS_DEFAULT_REGION', DEFAULT_AWS_REGION)
bedrock_client = boto3.client('bedrock-runtime', region_name=aws_region)
logger.info(f"Bedrock client initialized at module level: {id(bedrock_client)}")


class JobAnalysis(BaseModel):
    """Pydantic model for structured job analysis output - matches DynamoDB schema"""
    # Required fields
    title: str = Field(description="Job title")
    company: str = Field(description="Company name")
    location: str = Field(description="Job location (city, state, country, or 'Remote')")

    # Optional fields matching DynamoDB schema
    salary_range: Optional[str] = Field(description="Compensation range (e.g., '$120k-$180k', '€50k-€70k')", default=None)
    employment_type: Optional[str] = Field(description="Employment type: Full-time, Part-time, Internship, Contract, Freelance", default=None)
    source: Optional[str] = Field(description="Job board or source (e.g., LinkedIn, Indeed, Greenhouse, Company Website)", default=None)
    tags: Optional[List[str]] = Field(description="List of relevant skills, technologies, or keywords (e.g., ['Python', 'AWS', 'React'])", default_factory=list)


# Initialize output parser after class definition
parser = PydanticOutputParser(pydantic_object=JobAnalysis)


def analyze_with_bedrock(scraped_content: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Analyze scraped content using Amazon Bedrock
    """
    try:
        logger.info("Analyzing content with Bedrock...")
        logger.info(f"Using Bedrock client ID: {id(bedrock_client)}")

        if not scraped_content:
            logger.warning("No content to analyze")
            return None
        
        # Get model ID from environment (use constant default)
        model_id = os.getenv('BEDROCK_MODEL_ID', DEFAULT_MODEL_ID)
        logger.info(f"Using Bedrock model: {model_id}")
        logger.info(f"Using AWS region: {aws_region}")

        # Prepare content for analysis
        content_text = scraped_content.get("content", "")
        if not content_text:
            logger.warning("No content text to analyze")
            return None
        
        # Create analysis prompt with format instructions
        prompt = create_analysis_prompt(content_text, parser)
        
        # Prepare request body
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": MAX_TOKENS,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        # Call Bedrock API
        response = bedrock_client.invoke_model(
            modelId=model_id,
            body=json.dumps(request_body),
            contentType="application/json"
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        analysis_text = response_body['content'][0]['text']
        
        # Use LangChain output parser
        try:
            analyzed_data = parser.parse(analysis_text)
            logger.info("Successfully analyzed content with Bedrock")
            return analyzed_data.dict()
        except Exception as e:
            logger.error(f"Error parsing with LangChain parser: {str(e)}", exc_info=True)
            return create_fallback_response()
        
    except ClientError as e:
        logger.error(f"Bedrock API error: {str(e)}", exc_info=True)
        return None
    except Exception as e:
        logger.error(f"Bedrock analysis error: {str(e)}", exc_info=True)
        return None


def create_analysis_prompt(content: str, parser: PydanticOutputParser) -> str:
    """
    Create a prompt for job content analysis with LangChain format instructions
    """
    format_instructions = parser.get_format_instructions()
    
    prompt = f"""
    Analyze the following job posting content and extract structured information.
    
    {format_instructions}
    
    Job posting content:
    {content}
    
    Please analyze this content and return the structured information in the specified format.
    """
    
    return prompt


def create_fallback_response() -> Dict[str, Any]:
    """
    Create a fallback response when parsing fails
    """
    return {
        "title": "Unknown",
        "company": "Unknown",
        "location": "Unknown",
        "salary_range": None,
        "employment_type": None,
        "source": None,
        "tags": []
    }
