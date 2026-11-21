from django.urls import path

from . import views

app_name = "festive"

urlpatterns = [
    path("", views.home, name="home"),
    path("create/", views.create_greeting, name="create"),
    path("g/<str:token>/", views.greeting_detail, name="greeting"),
]
