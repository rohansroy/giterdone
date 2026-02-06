from django.urls import path
from .views import TodoListCreateView, TodoRetrieveUpdateDestroyView

urlpatterns = [
    # List all todos and create new todo
    path('', TodoListCreateView.as_view(), name='todo-list-create'),

    # Retrieve, update, or delete a specific todo
    path('<uuid:pk>/', TodoRetrieveUpdateDestroyView.as_view(), name='todo-detail'),
]
