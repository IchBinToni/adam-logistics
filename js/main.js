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

const rentalRequestForm = document.querySelector("[data-request-form]");

if (rentalRequestForm) {
    const cartItemsElement = document.querySelector("[data-cart-items]");
    const cartEmptyElement = document.querySelector("[data-cart-empty]");
    const cartSummaryElement = document.querySelector("[data-cart-summary]");
    const cartTotalElement = document.querySelector("[data-cart-total]");
    const requestItemsInput = document.querySelector("[data-request-items]");
    const formStatusElement = document.querySelector("[data-form-status]");
    const clearCartButton = document.querySelector("[data-cart-clear]");
    const floatingCartCountElement = document.querySelector("[data-floating-cart-count]");
    const cart = new Map();
    const cartStorageKey = "adam-rental-request-cart";
    const currencyFormatter = new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
    });

    const parsePrice = (value) => Number(value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
    const parsePackageSize = (value) => Number(value.replace(/\D/g, "")) || 1;
    const getCartCalculation = (item) => {
        const packageCount = Math.ceil(item.quantity / item.packageSize);
        const billablePieces = packageCount * item.packageSize;
        const lineTotal = item.price * billablePieces;

        return { packageCount, billablePieces, lineTotal };
    };
    const showFormStatus = (message, type = "error", shouldScroll = false) => {
        formStatusElement.textContent = message;
        formStatusElement.dataset.status = type;

        if (shouldScroll) {
            requestAnimationFrame(() => {
                formStatusElement.scrollIntoView({ behavior: "smooth", block: "center" });
            });
        }
    };

    const productFromCard = (card) => {
        const rows = [...card.querySelectorAll(".product-info > dl > div")];
        const getValue = (label) => {
            const row = rows.find((item) => item.querySelector("dt")?.textContent.trim() === label);
            return row?.querySelector("dd")?.textContent.trim() || "";
        };

        return {
            id: card.querySelector(".product-number")?.textContent.trim() || "",
            name: card.querySelector("h4")?.textContent.trim() || "",
            price: parsePrice(getValue("Preis")),
            unit: getValue("VPE"),
            packageSize: parsePackageSize(getValue("VPE")),
        };
    };

    const updateCart = () => {
        const items = [...cart.values()].filter((item) => item.quantity > 0);
        cartItemsElement.innerHTML = "";

        items.forEach((item) => {
            const { packageCount, billablePieces, lineTotal } = getCartCalculation(item);
            const row = document.createElement("div");
            row.className = "cart-item";
            row.innerHTML = `
                <div>
                    <strong>${item.name}</strong>
                    <span>${item.id} · ${currencyFormatter.format(item.price)} netto/Stk.</span>
                    <span class="cart-item-requested">Gewünscht: ${item.quantity} Stk.</span>
                    <span class="cart-item-billed">Berechnet: ${packageCount} VPE = ${billablePieces} Stk.</span>
                    <span class="cart-item-total">${currencyFormatter.format(item.price)} * ${billablePieces} Stk. = ${currencyFormatter.format(lineTotal)}</span>
                </div>
                <label>
                    Wunschmenge
                    <input type="number" min="0" step="1" value="${item.quantity}" data-cart-quantity="${item.id}">
                </label>
                <button type="button" data-cart-remove="${item.id}" aria-label="${item.name} entfernen">Entfernen</button>
            `;
            cartItemsElement.append(row);
        });

        const total = items.reduce((sum, item) => {
            const { lineTotal } = getCartCalculation(item);
            return sum + lineTotal;
        }, 0);
        cartEmptyElement.hidden = items.length > 0;
        cartSummaryElement.hidden = items.length === 0;
        cartTotalElement.textContent = currencyFormatter.format(total);
        if (floatingCartCountElement) {
            floatingCartCountElement.textContent = String(items.length);
        }
        requestItemsInput.value = items.map((item) => {
            const { packageCount, billablePieces, lineTotal } = getCartCalculation(item);

            return [
                `${item.name} / ${item.id} / ${packageCount} VPE / ${item.packageSize} Stk. je VPE / ${billablePieces} Stk.`,
                `Gewuenscht: ${item.quantity} Stk.`,
                `${currencyFormatter.format(item.price)} pro Teil * ${billablePieces} Teile = ${currencyFormatter.format(lineTotal)}`,
            ].join("\n");
        }).join("\n\n");

        localStorage.setItem(cartStorageKey, JSON.stringify(items));
    };

    const restoreCart = () => {
        try {
            const savedItems = JSON.parse(localStorage.getItem(cartStorageKey) || "[]");

            if (Array.isArray(savedItems)) {
                savedItems.forEach((item) => {
                    if (item.id && item.quantity > 0) {
                        cart.set(item.id, item);
                    }
                });
            }
        } catch (error) {
            localStorage.removeItem(cartStorageKey);
        }
    };

    const addProductControls = (container, product, variantClass = "", beforeElement = null) => {
        if (!product.id || !product.name) {
            return;
        }

        const controls = document.createElement("div");
        controls.className = `product-request${variantClass ? ` ${variantClass}` : ""}`;
        controls.innerHTML = `
            <label>
                Stückzahl
                <input type="number" min="0" step="1" value="0" inputmode="numeric" data-product-quantity>
            </label>
            <button type="button" data-add-product>Hinzufügen</button>
        `;
        if (beforeElement) {
            container.insertBefore(controls, beforeElement);
        } else {
            container.append(controls);
        }

        controls.querySelector("[data-add-product]").addEventListener("click", () => {
            const quantityInput = controls.querySelector("[data-product-quantity]");
            const quantity = Math.max(0, Number(quantityInput.value) || 0);

            if (quantity === 0) {
                formStatusElement.textContent = "Bitte zuerst eine Stückzahl größer 0 eintragen.";
                return;
            }

            const current = cart.get(product.id);
            cart.set(product.id, {
                ...product,
                quantity: (current?.quantity || 0) + quantity,
            });
            quantityInput.value = "0";
            formStatusElement.textContent = "";
            updateCart();
        });
    };

    const addonFromElement = (addon) => {
        const rows = [...addon.querySelectorAll("dl > div")];
        const getValue = (label) => {
            const row = rows.find((item) => item.querySelector("dt")?.textContent.trim() === label);
            return row?.querySelector("dd")?.textContent.trim() || "";
        };
        const rawName = addon.querySelector("p")?.textContent.trim() || "";
        const name = rawName.replace(/^Passend dazu:\s*/i, "").replace(/\s+optional$/i, "");

        return {
            id: getValue("Artikelnummer"),
            name,
            price: parsePrice(getValue("Preis")),
            unit: getValue("VPE"),
            packageSize: parsePackageSize(getValue("VPE")),
        };
    };

    document.querySelectorAll(".product-card").forEach((card) => {
        const productInfo = card.querySelector(".product-info");

        if (!productInfo) {
            return;
        }

        addProductControls(productInfo, productFromCard(card), "", productInfo.querySelector(".product-addon"));

        productInfo.querySelectorAll(".product-addon").forEach((addon) => {
            addProductControls(addon, addonFromElement(addon), "product-addon-request");
        });
    });

    cartItemsElement.addEventListener("input", (event) => {
        const input = event.target.closest("[data-cart-quantity]");

        if (!input) {
            return;
        }

        const item = cart.get(input.dataset.cartQuantity);
        const quantity = Math.max(0, Number(input.value) || 0);

        if (item) {
            item.quantity = quantity;
            if (quantity === 0) {
                cart.delete(item.id);
            }
            updateCart();
        }
    });

    cartItemsElement.addEventListener("click", (event) => {
        const button = event.target.closest("[data-cart-remove]");

        if (!button) {
            return;
        }

        cart.delete(button.dataset.cartRemove);
        updateCart();
    });

    clearCartButton.addEventListener("click", () => {
        cart.clear();
        updateCart();
    });

    rentalRequestForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!requestItemsInput.value.trim()) {
            formStatusElement.textContent = "Bitte fügen Sie mindestens einen Artikel zum Anfragekorb hinzu.";
            return;
        }

        const submitButton = rentalRequestForm.querySelector("[type='submit']");
        const formData = new FormData(rentalRequestForm);
        submitButton.disabled = true;
        formStatusElement.textContent = "Anfrage wird gesendet...";

        try {
            const response = await fetch("/", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams(formData).toString(),
            });

            if (!response.ok) {
                throw new Error("Form submission failed");
            }

            rentalRequestForm.reset();
            cart.clear();
            localStorage.removeItem(cartStorageKey);
            updateCart();
            formStatusElement.textContent = "Vielen Dank. Ihre Anfrage wurde gesendet.";
            showFormStatus("Vielen Dank. Ihre Anfrage wurde gesendet.", "success", true);
        } catch (error) {
            formStatusElement.textContent = "Die Anfrage konnte nicht gesendet werden. Bitte schreiben Sie uns direkt an info@adam-logistics.de.";
            showFormStatus("Die Anfrage konnte nicht gesendet werden. Bitte schreiben Sie uns direkt an info@adam-logistics.de.", "error", true);
        } finally {
            submitButton.disabled = false;
        }
    });

    restoreCart();
    updateCart();
}
