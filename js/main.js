document.querySelectorAll("img[data-fallback]").forEach((image) => {
    const markMissing = () => {
        const fallbackParent = image.closest(".logo-link, .hero-visual, .footer-brand");

        if (fallbackParent) {
            fallbackParent.classList.add("image-missing");
        }
    };

    if (image.complete && image.naturalWidth === 0) {
        markMissing();
    }

    image.addEventListener("error", markMissing);
});

document.querySelectorAll(".nav-toggle").forEach((toggle) => {
    const header = toggle.closest(".site-header");
    const navigation = header ? header.querySelector(".main-nav") : null;

    if (!navigation) {
        return;
    }

    const closeNavigation = () => {
        navigation.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Navigation öffnen");
    };

    toggle.addEventListener("click", () => {
        const isOpen = navigation.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Navigation schließen" : "Navigation öffnen");
    });

    navigation.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeNavigation);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeNavigation();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            closeNavigation();
        }
    });
});
