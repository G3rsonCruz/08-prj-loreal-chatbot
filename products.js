// Load product information from products.json.
let products = [];

// Keep saved selections separate from other projects.
const STORAGE_KEY = "loreal-selected-products";

// Product section elements.
const productGrid = document.getElementById("productGrid");
const selectedProductsList = document.getElementById(
  "selectedProductsList"
);
const selectedCount = document.getElementById("selectedCount");
const emptySelection = document.getElementById("emptySelection");
const selectionStatus = document.getElementById("selectionStatus");
const catalogNote = document.querySelector(".demo-note");

// Search and category elements.
const productSearch = document.getElementById("productSearch");
const categoryFilter = document.getElementById("categoryFilter");
const productResults = document.getElementById("productResults");
const noProductResults = document.getElementById("noProductResults");

// Restore saved IDs when the page opens.
let selectedProductIds = loadSavedSelections();

// Create the Clear all button.
const clearSelectionsBtn = document.createElement("button");

clearSelectionsBtn.type = "button";
clearSelectionsBtn.className = "remove-product";
clearSelectionsBtn.textContent = "Clear all selections";
clearSelectionsBtn.disabled = true;

selectedProductsList.after(clearSelectionsBtn);

// Create the Generate Routine button.
// script.js uses this ID to disable it during AI requests.
const generateRoutineBtn = document.createElement("button");

generateRoutineBtn.type = "button";
generateRoutineBtn.id = "generateRoutineButton";
generateRoutineBtn.className = "remove-product";
generateRoutineBtn.textContent = "Generate Routine";
generateRoutineBtn.style.marginInlineStart = "12px";

clearSelectionsBtn.after(generateRoutineBtn);

/* Read saved selections from the browser. */
function loadSavedSelections() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(saved)) {
      return [];
    }

    // Keep valid IDs, convert to strings, and remove duplicates.
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
    // Keep the page working if storage is unavailable or invalid.
    return [];
  }
}

/* Save the selected IDs in the browser. */
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

/* Load and validate the product catalog. */
async function loadProducts() {
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

    if (
      !Array.isArray(data.products) ||
      data.products.length === 0
    ) {
      throw new Error(
        'The catalog must contain a nonempty "products" array.'
      );
    }

    // Check the fields used by the cards and routine generator.
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

    // String IDs match the data attributes on product cards.
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

    // Restore only selections that still exist in this catalog.
    selectedProductIds = selectedProductIds.filter((id) =>
      products.some((product) => product.id === id)
    );

    renderProducts();
    renderSelectedProducts();
    setupProductFilters();

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

/* Create product cards and expandable descriptions. */
function renderProducts() {
  productGrid.replaceChildren();

  products.forEach((product) => {
    const productItem = document.createElement("article");

    // A button supports selection with a mouse or keyboard.
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

      // The card is already labeled with the product's name.
      image.alt = "";
      image.loading = "lazy";
      image.width = 140;
      image.height = 140;

      image.style.objectFit = "contain";
      image.style.alignSelf = "center";
      image.style.maxWidth = "100%";

      image.addEventListener(
        "error",
        () => {
          // The product remains usable if its image fails.
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

    // Descriptions are outside the selection button.
    // Opening a description does not change the selection.
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

    // Display catalog content as text, not HTML.
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

  updateProductCards();
}

/* Select or unselect a product. */
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

/* Update highlights without rebuilding the cards. */
function updateProductCards() {
  const cards = productGrid.querySelectorAll(".product-card");

  cards.forEach((card) => {
    const isSelected = selectedProductIds.includes(
      card.dataset.productId
    );

    card.classList.toggle("selected", isSelected);
    card.setAttribute("aria-pressed", String(isSelected));

    const selectionLabel = card.querySelector(
      ".product-selection-label"
    );

    selectionLabel.textContent = isSelected
      ? "✓ Selected"
      : "+ Select product";
  });
}

/* Get full product information for the selected IDs. */
function getSelectedProducts() {
  return selectedProductIds
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean);
}

/* Display selected products and individual Remove buttons. */
function renderSelectedProducts() {
  selectedProductsList.replaceChildren();

  const selectedProducts = getSelectedProducts();

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

      const cards = productGrid.querySelectorAll(
        ".product-card"
      );

      const matchingCard = Array.from(cards).find(
        (card) => card.dataset.productId === product.id
      );

      // Restore focus without scrolling to the product.
      if (
        matchingCard &&
        !matchingCard.closest("article").hidden
      ) {
        matchingCard.focus({ preventScroll: true });
      } else {
        focusProductControls();
      }
    });

    listItem.append(info, removeButton);
    selectedProductsList.append(listItem);
  });
}

