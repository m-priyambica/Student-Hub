# In users/urls.py (UPDATED)

from django.urls import path
from .views import RegisterView,VerifyEmailView

# Import the pre-built view from SimpleJWT
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
)

urlpatterns = [
    # .../api/auth/register/
    path('register/', RegisterView.as_view(), name='register'),
    
    # This is our new line
    # .../api/auth/login/
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),

    # New URL for verification
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
]