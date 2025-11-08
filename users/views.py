# In users/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import UserRegisterSerializer

class RegisterView(generics.CreateAPIView):
    """
    API View for registering a new user.
    """
    
    # We use our custom UserRegisterSerializer
    serializer_class = UserRegisterSerializer
    
    # This is a public endpoint, so we allow anyone (even unauthenticated users)
    # to access it.
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        """
        Override the default 'create' method to provide a custom
        success message.
        """
        serializer = self.get_serializer(data=request.data)
        
        # This is where the serializer's 'validate_email' and other checks run
        if serializer.is_valid():
            # If valid, this calls the serializer's 'create' method
            self.perform_create(serializer)
            
            # Send back a custom success response
            return Response(
                {"message": "User created successfully. Please check your email for OTP."},
                status=status.HTTP_201_CREATED
            )
        
        # If not valid, return the errors from the serializer
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        # This is the line that actually saves the user to the database
        serializer.save()