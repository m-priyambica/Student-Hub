# In users/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User,OneTimePassword, Student,Staff
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
                    'security_question_1',
                    'security_answer_1',
                    'security_question_2',
                    'security_answer_2',
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
class StudentAdmin(CustomUserAdmin):
    list_display = ('username', 'email', 'full_name', 'is_email_verified')
    def get_queryset(self, request):
        return super().get_queryset(request).filter(is_staff=False)

# 2. Admin for Staff (is_staff=True)
class StaffAdmin(CustomUserAdmin):
    list_display = ('username', 'email', 'full_name', 'is_staff', 'is_email_verified')
    def get_queryset(self, request):
        return super().get_queryset(request).filter(is_staff=True)

# Register everything
admin.site.register(User, CustomUserAdmin) # Keeps the "All Users" view just in case
admin.site.register(Student, StudentAdmin) # Shows only Students
admin.site.register(Staff, StaffAdmin)     # Shows only Staff
admin.site.register(OneTimePassword)
