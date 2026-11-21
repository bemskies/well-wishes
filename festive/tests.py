from pathlib import Path

from django.conf import settings
from django.test import TestCase
from django.urls import reverse

from .models import Greeting


class GreetingFlowTests(TestCase):
    def create(self, sender, parent=None, **extra):
        data = {
            "sender_name": sender,
            "recipient_name": extra.pop("recipient_name", "Friend"),
            "occasion": extra.pop("occasion", "both"),
            "greeting_style": extra.pop("greeting_style", "heartwarming"),
            "personal_note": extra.pop(
                "personal_note", "Wishing you joy this festive season."
            ),
        }
        response = self.client.post(
            reverse("festive:create", kwargs={}) + (f"?from={parent.unique_token}" if parent else ""),
            data,
        )
        return response

    def test_homepage_and_create_greeting(self):
        self.assertEqual(self.client.get(reverse("festive:home")).status_code, 200)
        response = self.create("Alice", recipient_name="Sam", personal_note="Be merry!")
        greeting = Greeting.objects.get(sender_name="Alice")
        self.assertRedirects(
            response, reverse("festive:greeting", args=[greeting.unique_token])
        )
        self.assertEqual(len(greeting.unique_token), 24)
        page = self.client.get(
            reverse("festive:greeting", args=[greeting.unique_token])
        )
        self.assertContains(page, "YOU SAM")
        self.assertContains(page, "Be merry!")
        self.assertNotContains(page, "May your days be filled with warmth")
        self.assertNotContains(page, "With warm wishes,")

    def test_new_greetings_get_independent_tokens_and_pages(self):
        self.create("Alice")
        self.create("Bob")
        alice, bob = Greeting.objects.order_by("created_at")
        self.assertNotEqual(alice.unique_token, bob.unique_token)
        self.assertNotEqual(
            reverse("festive:greeting", args=[alice.unique_token]),
            reverse("festive:greeting", args=[bob.unique_token]),
        )
        self.assertContains(
            self.client.get(reverse("festive:greeting", args=[alice.unique_token])),
            "Alice",
        )
        self.assertContains(
            self.client.get(reverse("festive:greeting", args=[bob.unique_token])),
            "Bob",
        )

    def test_recipient_can_create_child_without_changing_parent(self):
        parent = Greeting.objects.create(
            sender_name="Alice",
            occasion="christmas",
            greeting_style="family",
            personal_note="For my family",
        )
        self.assertContains(
            self.client.get(reverse("festive:create") + f"?from={parent.unique_token}"),
            "Merry Christmas",
        )
        response = self.create("Bea", parent, occasion="christmas")
        child = Greeting.objects.get(sender_name="Bea")
        parent.refresh_from_db()
        self.assertRedirects(
            response, reverse("festive:greeting", args=[child.unique_token])
        )
        self.assertEqual(child.parent_greeting, parent)
        self.assertEqual(child.occasion, parent.occasion)
        self.assertEqual(parent.sender_name, "Alice")
        self.assertEqual(parent.personal_note, "For my family")
        self.create("Caro", child, occasion=parent.occasion)
        grandchild = Greeting.objects.get(sender_name="Caro")
        self.assertEqual(grandchild.parent_greeting, child)
        self.assertNotEqual(grandchild.unique_token, child.unique_token)

    def test_server_rendered_social_metadata_and_sharing(self):
        greeting = Greeting.objects.create(
            sender_name="Casey",
            recipient_name="Jordan",
            occasion="new_year",
            greeting_style="inspirational",
        )
        response = self.client.get(
            reverse("festive:greeting", args=[greeting.unique_token]),
            HTTP_HOST="localhost",
            secure=True,
        )
        self.assertContains(response, 'property="og:title"')
        self.assertContains(response, "Casey")
        self.assertContains(response, "og:image")
        self.assertContains(response, "twitter:card")
        self.assertContains(response, "https://localhost/g/")
        self.assertContains(response, "wa.me/?text=")
        self.assertContains(response, "facebook.com/sharer/sharer.php")
        self.assertContains(response, "twitter.com/intent/tweet")
        self.assertContains(response, "data-copy-link=")
        self.assertContains(response, 'class="greeting-theme"')
        self.assertContains(response, "youtube-nocookie.com/embed/3CWJNqyub3o")
        self.assertContains(response, "music-video-caption")

    def test_invalid_form_and_unknown_token(self):
        self.assertEqual(
            self.client.post(reverse("festive:create"), {"sender_name": " "}).status_code,
            400,
        )
        self.assertEqual(
            self.client.post(
                reverse("festive:create"),
                {
                    "sender_name": "Taylor",
                    "occasion": "christmas",
                    "greeting_style": "heartwarming",
                    "personal_note": "Wishing you a bright Christmas!",
                },
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.post(
                reverse("festive:create"),
                {
                    "sender_name": "Taylor",
                    "recipient_name": "Jordan",
                    "occasion": "christmas",
                    "greeting_style": "heartwarming",
                    "personal_note": "   ",
                },
            ).status_code,
            400,
        )
        self.assertFalse(Greeting.objects.filter(sender_name="Taylor").exists())
        self.assertEqual(
            self.client.get(reverse("festive:greeting", args=["unknown-token"])).status_code,
            404,
        )

    def test_invalid_parent_is_not_silently_ignored(self):
        self.assertEqual(
            self.client.get(reverse("festive:create") + "?from=not-a-greeting").status_code,
            404,
        )

    def test_localhost_form_submission_with_csrf_protection(self):
        client = self.client_class(enforce_csrf_checks=True)
        client.get(reverse("festive:home"), HTTP_HOST="127.0.0.1:8000")
        csrf_token = client.cookies["csrftoken"].value
        response = client.post(
            reverse("festive:create"),
            {
                "sender_name": "Taylor",
                "recipient_name": "Jordan",
                "occasion": "christmas",
                "greeting_style": "heartwarming",
                "personal_note": "Wishing you a bright Christmas!",
                "csrfmiddlewaretoken": csrf_token,
            },
            HTTP_HOST="127.0.0.1:8000",
            HTTP_ORIGIN="http://localhost:8000",
        )
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Greeting.objects.filter(sender_name="Taylor").exists())

    def test_video_player_and_social_image_assets_are_addressable(self):
        social_image = (
            Path(settings.BASE_DIR) / "static/festive/images/social-card.png"
        )
        santa_image = Path(settings.BASE_DIR) / "static/festive/images/santa.svg"
        tree_image = (
            Path(settings.BASE_DIR) / "static/festive/images/real-christmas-tree.jpg"
        )
        self.assertTrue(social_image.is_file())
        self.assertTrue(santa_image.is_file())
        self.assertTrue(tree_image.is_file())
        homepage = self.client.get(reverse("festive:home"))
        self.assertContains(homepage, "youtube-nocookie.com/embed/3CWJNqyub3o")
        self.assertContains(homepage, "Jingle Bells with Lyrics")
        self.assertContains(homepage, "music-video-caption")
        self.assertContains(homepage, "cc_load_policy=1")
        self.assertNotContains(homepage, "jingle-bells-choir.mp3")
        self.assertNotContains(homepage, "Argyle Alumni Choir")
        self.assertContains(homepage, "data-balloon-field")
        self.assertContains(homepage, 'data-countdown="christmas"')
        self.assertContains(homepage, 'data-countdown="new-year"')
        self.assertContains(homepage, "data-local-clock")
        self.assertContains(homepage, "santa.svg")
        self.assertContains(homepage, "real-christmas-tree.jpg")
