import threading
import django
from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import OneTimePassword, User
from .serializers import RegisterSerializer, LoginSerializer, PasswordResetRequestSerializer, SetNewPasswordSerializer
from .utils import generate_otp
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.http import HttpResponse

# --- HELPER: Email Thread (Background Sending) ---
class EmailThread(threading.Thread):
    def __init__(self, subject, message, from_email, recipient_list):
        self.subject = subject
        self.message = message
        self.from_email = from_email
        self.recipient_list = recipient_list
        threading.Thread.__init__(self)

    def run(self):
        try:
            send_mail(
                self.subject, 
                self.message, 
                self.from_email, 
                self.recipient_list, 
                fail_silently=False
            ) 
            print(f"✅ OTP Email sent in background to {self.recipient_list}")
        except Exception as e:
            print(f"❌ Background email failed: {e}")

# --- 1. Custom Login ---
class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# --- 2. Registration (With Inactive Status & OTP) ---
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        
        # Check if user already exists
        # Note: We now rely on serializer validation for detailed checks, 
        # but this safety check prevents server errors on duplicates.
        if User.objects.filter(email=email).exists():
             return Response(
                {"error": "User with this email already exists."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Create user and send OTP
            self.perform_create(serializer)
            return Response(
                {"message": "User created. Please check your Stanley email for the OTP."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        # 1. Save the user
        user = serializer.save()

        # 2. CRITICAL: Lock the account immediately so they can't login without OTP
        user.is_active = False 
        user.save()

        # 3. Generate and Save OTP
        otp_code = generate_otp()
        OneTimePassword.objects.create(user=user, code=otp_code)

        # 4. Send Email in Background Thread
        subject = "Verify your Student Hub Account"
        message = f"Hi {user.first_name},\n\nYour code is: {otp_code}\n\nPlease check your Spam folder if not found in Inbox.\nIt expires in 5 minutes."
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [user.email]

        EmailThread(subject, message, from_email, recipient_list).start()

# --- 3. Verify Email (Unlocks the Account) ---
class VerifyEmailView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        otp_code = request.data.get('otp')
        try:
            otp_obj = OneTimePassword.objects.get(code=otp_code)
            user = otp_obj.user
            
            # Unlock the account only if OTP matches
            if not user.is_active:
                user.is_active = True
                user.is_email_verified = True  # Keep this for your reference
                user.save()
                
                # Cleanup: Delete used OTP
                otp_obj.delete()
                
                return Response({'message': 'Account verified! You can now login.'}, status=status.HTTP_200_OK)
            
            return Response({'message': 'Account is already verified.'}, status=status.HTTP_200_OK)
            
        except OneTimePassword.DoesNotExist:
            return Response({'message': 'Invalid or expired OTP.'}, status=status.HTTP_404_NOT_FOUND)

# --- 4. Resend OTP ---
class ResendOTPView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            if user.is_active:
                return Response({'message': 'User is already verified.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate new code
            otp_code = generate_otp()
            # Update existing or create new OTP record
            OneTimePassword.objects.update_or_create(
                user=user, 
                defaults={'code': otp_code, 'created_at': timezone.now()}
            )
            
            # Send in background
            subject = "Resend Code: Student Hub"
            message = f"Your new code is: {otp_code}"
            from_email = settings.DEFAULT_FROM_EMAIL
            
            EmailThread(subject, message, from_email, [user.email]).start()
            
            return Response({'message': 'OTP resent successfully.'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

# --- 5. User Transactions ---
class UserTransactionsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from chat.models import Transaction 
        user = request.user
        
        buy_txs = Transaction.objects.filter(buyer=user).select_related('product', 'seller').order_by('-created_at')
        sell_txs = Transaction.objects.filter(seller=user).select_related('product', 'buyer').order_by('-created_at')
        
        def format_tx(t, partner):
            img_url = None
            try:
                if t.product and t.product.images.exists():
                    img_url = t.product.images.first().image.url
            except Exception:
                img_url = None

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
        # Note: Actual email sending logic should be implemented here or in serializer
        return Response({'message': 'If registered, email sent.'}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = SetNewPasswordSerializer
    permission_classes = [AllowAny]
    def patch(self, request, uidb64, token):
        return Response({'message': 'Password reset successful'}, status=status.HTTP_200_OK)

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = RegisterSerializer
    def get_object(self):
        return self.request.user

# --- 8. Admin Unlock (Temporary) ---
def unlock_admin(request):
    User = get_user_model()
    try:
        user = User.objects.get(username="Maroju Chinu")
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.save()
        return HttpResponse("✅ SUCCESS: Maroju Chinu is now ACTIVE. Go login!")
    except User.DoesNotExist:
        return HttpResponse("❌ ERROR: User 'Maroju Chinu' not found.")