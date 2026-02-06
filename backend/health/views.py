from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db import connection
from django.core.cache import cache
import redis


class HealthCheckView(APIView):
    """
    Health check endpoint for monitoring service health.
    Returns 200 if all services are healthy, 503 otherwise.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        health_status = {
            'status': 'healthy',
            'services': {}
        }
        overall_healthy = True

        # Check database connection
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            health_status['services']['database'] = 'healthy'
        except Exception as e:
            health_status['services']['database'] = f'unhealthy: {str(e)}'
            overall_healthy = False

        # Check Redis/cache connection
        try:
            cache.set('health_check', 'ok', timeout=10)
            cache_value = cache.get('health_check')
            if cache_value == 'ok':
                health_status['services']['cache'] = 'healthy'
            else:
                health_status['services']['cache'] = 'unhealthy: unexpected value'
                overall_healthy = False
        except Exception as e:
            health_status['services']['cache'] = f'unhealthy: {str(e)}'
            overall_healthy = False

        if not overall_healthy:
            health_status['status'] = 'unhealthy'
            return Response(health_status, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(health_status, status=status.HTTP_200_OK)


class ReadinessCheckView(APIView):
    """
    Readiness check endpoint - simpler check to see if service is ready to receive traffic.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({'status': 'ready'}, status=status.HTTP_200_OK)
