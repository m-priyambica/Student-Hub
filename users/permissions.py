# In users/permissions.py (NEW FILE)

from rest_framework import permissions

class IsEmailVerified(permissions.BasePermission):
    """
    Allows access only to users who have verified their email.
    """
    message = 'You must verify your email address to access this feature.'

    def has_permission(self, request, view):
        # 1. User must be logged in
        if not request.user or not request.user.is_authenticated:
            return False
        
        # 2. User must be verified
        return request.user.is_email_verified

class IsSellerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow the owner of a product (seller) to edit it.
    Others can only view (GET) it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the seller of the product.
        return obj.seller == request.user