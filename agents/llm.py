import os
import torch
from groq import Groq
from openai import OpenAI, AzureOpenAI
from google.adk import Agent
from dotenv import load_dotenv
import streamlit as st
from openrouter import OpenRouter
from openrouter import errors as or_errors 
import os
import re
import logging
load_dotenv()


class LLMEngine:
    def __init__(self):
        self.configs = {
            "GROQ_MODEL": os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
            "AZURE_DEPLOYMENT": os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-5-main"),
            "OPENROUTER_KEY": os.getenv("OPENROUTER_API_KEY"),
            "AZURE_KEY": os.getenv("AZURE_OPENAI_KEY"),
            "GROQ_KEY": os.getenv("GROQ_API_KEY"),
            "LOCAL_WEIGHTS_MODEL": "Qwen/Qwen2.5-0.5B-Instruct",
            "DEFAULT_TOKEN_CAP": 200
        }
        

    def analyze_reservoir_task(self, model, system_prompt, user_content, max_token):
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_content}]
        
        retries = 2
        current_max = self.configs["DEFAULT_TOKEN_CAP"]

        for attempt in range(retries):
            try:
                # Example for OpenRouter logic
                if model == "claude":
                    with OpenRouter(api_key=os.getenv("OPENROUTER_KEY")) as client:
                        response = client.chat.send(
                            model="anthropic/claude-4.5-sonnet",
                            messages=messages,
                            max_completion_tokens=max_token,
                            #reasoning_effort="high",
                            #verbosity='low'
                        )
                
                        return response.choices[0].message.content
                        
                
                elif model == "gpt-5":
                    client = AzureOpenAI(
                        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT_URL"),
                        api_key=self.configs["AZURE_KEY"],
                        api_version="2025-01-01-preview",
                        
                    )
                    res = client.chat.completions.create(
                           model=self.configs["AZURE_DEPLOYMENT"],
                           messages=messages,
                           # Options: "minimal", "low", "medium" (default), or "high"
                           reasoning_effort="high",
                           verbosity='low'
                       )
                    return res.choices[0].message.content
                elif model == "openai-oss":
                    client = Groq(api_key=self.configs["GROQ_KEY"])
                    res = client.chat.completions.create(
                        model=self.configs["GROQ_MODEL"],
                        #max_completion_tokens=max_token,
                        messages=messages,
                        reasoning_effort="high",
                        #verbosity='low'
                    )
                    return res.choices[0].message.content
                elif model == "gemini":
                    res = Agent(
                        name="exzing_reservoir_orchestrator",
                        model="gemini-2.5-flash",
                        description=(
                            "Exzing Reservoir Intelligence Orchestrator."
                        ),
                        instruction=messages
                        )
       
            except or_errors.PaymentRequiredResponseError as e:
                # SMART PARSING: Extract "can only afford 1000" from the error string
                error_msg = str(e)
                afford_match = re.search(r"can only afford (\0-9]+)", error_msg)
            
                if afford_match and attempt < retries - 1:
                    affordable_tokens = int(afford_match.group(1)) - 10 # Buffer
                    logging.warning(f"Quota Hit. Retrying with {affordable_tokens} tokens.")
                    current_max = affordable_tokens
                    continue # Try again with the new limit
                else:
                    return f"ERROR_QUOTA: Insufficient credits. {error_msg}"
        
            except Exception as e:
                logging.error(f"Provider Error: {str(e)}")
                return f"ERROR_GENERIC: {str(e)}"
        
        return "ERROR_MAX_RETRIES: Could not fulfill request."
        