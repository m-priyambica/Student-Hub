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
# Automatically set DEBUG to False if running on Render
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
    'django.contrib.postgres',
    
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
       # Local fallback to SQLite
       default='sqlite:///' + os.path.join(BASE_DIR, 'db.sqlite3'),
       # Render/Production optimization
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


# --- Static Files Configuration ---
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'

# --- Storage Configuration (Cloudinary + WhiteNoise) ---
STORAGES = {
    "default": {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.StaticFilesStorage",
    },
}

STATICFILES_STORAGE = "whitenoise.storage.StaticFilesStorage"

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# --- Custom Authentication Backend (CRITICAL FOR LOGGING IN) ---
# Merged from your old file. Without this, custom login logic might fail.
AUTHENTICATION_BACKENDS = [
    'users.backends.EmailOrUsernameBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# --- CORS Configuration ---
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173', 
    "http://127.0.0.1:5173",
    'https://student-hub-frontend-gw6b.onrender.com'
]
CORS_ALLOW_ALL_ORIGINS = True # Be careful with this in production, but okay for dev/student projects
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

# --- Cloudinary Configuration ---
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.environ.get('CLOUDINARY_API_KEY'),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
}

# --- EMAIL CONFIGURATION ---
# Note: Gmail SMTP (port 587) is blocked by Render. 
# We must use the SendGrid API backend from your old config.

if 'RENDER' in os.environ:
    # Production: Use SendGrid API
    EMAIL_BACKEND = "sendgrid_backend.SendgridBackend"
    SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
    SENDGRID_SANDBOX_MODE_IN_DEBUG = False
    DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "priyambica1@gmail.com")
else:
    # Local Development: Print emails to console
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

EMAIL_FAIL_SILENTLY = False