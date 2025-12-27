from django.db import models
from django.conf import settings

class Room(models.Model):
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='buyer_rooms'
    )
    # ⚠️ NOTICE: We use 'products.Product' (String) to avoid circular errors
    product = models.ForeignKey(
        'products.Product', 
        on_delete=models.CASCADE, 
        related_name='chat_rooms'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Room {self.id} - Buyer: {self.buyer}"

class Message(models.Model):
    room = models.ForeignKey(
        Room, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE
    )
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

class Transaction(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('returned', 'Returned'),
        ('completed', 'Completed'),
    )
    product = models.ForeignKey(
        'products.Product', 
        on_delete=models.CASCADE
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='purchases'
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='sales'
    )
    transaction_type = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    
    rent_start_date = models.DateTimeField(null=True, blank=True)
    rent_end_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    def get_days_left(self):
        if self.transaction_type == 'rent' and self.status == 'active':
            if self.rent_end_date:
                delta = self.rent_end_date - timezone.now()
                return max(delta.days, 0)
        return 0