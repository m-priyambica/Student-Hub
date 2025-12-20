from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer
from products.models import Product

class CreateChatRoomView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatRoomSerializer

    def post(self, request):
        product_id = request.data.get('product_id')
        try:
            product = Product.objects.get(id=product_id)
            existing_room = ChatRoom.objects.filter(product=product).filter(
                Q(member1=request.user, member2=product.seller) | 
                Q(member1=product.seller, member2=request.user)
            ).first()

            if existing_room:
                return Response({'room_id': existing_room.id, 'message': 'Chat exists'}, status=status.HTTP_200_OK)

            new_room = ChatRoom.objects.create(
                member1=request.user, member2=product.seller, product=product
            )
            return Response({'room_id': new_room.id, 'message': 'Chat started'}, status=status.HTTP_201_CREATED)

        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

class UserChatListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatRoomSerializer

    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(Q(member1=user) | Q(member2=user)).order_by('-updated_at')

class MessageListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer
    parser_classes = [MultiPartParser, FormParser] 

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        return Message.objects.filter(room__id=room_id).order_by('timestamp')

    def perform_create(self, serializer):
        room_id = self.kwargs['room_id']
        room = ChatRoom.objects.get(id=room_id)
        serializer.save(sender=self.request.user, room=room)
        room.save()