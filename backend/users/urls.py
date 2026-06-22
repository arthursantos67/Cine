from django.urls import path

from users.views import (
    AdminGrantView,
    CurrentUserView,
    MyTicketsView,
    TmdbTokenView,
    UserDeleteView,
    UserListView,
    UserPermissionLogsView,
)

urlpatterns = [
    path("", UserListView.as_view(), name="user-list"),
    path("me/", CurrentUserView.as_view(), name="user-current"),
    path("me/tickets/", MyTicketsView.as_view(), name="user-my-tickets"),
    path("config/tmdb-token/", TmdbTokenView.as_view(), name="config-tmdb-token"),
    path("<uuid:user_id>/", UserDeleteView.as_view(), name="user-delete"),
    path("<uuid:user_id>/admin/", AdminGrantView.as_view(), name="user-admin-grant"),
    path("<uuid:user_id>/admin/logs/", UserPermissionLogsView.as_view(), name="user-admin-logs"),
]
