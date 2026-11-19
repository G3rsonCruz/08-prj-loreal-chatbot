// Products are loaded from the assignment's products.json file.
let products = [];

// Keep this project's saved selections separate from other websites.
const STORAGE_KEY = "loreal-selected-products";

// Get the HTML elements for the product section.
const productGrid = document.getElementById("productGrid");
const selectedProductsList = document.getElementById(
  "selectedProductsList"
);
const selectedCount = document.getElementById("selectedCount");
const emptySelection = document.getElementById("emptySelection");
const selectionStatus = document.getElementById("selectionStatus");
const catalogNote = document.querySelector(".demo-note");

// Restore saved product IDs when the page opens.
let selectedProductIds = loadSavedSelections();

// Create the Clear all button below the selected-products list.
const clearSelectionsBtn = document.createElement("button");

clearSelectionsBtn.type = "button";
clearSelectionsBtn.className = "remove-product";
clearSelectionsBtn.textContent = "Clear all selections";

selectedProductsList.after(clearSelectionsBtn);

/* Read saved selections from the browser. */
function loadSavedSelections() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(saved)) {
      return [];
    }

    // Convert valid IDs to strings and remove duplicates.
    return [
      ...new Set(
        saved
          .filter(
            (id) =>
              typeof id === "string" ||
              typeof id === "number"
          )
          .map(String)
      )
    ];
  } catch {
    // Continue working even if storage is unavailable or invalid.
    return [];
  }
}

/* Save the current selection in the browser. */
function saveSelections() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(selectedProductIds)
    );
  } catch {
    selectionStatus.textContent =
      "Selections work, but this browser could not save them.";
  }
}

/* Load the product catalog from products.json. */
async function loadProducts() {
  clearSelectionsBtn.disabled = true;

  if (catalogNote) {
    catalogNote.textContent = "Loading products…";
  }

  try {
    const response = await fetch("products.json");

    if (!response.ok) {
      throw new Error(
        "Could not load products.json. Make sure it is next to index.html."
      );
    }

    const data = await response.json();

    // The assignment file contains an object with a products array.
    if (
      !Array.isArray(data.products) ||
      data.products.length === 0
    ) {
      throw new Error(
        'The catalog must contain a nonempty "products" array.'
      );
    }

    // Check the fields needed to display each product.
    const invalidProduct = data.products.some((product) => {
      if (!product || typeof product !== "object") {
        return true;
      }

      const validId =
        (typeof product.id === "string" ||
          typeof product.id === "number") &&
        String(product.id).trim() !== "";

      const validText = [
        "name",
        "brand",
        "category",
        "description"
      ].every(
        (field) =>
          typeof product[field] === "string" &&
          product[field].trim() !== ""
      );

      return !validId || !validText;
    });

    if (invalidProduct) {
      throw new Error(
        "Each product needs an ID, name, brand, category, and description."
      );
    }

    // Use string IDs to match the values stored on the card buttons.
    const loadedProducts = data.products.map((product) => ({
      ...product,
      id: String(product.id)
    }));

    const uniqueIds = new Set(
      loadedProducts.map((product) => product.id)
    );

    if (uniqueIds.size !== loadedProducts.length) {
      throw new Error("Each product must have a unique ID.");
    }

    products = loadedProducts;

    // Restore only products that still exist in this catalog.
    selectedProductIds = selectedProductIds.filter((id) =>
      products.some((product) => product.id === id)
    );

    renderProducts();
    renderSelectedProducts();

    if (catalogNote) {
      catalogNote.textContent =
        `${products.length} products loaded from your assignment catalog. ` +
        "Select products to start building your routine.";
    }
  } catch (error) {
    if (catalogNote) {
      catalogNote.textContent =
        `Unable to load the catalog: ${error.message}`;
    }

    selectionStatus.textContent =
      "The product catalog could not load.";

    console.error("Product catalog error:", error);
  }
}

