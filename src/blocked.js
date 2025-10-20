// Extract site name from URL
let currentSite = "";

// Random messages to rotate through - keep it fresh and not preachy
const MESSAGES = [
  {
    title: "Caught you",
    text: "You were about to check the news."
  },
  {
    title: "Hey there",
    text: "Taking a break from rage scrolling?"
  },
  {
    title: "Not today",
    text: "This site is blocked. Your brain will thank you."
  },
  {
    title: "Hold up",
    text: "What were you about to do again?"
  },
  {
    title: "Nope",
    text: "Remember why you installed this?"
  }
];

// Alternatives that might actually appeal
const ALTERNATIVES = [
  "Check what's on your todo list that you're avoiding",
  "Go outside for 5 minutes - no phone, just walk",
  "Message someone you care about and ask how they're doing",
  "Work on that side project for 20 minutes",
  "Listen to a podcast episode you've been meaning to get to",
  "Do literally anything that won't make you angry at strangers",
  "Make something - drawing, cooking, writing, building, whatever",
  "Read a longform article you've been meaning to get to",
  "Call someone instead of reading about problems you can't solve",
  "Check your local news - stuff that actually affects your community",
  "Learn something new on Wikipedia for 10 minutes",
  "Do 20 pushups or a quick stretch",
  "Write down 3 things you're grateful for (corny but works)",
  "Check if any friends posted on actually-social social media",
  "Watch a quality YouTube video on something you're curious about",
  "Read one chapter of that book you keep meaning to finish",
  "Work on a problem you can actually solve today",
  "Look at photos from a trip/time you enjoyed",
  "Make a plan for something you're looking forward to",
  "Go do something that actually helps someone else"
];

(async function() {
  try {
    // Get site from URL params
    const params = new URLSearchParams(window.location.search);
    const site = params.get("site");
    const siteNameEl = document.getElementById("siteName");

    if (site) {
      currentSite = site;
      siteNameEl.textContent = site;
    } else {
      siteNameEl.textContent = "Unknown site";
    }

    // Check if we should show reflection message
    const shouldReflect = await shouldShowReflection();

    if (shouldReflect) {
      // Show reflection message instead of random message
      const stats = shouldReflect;
      document.getElementById("messageTitle").textContent = "Quick question";
      document.getElementById("messageText").textContent =
        `You've bypassed the block ${stats.count} times in the last ${stats.days} days. Can you remember what any of those articles were about?`;
    } else {
      // Pick random message
      const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      document.getElementById("messageTitle").textContent = message.title;
      document.getElementById("messageText").textContent = message.text;
    }

    // Pick 4 random alternatives
    const shuffled = [...ALTERNATIVES].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4);
    const listEl = document.getElementById("alternativesList");
    listEl.innerHTML = selected.map(alt => `<li>${alt}</li>`).join("");
  } catch (e) {
    console.error("Error loading blocked page:", e);
    document.getElementById("siteName").textContent = "Unknown site";
  }

  // Go back button
  document.getElementById("goBack").addEventListener("click", () => {
    window.history.back();
  });

  // Show bypass section
  document.getElementById("showBypass").addEventListener("click", () => {
    document.getElementById("bypassSection").classList.remove("hidden");
    document.getElementById("showBypass").style.display = "none";
  });

  // Handle acknowledgment checkbox
  const checkbox = document.getElementById("acknowledgeCheckbox");
  const tempButtons = document.querySelectorAll(".temp-btn");

  checkbox.addEventListener("change", () => {
    tempButtons.forEach(btn => {
      btn.disabled = !checkbox.checked;
    });
  });

  // Temp unblock buttons
  tempButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (checkbox.checked) {
        const minutes = parseInt(btn.dataset.minutes);
        tempUnblock(minutes);
      }
    });
  });
})();

// Temporary unblock function
async function tempUnblock(minutes) {
  if (!currentSite) {
    alert("Error: Could not determine site");
    return;
  }

  await addBypass(currentSite, minutes);

  setTimeout(() => {
    window.location.href = "https://" + currentSite;
  }, 200);
}
