from django.urls import path
from .views import CreateChatRoomView, UserChatListView, MessageListCreateView

urlpatterns = [
    path('start/', CreateChatRoomView.as_view(), name='start_chat'),
    path('my-chats/', UserChatListView.as_view(), name='my_chats'),
    path('<int:room_id>/messages/', MessageListCreateView.as_view(), name='chat_messages'),
]