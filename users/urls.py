# In users/urls.py (COMPLETE FILE)

from django.urls import path
from .views import (
    RegisterView, 
    VerifyEmailView, 
    PasswordResetView, 
    GetSecurityQuestionsView, 
    VerifySecurityAnswersView
)
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    # 1. Registration & Login
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),

    # 2. Password Reset Flow (The 3 Steps)
    
    # Step 1: Get the questions for a username
    path('get-questions/', GetSecurityQuestionsView.as_view(), name='get_questions'), # <--- ADDED THIS
    
    # Step 2: Check if answers are correct (Middle step)
    path('verify-answers/', VerifySecurityAnswersView.as_view(), name='verify_answers'), # <--- ADDED THIS

    # Step 3: Actually reset the password
    path('reset-password/', PasswordResetView.as_view(), name='reset_password'),
]