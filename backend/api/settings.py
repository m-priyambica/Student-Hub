"""
Django settings for api project.
"""
import os
import dj_database_url
from dotenv import load_dotenv
from pathlib import Path
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Force load the .env file
env_path = BASE_DIR / '.env'
load_dotenv(env_path)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-ja(807@vi$^@a+illo9%9o31u%sh3n7$43rb$%#^&)al)-w0rn')

# SECURITY WARNING: don't run with debug turned on in production!
# This automatically sets DEBUG to False if running on Render
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
    # --- 1. Cloudinary Storage MUST be at the top ---
    'cloudinary_storage',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    # --- 2. Staticfiles comes AFTER Cloudinary ---
    'django.contrib.staticfiles',
    
    # --- 3. Cloudinary SDK ---
    'cloudinary',

    # --- 4. Third-party apps ---
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',

    # --- 5. Our local apps ---
    'users',
    'products',
    'chat',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # <--- Added for Static Files
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
        'DIRS': [],
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
        # If running locally, use SQLite
        default='sqlite:///' + os.path.join(BASE_DIR, 'db.sqlite3'),
        # If running on Render, use the Neon URL
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


# --- Static Files Configuration (Django 5 Compatible) ---
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
# Note: MEDIA_ROOT is handled by Cloudinary backend automatically

# --- Django 5 Storage Configuration (The Fix) ---
STORAGES = {
    "default": {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.StaticFilesStorage",
    },
}

# --- Compatibility Alias for Cloudinary (Crucial Fix for AttributeError) ---
STATICFILES_STORAGE = "whitenoise.storage.StaticFilesStorage"


# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Tell Django to use our custom User model
AUTH_USER_MODEL = 'users.User'

# --- CORS Configuration ---
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # Your React dev server
     "http://127.0.0.1:5173",
    'https://student-hub-frontend-gw6b.onrender.com'
]
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
# --- DRF Configuration ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

# --- SimpleJWT Configuration ---
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_USER_MODEL': AUTH_USER_MODEL,
}

# --- Custom Authentication Backend ---
AUTHENTICATION_BACKENDS = [
    'users.backends.EmailOrUsernameBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# --- Cloudinary Configuration ---
# Ensure these environment variables are set in Render Dashboard
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.environ.get('CLOUDINARY_API_KEY'),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
}

# --- Email Configuration (Gmail SMTP) ---

# --- EMAIL CONFIGURATION (SendGrid API) ---
# We use the API backend to bypass Render's blocked ports (587/465)
EMAIL_BACKEND = "sendgrid_backend.SendgridBackend"

# The API Key you just created
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")

# Set to False so emails actually send
SENDGRID_SANDBOX_MODE_IN_DEBUG = False

# The email you just verified
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "priyambica1@gmail.com")
# Change this to True to see errors in the Render log
EMAIL_FAIL_SILENTLY = False
