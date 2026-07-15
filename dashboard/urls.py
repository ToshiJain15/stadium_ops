from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/chat', views.chat_api, name='chat_api'),
    path('api/concierge', views.concierge_api, name='concierge_api'),
    path('api/intelligence', views.intelligence_api, name='intelligence_api'),
    path('api/telemetry', views.telemetry_api, name='telemetry_api'),
    path('api/analytics', views.analytics_api, name='analytics_api'),
    path('api/staff', views.staff_api, name='staff_api'),
    path('api/health', views.health_api, name='health_api'),
]

