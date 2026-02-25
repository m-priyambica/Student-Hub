from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()

# --- 1. Registration Serializer (Restricted to @stanley.edu.in) ---
class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for registering new users.
    ENFORCES: @stanley.edu.in domain restriction.
    ENFORCES: Unique email addresses.
    """
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name')
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_email(self, value):
        """
        Check that the email belongs to Stanley College and is unique.
        """
        email = value.lower()
        
        # Rule #1: Domain Restriction
        if not email.endswith("@stanley.edu.in"):
            raise serializers.ValidationError("Only Stanley College students can login with their mail ID (@stanley.edu.in).")
        
        # Rule #2: One user per email
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("This email is already registered.")
            
        return email

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            password=validated_data['password']
        )
        return user


# --- 2. Login Serializer (Supports Username OR Email) ---
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField() # Can be username OR email
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
                # If email exists, use the actual username for authentication
                username_or_email = user_obj.username
        
        # Standard Django authentication
        user = authenticate(username=username_or_email, password=password)
        
        if not user:
            raise AuthenticationFailed('Invalid credentials. Please check your username/email and password.')
        
        # CRITICAL FIX: Block login if they haven't verified OTP yet
        if not user.is_active:
            raise AuthenticationFailed('Account disabled. Please verify your email via OTP first.')
            
        # Generate Tokens
        try:
            from rest_framework_simplejwt.tokens import RefreshToken
            tokens = RefreshToken.for_user(user)
        except ImportError:
            raise ImportError("SimpleJWT is not installed.")
        
        return {
            'username': user.username,
            'email': user.email,
            'access': str(tokens.access_token),
            'refresh': str(tokens)
        }


# --- 3. Password Reset Serializers ---
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class SetNewPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(min_length=6, write_only=True)
    confirm_password = serializers.CharField(min_length=6, write_only=True)

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"password": "Password and Confirm Password do not match."})
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'branch', 'semester', 'section'
        )
        read_only_fields = ('id', 'email')

    def update(self, instance, validated_data):
        first_name = validated_data.get('first_name', instance.first_name)
        last_name = validated_data.get('last_name', instance.last_name)

        # Keep full_name consistent when first/last name is updated from settings.
        if 'full_name' not in validated_data:
            combined = f"{first_name} {last_name}".strip()
            if combined:
                validated_data['full_name'] = combined

        return super().update(instance, validated_data)
