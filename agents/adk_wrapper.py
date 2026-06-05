from pydantic import BaseModel, PrivateAttr
from google.genai.types import Content, Part, GenerateContentResponse, Candidate
from .llm import LLMEngine

class ExzingAdkModel(BaseModel):
    """
    A custom ADK-compatible model wrapper.
    """
    # Define the field. Pydantic will now allow ExzingAdkModel(model_id="...")
    model: str 
    
    # PrivateAttr with a factory handles the engine setup automatically
    _engine: LLMEngine = PrivateAttr(default_factory=LLMEngine)

    async def generate_content(self, contents, **kwargs) -> GenerateContentResponse:
        """This is the method the ADK Runner calls."""
        
        # 1. Map frontend IDs to your LLMEngine model keys
        mapping = {
            "gpt-5-main": "gpt-5",
            "claude-sonnet-4.5": "claude",
            "gemini-2.5-flash": "gemini",
            "openai/gpt-oss-120b": "openai-oss"
        }
        
        user_content = contents[-1].parts[0].text if contents else ""
        system_prompt = contents[0].parts[0].text if len(contents) > 1 else "You are a reservoir assistant."
        
        # Use self.model_id (which Pydantic now populates)
        provider_key = mapping.get(self.model, "gemini")
        
        # 2. Call your direct logic via the private engine
        raw_response = self._engine.analyze_reservoir_task(
            model=provider_key,
            system_prompt=system_prompt,
            user_content=user_content,
            max_token=kwargs.get("max_tokens", 1000)
        )

        # 3. Return ADK compatible response
        return GenerateContentResponse(
            candidates=[
                Candidate(
                    content=Content(
                        role="model",
                        parts=[Part.from_text(text=str(raw_response))]
                    )
                )
            ]
        )