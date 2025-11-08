# In users/backends.py (A NEW FILE)

from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class EmailOrUsernameBackend(BaseBackend):
    """
    This is our custom authentication backend.

    It allows users to log in with either their username OR their email.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Overrides the default authenticate method.
        'username' here can be either a username or an email.
        """
        try:
            # Q objects are used for complex queries (like an OR statement)
            # We try to find a user where their username OR email matches the 'username' field
            user = User.objects.get(
                Q(username=username) | Q(email=username)
            )
        except User.DoesNotExist:
            # No user found with that username or email
            return None

        # If a user is found, check if the password is correct
        if user.check_password(password):
            return user  # Authentication successful
        
        return None  # Password was incorrect

    def get_user(self, user_id):
        """
        A required method for auth backends.
        Tells Django how to retrieve a user object given an ID.
        """
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None