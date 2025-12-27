from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.db.models import Q
from .models import Product, ProductImage
from .serializers import ProductSerializer

# ---------------------------------------------------------
# 1. List all Products & Create new Product
# ---------------------------------------------------------
class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # FIX: Ensure this is 'created_at' to match your models.py
        queryset = Product.objects.all().order_by('-created_at')
        
        # Get params from React
        search_query = self.request.query_params.get('search', None)
        category_filter = self.request.query_params.get('category', None)

        # Apply Search
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) | 
                Q(description__icontains=search_query)
            )

        # Apply Category Filter
        if category_filter and category_filter != "All":
            queryset = queryset.filter(category__iexact=category_filter)

        return queryset

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


# ---------------------------------------------------------
# 2. Retrieve, Update, Delete specific Product
# ---------------------------------------------------------
class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        return Product.objects.all()


# ---------------------------------------------------------
# 3. Delete specific Image
# ---------------------------------------------------------
class ProductImageDeleteView(generics.DestroyAPIView):
    queryset = ProductImage.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        try:
            image = self.get_object()
            if image.product.seller != request.user:
                return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
            image.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProductImage.DoesNotExist:
            return Response({"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND)


# ---------------------------------------------------------
# 4. Get Dynamic Categories
# ---------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def get_categories(request):
    categories = Product.objects.values_list('category', flat=True).distinct()
    category_list = [cat for cat in categories if cat]
    defaults = ["Textbooks", "Electronics", "Stationery", "Sports"]
    final_list = sorted(list(set(defaults + category_list)))
    
    if "All" not in final_list:
        final_list.insert(0, "All")
        
    return Response(final_list)