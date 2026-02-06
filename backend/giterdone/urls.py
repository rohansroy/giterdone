"""
URL configuration for giterdone project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/todos/', include('todos.urls')),
    path('health/', include('health.urls')),
]
