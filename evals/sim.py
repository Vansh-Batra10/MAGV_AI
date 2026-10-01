"""Simulated caller: an LLM plays the persona against the agent."""

from __future__ import annotations

from evals.personas import Persona
from receptionist.adapters.llm.base import Completion, LLMProvider, LLMRequest, SystemBlock

HANGUP = "<hangup>"

SIM_PROMPT = """You are role-playing a caller phoning {business}, a home-services company. You are \
talking to their phone receptionist. Stay in character.

Who you are: {persona}
Your goal: {goal}
Your details (share them only when asked, the way a real person would):
- Name: {name}
- Phone: {phone}
- Service address: {address}
- Email: {email}

Rules:
- Reply with only what you say out loud: one or two short, natural sentences.
- Answer the question you were asked. Don't volunteer every detail at once.
- If the receptionist reads back a detail that is correct, say yes. If it is wrong, correct it.
- When the conversation is clearly finished (they said goodbye, or you have what you need and
  said goodbye), reply with exactly {hangup}"""


class CallerSimulator:
    def __init__(self, llm: LLMProvider, persona: Persona, business: str) -> None:
        self.llm = llm
        self.persona = persona
        c = persona.caller
        self.system = SIM_PROMPT.format(
            business=business,
            persona=persona.persona.strip(),
            goal=persona.goal,
            name=c.name,
            phone=c.phone,
            address=c.address,
            email=c.email or "(prefer not to give)",
            hangup=HANGUP,
        )
        # From the simulator's point of view the agent is the "user".
        self.messages: list[dict] = []
        self.completions: list[Completion] = []

    async def reply(self, agent_said: str) -> str | None:
        """The caller's next line, or None if they hang up."""
        self.messages.append({"role": "user", "content": agent_said or "(silence)"})
        result = await self.llm.complete(
            LLMRequest(
                purpose="caller_sim",
                system=[SystemBlock(self.system)],
                messages=self.messages,
                max_tokens=200,
                timeout_s=30,
            )
        )
        self.completions.append(result)
        text = result.text.strip()
        self.messages.append({"role": "assistant", "content": text or HANGUP})
        if not text or HANGUP in text:
            return None
        return text
