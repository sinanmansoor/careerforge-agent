# CareerForge AI - Full Stack

This project has been upgraded from a Streamlit app to a modern Full-Stack application.

## Structure
- `/backend`: Django REST Framework API.
- `/frontend`: React + Vite Frontend.
- `llm.py`: Core logic for AI interactions (shared).

## How to Run

### 1. Start the Backend
Open a terminal and run:
```bash
python manage.py runserver
```
The API will run at `http://127.0.0.1:8000`.

### 2. Start the Frontend
Open another terminal, navigate to the frontend folder, and run:
```bash
cd frontend
npm run dev
```
The app will run at `http://localhost:5173`.

## Future-Proofing
The backend is built with Django, making it easy to swap the Groq API in `llm.py` with a local model (like Ollama or LocalAI) in the future.
