// Demo data for testing product selection.
// Replace these items with your assignment's real product data later.
const products = [
  {
    id: "demo-cleanser",
    name: "Sample Facial Cleanser",
    brand: "Demo product",
    category: "Skincare",
    description: "Placeholder description for testing a skincare product."
  },
  {
    id: "demo-shampoo",
    name: "Sample Shampoo",
    brand: "Demo product",
    category: "Haircare",
    description: "Placeholder description for testing a haircare product."
  },
  {
    id: "demo-mascara",
    name: "Sample Mascara",
    brand: "Demo product",
    category: "Makeup",
    description: "Placeholder description for testing a makeup product."
  },
  {
    id: "demo-fragrance",
    name: "Sample Fragrance",
    brand: "Demo product",
    category: "Fragrance",
    description: "Placeholder description for testing a fragrance product."
  }
];

// Get the HTML elements for product selection.
const productGrid = document.getElementById("productGrid");

const selectedProductsList = document.getElementById(
  "selectedProductsList"
);

const selectedCount = document.getElementById("selectedCount");
const emptySelection = document.getElementById("emptySelection");
const selectionStatus = document.getElementById("selectionStatus");

// Store the IDs of selected products.
// We will add localStorage in a later step.
let selectedProductIds = [];

/* Create the product cards when the page loads. */
function renderProducts() {
  productGrid.replaceChildren();

  products.forEach((product) => {
    // A button makes the entire card clickable and keyboard accessible.
    const card = document.createElement("button");

    card.type = "button";
    card.className = "product-card";

    // Store the product ID on the card.
    card.dataset.productId = product.id;

    // Tell screen readers whether the card is selected.
    card.setAttribute("aria-pressed", "false");

    // Keep the accessible name stable when selection changes.
    card.setAttribute(
      "aria-label",
      `${product.name}, ${product.brand}, ${product.category}`
    );

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

    productGrid.append(card);
  });
}

/* Add or remove a product from the selection. */
function toggleProduct(productId) {
  const product = products.find((item) => item.id === productId);

  // Ignore an ID that does not belong to a product.
  if (!product) {
    return;
  }

  if (selectedProductIds.includes(productId)) {
    // Keep every selected ID except the one being removed.
    selectedProductIds = selectedProductIds.filter(
      (id) => id !== productId
    );

    selectionStatus.textContent = `${product.name} removed.`;
  } else {
    // Add the ID once. Clicking again will remove it.
    selectedProductIds.push(productId);

    selectionStatus.textContent = `${product.name} selected.`;
  }

  updateProductCards();
  renderSelectedProducts();
}

/* Update the appearance of each card without recreating it. */
function updateProductCards() {
  const cards = productGrid.querySelectorAll(".product-card");

  cards.forEach((card) => {
    const isSelected = selectedProductIds.includes(
      card.dataset.productId
    );

    // Apply or remove the selected CSS class.
    card.classList.toggle("selected", isSelected);

    // Update the selection state for screen readers.
    card.setAttribute("aria-pressed", String(isSelected));

    const selectionLabel = card.querySelector(
      ".product-selection-label"
    );

    selectionLabel.textContent = isSelected
      ? "✓ Selected"
      : "+ Select product";
  });
}

/* Display the selected products below the grid. */
function renderSelectedProducts() {
  selectedProductsList.replaceChildren();

  selectedCount.textContent =
    `${selectedProductIds.length} selected`;

  // Show the empty message only when nothing is selected.
  emptySelection.hidden = selectedProductIds.length > 0;

  selectedProductIds.forEach((productId) => {
    const product = products.find((item) => item.id === productId);

    const listItem = document.createElement("li");
    listItem.className = "selected-product";

    const info = document.createElement("div");
    info.className = "selected-product-info";

    const name = document.createElement("strong");
    name.className = "selected-product-name";
    name.textContent = product.name;

    const category = document.createElement("p");
    category.className = "selected-product-category";
    category.textContent = product.category;

    info.append(name, category);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-product";
    removeButton.textContent = "Remove";

    // Include the product name for screen reader users.
    removeButton.setAttribute(
      "aria-label",
      `Remove ${product.name}`
    );

    removeButton.addEventListener("click", () => {
      toggleProduct(product.id);

      // The remove button disappears after removal.
      // Move focus to the matching card so keyboard users retain their place.
      const matchingCard = Array.from(productGrid.children).find(
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

// Create the initial grid and empty selected-products list.
renderProducts();
renderSelectedProducts();