from django.urls import path
from . import views

urlpatterns = [
    path('start/', views.start_chat, name='start_chat'),
    path('rooms/', views.get_rooms, name='get_rooms'),
    path('transaction/create/', views.create_transaction, name='create_transaction'),
    
    # --- Add these two lines ---
    path('<int:room_id>/messages/', views.get_messages, name='get_messages'),
    path('<int:room_id>/send/', views.send_message, name='send_message'),
    path('<int:room_id>/delete/', views.delete_room, name='delete_room'),
]