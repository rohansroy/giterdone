from rest_framework import serializers
from .models import Todo


class TodoSerializer(serializers.ModelSerializer):
    """Serializer for Todo model."""

    class Meta:
        model = Todo
        fields = [
            'id',
            'title',
            'description',
            'completed',
            'priority',
            'due_date',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_title(self, value):
        """Ensure title is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError('Title cannot be empty.')
        return value.strip()


class TodoCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new Todo."""

    class Meta:
        model = Todo
        fields = [
            'title',
            'description',
            'priority',
            'due_date'
        ]

    def validate_title(self, value):
        """Ensure title is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError('Title cannot be empty.')
        return value.strip()

    def create(self, validated_data):
        """Create a todo associated with the current user."""
        user = self.context['request'].user
        return Todo.objects.create(user=user, **validated_data)


class TodoUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating an existing Todo."""

    class Meta:
        model = Todo
        fields = [
            'title',
            'description',
            'completed',
            'priority',
            'due_date'
        ]

    def validate_title(self, value):
        """Ensure title is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError('Title cannot be empty.')
        return value.strip()
