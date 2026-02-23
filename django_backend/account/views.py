from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import generics, status, viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django_backend.authentication import CustomTokenAuthentication
from .models import AuthToken
from .serializers import (
    AuthTokenSerializer,
    RegisterSerializer,
    UserSerializer,
)


# ─── Mixin: enforce our custom backend on every auth view ────────────────────

class CustomAuthMixin:
    authentication_classes = [CustomTokenAuthentication]


# ─── Auth Views ──────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Body: { username, email, password, password2 }
    Creates user + custom token → returns token + user info.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []        # no auth needed here

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = AuthToken.get_or_create_for_user(user)
        return Response(
            {
                'token': AuthTokenSerializer(token).data,
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/auth/login/
    Body: { username, password }
    Returns a (new or existing) custom token.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username or not password:
            return Response(
                {'detail': 'username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token = AuthToken.get_or_create_for_user(user)
        return Response(
            {
                'token': AuthTokenSerializer(token).data,
                'user': UserSerializer(user).data,
            }
        )


class LogoutView(CustomAuthMixin, APIView):
    """
    POST /api/auth/logout/
    Deletes the current user's token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except AuthToken.DoesNotExist:
            pass
        return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)


class TokenInfoView(CustomAuthMixin, APIView):
    """
    GET /api/auth/token/
    Returns metadata about the current token (expiry, last use, etc.).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        token = request.auth          # set by CustomTokenAuthentication
        return Response(AuthTokenSerializer(token).data)


class TokenRefreshView(CustomAuthMixin, APIView):
    """
    POST /api/auth/token/refresh/
    Re-rolls the token key and extends the expiry window.
    Returns the new token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.auth
        token.refresh()
        return Response(AuthTokenSerializer(token).data)


class ProfileView(CustomAuthMixin, generics.RetrieveUpdateAPIView):
    """
    GET   /api/auth/profile/  – retrieve current user
    PUT   /api/auth/profile/  – full update
    PATCH /api/auth/profile/  – partial update
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user