from django.db import models
from django.conf import settings

class ChatRoom(models.Model):
    member1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chats_as_member1')
    member2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chats_as_member2')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='chat_rooms')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['member1', 'member2', 'product']

    def __str__(self):
        return f"Chat for {self.product.title}"

class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(blank=True, null=True)
    attachment = models.FileField(upload_to='chat_attachments/', blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Message from {self.sender.username}"