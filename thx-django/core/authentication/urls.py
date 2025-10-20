# authentication/urls.py

from django.urls import path
from .views import RegisterView, CustomTokenObtainPairView, login_view
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    # path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path("login/", login_view, name="login"),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]