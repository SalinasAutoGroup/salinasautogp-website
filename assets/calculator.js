const TAX_RATE = 0.0625;
const FIXED_FEES = 317;

const MIN_APR = 6.99;
const MAX_APR = 24.52;

let selectedTerm = 48;
let selectedPresetTerm = 48;
let customAprActive = false;

const vehiclePriceInput = document.getElementById("vehiclePrice");
const downPaymentInput = document.getElementById("downPayment");
const downPaymentSlider = document.getElementById("downPaymentSlider");
const customAprInput = document.getElementById("customApr");
const customTermInput = document.getElementById("customTerm");
const extraPaymentInput = document.getElementById("extraPayment");


const minimumPayment = document.getElementById("minimumPayment");
const maximumPayment = document.getElementById("maximumPayment");
const paymentDash = document.querySelector(".payment-dash");

const displayVehiclePrice = document.getElementById("displayVehiclePrice");
const displayTaxes = document.getElementById("displayTaxes");
const displayDownPayment = document.getElementById("displayDownPayment");
const amountFinancedDisplay = document.getElementById("amountFinanced");
const displayTerm = document.getElementById("displayTerm");
const displayApr = document.getElementById("displayApr");

const regularPaymentDisplay = document.getElementById("regularPayment");
const newPaymentDisplay = document.getElementById("newPayment");
const monthsSavedDisplay = document.getElementById("monthsSaved");
const interestSavedDisplay = document.getElementById("interestSaved");

const paymentDescription = document.getElementById("paymentDescription");

const advancedToggle = document.getElementById("advancedToggle");
const advancedOptions = document.getElementById("advancedOptions");

const termButtons = document.querySelectorAll(".term-button");
const extraButtons = document.querySelectorAll(".extra-buttons button");


function numberValue(input) {
  const value = parseFloat(input.value);

  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}


function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}


function monthlyPayment(principal, apr, months) {
  if (principal <= 0 || months <= 0) {
    return 0;
  }

  const monthlyRate = apr / 100 / 12;

  if (monthlyRate === 0) {
    return principal / months;
  }

  return (
    principal *
    monthlyRate /
    (1 - Math.pow(1 + monthlyRate, -months))
  );
}


function calculateAmountFinanced() {
  const vehiclePrice = numberValue(vehiclePriceInput);

  const taxes = vehiclePrice * TAX_RATE;

  const estimatedTotal =
    vehiclePrice +
    taxes +
    FIXED_FEES;

  let downPayment = numberValue(downPaymentInput);

  if (downPayment > estimatedTotal) {
    downPayment = estimatedTotal;
    downPaymentInput.value = Math.round(downPayment);
  }

  const amountFinanced = Math.max(
    0,
    estimatedTotal - downPayment
  );

  return {
    vehiclePrice,
    taxes,
    estimatedTotal,
    downPayment,
    amountFinanced
  };
}


function updateSlider() {
  const vehiclePrice = numberValue(vehiclePriceInput);

  const newMax = Math.max(
    15000,
    Math.ceil(vehiclePrice / 1000) * 1000
  );

  downPaymentSlider.max = newMax;

  const downPayment = numberValue(downPaymentInput);

  downPaymentSlider.value = Math.min(
    downPayment,
    newMax
  );
}


function payoffWithExtra(principal, apr, regularPayment, extraPayment) {
  if (principal <= 0 || regularPayment <= 0) {
    return {
      months: 0,
      interest: 0
    };
  }

  const monthlyRate = apr / 100 / 12;

  let balance = principal;
  let totalInterest = 0;
  let months = 0;

  const payment = regularPayment + extraPayment;

  while (balance > 0.01 && months < 600) {
    const interest = balance * monthlyRate;

    let principalPayment = payment - interest;

    if (principalPayment <= 0) {
      break;
    }

    if (principalPayment > balance) {
      principalPayment = balance;
    }

    totalInterest += interest;
    balance -= principalPayment;
    months++;
  }

  return {
    months,
    interest: totalInterest
  };
}


function updatePayoff(amountFinanced, apr) {
  const extraPayment = numberValue(extraPaymentInput);

  const regularPayment = monthlyPayment(
    amountFinanced,
    apr,
    selectedTerm
  );

  const regularInterest =
    regularPayment * selectedTerm -
    amountFinanced;

  const accelerated = payoffWithExtra(
    amountFinanced,
    apr,
    regularPayment,
    extraPayment
  );

  const monthsSaved = Math.max(
    0,
    selectedTerm - accelerated.months
  );

  const interestSaved = Math.max(
    0,
    regularInterest - accelerated.interest
  );

  regularPaymentDisplay.textContent =
    `${money(regularPayment)}/mo`;

  newPaymentDisplay.textContent =
    `${money(regularPayment + extraPayment)}/mo`;

  monthsSavedDisplay.textContent =
    `${monthsSaved} ${monthsSaved === 1 ? "month" : "months"}`;

  interestSavedDisplay.textContent =
    money(interestSaved);
}


