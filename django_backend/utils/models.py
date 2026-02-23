import uuid

from django.db import models


class IdAndActiveMixin(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    id = models.BigAutoField(primary_key=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True


class TimeStampMixin(models.Model):
    created_at = models.DateTimeField(null=True, auto_now_add=True)
    updated_at = models.DateTimeField(null=True, auto_now=True)

    class Meta:
        abstract = True


class UserInfoMixin(models.Model):
    created_by = models.ForeignKey('account.User', null=True, on_delete=models.SET_NULL, related_name="%(app_label)s_%(class)s_created")
    updated_by = models.ForeignKey('account.User', null=True, on_delete=models.SET_NULL, related_name="%(app_label)s_%(class)s_updated")

    class Meta:
        abstract = True