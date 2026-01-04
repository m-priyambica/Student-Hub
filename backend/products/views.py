from rest_framework import generics, permissions, status, parsers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django.db.models import Q
from django.db import connection
from .models import Product, ProductImage
from .serializers import ProductSerializer

# Try to import PostgreSQL specific functions
try:
    from django.contrib.postgres.search import TrigramSimilarity
    from django.db.models.functions import Greatest
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False

# ---------------------------------------------------------
# 1. List all Products & Create new Product
# ---------------------------------------------------------
class ProductListCreateView(generics.ListCreateAPIView):
    # This class name matches what your urls.py is looking for!
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        # Start with all products
        queryset = Product.objects.all().order_by('-created_at')
        
        # Get params from React
        search_query = self.request.query_params.get('search', None)
        category_filter = self.request.query_params.get('category', None)
        condition_filter = self.request.query_params.get('condition', None)
        type_filter = self.request.query_params.get('product_type', None)

        # --- SMART SEARCH FILTER ---
        if search_query:
            # Check if we are on Render (PostgreSQL)
            is_postgres = POSTGRES_AVAILABLE and 'postgresql' in connection.vendor

            if is_postgres:
                # --- FUZZY SEARCH (Handles Typos: "cosmatics" -> "Cosmetics") ---
                queryset = queryset.annotate(
                    similarity=Greatest(
                        TrigramSimilarity('title', search_query),
                        TrigramSimilarity('description', search_query),
                        TrigramSimilarity('category', search_query),
                    )
                ).filter(similarity__gt=0.1).order_by('-similarity')
            else:
                # --- BASIC SEARCH (Local SQLite Fallback) ---
                queryset = queryset.filter(
                    Q(title__icontains=search_query) | 
                    Q(description__icontains=search_query) |
                    Q(category__icontains=search_query)
                )

        # --- FILTERS ---
        if category_filter and category_filter != "All":
            queryset = queryset.filter(category__icontains=category_filter)

        if condition_filter and condition_filter != 'all':
            queryset = queryset.filter(condition=condition_filter)

        if type_filter and type_filter != 'all':
            queryset = queryset.filter(product_type=type_filter)

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