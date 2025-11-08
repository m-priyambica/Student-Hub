# In users/urls.py (A NEW FILE)

from django.urls import path
from .views import RegisterView

urlpatterns = [
    # This is the "phone number" for our RegisterView
    # The full URL will be /api/auth/register/
    path('register/', RegisterView.as_view(), name='register'),
]