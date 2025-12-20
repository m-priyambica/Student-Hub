# In products/models.py (UPDATED for Multiple Images)

from django.db import models
from django.conf import settings

class Product(models.Model):
    # --- Choices ---
    CATEGORY_CHOICES = [
        ('electronics', 'Electronics'),
        ('books', 'Books & Notes'),
        ('furniture', 'Dorm Furniture'),
        ('clothing', 'Clothing'),
        ('other', 'Other'),
    ]

    CONDITION_CHOICES = [
        ('new', 'Brand New'),
        ('used', 'Used / Second Hand'),
    ]

    TYPE_CHOICES = [
        ('sale', 'For Sale'),
        ('rent', 'For Rent'),
    ]

    # 1. Link to Seller
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='products'
    )
    
    # 2. Basic Details
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    condition = models.CharField(max_length=10, choices=CONDITION_CHOICES, default='used')
    product_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='sale')

    # 3. Timestamps
    created_at = models.DateTimeField(auto_now_add=True) 
    updated_at = models.DateTimeField(auto_now=True)    

    def __str__(self):
        return f"{self.title} ({self.product_type}) - ₹{self.price}"

# --- NEW MODEL FOR MULTIPLE IMAGES ---
class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='product_images/')
    
    def __str__(self):
        return f"Image for {self.product.title}"