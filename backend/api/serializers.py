from rest_framework import serializers
from django.contrib.auth import get_user_model

# Get the correct user model (users.User)
User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name','branch','semester','section']
        read_only_fields = ['email']