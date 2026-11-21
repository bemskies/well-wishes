(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clock = document.querySelector("[data-local-clock]");
  const countdowns = document.querySelectorAll("[data-countdown]");

  function nextLocalHoliday(now, month, day) {
    let target = new Date(now.getFullYear(), month, day);
    if (target <= now) {
      target = new Date(now.getFullYear() + 1, month, day);
    }
    return target;
  }

  function updateFestiveClock() {
    const now = new Date();
    if (clock) {
      clock.dateTime = now.toISOString();
      clock.textContent = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      }).format(now);
    }

    countdowns.forEach((card) => {
      const target = card.dataset.countdown === "christmas"
        ? nextLocalHoliday(now, 11, 25)
        : nextLocalHoliday(now, 0, 1);
      const remaining = Math.max(0, target.getTime() - now.getTime());
      const totalSeconds = Math.floor(remaining / 1000);
      const values = [
        Math.floor(totalSeconds / 86400),
        Math.floor((totalSeconds % 86400) / 3600),
        Math.floor((totalSeconds % 3600) / 60),
        totalSeconds % 60,
      ];
      card.querySelectorAll("[data-countdown-units] b").forEach((unit, index) => {
        unit.textContent = String(values[index]).padStart(2, "0");
      });
      card.setAttribute(
        "aria-label",
        `${card.dataset.countdown === "christmas" ? "Christmas" : "New Year"} in ${values[0]} days, ${values[1]} hours, ${values[2]} minutes, and ${values[3]} seconds`,
      );
    });
  }

  if (clock || countdowns.length) {
    updateFestiveClock();
    window.setInterval(updateFestiveClock, 1000);
  }

  const balloonField = document.querySelector("[data-balloon-field]");
  if (balloonField) {
    const balloonColors = ["#f3d37d", "#f7e3df", "#e7f0e2", "#dbb7a1", "#f5eee0"];
    for (let index = 0; index < 15; index += 1) {
      const balloon = document.createElement("span");
      const size = Math.round(25 + Math.random() * 37);
      balloon.className = "festive-balloon";
      balloon.style.setProperty("--balloon-size", `${size}px`);
      balloon.style.setProperty("--balloon-color", balloonColors[index % balloonColors.length]);
      balloon.style.setProperty("--balloon-left", `${Math.round(2 + Math.random() * 96)}%`);
      balloon.style.setProperty("--balloon-duration", `${12 + Math.random() * 14}s`);
      balloon.style.setProperty("--balloon-delay", `${-Math.random() * 25}s`);
      balloon.style.setProperty("--balloon-drift", `${Math.round(-45 + Math.random() * 90)}px`);
      balloonField.appendChild(balloon);
    }
  }

  document.querySelectorAll("[data-copy-link]").forEach((button) => {
    button.addEventListener("click", async () => {
      const feedback = document.querySelector("[data-copy-feedback]");
      try {
        await navigator.clipboard.writeText(button.dataset.copyLink);
      } catch {
        const field = document.createElement("textarea");
        field.value = button.dataset.copyLink;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand("copy");
        field.remove();
        if (!copied) {
          feedback.textContent = "Could not copy automatically. Please copy the page address.";
          return;
        }
      }
      feedback.textContent = "Greeting link copied — ready to share!";
    });
  });

  document.querySelectorAll("[data-native-share]").forEach((button) => {
    if (!navigator.share) return;
    button.hidden = false;
    button.addEventListener("click", async () => {
      try {
        await navigator.share({
          title: button.dataset.shareTitle,
          text: button.dataset.shareText,
          url: button.dataset.shareUrl,
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          document.querySelector("[data-copy-feedback]").textContent =
            "Sharing is unavailable right now. You can copy the greeting link instead.";
        }
      }
    });
  });

  const canvas = document.querySelector(".snow-canvas");
  if (!canvas || reducedMotion) return;
  const context = canvas.getContext("2d");
  const flakes = [];
  let width = 0;
  let height = 0;

  function resize() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * scale;
    canvas.height = height * scale;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    const count = Math.min(60, Math.ceil((width * height) / 18000));
    flakes.length = 0;
    for (let index = 0; index < count; index += 1) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.6,
        speed: Math.random() * 0.45 + 0.2,
        drift: Math.random() * 0.4 - 0.2,
      });
    }
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(255, 250, 239, .55)";
    flakes.forEach((flake) => {
      context.beginPath();
      context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      context.fill();
      flake.y += flake.speed;
      flake.x += flake.drift;
      if (flake.y > height + 4) {
        flake.y = -4;
        flake.x = Math.random() * width;
      }
      if (flake.x < -4) flake.x = width + 4;
      if (flake.x > width + 4) flake.x = -4;
    });
    if (!document.hidden) window.requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) window.requestAnimationFrame(draw);
  });
  window.requestAnimationFrame(draw);
})();
