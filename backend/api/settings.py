"""
Django settings for api project.
"""
import os
import dj_database_url
from dotenv import load_dotenv
from pathlib import Path
from datetime import timedelta

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Force load the .env file
env_path = BASE_DIR / '.env'
load_dotenv(env_path)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-ja(807@vi$^@a+illo9%9o31u%sh3n7$43rb$%#^&)al)-w0rn')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = 'RENDER' not in os.environ

ALLOWED_HOSTS = [
    "student-hub-quqc.onrender.com", 
    "localhost", 
    "127.0.0.1"
]
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Application definition
INSTALLED_APPS = [
    'cloudinary_storage', # 1. Cloudinary Storage First
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',
    'cloudinary',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    # Your apps
    'users',
    'products',
    'chat',
    # SendGrid App (Required if using the library)
    'sendgrid_backend',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [], # Ensure you have your templates folder if using HTML emails
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'api.wsgi.application'

# Database
DATABASES = {
   'default': dj_database_url.config(
       default='sqlite:///' + os.path.join(BASE_DIR, 'db.sqlite3'),
       conn_max_age=600
   )
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static Files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'

STORAGES = {
    "default": {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.StaticFilesStorage",
    },
}
STATICFILES_STORAGE = "whitenoise.storage.StaticFilesStorage"

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'users.User'

# CORS
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173', 
    "http://127.0.0.1:5173",
    'https://student-hub-frontend-gw6b.onrender.com'
]
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# DRF
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_USER_MODEL': AUTH_USER_MODEL,
}

AUTHENTICATION_BACKENDS = [
    'users.backends.EmailOrUsernameBackend',
    'django.contrib.auth.backends.ModelBackend',
]

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.environ.get('CLOUDINARY_API_KEY'),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
}

# --- EMAIL CONFIGURATION (SENDGRID) ---
# This matches your original request.

EMAIL_BACKEND = "sendgrid_backend.SendgridBackend"
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")

# Toggle Sandbox Mode
# If DEBUG is True (Local), use Sandbox (fake sending)
# If DEBUG is False (Render), Send Real Emails
SENDGRID_SANDBOX_MODE_IN_DEBUG = False 

# IMPORTANT: This email MUST be verified in SendGrid Dashboard
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "priyambica1@gmail.com")

# Ensure we see errors in logs if it fails
EMAIL_FAIL_SILENTLY = False