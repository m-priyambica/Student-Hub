# In users/views.py (UPDATED)

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import UserRegisterSerializer
from .models import OneTimePassword
from .utils import generate_otp
from django.core.mail import send_mail
from django.conf import settings

class RegisterView(generics.CreateAPIView):
    """
    API View for registering a new user.
    """
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        # This calls the standard CreateAPIView logic first
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # This calls our perform_create method below
            self.perform_create(serializer)
            
            return Response(
                {"message": "User created successfully. Please check your email for OTP."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        """
        This runs when we save the user.
        We save the user, generate the OTP, save it to DB, and send email.
        """
        # 1. Save the user to the database
        user = serializer.save()
        
        # 2. Generate a random 6-digit code
        otp_code = generate_otp()
        
        # 3. Save the OTP to the OneTimePassword model
        # update_or_create handles cases if an OTP already exists for this user
        OneTimePassword.objects.update_or_create(
            user=user, 
            defaults={'code': otp_code}
        )
        
        # 4. Send the Email
        subject = "Your Student Hub Verification Code"
        message = f"Hi {user.full_name},\n\nThank you for registering at Student Hub.\n\nYour verification code is: {otp_code}\n\nPlease verify your email to activate your account.\n\nBest,\nThe Student Hub Team"
        email_from = settings.EMAIL_HOST_USER
        recipient_list = [user.email]
        
        send_mail(subject, message, email_from, recipient_list)