import threading
import django
from rest_framework import generics, status
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

# --- HELPER: HTML Email Template ---
def get_otp_html_content(name, otp):
    """
    Returns a beautiful HTML email string.
    """
    return f"""
   <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Email - Student Hub</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <div style="background-color: #ea580c; padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">Student Hub 🎓</h1>
            <p style="color: #fff7ed; margin: 5px 0 0; font-size: 16px;">The Campus Marketplace</p>
        </div>

        <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin-top: 0;">Welcome to the Squad, {name}! 👋</h2>
            
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
                You're almost in! We built <strong>Student Hub</strong> because we were tired of being broke and wanted a better way to trade gear on campus.
                <br><br>
                <span style="background-color: #fff7ed; padding: 5px 10px; border-radius: 4px; border-left: 3px solid #ea580c; display: block;">
                    <strong>Just a heads up:</strong> We are 100% student-run (not the college admin). We built this for us, by us.
                </span>
            </p>

            <div style="background-color: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <span style="display: block; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Your Entry Code</span>
                <span style="font-size: 36px; font-weight: 900; color: #ea580c; letter-spacing: 5px;">{otp}</span>
            </div>
            <p style="color: #9ca3af; font-size: 13px; text-align: center; margin-top: -15px; margin-bottom: 30px;">
                Grab it quick! Expires in 5 minutes.
            </p>

            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">Here is how you own the app:</h3>
            
            <div style="margin-bottom: 20px;">
                <strong style="color: #ea580c; font-size: 16px;">💸 List It. Rent It. Earn it</strong>
                <p style="color: #4b5563; font-size: 14px; margin: 5px 0 0; line-height: 1.5;">
                    Got a drafter, books, or gadgets gathering dust? <strong>Add Product</strong> easily. You can choose to <strong>Sell</strong> it permanently or just <strong>Rent</strong> it out for the semester to make some quick pocket money.
                </p>
            </div>

            <div style="margin-bottom: 20px;">
                <strong style="color: #ea580c; font-size: 16px;">🤝 Zero Fees, Direct Deals</strong>
                <p style="color: #4b5563; font-size: 14px; margin: 5px 0 0; line-height: 1.5;">
                    We don't touch your money. There are <strong>no payment gateways</strong> here. You find a buyer, use our secure <strong>Chat</strong> to fix a meeting spot (like the canteen or library), and handle the payment your way (Cash/UPI).
                </p>
            </div>

            <div style="margin-bottom: 0;">
                <strong style="color: #ea580c; font-size: 16px;">😎 Track Your Empire</strong>
                <p style="color: #4b5563; font-size: 14px; margin: 5px 0 0; line-height: 1.5;">
                    Head over to your <strong>Profile</strong> to see exactly what you've listed. We've organized your history into <strong>'Lent'</strong> and <strong>'Sold'</strong> sections so you never lose track of your stuff.
                </p>
            </div>

        </div>

        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Made with ❤️ and late-night coffee by the Student Hub Team.<br>
                Hyderabad, India
            </p>
        </div>
    </div>
</body>
</html>
    """

# --- HELPER: Email Thread (Now supports HTML) ---
class EmailThread(threading.Thread):
    def __init__(self, subject, message, from_email, recipient_list, html_message=None):
        self.subject = subject
        self.message = message
        self.from_email = from_email
        self.recipient_list = recipient_list
        self.html_message = html_message  # <--- Store HTML content
        threading.Thread.__init__(self)

    def run(self):
        try:
            # send_mail supports an 'html_message' argument!
            send_mail(
                self.subject, 
                self.message,  # Plain text fallback
                self.from_email, 
                self.recipient_list, 
                fail_silently=False,
                html_message=self.html_message # <--- Send the beautiful HTML version
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

# --- 2. Registration (With HTML Email) ---
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        
        if User.objects.filter(email=email).exists():
             return Response(
                {"error": "User with this email already exists."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(
                {"message": "User created. Please check your Stanley email for the OTP."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        user = serializer.save()
        user.is_active = False 
        user.save()

        otp_code = generate_otp()
        OneTimePassword.objects.create(user=user, code=otp_code)

        # --- NEW: Generate HTML Content ---
        subject = "Welcome to Student Hub! 🎓 Verification Code"
        # Plain text version for old email clients
        plain_message = f"Hi {user.first_name}, Your code is: {otp_code}"
        # HTML version
        html_content = get_otp_html_content(user.first_name, otp_code)
        
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [user.email]

        # Pass html_message to the thread
        EmailThread(subject, plain_message, from_email, recipient_list, html_message=html_content).start()

# --- 3. Verify Email ---
class VerifyEmailView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        otp_code = request.data.get('otp')
        try:
            otp_obj = OneTimePassword.objects.get(code=otp_code)
            user = otp_obj.user
            
            if not user.is_active:
                user.is_active = True
                user.is_email_verified = True
                user.save()
                otp_obj.delete()
                return Response({'message': 'Account verified! You can now login.'}, status=status.HTTP_200_OK)
            
            return Response({'message': 'Account is already verified.'}, status=status.HTTP_200_OK)
            
        except OneTimePassword.DoesNotExist:
            return Response({'message': 'Invalid or expired OTP.'}, status=status.HTTP_404_NOT_FOUND)

# --- 4. Resend OTP (With HTML Email) ---
class ResendOTPView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            if user.is_active:
                return Response({'message': 'User is already verified.'}, status=status.HTTP_400_BAD_REQUEST)
            
            otp_code = generate_otp()
            OneTimePassword.objects.update_or_create(
                user=user, 
                defaults={'code': otp_code, 'created_at': timezone.now()}
            )
            
            # --- NEW: HTML for Resend ---
            subject = "New Verification Code 🔐"
            plain_message = f"Your new code is: {otp_code}"
            html_content = get_otp_html_content(user.first_name, otp_code)
            
            EmailThread(subject, plain_message, settings.DEFAULT_FROM_EMAIL, [user.email], html_message=html_content).start()
            
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