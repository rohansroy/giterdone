from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for the custom User model."""

    list_display = ('email', 'auth_method', 'totp_enabled', 'is_staff', 'is_active', 'created_at')
    list_filter = ('auth_method', 'is_staff', 'is_active', 'totp_enabled')
    search_fields = ('email',)
    ordering = ('-created_at',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Authentication', {'fields': ('auth_method', 'passkey_credential')}),
        ('Two-Factor Authentication', {'fields': ('totp_secret', 'totp_enabled')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'auth_method'),
        }),
    )

    readonly_fields = ('created_at', 'updated_at', 'last_login')
