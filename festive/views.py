from django.shortcuts import get_object_or_404, redirect, render

from .forms import GreetingForm
from .models import Greeting


def home(request):
    form = GreetingForm()
    return render(request, "festive/home.html", {"form": form})


def create_greeting(request):
    parent_token = request.GET.get("from") or request.POST.get("from")
    parent = (
        get_object_or_404(Greeting, unique_token=parent_token)
        if parent_token
        else None
    )
    if request.method == "POST":
        form = GreetingForm(request.POST)
        if form.is_valid():
            greeting = form.save(commit=False)
            greeting.parent_greeting = parent
            greeting.save()
            return redirect("festive:greeting", token=greeting.unique_token)
        status = 400
    else:
        initial = {"occasion": parent.occasion} if parent else {}
        form = GreetingForm(initial=initial)
        status = 200
    return render(
        request,
        "festive/create.html",
        {"form": form, "parent": parent},
        status=status,
    )


def greeting_detail(request, token):
    greeting = get_object_or_404(Greeting, unique_token=token)
    return render(
        request,
        "festive/greeting.html",
        {"greeting": greeting},
    )
