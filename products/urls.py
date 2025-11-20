# In products/urls.py (NEW FILE)

from django.urls import path
from .views import ProductListCreateView, ProductDetailView

urlpatterns = [
    # /api/products/
    path('', ProductListCreateView.as_view(), name='product-list-create'),
    
    # /api/products/5/ (where 5 is the ID)
    path('<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
]