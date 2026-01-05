from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.mail import send_mail # Import simple mailer
from .serializers import UserSerializer

User = get_user_model()

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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_password_reset(request):
    """
    Sends a simple text email to the console. 
    Does NOT require HTML templates.
    """
    user = request.user
    if not user.email:
        return Response({"error": "User has no email."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Simple text email - No templates required!
        send_mail(
            subject="Password Reset Request",
            message=f"Hello {user.username},\n\nYou requested a password reset.\nYour email is: {user.email}\n\n(Since this is a demo, assume you are verified!)",
            from_email="admin@studenthub.com",
            recipient_list=[user.email],
            fail_silently=False,
        )
        return Response({"message": f"Reset link sent to {user.email}"})
    except Exception as e:
        print("Email Error:", e) # Print error to terminal for debugging
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)