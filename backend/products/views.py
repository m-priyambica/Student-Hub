# In products/views.py

from rest_framework import generics, filters, parsers
from .models import Product
from .serializers import ProductSerializer
from users.permissions import IsEmailVerified, IsSellerOrReadOnly # Import our gatekeepers

class ProductListCreateView(generics.ListCreateAPIView):
    """
    GET: List all products.
    POST: Create a new product (Requires verified email).
    """
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    
    # The Gatekeeper: Only verified users can enter
    permission_classes = [IsEmailVerified]
    
    # Essential for uploading images!
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    
    # Add search capability
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'category']

    def perform_create(self, serializer):
        # Automatically set the seller to the currently logged-in user
        serializer.save(seller=self.request.user)

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: View details of a product.
    PUT/DELETE: Edit/Delete a product (Only the Seller can do this).
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    
    # Only verified users can view, ONLY SELLER can edit/delete
    permission_classes = [IsEmailVerified, IsSellerOrReadOnly]