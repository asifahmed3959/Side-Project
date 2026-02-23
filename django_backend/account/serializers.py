from django.contrib.auth.models import User
from rest_framework import serializers
from .models import AuthToken


# ─── Auth Serializers ────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    """Validate and create a new user."""
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label='Confirm password')

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password2')
        read_only_fields = ('id',)

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined')
        read_only_fields = ('id', 'date_joined')


class AuthTokenSerializer(serializers.ModelSerializer):
    """Read-only representation of an AuthToken (safe fields only)."""
    is_expired = serializers.ReadOnlyField()

    class Meta:
        model = AuthToken
        fields = ('key', 'created_at', 'expires_at', 'last_used_at', 'is_expired')
        read_only_fields = fields
