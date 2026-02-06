from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from .models import Todo
from .serializers import TodoSerializer, TodoCreateSerializer, TodoUpdateSerializer


@method_decorator(ratelimit(key='user', rate='100/h', method='POST'), name='create')
@method_decorator(ratelimit(key='user', rate='500/h', method='GET'), name='list')
class TodoListCreateView(generics.ListCreateAPIView):
    """
    API endpoint to list all todos for the authenticated user and create new todos.

    GET: Returns list of todos sorted by priority (descending) then created_at (descending)
    POST: Create a new todo

    Rate limits: 100 creates/hour, 500 list requests/hour per user
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return only todos belonging to the authenticated user."""
        return Todo.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        """Use different serializers for list vs create."""
        if self.request.method == 'POST':
            return TodoCreateSerializer
        return TodoSerializer

    def create(self, request, *args, **kwargs):
        """Create a todo and return the full serialized response."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        todo = serializer.save()

        # Return full todo data using TodoSerializer
        response_serializer = TodoSerializer(todo)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


@method_decorator(ratelimit(key='user', rate='200/h', method=['PATCH', 'PUT']), name='update')
@method_decorator(ratelimit(key='user', rate='100/h', method='DELETE'), name='destroy')
class TodoRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint to retrieve, update, or delete a specific todo.

    GET: Retrieve a todo by ID
    PATCH/PUT: Update a todo
    DELETE: Delete a todo

    Rate limits: 200 updates/hour, 100 deletes/hour per user
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return only todos belonging to the authenticated user."""
        return Todo.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        """Use different serializers for retrieve vs update."""
        if self.request.method in ['PATCH', 'PUT']:
            return TodoUpdateSerializer
        return TodoSerializer

    def update(self, request, *args, **kwargs):
        """Update a todo and return the full serialized response."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        todo = serializer.save()

        # Return full todo data using TodoSerializer
        response_serializer = TodoSerializer(todo)
        return Response(response_serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Delete a todo and return a success message."""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'message': 'Todo deleted successfully.'
        }, status=status.HTTP_200_OK)
