from django.urls import path

from catalog.views import (
    GenreDetailView,
    GenreListCreateView,
    MovieDetailView,
    MovieInterestView,
    MovieListCreateView,
    RoomDetailView,
    RoomListCreateView,
    RoomTypePricingDetailView,
    RoomTypePricingListView,
    SessionDetailView,
    SessionListCreateView,
)

urlpatterns = [
    path("genres/", GenreListCreateView.as_view(), name="genre-list-create"),
    path("genres/<uuid:pk>/", GenreDetailView.as_view(), name="genre-detail"),
    path("movies/", MovieListCreateView.as_view(), name="movie-list-create"),
    path("movies/<uuid:pk>/", MovieDetailView.as_view(), name="movie-detail"),
    path("movies/<uuid:movie_pk>/interest/", MovieInterestView.as_view(), name="movie-interest"),
    path("rooms/", RoomListCreateView.as_view(), name="room-list-create"),
    path("rooms/<uuid:pk>/", RoomDetailView.as_view(), name="room-detail"),
    path("room-type-pricing/", RoomTypePricingListView.as_view(), name="room-type-pricing-list"),
    path("room-type-pricing/<int:pk>/", RoomTypePricingDetailView.as_view(), name="room-type-pricing-detail"),
    path("sessions/", SessionListCreateView.as_view(), name="session-list-create"),
    path("sessions/<uuid:pk>/", SessionDetailView.as_view(), name="session-detail"),
]
