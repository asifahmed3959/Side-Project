import binascii
import os

from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

from utils.models import IdAndActiveMixin
from utils.models import UserInfoMixin
from utils.models import TimeStampMixin
# Create your models here.


class User(IdAndActiveMixin, TimeStampMixin, AbstractUser):
    first_name = models.CharField(_('first name'), max_length=30, blank=False)
    last_name = models.CharField(_('last name'), max_length=150, blank=False)
    email = models.EmailField(_('email address'), blank=False)
    verified = models.BooleanField(default=False)

    groups = models.ManyToManyField(
        'auth.Group',
        blank=True,
        related_name='+',  # ← disables reverse accessor entirely
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        blank=True,
        related_name='+',  # ← disables reverse accessor entirely
    )

    class Meta:
        db_table = 'user'

    def __str__(self):
        return "{}  uuid:{}".format(self.email.__str__(), self.uuid.__str__())



# ─── Custom Auth Token ────────────────────────────────────────────────────────

def generate_token():
    """Return a cryptographically secure 40-hex-character token string."""
    return binascii.hexlify(os.urandom(20)).decode()


def default_expiry():
    """Token expires TOKEN_EXPIRY_HOURS hours from now (default 24 h)."""
    hours = getattr(settings, 'TOKEN_EXPIRY_HOURS', 24)
    return timezone.now() + timedelta(hours=hours)


class AuthToken(models.Model):
    """
    Custom per-user authentication token.

    Features
    --------
    * Cryptographically random 40-char hex key (no sequential IDs).
    * Configurable expiry via settings.TOKEN_EXPIRY_HOURS (default 24 h).
    * `is_expired` property and `refresh()` helper.
    * One active token per user enforced via `get_or_create_for_user()`.
    * `last_used_at` updated automatically by the authentication backend.
    """

    key = models.CharField(
        max_length=40,
        primary_key=True,
        default=generate_token,
        editable=False,
        unique=True,
    )
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='auth_token',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_expiry)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Auth Token'
        verbose_name_plural = 'Auth Tokens'

    def __str__(self):
        return f'Token({self.user.username}) – expires {self.expires_at:%Y-%m-%d %H:%M} UTC'

    # ── Helpers ──────────────────────────────────────────────────────────────

    @property
    def is_expired(self) -> bool:
        """Return True if the token has passed its expiry timestamp."""
        return timezone.now() >= self.expires_at

    def refresh(self) -> None:
        """
        Re-roll the token key and push the expiry window forward.
        Useful for sliding-session behaviour.
        """
        self.key = generate_token()
        self.expires_at = default_expiry()
        self.save(update_fields=['key', 'expires_at'])

    def touch(self) -> None:
        """Record that the token was just used (called by the auth backend)."""
        self.last_used_at = timezone.now()
        self.save(update_fields=['last_used_at'])

    # ── Class-level factory ───────────────────────────────────────────────────

    @classmethod
    def get_or_create_for_user(cls, user: User) -> 'AuthToken':
        """
        Return a valid token for *user*, creating one if none exists.
        If the existing token is expired it is deleted and a fresh one issued.
        """
        try:
            token = cls.objects.get(user=user)
            if token.is_expired:
                token.delete()
                raise cls.DoesNotExist
        except cls.DoesNotExist:
            token = cls.objects.create(user=user)
        return token

