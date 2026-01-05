from django.shortcuts import render
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer

User = get_user_model()

# ==========================================
# 1. User Profile View
# ==========================================
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user

    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ==========================================
# 2. Trigger Password Reset (Sends HTML Email)
# ==========================================
@api_view(['POST'])
@permission_classes([AllowAny]) 
def trigger_password_reset(request):
    """
    Generates a UID and Token, creates a reset link, 
    and sends a styled HTML email using an internal string.
    """
    email = request.data.get('email')
    
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Return success even if user not found to prevent email scraping
        return Response({"message": "If an account exists, a reset link has been sent."})

    try:
        # 1. Generate the UID and Token
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # 2. Create the Frontend Link
        # IMPORTANT: This must match your deployed React URL
        frontend_domain = "https://student-hub-frontend-gw6b.onrender.com" 
        reset_link = f"{frontend_domain}/reset-password/{uid}/{token}"

        # 3. Create HTML Content (Embedded directly here)
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Helvetica', 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }}
                .header {{ background-color: #E65100; padding: 30px; text-align: center; color: white; }}
                .header h1 {{ margin: 0; font-size: 28px; font-weight: 700; }}
                .content {{ padding: 30px; color: #333333; line-height: 1.6; }}
                .btn {{ background-color: #E65100; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; display: inline-block; }}
                .alert-box {{ background-color: #FFF3E0; border-left: 5px solid #E65100; padding: 15px; margin: 20px 0; }}
            </style>
        </head>
        <body>
        <div class="container">
            <div class="header">
                <h1>Student Hub 🎓</h1>
                <div>The Campus Marketplace</div>
            </div>
            <div class="content">
                <h3>Hey there! 👋</h3>
                <p>We received a request to reset your password.</p>
                
                <div class="alert-box">
                    <strong>Heads up:</strong> This link expires in 24 hours.
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" class="btn">Reset My Password</a>
                </div>
                
                <p style="font-size: 12px; color: #777;">If the button doesn't work, copy this link:<br>{reset_link}</p>
            </div>
        </div>
        </body>
        </html>
        """

        # 4. Send the Email
        send_mail(
            subject="Reset Your Student Hub Password 🎓",
            message=f"Reset your password here: {reset_link}", # Text fallback
            from_email="admin@studenthub.com", # Update this if you have a real sender
            recipient_list=[user.email],
            fail_silently=False,
            html_message=html_message # Sends the HTML version
        )

        return Response({"message": "Reset link sent successfully."})

    except Exception as e:
        print("Email Error:", e) 
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==========================================
# 3. Confirm Password Reset (The Logic)
# ==========================================
@api_view(['PATCH'])
@permission_classes([AllowAny])
def confirm_password_reset(request, uidb64, token):
    """
    Validates the UID and Token from the link, and sets the new password.
    """
    try:
        # Decode the UID to get the user
        # FIXED: Using force_str instead of force_bytes
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    # Check if the User exists and the Token is valid
    if user is not None and default_token_generator.check_token(user, token):
        password = request.data.get('password')
        
        if not password:
            return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Set the new password
        user.set_password(password)
        user.save()
        return Response({"message": "Password reset successful!"}, status=status.HTTP_200_OK)
    
    else:
        return Response({"error": "Invalid or expired reset link."}, status=status.HTTP_400_BAD_REQUEST)