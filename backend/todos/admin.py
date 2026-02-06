from django.contrib import admin
from .models import Todo


@admin.register(Todo)
class TodoAdmin(admin.ModelAdmin):
    """Admin interface for the Todo model."""

    list_display = ('title', 'user', 'priority', 'completed', 'due_date', 'created_at')
    list_filter = ('completed', 'priority', 'created_at')
    search_fields = ('title', 'description', 'user__email')
    ordering = ('-priority', '-created_at')
    readonly_fields = ('id', 'created_at', 'updated_at')

    fieldsets = (
        (None, {'fields': ('user', 'title', 'description')}),
        ('Status & Priority', {'fields': ('completed', 'priority', 'due_date')}),
        ('Metadata', {'fields': ('id', 'created_at', 'updated_at')}),
    )