/* Focus a visible control without moving the page. */
function focusProductControls() {
  if (productSearch && !productSearch.disabled) {
    productSearch.focus({ preventScroll: true });
    return;
  }

  const firstVisibleCard = productGrid.querySelector(
    "article:not([hidden]) .product-card"
  );

  if (firstVisibleCard) {
    firstVisibleCard.focus({ preventScroll: true });
  }
}

/* Prepare the category dropdown and search listeners. */
function setupProductFilters() {
  // Keep the catalog usable if the HTML controls are missing.
  if (
    !productSearch ||
    !categoryFilter ||
    !productResults ||
    !noProductResults
  ) {
    console.warn(
      "Add the product search and category controls to index.html " +
      "to enable filtering."
    );

    return;
  }

  // Build categories from the actual catalog.
  const categories = [
    ...new Set(
      products.map((product) =>
        product.category.trim().toLowerCase()
      )
    )
  ].sort();

  categoryFilter.replaceChildren();

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "All categories";

  categoryFilter.append(allOption);

  categories.forEach((category) => {
    const option = document.createElement("option");

    option.value = category;
    option.textContent =
      category.charAt(0).toUpperCase() + category.slice(1);

    categoryFilter.append(option);
  });

  productSearch.disabled = false;
  categoryFilter.disabled = false;

  productSearch.addEventListener("input", filterProducts);
  categoryFilter.addEventListener("change", filterProducts);

  filterProducts();
}

/* Ignore capitalization, accents, and apostrophes in searches. */
function normalizeProductText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .toLowerCase();
}

/* Show products matching both the search and category. */
function filterProducts() {
  const searchText = normalizeProductText(
    productSearch.value.trim()
  );

  const searchWords = searchText.split(/\s+/).filter(Boolean);
  const selectedCategory = categoryFilter.value;

  let visibleCount = 0;

  const cards = productGrid.querySelectorAll(".product-card");

  cards.forEach((card) => {
    const product = products.find(
      (item) => item.id === card.dataset.productId
    );

    if (!product) {
      return;
    }

    const searchableText = normalizeProductText(
      [
        product.name,
        product.brand,
        product.category,
        product.description
      ].join(" ")
    );

    // Every search word must appear in the product information.
    const matchesSearch = searchWords.every((word) =>
      searchableText.includes(word)
    );

    const matchesCategory =
      selectedCategory === "" ||
      product.category.trim().toLowerCase() === selectedCategory;

    const matches = matchesSearch && matchesCategory;

    // Hide the entire card and its description.
    // Hidden products remain selected.
    card.closest("article").hidden = !matches;

    if (matches) {
      visibleCount++;
    }
  });

  productResults.textContent =
    `Showing ${visibleCount} of ${products.length} products.`;

  noProductResults.hidden = visibleCount > 0;
}

/* Clear all selected products and save the empty selection. */
clearSelectionsBtn.addEventListener("click", () => {
  selectedProductIds = [];

  updateProductCards();
  renderSelectedProducts();

  selectionStatus.textContent = "All selected products removed.";

  saveSelections();
  focusProductControls();
});

/* Send selected product data to the chat script. */
generateRoutineBtn.addEventListener("click", () => {
  const selectedProducts = getSelectedProducts().map(
    (product) => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description
    })
  );

  if (selectedProducts.length === 0) {
    const message =
      "Select at least one product before generating a routine.";

    selectionStatus.textContent = message;

    const chatStatusElement = document.getElementById("status");

    if (chatStatusElement) {
      chatStatusElement.textContent = message;
    }

    return;
  }

  // script.js handles the request and conversation history.
  document.dispatchEvent(
    new CustomEvent("generate-routine", {
      detail: selectedProducts
    })
  );
});

// Load the catalog, restore selections, and activate filters.
loadProducts();