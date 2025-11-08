# In users/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    """
    Our Custom User Model, extending Django's default.
    We will use 'username' as the main login field,
    but we make 'email' unique so we can also use it for login.
    """
    
    # Django's AbstractUser already has:
    # username, first_name, last_name, is_staff, is_active, is_superuser, etc.
    
    # We must make the email field unique so we can use it for login
    email = models.EmailField(_('email address'), unique=True)
    
    # We'll add a 'full_name' field as required by our project plan
    full_name = models.CharField(_('full name'), max_length=150, blank=False)

    # --- Our Custom Fields ---
    is_email_verified = models.BooleanField(default=False)
    secret_question = models.CharField(max_length=255, blank=True)
    secret_answer = models.CharField(max_length=255, blank=True) # Note: We'll hash this later

    # --- Configuration ---
    
    # Tell Django what field to use as the main "username"
    # We keep it as 'username'
    USERNAME_FIELD = 'username'
    
    # Tell Django which fields are required when creating a superuser
    # 'username' (the USERNAME_FIELD) and 'password' are required by default.
    REQUIRED_FIELDS = ['email', 'full_name']

    def __str__(self):
        """
        A string representation of the user (e.g., in the admin panel).
        """
        return self.username