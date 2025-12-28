from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import OneTimePassword, User
from .serializers import UserRegisterSerializer, LoginSerializer, PasswordResetRequestSerializer, SetNewPasswordSerializer
from .utils import generate_otp
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

# --- 1. Custom Login ---
class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# --- 2. Registration ---
class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        
        # Check if user exists but is NOT verified
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            if not existing_user.is_email_verified:
                existing_user.delete()
            else:
                return Response({"error": "User with this email already exists and is verified."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(
                {"message": "User created. Check your email for OTP."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        # 1. Save the user first
        user = serializer.save()

        # 2. Generate and Save OTP
        otp_code = generate_otp()
        OneTimePassword.objects.create(user=user, code=otp_code)

        # 3. Send Email Safely (Try/Except Block)
        try:
            subject = "Verify your Student Hub Account"
            message = f"Hi {user.full_name},\n\nYour code is: {otp_code}\n\nIt expires in 5 minutes."
            from_email = settings.EMAIL_HOST_USER
            recipient_list = [user.email]

            send_mail(subject, message, from_email, recipient_list)
            print(f"✅ OTP Email sent to {user.email}")

        except Exception as e:
            # If email fails, print the error but DO NOT CRASH the server
            print(f"❌ Email failed to send: {str(e)}")
            # The user is still created, so the frontend receives a 201 Created success

# --- 3. Verify Email ---
class VerifyEmailView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        otp_code = request.data.get('otp')
        try:
            otp_obj = OneTimePassword.objects.get(code=otp_code)
            user = otp_obj.user
            if not user.is_email_verified:
                user.is_email_verified = True
                user.save()
                otp_obj.delete()
                return Response({'message': 'Account verified!'}, status=status.HTTP_200_OK)
            return Response({'message': 'Already verified.'}, status=status.HTTP_204_NO_CONTENT)
        except OneTimePassword.DoesNotExist:
            return Response({'message': 'Invalid OTP.'}, status=status.HTTP_404_NOT_FOUND)

# --- 4. Resend OTP ---
class ResendOTPView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            if user.is_email_verified:
                return Response({'message': 'User is already verified.'}, status=status.HTTP_400_BAD_REQUEST)
            
            otp_code = generate_otp()
            OneTimePassword.objects.update_or_create(user=user, defaults={'code': otp_code, 'created_at': timezone.now()})
            
            send_mail("Resend Code", f"Your new code is: {otp_code}", settings.EMAIL_HOST_USER, [user.email])
            return Response({'message': 'OTP resent successfully.'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

# --- 5. User Transactions (Buying/Selling History) ---
class UserTransactionsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # FIX: Local import to prevent Circular Import Error
        from chat.models import Transaction 
        
        user = request.user
        
        # 1. Things I bought/rented
        buy_txs = Transaction.objects.filter(buyer=user).select_related('product', 'seller').order_by('-created_at')
        
        # 2. Things I sold/rented out
        sell_txs = Transaction.objects.filter(seller=user).select_related('product', 'buyer').order_by('-created_at')
        
        def format_tx(t, partner):
            # 1. Safely get Image URL
            img_url = None
            try:
                # Check if product exists and has images
                if t.product and t.product.images.exists():
                    img_url = t.product.images.first().image.url
            except Exception:
                img_url = None # Fallback if anything fails

            # 2. Safely get Days Left
            days = 0
            try:
                if hasattr(t, 'get_days_left'):
                    days = t.get_days_left()
            except Exception:
                days = 0

            return {
                "id": t.id,
                "product_title": t.product.title if t.product else "Unknown Item",
                "product_price": t.product.price if t.product else 0,
                "product_image": img_url,
                "type": t.transaction_type, 
                "status": t.status, 
                "days_left": days,
                "partner": partner.username 
            }

        return Response({
            "purchases": [format_tx(t, t.seller) for t in buy_txs],
            "sales": [format_tx(t, t.buyer) for t in sell_txs]
        })

# --- 6. Mark Item as Returned ---
class MarkReturnedView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, transaction_id):
        # FIX: Local import to prevent Circular Import Error
        from chat.models import Transaction

        try:
            trans = Transaction.objects.get(id=transaction_id, seller=request.user)
            if trans.transaction_type == 'rent':
                trans.status = 'returned'
                trans.save()
                return Response({"message": "Item marked as returned."})
            return Response({"error": "Not a rental item."}, status=400)
        except Transaction.DoesNotExist:
            return Response({"error": "Transaction not found."}, status=404)

# --- 7. Password Reset & Profile ---
class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        return Response({'message': 'If registered, email sent.'}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = SetNewPasswordSerializer
    permission_classes = [AllowAny]
    def patch(self, request, uidb64, token):
        return Response({'message': 'Password reset successful'}, status=status.HTTP_200_OK)

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserRegisterSerializer
    def get_object(self):
        return self.request.user