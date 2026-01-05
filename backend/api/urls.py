from django.contrib import admin
from django.urls import path, include
# --- CORRECT IMPORT: Import views from 'users' app, not 'api' ---
from users import views as user_views 
from users.views import unlock_admin

urlpatterns = [
    # Admin Route
    path('admin/', admin.site.urls),
    
    # Custom Admin Unlock
    path('unlock-admin/', unlock_admin),

    # App Endpoints (Delegating to app-specific urls.py)
    path('api/auth/', include('users.urls')), 
    path('api/products/', include('products.urls')),
    path('api/chat/', include('chat.urls')),

    # --- CRITICAL FIXES FOR PASSWORD RESET & PROFILE ---
    # We must use user_views.ClassName.as_view() because they are Class-Based Views now.
    
    path('auth/profile/', user_views.UserProfileView.as_view(), name='user_profile'),
    
    path('auth/request-password-reset/', user_views.PasswordResetRequestView.as_view(), name='trigger_password_reset'),
    
    path('api/auth/password-reset-confirm/<uidb64>/<token>/', user_views.PasswordResetConfirmView.as_view(), name='confirm_password_reset'),
]