from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from .models import User
import re 

# --- 1. Registration Serializer ---
class UserRegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for registering new users. 
    REMOVED: Security Questions.
    """
    
    class Meta:
        model = User
        # Removed security_question/answer fields
        fields = ('username', 'email', 'full_name', 'password')
        
        extra_kwargs = {
            'password': {
                'write_only': True, 
                'style': {'input_type': 'password'} 
            }
        }
    
    def validate_email(self, value):
        """
        Check that the email is from the allowed college domain.
        """
        if not re.match(r"^[A-Za-z0-9._%+-]+@stanley\.edu\.in$", value, re.IGNORECASE):
            raise serializers.ValidationError("Only emails from @stanley.edu.in are allowed.")
        return value
    
    def create(self, validated_data):
        """
        Create user without security questions.
        """
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            password=validated_data['password']
        )
        return user


# --- 2. Login Serializer (Supports Username OR Email) ---
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField() # This can be username OR email
    password = serializers.CharField(write_only=True)
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)

    def validate(self, data):
        username_or_email = data.get('username', '')
        password = data.get('password', '')
        
        # LOGIC: Check if input looks like an email
        if '@' in username_or_email:
            user_obj = User.objects.filter(email=username_or_email).first()
            if user_obj:
                # If email exists, switch variable to the actual username for authentication
                username_or_email = user_obj.username
        
        # Standard Django authentication
        user = authenticate(username=username_or_email, password=password)
        
        if not user:
            raise AuthenticationFailed('Invalid credentials. Please check your username/email and password.')
        
        if not user.is_active:
            raise AuthenticationFailed('Account disabled.')
            
        # Generate Tokens (Assuming you use SimpleJWT)
        try:
            from rest_framework_simplejwt.tokens import RefreshToken
            tokens = RefreshToken.for_user(user)
        except ImportError:
            raise ImportError("SimpleJWT is not installed. Install it or use your custom token logic.")
        
        return {
            'username': user.username,
            'email': user.email,
            'access': str(tokens.access_token),
            'refresh': str(tokens)
        }


# --- 3. Password Reset Request Serializer ---
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    class Meta:
        fields = ['email']


# --- 4. Password Reset Confirm (Set New Password) Serializer ---
class SetNewPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(min_length=6, max_length=68, write_only=True)
    confirm_password = serializers.CharField(min_length=6, max_length=68, write_only=True)

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"password": "Password and Confirm Password do not match."})
        return attrs