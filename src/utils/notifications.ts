export async function showTestNotification() {
  if (!("Notification" in window)) {
    alert("This browser does not support notifications.");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification("🧴 AI Wellness Tracker", {
      body: "This is a test notification.",
      icon: "/favicon.svg",
    });

    return;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      new Notification("🧴 AI Wellness Tracker", {
        body: "This is a test notification.",
        icon: "/favicon.svg",
      });
    }
  }
}
