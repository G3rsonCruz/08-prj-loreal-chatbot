// Load the actual products from products.json.
let products = [];

// Store selected product IDs.
// Saving selections after a reload will be added later.
let selectedProductIds = [];

// Get the product section elements.
const productGrid = document.getElementById("productGrid");

const selectedProductsList = document.getElementById(
  "selectedProductsList"
);

const selectedCount = document.getElementById("selectedCount");
const emptySelection = document.getElementById("emptySelection");
const selectionStatus = document.getElementById("selectionStatus");
const catalogNote = document.querySelector(".demo-note");

/* Load the product catalog from the JSON file. */
async function loadProducts() {
  if (catalogNote) {
    catalogNote.textContent = "Loading products…";
  }

  try {
    const response = await fetch("products.json");

    // Handle missing files or other unsuccessful responses.
    if (!response.ok) {
      throw new Error(
        "Could not load products.json. Make sure it is next to index.html."
      );
    }

    const data = await response.json();

    // The provided file contains an object with a products array.
    if (
      !Array.isArray(data.products) ||
      data.products.length === 0
    ) {
      throw new Error(
        "The JSON file must contain a nonempty products array."
      );
    }

    // Check the fields needed to display each product.
    const hasInvalidProduct = data.products.some((product) => {
      return (
        !product ||
        !["string", "number"].includes(typeof product.id) ||
        !String(product.id).trim() ||
        ["name", "brand", "category", "description"].some(
          (field) =>
            typeof product[field] !== "string" ||
            !product[field].trim()
        )
      );
    });

    if (hasInvalidProduct) {
      throw new Error(
        "A product is missing an ID, name, brand, category, or description."
      );
    }

    // Convert IDs to strings so they match HTML data attributes.
    products = data.products.map((product) => ({
      ...product,
      id: String(product.id)
    }));

    // Each product must have its own unique ID.
    const uniqueIds = new Set(
      products.map((product) => product.id)
    );

    if (uniqueIds.size !== products.length) {
      throw new Error("The catalog contains duplicate product IDs.");
    }

    renderProducts();
    renderSelectedProducts();

    // Replace the old demo message with the actual product count.
    if (catalogNote) {
      catalogNote.textContent =
        `${products.length} products loaded from your assignment catalog. ` +
        "Select products to start building your routine.";
    }
  } catch (error) {
    // Display a useful message instead of leaving an unexplained empty grid.
    if (catalogNote) {
      catalogNote.textContent =
        `Unable to load the catalog: ${error.message}`;
    }

    selectionStatus.textContent = "The product catalog could not load.";

    // Keep the original error available for troubleshooting.
    console.error("Product catalog error:", error);
  }
}

/* Create product cards and expandable descriptions. */
function renderProducts() {
  productGrid.replaceChildren();

  products.forEach((product) => {
    // Group the selection card and its description.
    const productItem = document.createElement("article");

    // Make the entire card a keyboard-accessible button.
    const card = document.createElement("button");

    card.type = "button";
    card.className = "product-card";
    card.dataset.productId = product.id;

    card.setAttribute("aria-pressed", "false");

    card.setAttribute(
      "aria-label",
      `${product.name}, ${product.brand}, ${product.category}`
    );

    // Add the product image when the catalog provides one.
    if (typeof product.image === "string" && product.image.trim()) {
      const image = document.createElement("img");

      // The product name is already included in the button's label.
      image.alt = "";

      image.loading = "lazy";
      image.width = 140;
      image.height = 140;

      // Keep the image proportional and centered.
      image.style.objectFit = "contain";
      image.style.alignSelf = "center";
      image.style.maxWidth = "100%";

      // Keep the card usable if an external image fails to load.
      image.addEventListener(
        "error",
        () => {
          image.hidden = true;
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

    // Select or unselect this product when its card is clicked.
    card.addEventListener("click", () => {
      toggleProduct(product.id);
    });

    // Keep the description outside the selection button.
    const details = document.createElement("details");
    details.className = "selected-products";

    const summary = document.createElement("summary");

    const summaryText = document.createElement("span");
    summaryText.textContent = "View description";

    // Include the product name for screen reader users.
    const accessibleName = document.createElement("span");
    accessibleName.className = "visually-hidden";
    accessibleName.textContent = ` for ${product.name}`;

    summary.append(summaryText, accessibleName);

    const description = document.createElement("p");
    description.className = "empty-selection";

    // Display the catalog description safely as text.
    description.textContent = product.description;

    details.append(summary, description);

    // Change the label when the description opens or closes.
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
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return;
  }

  if (selectedProductIds.includes(productId)) {
    // Remove the selected ID.
    selectedProductIds = selectedProductIds.filter(
      (id) => id !== productId
    );

    selectionStatus.textContent = `${product.name} removed.`;
  } else {
    // Add the ID once.
    selectedProductIds.push(productId);

    selectionStatus.textContent = `${product.name} selected.`;
  }

  updateProductCards();
  renderSelectedProducts();
}

/* Update highlights without rebuilding the cards. */
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

/* Update the selected-products list. */
function renderSelectedProducts() {
  selectedProductsList.replaceChildren();

  selectedCount.textContent =
    `${selectedProductIds.length} selected`;

  emptySelection.hidden = selectedProductIds.length > 0;

  selectedProductIds.forEach((productId) => {
    const product = products.find(
      (item) => item.id === productId
    );

    if (!product) {
      return;
    }

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

      // Return keyboard focus to the matching product card.
      const cards = productGrid.querySelectorAll(".product-card");

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

// Show the empty selection state, then load the catalog.
renderSelectedProducts();
loadProducts();