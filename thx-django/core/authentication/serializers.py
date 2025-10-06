from rest_framework import serializers
from django.contrib.auth import authenticate
from core.models import User  # Import your custom user model
from rest_framework_simplejwt.tokens import RefreshToken

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email", "")
        password = data.get("password", "")

        # Use email to find user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_active:
            raise serializers.ValidationError("Account is disabled.")

        refresh = RefreshToken.for_user(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'username': user.username,  # Optional: remove if unused
            }
        }
    
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'password']  # No username

    def create(self, validated_data):
        email = validated_data['email']
        name = validated_data.get('name', '')
        password = validated_data['password']

        # Auto-generate a username from email if required
        username = email.split('@')[0]  

        user = User.objects.create_user(
            email=email,
            username=username,
            name=name,
            password=password
        )
        return user