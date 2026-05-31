from django.urls import path

from users.views import (
    AdminGrantView,
    CurrentUserView,
    MyTicketsView,
)

urlpatterns = [
    path("me/", CurrentUserView.as_view(), name="user-current"),
    path("me/tickets/", MyTicketsView.as_view(), name="user-my-tickets"),
    path("<uuid:user_id>/admin/", AdminGrantView.as_view(), name="user-admin-grant"),
]
