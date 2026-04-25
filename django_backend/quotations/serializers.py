from rest_framework import serializers
from .models import Quotes


class QuoteSerializer(serializers.ModelSerializer):
    # UserInfoMixin typically adds a `user` FK — expose as read-only username
    created_by = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Quotes
        fields = (
            'id',           # IdAndActiveMixin
            'is_active',    # IdAndActiveMixin
            'quote',
            'created_at',   # TimeStampMixin
            'updated_at',   # TimeStampMixin
            'created_by'
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')