from django.db import models
from django.contrib.auth import get_user_model

from utils.models import IdAndActiveMixin
from utils.models import UserInfoMixin
from utils.models import TimeStampMixin

# Create your models here.


User = get_user_model()


class Quotes(IdAndActiveMixin, UserInfoMixin, TimeStampMixin):
    quote = models.CharField(max_length=1000)
