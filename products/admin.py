# In products/admin.py (FIXED & UPDATED)

from django.contrib import admin
from .models import Product, ProductImage

# This lets us upload images directly inside the Product page
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1  # Shows 1 empty slot by default (you can click "Add another" for more)
    max_num = 5 # Limit to 5 images per product, as you requested

class ProductAdmin(admin.ModelAdmin): # <--- FIXED: Removed '.site'
    # 1. Columns to show in the list
    list_display = (
        'title', 
        'seller', 
        'price', 
        'category', 
        'condition', 
        'product_type', 
        'created_at'
    )
    
    # 2. Filters and Search
    list_filter = ('category', 'condition', 'product_type', 'created_at')
    search_fields = ('title', 'description', 'seller__username')
    
    # 3. Add the images inline
    inlines = [ProductImageInline]

# Register the model
admin.site.register(Product, ProductAdmin)