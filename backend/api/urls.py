from django.contrib import admin
from django.urls import path, include
# Assuming you have an api/views.py for specific global logic, otherwise remove this import
from . import views 
from users.views import unlock_admin

urlpatterns = [
    # Admin Route
    path('admin/', admin.site.urls),
    
    # Custom Admin Unlock (if utilizing your custom logic)
    path('unlock-admin/', unlock_admin),

    # App Endpoints
    path('api/auth/', include('users.urls')), 
    path('api/products/', include('products.urls')),
    path('api/chat/', include('chat.urls')),

    # User Profile & Reset Logic
    # Note: Ideally, these should be inside users/urls.py, but they will work here if views.py exists
    path('auth/profile/', views.user_profile, name='user_profile'),
    path('auth/request-password-reset/', views.trigger_password_reset, name='trigger_password_reset'),
    path('api/auth/password-reset-confirm/<uidb64>/<token>/', views.confirm_password_reset, name='confirm_password_reset'),
]