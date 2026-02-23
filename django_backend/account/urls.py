from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LoginView,
    LogoutView,
    ProfileView,
    RegisterView,
    TokenInfoView,
    TokenRefreshView,
)

router = DefaultRouter()

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path('auth/register/',       RegisterView.as_view(),     name='register'),
    path('auth/login/',          LoginView.as_view(),        name='login'),
    path('auth/logout/',         LogoutView.as_view(),       name='logout'),
    path('auth/profile/',        ProfileView.as_view(),      name='profile'),

    # ── Custom token management ───────────────────────────────────────────────
    path('auth/token/',          TokenInfoView.as_view(),    name='token-info'),
    path('auth/token/refresh/',  TokenRefreshView.as_view(), name='token-refresh'),

    # ── Resources ─────────────────────────────────────────────────────────────
    path('', include(router.urls)),
]