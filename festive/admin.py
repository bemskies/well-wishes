from django.contrib import admin

from .models import Greeting


@admin.register(Greeting)
class GreetingAdmin(admin.ModelAdmin):
    list_display = (
        "sender_name",
        "recipient_name",
        "occasion",
        "greeting_style",
        "created_at",
    )
    list_filter = ("occasion", "greeting_style", "created_at")
    search_fields = ("sender_name", "recipient_name", "unique_token")
    readonly_fields = ("unique_token", "created_at")
