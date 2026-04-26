/* Mobile navigation: toggle panel and sync aria-expanded. */
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const navLinkItems = document.querySelectorAll(".nav-links a");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinkItems.forEach((item) => {
    item.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* Reveal sections on scroll (one-shot per element). */
const fadeElements = document.querySelectorAll(".fade-in");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -24px 0px" }
  );

  fadeElements.forEach((element) => observer.observe(element));
} else {
  fadeElements.forEach((element) => element.classList.add("is-visible"));
}

/**
 * About Us team carousel: responsive pages (3 / 2 / 1 cards), auto-advance,
 * pause on hover, touch swipe, infinite wrap. Rebuilds pages on resize.
 */
(function initAboutTeamCarousel() {
  const root = document.getElementById("aboutTeamCarousel");
  const viewport = root?.querySelector(".about-carousel-viewport");
  const track = document.getElementById("aboutCarouselTrack");
  const prevBtn = root?.querySelector(".about-carousel-btn--prev");
  const nextBtn = root?.querySelector(".about-carousel-btn--next");

  if (!root || !viewport || !track || !prevBtn || !nextBtn) return;

  const originals = Array.from(track.querySelectorAll(".team-profile-card"));
  if (originals.length === 0) return;

  let currentPage = 0;
  let autoTimer = null;
  let isHovered = false;
  let touchStartX = 0;
  const AUTO_MS = 2000;

  function visibleCount() {
    if (window.innerWidth <= 760) return 1;
    if (window.innerWidth <= 980) return 2;
    return 3;
  }

  function pageWidth() {
    return viewport.offsetWidth;
  }

  function numPages() {
    return track.children.length;
  }

  function rebuild() {
    const v = visibleCount();
    const cards = originals.map((node) => node);
    track.innerHTML = "";
    for (let i = 0; i < cards.length; i += v) {
      const page = document.createElement("div");
      page.className = "about-carousel-page";
      cards.slice(i, i + v).forEach((card) => page.appendChild(card));
      track.appendChild(page);
    }
    const n = numPages();
    currentPage = Math.min(currentPage, Math.max(0, n - 1));
    layout();
  }

  function layout() {
    const w = pageWidth();
    const n = numPages();
    track.style.width = n > 0 ? `${n * w}px` : "100%";
    Array.from(track.children).forEach((page) => {
      page.style.flex = `0 0 ${w}px`;
      page.style.width = `${w}px`;
    });
    applyTransform(false);
  }

  function applyTransform(animate) {
    const w = pageWidth();
    track.style.transition = animate ? "transform 0.45s ease" : "none";
    track.style.transform = `translateX(-${currentPage * w}px)`;
  }

  function stopAuto() {
    if (autoTimer) {
      window.clearTimeout(autoTimer);
      autoTimer = null;
    }
  }

  function startAuto() {
    stopAuto();
    if (isHovered || numPages() === 0) return;
    autoTimer = window.setTimeout(() => {
      goNext();
      startAuto();
    }, AUTO_MS);
  }

  function goNext() {
    const n = numPages();
    if (n === 0) return;
    if (currentPage >= n - 1) {
      track.style.transition = "none";
      currentPage = 0;
      applyTransform(false);
      void track.offsetHeight;
      track.style.transition = "transform 0.45s ease";
    } else {
      currentPage += 1;
      applyTransform(true);
    }
  }

  function goPrev() {
    const n = numPages();
    if (n === 0) return;
    if (currentPage <= 0) {
      track.style.transition = "none";
      currentPage = n - 1;
      applyTransform(false);
      void track.offsetHeight;
      track.style.transition = "transform 0.45s ease";
    } else {
      currentPage -= 1;
      applyTransform(true);
    }
  }

  nextBtn.addEventListener("click", () => {
    goNext();
    startAuto();
  });

  prevBtn.addEventListener("click", () => {
    goPrev();
    startAuto();
  });

  viewport.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  viewport.addEventListener("touchend", (e) => {
    const delta = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(delta) < 45) return;
    if (delta > 0) goNext();
    else goPrev();
    startAuto();
  });

  root.addEventListener("mouseenter", () => {
    isHovered = true;
    stopAuto();
  });

  root.addEventListener("mouseleave", () => {
    isHovered = false;
    startAuto();
  });

  window.addEventListener("resize", () => {
    rebuild();
    startAuto();
  });

  rebuild();
  startAuto();
})();

/* Sticky nav: highlight link for the section most visible near the top. */
(function initNavScrollSpy() {
  const sectionIds = ["home", "domain", "milestones", "documents", "presentations", "about", "contact"];
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
  if (sections.length === 0 || navAnchors.length === 0) return;

  const headerEl = document.querySelector(".site-header");
  const offset = () => (headerEl ? headerEl.getBoundingClientRect().height + 16 : 96);

  function setActiveFromScroll() {
    const scrollBottom = window.scrollY + window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const nearBottom = scrollBottom >= docHeight - 8;

    let currentId = sectionIds[0];
    if (nearBottom) {
      currentId = "contact";
    } else {
      const y = window.scrollY + offset();
      for (const section of sections) {
        if (section.offsetTop <= y) {
          currentId = section.id;
        }
      }
    }

    navAnchors.forEach((a) => {
      const href = a.getAttribute("href");
      a.classList.toggle("active", href === `#${currentId}`);
    });
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setActiveFromScroll();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener("load", setActiveFromScroll);
  window.addEventListener("resize", setActiveFromScroll);
  setActiveFromScroll();
})();

/* Contact form: client-side validation and demo-only success copy (no backend). */
const contactForm = document.getElementById("contactForm");
const submitBtn = document.getElementById("submitBtn");
const formFeedback = document.getElementById("formFeedback");

if (contactForm && submitBtn && formFeedback) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      formFeedback.textContent = "Please complete all required fields correctly.";
      formFeedback.classList.add("error");
      formFeedback.classList.remove("success");
      contactForm.reportValidity();
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    window.setTimeout(() => {
      formFeedback.textContent =
        "Thank you. Your message has been recorded for demonstration purposes.";
      formFeedback.classList.add("success");
      formFeedback.classList.remove("error");

      contactForm.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }, 700);
  });
}
