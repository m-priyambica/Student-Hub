from rest_framework import serializers
from .models import ChatRoom, Message

class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.ReadOnlyField(source='sender.email')
    sender_name = serializers.ReadOnlyField(source='sender.full_name')
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_email', 'sender_name', 'text', 'attachment', 'timestamp', 'is_read']

class ChatRoomSerializer(serializers.ModelSerializer):
    product_title = serializers.ReadOnlyField(source='product.title')
    product_image = serializers.SerializerMethodField()
    other_member_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'member1', 'member2', 'product', 'product_title', 'product_image', 'other_member_name', 'updated_at']

    def get_product_image(self, obj):
        first_image = obj.product.images.first()
        if first_image:
            return first_image.image.url
        return None

    def get_other_member_name(self, obj):
        request = self.context.get('request')
        if request and request.user == obj.member1:
            return obj.member2.full_name
        return obj.member1.full_name