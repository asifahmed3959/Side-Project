from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from account.models import AuthToken


class CustomTokenAuthentication(BaseAuthentication):
    """
    Custom DRF authentication backend.

    Clients must include the token in the Authorization header:

        Authorization: Bearer <token_key>

    Raises AuthenticationFailed for missing, invalid, or expired tokens.
    Updates token.last_used_at on every successful authentication.
    """

    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header:
            return None                          # Let other backends try

        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != self.keyword.lower():
            raise AuthenticationFailed(
                f'Authorization header must be "{self.keyword} <token>".'
            )

        raw_token = parts[1]
        return self._validate_token(raw_token)

    def _validate_token(self, raw_token: str):
        try:
            token = AuthToken.objects.select_related('user').get(key=raw_token)
        except AuthToken.DoesNotExist:
            raise AuthenticationFailed('Invalid token.')

        if not token.user.is_active:
            raise AuthenticationFailed('User account is disabled.')

        if token.is_expired:
            raise AuthenticationFailed('Token has expired. Please log in again.')

        # Record usage without blocking the request
        token.touch()

        return (token.user, token)

    def authenticate_header(self, request):
        """Returned in WWW-Authenticate header on 401 responses."""
        return self.keyword