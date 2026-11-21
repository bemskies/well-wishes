from django import forms

from .models import Greeting


class GreetingForm(forms.ModelForm):
    class Meta:
        model = Greeting
        fields = (
            "sender_name",
            "recipient_name",
            "occasion",
            "greeting_style",
            "personal_note",
        )
        widgets = {
            "sender_name": forms.TextInput(
                attrs={"autocomplete": "name", "placeholder": "Your name", "maxlength": 80}
            ),
            "recipient_name": forms.TextInput(
                attrs={"placeholder": "Who is this greeting for?", "maxlength": 80}
            ),
            "occasion": forms.Select(),
            "greeting_style": forms.Select(),
            "personal_note": forms.Textarea(
                attrs={
                    "placeholder": "Write your own Christmas or New Year wishes…",
                    "rows": 4,
                    "maxlength": 400,
                }
            ),
        }

    def clean_sender_name(self):
        name = self.cleaned_data["sender_name"].strip()
        if not name:
            raise forms.ValidationError("Please enter your name.")
        return name

    def clean_recipient_name(self):
        name = self.cleaned_data["recipient_name"].strip()
        if not name:
            raise forms.ValidationError("Please enter the recipient's name.")
        return name

    def clean_personal_note(self):
        message = self.cleaned_data["personal_note"].strip()
        if not message:
            raise forms.ValidationError("Please write your own well-wishing message.")
        return message
