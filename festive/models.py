import secrets

from django.db import models


def create_unique_token():
    return secrets.token_urlsafe(18)


class Greeting(models.Model):
    class Occasion(models.TextChoices):
        CHRISTMAS = "christmas", "Merry Christmas"
        NEW_YEAR = "new_year", "Happy New Year"
        BOTH = "both", "Christmas and New Year"

    class Style(models.TextChoices):
        HEARTWARMING = "heartwarming", "Heartwarming"
        ROMANTIC = "romantic", "Romantic"
        FUNNY = "funny", "Funny"
        INSPIRATIONAL = "inspirational", "Inspirational"
        SPIRITUAL = "spiritual", "Spiritual"
        PROFESSIONAL = "professional", "Professional"
        FAMILY = "family", "Family and Friends"

    sender_name = models.CharField(max_length=80)
    recipient_name = models.CharField("recipient's name", max_length=80)
    occasion = models.CharField(max_length=16, choices=Occasion.choices)
    greeting_style = models.CharField(max_length=20, choices=Style.choices)
    personal_note = models.CharField(
        "your well-wishing message",
        max_length=400,
    )
    unique_token = models.CharField(
        max_length=32, unique=True, default=create_unique_token
    )
    parent_greeting = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        related_name="inspired_greetings",
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["parent_greeting", "created_at"])]

    def __str__(self):
        return f"{self.sender_name} — {self.get_occasion_display()}"

    @property
    def greeting_title(self):
        return {
            self.Occasion.CHRISTMAS: "Merry Christmas",
            self.Occasion.NEW_YEAR: "Happy New Year",
            self.Occasion.BOTH: "Merry Christmas & Happy New Year",
        }[self.occasion]
