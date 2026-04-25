from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny

from django_backend.authentication import CustomTokenAuthentication
from .models import Quotes
from .serializers import QuoteSerializer


class QuoteViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/quotes/           – list all active quotes
    POST   /api/v1/quotes/           – create (auto-assigns created_by/updated_by)
    GET    /api/v1/quotes/{id}/      – retrieve
    PUT    /api/v1/quotes/{id}/      – full update   (tracks updated_by)
    PATCH  /api/v1/quotes/{id}/      – partial update (tracks updated_by)
    DELETE /api/v1/quotes/{id}/      – soft-delete (is_active=False)

    Query params:
        ?search=<text>    – search by quote text
        ?ordering=created_at/-created_at
        ?mine=true        – only return the current user's quotes
    """

    serializer_class = QuoteSerializer
    authentication_classes = [CustomTokenAuthentication]
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['quote']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Quotes.objects.filter(is_active=True).select_related('created_by', 'updated_by')

        if self.request.query_params.get('mine', '').lower() == 'true':
            qs = qs.filter(created_by=self.request.user)

        return qs

    def perform_create(self, serializer):
        """Auto-assign both FK fields from the authenticated user."""
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    def perform_update(self, serializer):
        """Track who last modified the quote."""
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        """Soft delete — flip is_active instead of deleting the row."""
        instance.is_active = False
        instance.save(update_fields=['is_active'])