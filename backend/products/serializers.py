# In products/serializers.py (NEW FILE)

from rest_framework import serializers
from .models import Product, ProductImage

# 1. Serializer for the Image (The Child)
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image']

# 2. Serializer for the Product (The Parent)
class ProductSerializer(serializers.ModelSerializer):
    # This allows us to see the images when we fetch a product
    images = ProductImageSerializer(many=True, read_only=True)
    
    # This write_only field lets us UPLOAD images
    # ListField means we accept a list of files (e.g., [img1, img2])
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )

    class Meta:
        model = Product
        fields = [
            'id', 'seller', 'title', 'description', 'price', 
            'category', 'condition', 'product_type', 
            'created_at', 'images', 'uploaded_images'
        ]
        # The seller is automatically set to the logged-in user, so they can't edit it
        read_only_fields = ['seller', 'created_at']

    def create(self, validated_data):
        # 1. Pop (remove) the images from the data because Product model doesn't have 'uploaded_images'
        uploaded_images = validated_data.pop('uploaded_images', [])
        
        # 2. Create the Product
        product = Product.objects.create(**validated_data)
        
        # 3. Loop through images and create ProductImage objects linked to this product
        for image in uploaded_images:
            ProductImage.objects.create(product=product, image=image)
            
        return product