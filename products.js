// Demo data for testing product selection.
// Replace these items with your assignment's real product data later.
const products = [
  {
    id: "demo-cleanser",
    name: "Sample Facial Cleanser",
    brand: "Demo product",
    category: "Skincare",
    description:
      "This sample item represents a facial cleanser in the routine builder. " +
      "It is demo data, not an actual L’Oréal product or recommendation."
  },
  {
    id: "demo-shampoo",
    name: "Sample Shampoo",
    brand: "Demo product",
    category: "Haircare",
    description:
      "This sample item represents a shampoo in the routine builder. " +
      "It is demo data, not an actual L’Oréal product or recommendation."
  },
  {
    id: "demo-mascara",
    name: "Sample Mascara",
    brand: "Demo product",
    category: "Makeup",
    description:
      "This sample item represents a mascara in the routine builder. " +
      "It is demo data, not an actual L’Oréal product or recommendation."
  },
  {
    id: "demo-fragrance",
    name: "Sample Fragrance",
    brand: "Demo product",
    category: "Fragrance",
    description:
      "This sample item represents a fragrance in the routine builder. " +
      "It is demo data, not an actual L’Oréal product or recommendation."
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

/* Create the product cards and their description dropdowns. */
function renderProducts() {
  productGrid.replaceChildren();

  products.forEach((product) => {
    // Keep the selection button and description together in one grid item.
    const productItem = document.createElement("article");

    // The card button controls product selection.
    const card = document.createElement("button");

    card.type = "button";
    card.className = "product-card";
    card.dataset.productId = product.id;

    // Tell screen readers whether the product is selected.
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

    // Clicking the card selects or unselects the product.
    card.addEventListener("click", () => {
      toggleProduct(product.id);
    });

    // A native details element provides an accessible dropdown.
    const details = document.createElement("details");

    // Reuse the existing white-panel styling.
    details.className = "selected-products";

    // The summary opens and closes the description.
    const summary = document.createElement("summary");
    summary.textContent = "View description";

    // Add the product name for screen readers.
    const descriptionLabel = document.createElement("span");
    descriptionLabel.className = "visually-hidden";
    descriptionLabel.textContent = ` for ${product.name}`;

    summary.append(descriptionLabel);

    // Show the description as text rather than interpreting it as HTML.
    const description = document.createElement("p");
    description.className = "empty-selection";
    description.textContent = product.description;

    details.append(summary, description);

    // Update the label when the description opens or closes.
    details.addEventListener("toggle", () => {
      summary.firstChild.textContent = details.open
        ? "Hide description"
        : "View description";
    });

    // Keep details outside the selection button.
    // Opening a description therefore does not toggle selection.
    productItem.append(card, details);

    productGrid.append(productItem);
  });
}

/* Add or remove a product from the selection. */
function toggleProduct(productId) {
  const product = products.find((item) => item.id === productId);

  // Ignore IDs that do not belong to a product.
  if (!product) {
    return;
  }

  if (selectedProductIds.includes(productId)) {
    // Remove this product's ID from the selection.
    selectedProductIds = selectedProductIds.filter(
      (id) => id !== productId
    );

    selectionStatus.textContent = `${product.name} removed.`;
  } else {
    // Add the product's ID to the selection.
    selectedProductIds.push(productId);

    selectionStatus.textContent = `${product.name} selected.`;
  }

  updateProductCards();
  renderSelectedProducts();
}

/* Update card selection without rebuilding the description dropdowns. */
function updateProductCards() {
  const cards = productGrid.querySelectorAll(".product-card");

  cards.forEach((card) => {
    const isSelected = selectedProductIds.includes(
      card.dataset.productId
    );

    // Apply or remove the red highlight.
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

    removeButton.setAttribute(
      "aria-label",
      `Remove ${product.name}`
    );

    removeButton.addEventListener("click", () => {
      toggleProduct(product.id);

      // Find the matching card inside its article wrapper.
      const cards = productGrid.querySelectorAll(".product-card");

      const matchingCard = Array.from(cards).find(
        (card) => card.dataset.productId === product.id
      );

      // Preserve a useful focus position after the remove button disappears.
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