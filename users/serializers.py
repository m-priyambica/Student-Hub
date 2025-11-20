# In users/serializers.py (UPDATED)

from rest_framework import serializers
from .models import User
import re # Import the regular expressions module

class UserRegisterSerializer(serializers.ModelSerializer):
    """
    A serializer for registering new users.
    We only define the fields needed for creation.
    """
    
    class Meta:
        model = User
        # List the fields you want to accept for registration
        fields = ('username', 'email', 'full_name', 'password',
                  'security_question_1', 'security_answer_1',
                   'security_question_2', 'security_answer_2'
                  )
        
        extra_kwargs = {
            'password': {
                'write_only': True, # This means the password won't be sent back in the response
                'style': {'input_type': 'password'} # This hides it in the browsable API
            }
        }
    
    # --- THIS IS OUR NEW CUSTOM VALIDATION ---
    def validate_email(self, value):
        """
        Check that the email is from the allowed college domain.
        """
        # We can make this more flexible in case there are subdomains, etc.
        # This regex checks for "anything@stanley.edu.in"
        # The re.IGNORECASE makes it case-insensitive.
        if not re.match(r"^[A-Za-z0-9._%+-]+@stanley\.edu\.in$", value, re.IGNORECASE):
            raise serializers.ValidationError("Only emails from @stanley.edu.in are allowed.")
        
        return value
    # --- END OF NEW VALIDATION ---
    
    def create(self, validated_data):
        """
        This method is called when we save the serializer (e.g., serializer.save()).
        We override it to use our custom create_user method
        which properly hashes the password.
        """
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            password=validated_data['password'],
            # Use .get() to handle these fields safely
            security_question_1=validated_data.get('security_question_1', ''),
            security_answer_1=validated_data.get('security_answer_1', ''),
            security_question_2=validated_data.get('security_question_2', ''),
            security_answer_2=validated_data.get('security_answer_2', ''),
        )
        
        return user
    