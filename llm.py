import os
import json
import re
import time
import random
from groq import Groq
from duckduckgo_search import DDGS

# Initialize Groq Client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def ask(prompt, is_json=False):
    """Core LLM inference function with temperature variability."""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"} if is_json else None,
            temperature=0.9
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"LLM ERROR: {e}")
        return "{}" if is_json else "Error: Agent Offline."

def get_assessment_questions(context=""):
    seed = time.time()
    prompt = f"""
    SEED: {seed}
    Based on the following 2026 industry context: {context}
    Generate 3 unique, scenario-based questions to discover a candidate's hidden engineering strengths.
    Return JSON:
    {{
      "questions": [
        {{ "id": {random.randint(1,1000)}, "question": "...", "options": ["Choice A", "Choice B", "Choice C"] }}
      ]
    }}
    """
    return ask(prompt, is_json=True)

def analyze_interests(responses):
    prompt = f"""
    Analyze these engineering scenarios responses: {responses}.
    Summarize the candidate's core technical persona and interests in 2 sentences.
    """
    return ask(prompt)

def get_role_fit(interests_summary, context=""):
    prompt = f"""
    Context: {context}
    Interests: {interests_summary}
    Predict top 3 highly specialized roles for this engineer in 2026.
    Return JSON:
    {{
      "roles": [
        {{ "title": "...", "reason": "...", "match": "95%" }}
      ]
    }}
    """
    return ask(prompt, is_json=True)

def get_job_openings(role, context=""):
    prompt = f"""
    Context: {context}
    Role: {role}
    Find 3 real-world job openings.
    Return JSON:
    {{
      "categories": {{
        "Verified Portals": [
          {{ "company": "...", "role": "...", "links": [{{ "platform": "LinkedIn", "url": "..." }}] }}
        ]
      }}
    }}
    """
    return ask(prompt, is_json=True)

def get_skill_gap(role, current_skills, degree, context=""):
    prompt = f"""
    Target Role: {role}
    Current Skills: {current_skills}
    Degree: {degree}
    Market Context: {context}
    Identify 3 critical skill gaps.
    """
    return ask(prompt)

def get_interview_prep(role, company="", context=""):
    prompt = f"""
    Role: {role}
    Company: {company}
    Market Context: {context}
    
    Task: Select ONLY THE SINGLE MOST RELEVANT YouTube video for this specific role: "{role}" from the context provided.
    If the user is a Frontend Developer, prioritize Frontend videos. If a Data Scientist, prioritize ML videos.
    Provide a hyper-detailed summary and precisely 5 high-impact key takeaways.
    
    Return JSON:
    {{
      "videos": [
        {{ 
          "topic": "...", 
          "video_id": "...", 
          "summary": "Provide a 3-paragraph executive summary here.", 
          "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5"],
          "priority_score": 99
        }}
      ]
    }}
    
    CRITICAL: RETURN EXACTLY ONE VIDEO OBJECT IN THE LIST.
    Extract the 'video_id' accurately from the provided context. 
    """
    return ask(prompt, is_json=True)

def get_project_idea(role, skills, interests, context=""):
    seed = time.time()
    prompt = f"""
    SEED: {seed}
    Role: {role}
    Skills: {skills}
    Interests: {interests}
    Market Context: {context}
    Suggest a unique project.
    Provide: Project name, Problem solved, Features, Tech stack, Resume bullet.
    """
    return ask(prompt)

def get_resume(name, degree, skills, role, project_idea, context=""):
    prompt = f"""
    Name: {name}
    Degree: {degree}
    Skills: {skills}
    Role: {role}
    Project: {project_idea}
    Context: {context}
    Generate an ATS JSON resume.
    Return JSON: name, role, summary, skills, projects, education.
    """
    return ask(prompt, is_json=True)

def get_technical_quiz(role):
    seed = time.time()
    prompt = f"""
    SEED: {seed}
    Role: {role}
    Generate a 10-question technical quiz.
    Return JSON:
    {{
      "questions": [
        {{
          "id": {random.randint(1,1000)},
          "question": "...",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correct": "Option 1" 
        }}
      ]
    }}
    CRITICAL: The "correct" field MUST be the EXACT string from the "options" array.
    """
    return ask(prompt, is_json=True)

