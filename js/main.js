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
