import os
import threading
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import OneTimePassword, User
from .serializers import RegisterSerializer, LoginSerializer, SetNewPasswordSerializer, UserProfileSerializer
from .utils import generate_otp
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.shortcuts import render

# Get the User model
User = get_user_model()

# --- HELPER: HTML Email Template for OTP ---
def get_otp_html_content(name, otp):
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

# --- HELPER: HTML Email Template for Password Reset ---
def get_reset_html_content(reset_link):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Reset Password</title>
    </head>
    <body style="font-family: 'Helvetica', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <div style="background-color: #ea580c; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff;">Student Hub 🎓</h1>
                <div style="color: #fff7ed; margin-top: 5px; font-size: 16px;">Password Reset</div>
            </div>

            <div style="padding: 40px 30px; color: #333333; line-height: 1.6;">
                <h3 style="margin-top: 0; color: #1f2937;">Hello! 👋</h3>
                <p>We received a request to reset the password for your Student Hub account.</p>
                
                <div style="background-color: #fff7ed; border-left: 5px solid #ea580c; padding: 15px; margin: 20px 0; color: #9a3412;">
                    <strong>Heads up:</strong> This link is valid for <strong>24 hours</strong>.
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(234, 88, 12, 0.3);">
                        Reset My Password
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">If you didn't ask for this, you can safely ignore this email.</p>
            </div>

            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
                Student Hub Team • Hyderabad, India
            </div>
        </div>
    </body>
    </html>
    """

# --- HELPER: Email Thread ---
class EmailThread(threading.Thread):
    def __init__(self, subject, message, from_email, recipient_list, html_message=None):
        self.subject = subject
        self.message = message
        self.from_email = from_email
        self.recipient_list = recipient_list
        self.html_message = html_message
        threading.Thread.__init__(self)

    def run(self):
        try:
            send_mail(
                self.subject, 
                self.message, 
                self.from_email, 
                self.recipient_list, 
                fail_silently=False,
                html_message=self.html_message
            ) 
            print(f"✅ Email sent to {self.recipient_list}")
        except Exception as e:
            print(f"❌ Email failed: {e}")

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
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        existing_user = User.objects.filter(email=email).first()

        if existing_user:
            if existing_user.is_active:
                 return Response({"error": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                otp_code = generate_otp()
                OneTimePassword.objects.update_or_create(user=existing_user, defaults={'code': otp_code})
                subject = f"[{otp_code}] Verification Code - Student Hub 🎓"
                html_content = get_otp_html_content(existing_user.first_name, otp_code)
                EmailThread(subject, f"Code: {otp_code}", settings.DEFAULT_FROM_EMAIL, [existing_user.email], html_message=html_content).start()
                return Response({"message": "Account exists but not verified. New OTP sent!"}, status=status.HTTP_200_OK)

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response({"message": "User created. Check email for OTP."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        user = serializer.save()
        user.is_active = False 
        user.save()
        otp_code = generate_otp()
        OneTimePassword.objects.create(user=user, code=otp_code)
        subject = f"[{otp_code}] Verification Code - Student Hub 🎓"
        html_content = get_otp_html_content(user.first_name, otp_code)
        EmailThread(subject, f"Code: {otp_code}", settings.DEFAULT_FROM_EMAIL, [user.email], html_message=html_content).start()

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
                return Response({'message': 'Account verified!'}, status=status.HTTP_200_OK)
            return Response({'message': 'Already verified.'}, status=status.HTTP_200_OK)
        except OneTimePassword.DoesNotExist:
            return Response({'message': 'Invalid OTP.'}, status=status.HTTP_404_NOT_FOUND)

# --- 4. Resend OTP ---
class ResendOTPView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            if user.is_active:
                return Response({'message': 'User already verified.'}, status=status.HTTP_400_BAD_REQUEST)
            otp_code = generate_otp()
            OneTimePassword.objects.update_or_create(user=user, defaults={'code': otp_code, 'created_at': timezone.now()})
            subject = f"[{otp_code}] New Verification Code"
            html_content = get_otp_html_content(user.first_name, otp_code)
            EmailThread(subject, f"Code: {otp_code}", settings.DEFAULT_FROM_EMAIL, [user.email], html_message=html_content).start()
            return Response({'message': 'OTP resent.'}, status=status.HTTP_200_OK)
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
            img_url = t.product.images.first().image.url if (t.product and t.product.images.exists()) else None
            days = t.get_days_left() if hasattr(t, 'get_days_left') else 0
            return {
                "id": t.id,
                "product_title": t.product.title if t.product else "Unknown",
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

# --- 6. Mark Returned ---
class MarkReturnedView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, transaction_id):
        from chat.models import Transaction
        try:
            trans = Transaction.objects.get(id=transaction_id, seller=request.user)
            if trans.transaction_type == 'rent':
                trans.status = 'returned'
                trans.save()
                return Response({"message": "Item returned."})
            return Response({"error": "Not a rental."}, status=400)
        except Transaction.DoesNotExist:
            return Response({"error": "Transaction not found."}, status=404)

# ====================================================
#  🛑 DEBUG PASSWORD RESET REQUEST 
# ====================================================
class PasswordResetRequestView(APIView):
    # This View is specifically designed to DEBUG why emails aren't sending
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        print(f"🛑 DEBUG: Password reset requested for: '{email}'")

        user = User.objects.filter(email__iexact=email).first()

        if user:
            print(f"✅ DEBUG: User found in DB: ID={user.id}, Email={user.email}")
            
            # Create Link
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            # ENSURE THIS MATCHES YOUR FRONTEND URL
            frontend_url = "https://student-hub-frontend-gw6b.onrender.com"
            reset_link = f"{frontend_url}/reset-password/{uid}/{token}"
            
            subject = 'Password Reset Request'
            html_content = get_reset_html_content(reset_link)
            
            print("⏳ DEBUG: Attempting to send email via SendGrid...")
            
            try:
                # We send Synchronously (not threaded) here so we can catch errors in the logs!
                send_mail(
                    subject=subject,
                    message=f'Reset link: {reset_link}', # Plain text fallback
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False, # CRITICAL: This will make the error print to logs
                    html_message=html_content
                )
                print("🚀 DEBUG: SendGrid accepted the email! Check SendGrid logs now.")
            except Exception as e:
                print(f"❌ DEBUG: Email sending FAILED. Error: {str(e)}")
        
        else:
            print(f"❌ DEBUG: User NOT found. The email '{email}' is not in the database.")
            # Print first 3 users to verify what IS in the database
            all_users = list(User.objects.values_list('email', flat=True)[:3])
            print(f"🧐 DEBUG: First 3 emails in DB: {all_users}")

        # Always return success to frontend for security
        return Response({'message': 'If registered, email sent.'}, status=status.HTTP_200_OK)

# --- 7. Confirm Password Reset ---
class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = SetNewPasswordSerializer
    permission_classes = [AllowAny]
    
    def patch(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Invalid Token"}, status=status.HTTP_400_BAD_REQUEST)

        if default_token_generator.check_token(user, token):
            serializer = self.serializer_class(data=request.data)
            serializer.is_valid(raise_exception=True)
            user.set_password(serializer.validated_data['password'])
            user.save()
            return Response({'message': 'Password reset successful'}, status=status.HTTP_200_OK)
        
        return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

# --- 8. User Profile ---
class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer
    def get_object(self):
        return self.request.user

# --- 9. Unlock Admin ---
def unlock_admin(request):
    return render(request, 'unlock_admin.html')