/* Create the product cards and expandable descriptions. */
function renderProducts() {
  productGrid.replaceChildren();

  products.forEach((product) => {
    const productItem = document.createElement("article");

    // A button makes selection accessible by mouse and keyboard.
    const card = document.createElement("button");

    card.type = "button";
    card.className = "product-card";
    card.dataset.productId = product.id;

    card.setAttribute("aria-pressed", "false");

    card.setAttribute(
      "aria-label",
      `${product.name}, ${product.brand}, ${product.category}`
    );

    // Add an image when the catalog provides one.
    if (
      typeof product.image === "string" &&
      product.image.trim()
    ) {
      const image = document.createElement("img");

      // The product name already labels the card.
      image.alt = "";
      image.loading = "lazy";
      image.width = 140;
      image.height = 140;

      image.style.objectFit = "contain";
      image.style.alignSelf = "center";
      image.style.maxWidth = "100%";

      // Keep the product usable if its image cannot load.
      image.addEventListener(
        "error",
        () => {
          image.hidden = true;
          console.warn(
            `Image could not load for ${product.name}:`,
            product.image
          );
        },
        { once: true }
      );

      image.src = product.image;
      card.append(image);
    }

    const category = document.createElement("span");
    category.className = "product-category";
    category.textContent = product.category;

    const name = document.createElement("strong");
    name.className = "product-name";
    name.textContent = product.name;

    const brand = document.createElement("span");
    brand.className = "product-brand";
    brand.textContent = product.brand;

    const selectionLabel = document.createElement("span");
    selectionLabel.className = "product-selection-label";
    selectionLabel.textContent = "+ Select product";

    card.append(category, name, brand, selectionLabel);

    card.addEventListener("click", () => {
      toggleProduct(product.id);
    });

    // Keep descriptions outside the button so opening them
    // does not accidentally select or unselect the product.
    const details = document.createElement("details");
    details.className = "selected-products";

    const summary = document.createElement("summary");

    const summaryText = document.createElement("span");
    summaryText.textContent = "View description";

    const descriptionLabel = document.createElement("span");
    descriptionLabel.className = "visually-hidden";
    descriptionLabel.textContent = ` for ${product.name}`;

    summary.append(summaryText, descriptionLabel);

    const description = document.createElement("p");
    description.className = "empty-selection";

    // Use textContent instead of interpreting catalog text as HTML.
    description.textContent = product.description;

    details.append(summary, description);

    details.addEventListener("toggle", () => {
      summaryText.textContent = details.open
        ? "Hide description"
        : "View description";
    });

    productItem.append(card, details);
    productGrid.append(productItem);
  });

  // Highlight selections restored from localStorage.
  updateProductCards();
}

/* Select or unselect a product and save the updated selection. */
function toggleProduct(productId) {
  const product = products.find(
    (item) => item.id === productId
  );

  if (!product) {
    return;
  }

  if (selectedProductIds.includes(productId)) {
    selectedProductIds = selectedProductIds.filter(
      (id) => id !== productId
    );

    selectionStatus.textContent = `${product.name} removed.`;
  } else {
    selectedProductIds.push(productId);

    selectionStatus.textContent = `${product.name} selected.`;
  }

  updateProductCards();
  renderSelectedProducts();
  saveSelections();
}

/* Update highlights and labels without rebuilding the cards. */
function updateProductCards() {
  const cards = productGrid.querySelectorAll(".product-card");

  cards.forEach((card) => {
    const isSelected = selectedProductIds.includes(
      card.dataset.productId
    );

    card.classList.toggle("selected", isSelected);

    card.setAttribute(
      "aria-pressed",
      String(isSelected)
    );

    const selectionLabel = card.querySelector(
      ".product-selection-label"
    );

    selectionLabel.textContent = isSelected
      ? "✓ Selected"
      : "+ Select product";
  });
}

/* Show the selected products and their Remove buttons. */
function renderSelectedProducts() {
  selectedProductsList.replaceChildren();

  // Find the full product information for each selected ID.
  const selectedProducts = selectedProductIds
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean);

  selectedCount.textContent =
    `${selectedProducts.length} selected`;

  emptySelection.hidden = selectedProducts.length > 0;

  clearSelectionsBtn.disabled = selectedProducts.length === 0;

  selectedProducts.forEach((product) => {
    const listItem = document.createElement("li");
    listItem.className = "selected-product";

    const info = document.createElement("div");
    info.className = "selected-product-info";

    const name = document.createElement("strong");
    name.className = "selected-product-name";
    name.textContent = product.name;

    const category = document.createElement("p");
    category.className = "selected-product-category";
    category.textContent =
      `${product.brand} · ${product.category}`;

    info.append(name, category);

    const removeButton = document.createElement("button");

    removeButton.type = "button";
    removeButton.className = "remove-product";
    removeButton.textContent = "Remove";

    removeButton.setAttribute(
      "aria-label",
      `Remove ${product.name}`
    );

    removeButton.addEventListener("click", () => {
      toggleProduct(product.id);

      // Return keyboard focus to the corresponding product card
      // after this Remove button disappears.
      const cards = productGrid.querySelectorAll(
        ".product-card"
      );

      const matchingCard = Array.from(cards).find(
        (card) => card.dataset.productId === product.id
      );

      if (matchingCard) {
        matchingCard.focus();
      }
    });

    listItem.append(info, removeButton);
    selectedProductsList.append(listItem);
  });
}

/* Clear the selection on screen and in saved storage. */
clearSelectionsBtn.addEventListener("click", () => {
  selectedProductIds = [];

  updateProductCards();
  renderSelectedProducts();

  selectionStatus.textContent = "All selected products removed.";

  saveSelections();

  // Move focus to a usable control after Clear all is disabled.
  const firstCard = productGrid.querySelector(".product-card");

  if (firstCard) {
    firstCard.focus();
  }
});

// Load the catalog and restore saved selections.
loadProducts();