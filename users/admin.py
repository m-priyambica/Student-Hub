# In users/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User,OneTimePassword

class CustomUserAdmin(UserAdmin):
    """
    A custom admin class for our User model.
    """
    
    # We add our custom fields to the 'fieldsets'.
    # This controls the layout of the 'Edit User' page.
    # We add our 'Personal Info' section.
    fieldsets = (
        *UserAdmin.fieldsets,  # Inherits all the default fields
        (
            'Personal Info',  # Title of our new section
            {
                'fields': (
                    'full_name',
                    'is_email_verified',
                    'secret_question',
                    'secret_answer',
                )
            }
        )
    )

    # This controls the columns displayed in the user list.
    list_display = (
        'username', 
        'email', 
        'full_name', 
        'is_staff', 
        'is_email_verified'
    )

# Register your models here.
admin.site.register(User, CustomUserAdmin)
admin.site.register(OneTimePassword)