from django.urls import path
from . import views

urlpatterns = [
    path('assessment-questions/', views.assessment_questions, name='assessment_questions'),
    path('analyze-interests/', views.analyze_user_interests, name='analyze_interests'),
    path('role-fit/', views.role_fit, name='role_fit'),
    path('skill-gap/', views.skill_gap, name='skill_gap'),
    path('project-idea/', views.project_idea, name='project_idea'),
    path('resume/', views.resume, name='resume'),
    path('job-openings/', views.job_openings, name='job_openings'),
    path('draft-application/', views.auto_draft_application, name='draft_application'),
    path('interview-prep/', views.interview_prep, name='interview_prep'),
    path('technical-quiz/', views.technical_quiz, name='technical_quiz'),
    path('run-code/', views.run_code, name='run_code'),
    path('get-problem/', views.get_code_problem, name='get_code_problem'),
    path('chat-orchestrator/', views.chat_orchestrator, name='chat_orchestrator'),
]
