from django.urls import path
from .views import (
    ProductListCreateView, 
    ProductDetailView, 
    ProductImageDeleteView, 
    get_categories 
)

urlpatterns = [
    # API for Listing and Creating Products (Handles ?category=X and ?search=Y)
    path('', ProductListCreateView.as_view(), name='product-list-create'),

    # API for Single Product details (Edit/Delete)
    path('<int:pk>/', ProductDetailView.as_view(), name='product-detail'),

    # API for Deleting an Image
    path('images/<int:pk>/delete/', ProductImageDeleteView.as_view(), name='image-delete'),

    # NEW API for Categories (This fixes the dropdown)
    path('categories/', get_categories, name='get-categories'),
]