function updateCalculator() {
  const {
    vehiclePrice,
    taxes,
    downPayment,
    amountFinanced
  } = calculateAmountFinanced();

  displayVehiclePrice.textContent =
    money(vehiclePrice);

  displayTaxes.textContent =
    money(taxes);

  displayDownPayment.textContent =
    `−${money(downPayment)}`;

  amountFinancedDisplay.textContent =
    money(amountFinanced);

  displayTerm.textContent =
    `${selectedTerm} Months`;

  if (customAprActive && customAprInput.value !== "") {
    let customApr = numberValue(customAprInput);

    if (customApr > 40) {
      customApr = 40;
      customAprInput.value = 40;
    }

    const exactPayment = monthlyPayment(
      amountFinanced,
      customApr,
      selectedTerm
    );

    minimumPayment.textContent =
      money(exactPayment);

    maximumPayment.textContent = "";

    paymentDash.style.display = "none";

    displayApr.textContent =
      `${customApr.toFixed(2)}%`;

    paymentDescription.textContent =
      "Estimated payment using the APR entered above.";

    updatePayoff(
      amountFinanced,
      customApr
    );

  } else {

    const lowPayment = monthlyPayment(
      amountFinanced,
      MIN_APR,
      selectedTerm
    );

    const highPayment = monthlyPayment(
      amountFinanced,
      MAX_APR,
      selectedTerm
    );

    minimumPayment.textContent =
      money(lowPayment);

    maximumPayment.textContent =
      money(highPayment);

    paymentDash.style.display = "";

    displayApr.textContent =
      `${MIN_APR.toFixed(2)}% – ${MAX_APR.toFixed(2)}%`;

    paymentDescription.textContent =
      "Estimated payment range based on financing terms and lender approval.";

    /*
      Payoff estimates need one APR.
      Until a custom APR is entered,
      we use the upper end of the estimated range.
    */

    updatePayoff(
      amountFinanced,
      MAX_APR
    );
  }

  updateSlider();
}


termButtons.forEach(button => {
  button.addEventListener("click", () => {
    selectedPresetTerm = Number(button.dataset.term);
    selectedTerm = selectedPresetTerm;

    customTermInput.value = "";

    termButtons.forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    updateCalculator();
  });
});


customTermInput.addEventListener("input", () => {
  const rawValue = customTermInput.value.trim();

  if (rawValue === "") {
    selectedTerm = selectedPresetTerm;

    termButtons.forEach(button => {
      button.classList.toggle(
        "active",
        Number(button.dataset.term) === selectedPresetTerm
      );
    });

    updateCalculator();
    return;
  }

  let customTerm = parseInt(rawValue, 10);

  if (!Number.isFinite(customTerm)) {
    return;
  }

  customTerm = Math.max(1, Math.min(84, customTerm));

  selectedTerm = customTerm;

  termButtons.forEach(button => {
    button.classList.remove("active");
  });

  updateCalculator();
});


vehiclePriceInput.addEventListener("input", () => {
  updateSlider();
  updateCalculator();
});


downPaymentInput.addEventListener("input", () => {
  downPaymentSlider.value =
    numberValue(downPaymentInput);

  updateCalculator();
});


downPaymentSlider.addEventListener("input", () => {
  downPaymentInput.value =
    downPaymentSlider.value;

  updateCalculator();
});


extraPaymentInput.addEventListener("input", () => {
  updateCalculator();
});


extraButtons.forEach(button => {
  button.addEventListener("click", () => {
    extraPaymentInput.value =
      button.dataset.extra;

    updateCalculator();
  });
});


advancedToggle.addEventListener("click", () => {
  const isOpen =
    advancedOptions.classList.toggle("open");

  const symbol =
    advancedToggle.querySelector("span");

  symbol.textContent =
    isOpen ? "−" : "+";
});


customAprInput.addEventListener("input", () => {
  customAprActive =
    customAprInput.value.trim() !== "";

  updateCalculator();
});


customAprInput.value = "";
customAprInput.placeholder = "Example: 12.00";

updateSlider();
updateCalculator();
