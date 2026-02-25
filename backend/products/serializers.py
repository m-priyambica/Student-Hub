from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Product, ProductImage

User = get_user_model()

# --- 1. UNIVERSAL SELLER SERIALIZER ---
class SellerSerializer(serializers.ModelSerializer):
    branch = serializers.SerializerMethodField()
    semester = serializers.SerializerMethodField()
    section = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'full_name', 'username', 'branch', 'semester', 'section']

    def get_student_detail(self, user_obj, field_name):
        """
        This function hunts for the data in 3 places:
        1. The User model itself.
        2. Any OneToOne connected Profile model (Automatic Detection).
        3. Common names like 'profile' or 'userprofile'.
        """
        # 1. Check directly on User model
        if hasattr(user_obj, field_name):
            val = getattr(user_obj, field_name)
            if val: return str(val)

        # 2. "Smart Search" - Scan for any attached Profile model
        # This loops through all links connected to the User
        for relation in user_obj._meta.get_fields():
            # We look for One-to-One links (which Profiles usually are)
            if relation.one_to_one and relation.auto_created:
                try:
                    # Get the related object (e.g., the Profile)
                    related_profile = getattr(user_obj, relation.name, None)
                    # Check if this profile has the field we want (branch, sem, etc)
                    if related_profile and hasattr(related_profile, field_name):
                        val = getattr(related_profile, field_name)
                        if val: return str(val)
                except Exception:
                    continue

        return "" # Data really doesn't exist

    # Map the fields using the smart search
    def get_branch(self, obj): return self.get_student_detail(obj, 'branch')
    def get_semester(self, obj): return self.get_student_detail(obj, 'semester')
    def get_section(self, obj): return self.get_student_detail(obj, 'section')


# --- 2. IMAGE SERIALIZER ---
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image']


# --- 3. PRODUCT SERIALIZER ---
class ProductSerializer(serializers.ModelSerializer):
    seller = SellerSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    
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
        read_only_fields = ['created_at'] 

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        product = Product.objects.create(**validated_data)
        for image in uploaded_images:
            ProductImage.objects.create(product=product, image=image)
        return product

    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        for image in uploaded_images:
            ProductImage.objects.create(product=instance, image=image)
        return instance