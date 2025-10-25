"""
Job content analysis using Amazon Bedrock or Anthropic API
"""

import os
import json
import logging
import boto3
from botocore.exceptions import ClientError
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import anthropic

logger = logging.getLogger(__name__)

# Configuration constants
MAX_TOKENS = int(os.getenv('MAX_TOKENS', '2000'))
LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'anthropic')  # 'anthropic' or 'bedrock'
DEFAULT_MODEL_ID = 'claude-haiku-4-5-20251001'  # Claude Haiku 4.5 (October 2025)
DEFAULT_BEDROCK_MODEL_ID = 'us.anthropic.claude-haiku-4-5-20251001-v1:0'  # Bedrock Haiku 4.5
DEFAULT_AWS_REGION = 'us-east-2'

# Initialize clients based on provider
aws_region = os.getenv('AWS_DEFAULT_REGION', DEFAULT_AWS_REGION)
bedrock_client = None
anthropic_client = None

if LLM_PROVIDER == 'bedrock':
    bedrock_client = boto3.client('bedrock-runtime', region_name=aws_region)
    logger.info(f"Bedrock client initialized: {id(bedrock_client)}")
else:  # Default to Anthropic
    anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
    if anthropic_api_key:
        anthropic_client = anthropic.Anthropic(api_key=anthropic_api_key)
        logger.info("Anthropic client initialized")
    else:
        logger.error("ANTHROPIC_API_KEY not found in environment")
        raise ValueError("ANTHROPIC_API_KEY is required when LLM_PROVIDER is 'anthropic'")


class JobAnalysis(BaseModel):
    """Pydantic model for structured job analysis output - matches DynamoDB schema"""
    # Required fields
    title: str = Field(description="Job title")
    company: str = Field(description="Company name")
    location: str = Field(description="Job location (city, state, country, or 'Remote')")

    # Optional fields matching DynamoDB schema
    salary_range: Optional[str] = Field(description="Compensation range in format '$XXX,XXX - $XXX,XXX' (e.g., '$120,000 - $180,000', '$50,000 - $70,000'). Always use commas for thousands separator and include currency symbol. Use 'per year' or annual amounts only.", default=None)
    employment_type: Optional[str] = Field(description="Employment type: Full-time, Part-time, Internship, Contract, Freelance", default=None)
    source: Optional[str] = Field(description="Job board or source (e.g., LinkedIn, Indeed, Greenhouse, Company Website)", default=None)
    tags: Optional[List[str]] = Field(description="List of relevant skills, technologies, or keywords (e.g., ['Python', 'AWS', 'React'])", default_factory=list)
    notes: Optional[str] = Field(description="Brief summary or key highlights about the job (2-3 sentences). Include any notable benefits, requirements, or unique aspects.", default=None)


# Initialize output parser after class definition
parser = PydanticOutputParser(pydantic_object=JobAnalysis)


def analyze_with_bedrock(scraped_content: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Analyze scraped content using Amazon Bedrock or Anthropic API
    """
    try:
        logger.info(f"Analyzing content with {LLM_PROVIDER.upper()}...")

        if not scraped_content:
            logger.warning("No content to analyze")
            return None

        # Prepare content for analysis
        content_text = scraped_content.get("content", "")
        if not content_text:
            logger.warning("No content text to analyze")
            return None

        # Create analysis prompt with format instructions
        prompt = create_analysis_prompt(content_text, parser)

        # Call appropriate LLM provider
        if LLM_PROVIDER == 'bedrock':
            analysis_text = call_bedrock(prompt)
        else:  # anthropic
            analysis_text = call_anthropic(prompt)

        if not analysis_text:
            logger.error("No analysis text returned from LLM")
            return None

        # Use LangChain output parser
        try:
            analyzed_data = parser.parse(analysis_text)
            logger.info(f"Successfully analyzed content with {LLM_PROVIDER.upper()}")
            return analyzed_data.dict()
        except Exception as e:
            logger.error(f"Error parsing with LangChain parser: {str(e)}", exc_info=True)
            return create_fallback_response()

    except Exception as e:
        logger.error(f"Analysis error: {str(e)}", exc_info=True)
        return None


def call_anthropic(prompt: str) -> Optional[str]:
    """
    Call Anthropic API directly
    """
    try:
        model_id = os.getenv('ANTHROPIC_MODEL_ID', DEFAULT_MODEL_ID)
        logger.info(f"Using Anthropic model: {model_id}")

        message = anthropic_client.messages.create(
            model=model_id,
            max_tokens=MAX_TOKENS,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return message.content[0].text
    except Exception as e:
        logger.error(f"Anthropic API error: {str(e)}", exc_info=True)
        return None


def call_bedrock(prompt: str) -> Optional[str]:
    """
    Call Amazon Bedrock
    """
    try:
        model_id = os.getenv('BEDROCK_MODEL_ID', DEFAULT_BEDROCK_MODEL_ID)
        logger.info(f"Using Bedrock model: {model_id}")

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

        response = bedrock_client.invoke_model(
            modelId=model_id,
            body=json.dumps(request_body),
            contentType="application/json"
        )

        response_body = json.loads(response['body'].read())
        return response_body['content'][0]['text']
    except ClientError as e:
        logger.error(f"Bedrock API error: {str(e)}", exc_info=True)
        return None


def create_analysis_prompt(content: str, parser: PydanticOutputParser) -> str:
    """
    Create a prompt for job content analysis with LangChain format instructions
    """
    format_instructions = parser.get_format_instructions()

    prompt = f"""
    Analyze the following job posting content and extract structured information.

    {format_instructions}

    IMPORTANT FORMATTING RULES:
    - salary_range: MUST be in format "$XXX,XXX - $XXX,XXX" with commas as thousands separators
      Examples: "$120,000 - $180,000", "$50,000 - $70,000", "$200,000 - $250,000"
      If hourly rate is given, convert to annual (multiply by 2080 hours)
      If monthly is given, multiply by 12
      If only one number is given, create a reasonable range (±20%)

    - notes: Provide a brief 2-3 sentence summary highlighting key aspects of the job.
      Include notable benefits, key requirements, or unique selling points.
      Keep it concise and informative.

    Job posting content:
    {content}

    Please analyze this content and return the structured information in the specified format.
    Ensure salary_range follows the exact format with commas and dollar signs.
    Provide helpful notes that give a quick overview of the opportunity.
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
        "tags": [],
        "notes": None
    }