def get_coding_challenge(role, context=""):
    seed = time.time()
    prompt = f"""
    SEED: {seed}
    RAG CONTEXT: {context}
    
    Based on the RAG context above, identify a REAL and RELEVANT LeetCode problem for a {role} role. 
    If the context is empty, fallback to a standard Hard problem like 'LRU Cache' or 'Merge K Sorted Lists'.
    Provide the actual LeetCode title, a high-fidelity description, and the official LeetCode URL.
    
    Return JSON:
    {{
      "title": "...",
      "difficulty": "Medium/Hard",
      "description": "...",
      "leetcode_url": "https://leetcode.com/problems/...",
      "constraints": ["..."],
      "hints": ["..."],
      "scenarios": [
        {{ "input": "...", "expected": "..." }}
      ],
      "starter_code": {{
        "python": "...",
        "javascript": "..."
      }}
    }}
    """
    return ask(prompt, is_json=True)



def evaluate_code(code, language, problem=""):
    prompt = f"""
    Audit this {language} code for PROBLEM: {problem}.
    Return JSON: score, complexity, efficiency, review, optimal_solution.
    """
    return ask(prompt, is_json=True)

def draft_application(name, skills, role, company, context=""):
    prompt = f"""
    Name: {name}
    Skills: {skills}
    Role: {role}
    Company: {company}
    Culture Context: {context}
    Draft a personalized cover letter.
    """
    return ask(prompt)

def agent_chat(history, user_state):
    history_str = json.dumps(history)
    
    # Phase 1: Determine Action
    prompt = f"""
    You are CareerForge AI, a top-notch Agentic RAG orchestrator for Software Engineers, similar to Claude and ChatGPT.
    
    USER STATE:
    {json.dumps(user_state)}
    
    CHAT HISTORY:
    {history_str}
    
    INSTRUCTIONS:
    Analyze the latest user message. Decide what TOOL to use.
    
    Tools Available:
    - "NONE": Just talk to the user.
    - "ROADMAP": Generate an interview roadmap/masterclass for a specific role.
    - "CODELAB": Give the user a coding challenge (LeetCode style).
    - "QUIZ": Give the user a technical quiz.
    - "PROJECT": Generate a portfolio project.
    
    Return EXACTLY this JSON:
    {{
      "reply": "Conversational reply.",
      "action": "TOOL_NAME",
      "extracted_role": "Software Engineer (or whatever they asked for)"
    }}
    """
    decision = json.loads(ask(prompt, is_json=True))
    
    action = decision.get("action", "NONE")
    role = decision.get("extracted_role", "Software Engineer")
    
    response_data = {
        "reply": decision.get("reply", "Processing..."),
        "action": action,
        "artifact_data": None
    }
    
    # Phase 2: Execute Action (Tool Use)
    try:
        if action == "ROADMAP":
            from api.views import retrieve_context
            context = retrieve_context("youtube", {"role": role})
            videos = json.loads(get_interview_prep(role, company="", context=context))
            skill_gap = get_skill_gap(role, "", "", "")
            response_data["artifact_data"] = {"videos": videos, "skill_gap": skill_gap}
        
        elif action == "CODELAB":
            from api.views import retrieve_context
            context = retrieve_context("leetcode", {"role": role})
            problem = json.loads(get_coding_challenge(role, context=context))
            response_data["artifact_data"] = {"problem": problem}
            
        elif action == "QUIZ":
            quiz_data = json.loads(get_technical_quiz(role))
            response_data["artifact_data"] = {"questions": quiz_data.get("questions", [])}
            
        elif action == "PROJECT":
            project = get_project_idea(role, "", "")
            response_data["artifact_data"] = {"project": project}
            
    except Exception as e:
        response_data["reply"] += f" [System Info: Tool execution failed: {str(e)}]"
        response_data["action"] = "NONE"

    return json.dumps(response_data)