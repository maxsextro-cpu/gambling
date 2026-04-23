const DEPOSIT_KEY = "demo_deposit_balance";

function readBalance() {
  const raw = localStorage.getItem(DEPOSIT_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function writeBalance(amount) {
  const safe = Math.max(0, Number(amount) || 0);
  localStorage.setItem(DEPOSIT_KEY, safe.toFixed(2));
}

function formatMoney(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function updateBalanceUI() {
  const elements = document.querySelectorAll("[data-balance]");
  const balance = readBalance();
  elements.forEach((el) => {
    el.textContent = formatMoney(balance);
  });
}

function notify(message) {
  alert(message);
}

async function fetchOneMonthYield() {
  const fallback = 5.25;
  try {
    const response = await fetch(
      "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS1MO",
      { cache: "no-store" }
    );
    if (!response.ok) {
      return fallback;
    }
    const csv = await response.text();
    const rows = csv.trim().split("\n").slice(1);
    for (let i = rows.length - 1; i >= 0; i -= 1) {
      const value = Number(rows[i].split(",")[1]);
      if (Number.isFinite(value)) {
        return value;
      }
    }
    return fallback;
  } catch (error) {
    return fallback;
  }
}

function initHome() {
  const form = document.getElementById("deposit-form");
  const input = document.getElementById("deposit-amount");
  const actions = document.querySelectorAll("[data-requires-balance]");
  updateBalanceUI();

  const toggleActions = () => {
    const balance = readBalance();
    const isDisabled = balance <= 0;
    actions.forEach((item) => {
      if (item.tagName === "A") {
        item.setAttribute("aria-disabled", String(isDisabled));
        item.style.pointerEvents = isDisabled ? "none" : "auto";
        item.style.opacity = isDisabled ? "0.5" : "1";
      } else {
        item.disabled = isDisabled;
      }
    });
  };

  actions.forEach((item) => {
    if (item.tagName === "A") {
      item.addEventListener("click", (event) => {
        if (item.getAttribute("aria-disabled") === "true") {
          event.preventDefault();
        }
      });
    }
  });

  toggleActions();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = Number(input.value);
    if (!Number.isFinite(value) || value <= 0) {
      notify("Enter a valid fake deposit amount.");
      return;
    }
    const updated = readBalance() + value;
    writeBalance(updated);
    updateBalanceUI();
    input.value = "";
    toggleActions();
  });

  const resetBtn = document.getElementById("reset-balance");
  resetBtn.addEventListener("click", () => {
    writeBalance(0);
    updateBalanceUI();
    toggleActions();
  });
}

async function initStake() {
  updateBalanceUI();
  const yieldSpan = document.getElementById("treasury-yield");
  const stakeInput = document.getElementById("stake-amount");
  const expectedPayout = document.getElementById("expected-payout");
  const confirmBtn = document.getElementById("confirm-stake");
  const backBtn = document.getElementById("back-home");

  const oneMonthYield = await fetchOneMonthYield();
  yieldSpan.textContent = `${oneMonthYield.toFixed(2)}%`;

  const recompute = () => {
    const amount = Number(stakeInput.value) || 0;
    const payout = amount * (oneMonthYield / 100) * (1 / 12);
    expectedPayout.textContent =
      amount > 0 ? formatMoney(payout) : formatMoney(0);
  };

  stakeInput.addEventListener("input", recompute);
  recompute();

  confirmBtn.addEventListener("click", () => {
    const amount = Number(stakeInput.value);
    const balance = readBalance();
    if (!Number.isFinite(amount) || amount <= 0) {
      notify("Enter a valid amount to stake.");
      return;
    }
    if (amount > balance) {
      notify("You cannot stake more than your current deposit.");
      return;
    }
    writeBalance(balance - amount);
    notify(`Staked ${formatMoney(amount)}. Returning to home page.`);
    window.location.href = "index.html";
  });

  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

function initCasinos() {
  updateBalanceUI();
  const casinos = [
    { name: "Greenetrack", city: "Eutaw, AL", miles: "33 mi" },
    { name: "Wind Creek Casino & Hotel", city: "Montgomery, AL", miles: "95 mi" },
    { name: "Birmingham Race Course Casino", city: "Birmingham, AL", miles: "60 mi" },
    { name: "Wind Creek Wetumpka", city: "Wetumpka, AL", miles: "105 mi" },
    { name: "Wind Creek Atmore", city: "Atmore, AL", miles: "200 mi" }
  ];

  const list = document.getElementById("casino-list");
  const selectedCasino = document.getElementById("selected-casino");
  const chipAmount = document.getElementById("chip-amount");
  const getChipsBtn = document.getElementById("get-chips");
  const barcodeBlock = document.getElementById("barcode-block");
  const barcodeEl = document.getElementById("chip-barcode");
  const chipCodeFallback = document.getElementById("chip-code-fallback");
  const barcodeInstructions = document.getElementById("barcode-instructions");
  const backBtn = document.getElementById("back-home");
  let selectedButton = null;

  casinos.forEach((casino) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "casino-item";
    item.textContent = `${casino.name} - ${casino.city} (${casino.miles})`;
    item.addEventListener("click", () => {
      selectedCasino.value = casino.name;
      if (selectedButton) {
        selectedButton.classList.remove("selected");
      }
      selectedButton = item;
      selectedButton.classList.add("selected");
    });
    list.appendChild(item);
  });

  getChipsBtn.addEventListener("click", () => {
    const balance = readBalance();
    const casino = selectedCasino.value;
    const amount = Number(chipAmount.value);
    if (!casino) {
      notify("Select a casino first.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      notify("Enter a valid chip amount.");
      return;
    }
    if (amount > balance) {
      notify("Insufficient deposit balance.");
      return;
    }

    writeBalance(balance - amount);
    updateBalanceUI();

    const codeValue = `CHIP-${casino.replace(/\s+/g, "-").toUpperCase()}-${Date.now()}`;
    if (window.JsBarcode) {
      chipCodeFallback.hidden = true;
      window.JsBarcode(barcodeEl, codeValue, {
        width: 2,
        height: 70,
        displayValue: true
      });
    } else {
      barcodeEl.innerHTML = "";
      chipCodeFallback.textContent = codeValue;
      chipCodeFallback.hidden = false;
    }

    barcodeInstructions.textContent = `Sit at a table at "${casino}" and scan this code to get chips.`;
    barcodeBlock.hidden = false;
  });

  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

function initCoinFlip() {
  updateBalanceUI();
  const betInput = document.getElementById("bet-amount");
  const guessSelect = document.getElementById("guess-side");
  const flipBtn = document.getElementById("flip-coin");
  const resultText = document.getElementById("flip-result");
  const coin = document.getElementById("coin");
  const backBtn = document.getElementById("back-home");

  flipBtn.addEventListener("click", () => {
    const balance = readBalance();
    const bet = Number(betInput.value);
    if (!Number.isFinite(bet) || bet <= 0) {
      notify("Enter a valid bet amount.");
      return;
    }
    if (bet > balance) {
      notify("Your bet cannot be greater than your deposit.");
      return;
    }

    flipBtn.disabled = true;
    coin.classList.remove("flip");
    void coin.offsetWidth;
    coin.classList.add("flip");
    resultText.textContent = "Flipping...";

    setTimeout(() => {
      const actual = Math.random() < 0.5 ? "Heads" : "Tails";
      const guessed = guessSelect.value;
      let newBalance = balance - bet;

      if (guessed === actual) {
        const payout = bet * 1.95;
        newBalance += payout;
        resultText.textContent = `Result: ${actual}. You won ${formatMoney(
          payout - bet
        )} profit (1.95x payout)!`;
      } else {
        resultText.textContent = `Result: ${actual}. You lost ${formatMoney(bet)}.`;
      }

      writeBalance(newBalance);
      updateBalanceUI();
      coin.textContent = actual;
      flipBtn.disabled = false;
    }, 1450);
  });

  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "home") initHome();
  if (page === "stake") initStake();
  if (page === "casinos") initCasinos();
  if (page === "coinflip") initCoinFlip();
});
