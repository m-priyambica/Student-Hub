from django.urls import path
from .views import (
    MarkReturnedView, RegisterView, UserTransactionsView, VerifyEmailView, LoginView, UserProfileView,
    PasswordResetRequestView, PasswordResetConfirmView, ResendOTPView # Import ResendOTPView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'), 
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset-confirm/<uidb64>/<token>/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('transactions/', UserTransactionsView.as_view(), name='user-transactions'),
    path('transactions/<int:transaction_id>/return/', MarkReturnedView.as_view(), name='mark-returned'),
]