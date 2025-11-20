# In users/views.py (FIXED COMPLETE FILE)

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import UserRegisterSerializer
from .models import OneTimePassword, User
from .utils import generate_otp
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

# --- 1. Registration & OTP ---

class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(
                {"message": "User created successfully. Please check your email for OTP."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        user = serializer.save()
        otp_code = generate_otp()
        OneTimePassword.objects.update_or_create(
            user=user, 
            defaults={'code': otp_code}
        )
        
        # Send Email
        subject = "Your Student Hub Verification Code"
        message = f"Hi {user.full_name},\n\nYour verification code is: {otp_code}\n\nPlease verify your email."
        email_from = settings.EMAIL_HOST_USER
        recipient_list = [user.email]
        try:
            send_mail(subject, message, email_from, recipient_list)
        except Exception as e:
            print(f"Error sending email: {e}")

class VerifyEmailView(generics.GenericAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        otp_code = request.data.get('otp')
        try:
            otp_obj = OneTimePassword.objects.get(code=otp_code)
            user = otp_obj.user

            time_difference = timezone.now() - otp_obj.created_at
            
            if time_difference.total_seconds() > 120: # 120 seconds = 2 minutes
                otp_obj.delete() # Delete expired code
                return Response(
                    {'message': 'OTP expired. Please request a new one.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not user.is_email_verified:
                user.is_email_verified = True
                user.save()
                otp_obj.delete()
                return Response({'message': 'Account verified successfully!'}, status=status.HTTP_200_OK)
            return Response({'message': 'User is already verified.'}, status=status.HTTP_204_NO_CONTENT)
        except OneTimePassword.DoesNotExist:
            return Response({'message': 'Passcode not provided or invalid.'}, status=status.HTTP_404_NOT_FOUND)

# --- 2. Password Reset Flow (3 Steps) ---

# Step 1: Get Questions
class GetSecurityQuestionsView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserRegisterSerializer # <--- ADDED THIS LINE

    def post(self, request):
        username = request.data.get('username')
        try:
            user = User.objects.get(username=username)
            
            def get_label(code):
                for choice in User.SECURITY_QUESTION_CHOICES:
                    if choice[0] == code:
                        return choice[1]
                return code

            return Response({
                'username': username,
                'question_1': get_label(user.security_question_1),
                'question_2': get_label(user.security_question_2)
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

# Step 2: Verify Answers
class VerifySecurityAnswersView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserRegisterSerializer # <--- ADDED THIS LINE
    
    def post(self, request):
        username = request.data.get('username')
        ans1 = request.data.get('security_answer_1')
        ans2 = request.data.get('security_answer_2')

        try:
            user = User.objects.get(username=username)
            db_ans1 = user.security_answer_1.strip().lower()
            db_ans2 = user.security_answer_2.strip().lower()
            
            if db_ans1 == ans1.strip().lower() and db_ans2 == ans2.strip().lower():
                return Response({'message': 'Answers correct.'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Incorrect answers'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

# Step 3: Reset Password
class PasswordResetView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserRegisterSerializer # <--- ADDED THIS LINE
    
    def post(self, request):
        username = request.data.get('username')
        ans1 = request.data.get('security_answer_1')
        ans2 = request.data.get('security_answer_2')
        new_password = request.data.get('new_password')

        try:
            user = User.objects.get(username=username)
            db_ans1 = user.security_answer_1.strip().lower()
            db_ans2 = user.security_answer_2.strip().lower()
            
            if db_ans1 == ans1.strip().lower() and db_ans2 == ans2.strip().lower():
                user.set_password(new_password)
                user.save()
                return Response({'message': 'Password reset successful!'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Incorrect answers'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

# In users/views.py (Add to bottom)

class ResendOTPView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserRegisterSerializer # Just for docs

    def post(self, request):
        email = request.data.get('email') # Ask for email to identify user
        
        try:
            user = User.objects.get(email=email)
            
            # Generate new code
            otp_code = generate_otp()
            
            # Update the existing OTP record (this resets the created_at timestamp!)
            OneTimePassword.objects.update_or_create(
                user=user, 
                defaults={'code': otp_code, 'created_at': timezone.now()}
            )
            
            # Send Email Logic (Same as before)
            subject = "Resend: Your Verification Code"
            message = f"Hi {user.full_name},\n\nYour new code is: {otp_code}"
            email_from = settings.EMAIL_HOST_USER
            recipient_list = [user.email]
            send_mail(subject, message, email_from, recipient_list)
            
            return Response({'message': 'New OTP sent.'}, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Security: Don't reveal if email exists or not
            return Response({'message': 'If this email is registered, an OTP was sent.'}, status=status.HTTP_200_OK)
