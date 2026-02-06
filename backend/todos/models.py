import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class Todo(models.Model):
    """
    Todo model representing a task for a user.
    Each todo belongs to a specific user (private todos).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='todos'
    )

    # Core fields
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    completed = models.BooleanField(default=False)

    # Optional fields
    due_date = models.DateTimeField(blank=True, null=True)
    priority = models.IntegerField(default=0, help_text='Higher number = higher priority')

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'todos'
        verbose_name = 'todo'
        verbose_name_plural = 'todos'
        ordering = ['-priority', '-created_at']  # Sort by priority first, then date
        indexes = [
            models.Index(fields=['user', '-priority', '-created_at']),
            models.Index(fields=['user', 'completed']),
        ]

    def __str__(self):
        return f"{self.title} ({'✓' if self.completed else '○'})"
