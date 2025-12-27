from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import Room, Message, Transaction
from products.models import Product
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_chat(request):
    product_id = request.data.get('product_id')
    try:
        product = Product.objects.get(id=product_id)
        if product.seller == request.user:
            return Response({"error": "You cannot chat with yourself"}, status=400)
        
        room, created = Room.objects.get_or_create(buyer=request.user, product=product)
        return Response({"message": "Chat started", "room_id": room.id})
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, room_id):
    try:
        room = Room.objects.get(id=room_id)
        # Security: Only participants can read
        if request.user != room.buyer and request.user != room.product.seller:
            return Response({"error": "Not allowed"}, status=403)
            
        messages = Message.objects.filter(room=room).order_by('timestamp')
        data = [{"id": m.id, "text": m.text, "senderId": m.sender.id, "timestamp": m.timestamp} for m in messages]
        return Response(data)
    except Room.DoesNotExist:
        return Response({"error": "Room not found"}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, room_id):
    try:
        room = Room.objects.get(id=room_id)
        text = request.data.get('text')
        
        # Security: Only participants can send
        if request.user != room.buyer and request.user != room.product.seller:
            return Response({"error": "Not allowed"}, status=403)

        # SAVE TO DB
        msg = Message.objects.create(room=room, sender=request.user, text=text)
        return Response({"id": msg.id, "text": msg.text, "senderId": msg.sender.id, "timestamp": msg.timestamp})
    except Room.DoesNotExist:
        return Response({"error": "Room not found"}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_transaction(request):
    user = request.user
    data = request.data
    
    try:
        product = Product.objects.get(id=data.get('product_id'))
        buyer = User.objects.get(id=data.get('buyer_id'))
        
        if product.seller != user:
            return Response({"error": "Only seller can confirm"}, status=403)

        rent_end = None
        if data.get('type') == 'rent':
            days = int(data.get('days', 15))
            rent_end = timezone.now() + timedelta(days=days)

        Transaction.objects.create(
            product=product, seller=user, buyer=buyer, transaction_type=data.get('type'),
            rent_end_date=rent_end, status='active' if data.get('type') == 'rent' else 'completed'
        )
        return Response({"message": "Transaction recorded!"})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_rooms(request):
    user = request.user
    # Fetch rooms where user is Buyer OR Seller and prefetch messages
    rooms = Room.objects.filter(Q(buyer=user) | Q(product__seller=user)).select_related('product', 'buyer', 'product__seller').prefetch_related('messages')
    
    data = []
    for room in rooms:
        # Get Last Message Info for Notifications
        last_msg = room.messages.order_by('-timestamp').first()
        
        # --- FIX: Define last_sender_id based on last_msg ---
        last_sender_id = last_msg.sender.id if last_msg else None
        # ----------------------------------------------------

        data.append({
            "id": room.id,
            "buyer": { 
                "id": room.buyer.id, 
                "username": room.buyer.username 
            },
            "seller": { 
                "id": room.product.seller.id, 
                "username": room.product.seller.username 
            },
            "product": {
                "id": room.product.id,
                "title": room.product.title,
                "price": room.product.price,
                "product_type": room.product.product_type,
                "seller": room.product.seller.id 
            },
            # NEW FIELDS FOR NOTIFICATIONS
            "last_sender_id": last_sender_id,
            "last_message_time": last_msg.timestamp if last_msg else None
        })
    return Response(data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_room(request, room_id):
    try:
        room = Room.objects.get(id=room_id)
        # Security: Only participants can delete
        if request.user == room.buyer or request.user == room.product.seller:
            room.delete()
            return Response({"message": "Chat deleted successfully"})
        return Response({"error": "Not allowed"}, status=403)
    except Room.DoesNotExist:
        return Response({"error": "Room not found"}, status=404)