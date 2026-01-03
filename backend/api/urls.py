
from django.contrib import admin
from django.urls import path, include
from . import views
from users.views import unlock_admin

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/auth/', include('users.urls')),  # Include the URLs from the users app
    path('api/products/', include('products.urls')),
    path('api/chat/', include('chat.urls')),
    path('auth/profile/', views.user_profile, name='user_profile'),
    path('auth/request-password-reset/', views.trigger_password_reset, name='trigger_password_reset'),
    path('admin/', admin.site.urls),
    path('unlock-admin/', unlock_admin)
]
