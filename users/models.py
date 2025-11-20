# In users/models.py (UPDATED for Random Default + Notice)

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
import random # Import random to pick a default question

# --- Helper function to pick a random question ---
def get_random_question():
    questions = [
        'nick_name', 'first_pet', 'first_school', 'favorite_book', 'birth_city'
    ]
    return random.choice(questions)

class User(AbstractUser):
    """
    Custom User Model with 2 Security Questions.
    """
    email = models.EmailField(_('email address'), unique=True)
    full_name = models.CharField(_('full name'), max_length=150, blank=False)
    is_email_verified = models.BooleanField(default=False)

    # --- 2 Security Questions ---
    SECURITY_QUESTION_CHOICES = [
        ('nick_name', "What is your nick name?"),
        ('first_pet', "What was the name of your first pet?"),
        ('first_school', "What was the name of your first school?"),
        ('favorite_book', "What is your favorite book?"),
        ('birth_city', "In what city were you born?"),
    ]

    # Question 1
    security_question_1 = models.CharField(
        max_length=50, 
        choices=SECURITY_QUESTION_CHOICES, 
        default=get_random_question,  # <--- AUTO-SELECTS RANDOM QUESTION
        blank=True
    )
    security_answer_1 = models.CharField(
        max_length=255, 
        blank=True, 
        help_text="You can change the question above. IMPORTANT: This answer will be required to reset your password." # <--- UPDATED NOTICE
    )

    # Question 2
    security_question_2 = models.CharField(
        max_length=50, 
        choices=SECURITY_QUESTION_CHOICES, 
        default=get_random_question, # <--- AUTO-SELECTS RANDOM QUESTION
        blank=True
    )
    security_answer_2 = models.CharField(
        max_length=255, 
        blank=True,
        help_text="You can change the question above. IMPORTANT: This answer will be required to reset your password." # <--- UPDATED NOTICE
    )

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'full_name']

    def __str__(self):
        return self.username

# --- Proxy Models for Admin ---
class Student(User):
    class Meta:
        proxy = True
        verbose_name = 'Student'
        verbose_name_plural = 'Students'

class Staff(User):
    class Meta:
        proxy = True
        verbose_name = 'Staff Member'
        verbose_name_plural = 'Staff Members'

# --- OTP Model ---
class OneTimePassword(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6, unique=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.code}"