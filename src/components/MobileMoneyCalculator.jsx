import { useMemo, useState } from "react";

const MOBILE_MONEY_TARIFFS = {
  airtel: [
    [500, 2500, 330, 100],
    [2501, 5000, 440, 100],
    [5001, 15000, 700, 500],
    [15001, 30000, 880, 500],
    [30001, 45000, 1210, 500],
    [45001, 60000, 1500, 500],
    [60001, 125000, 1925, 1000],
    [125001, 250000, 3575, 1000],
    [250001, 500000, 7000, 1000],
    [500001, 1000000, 12500, 1500],
    [1000001, 2000000, 15000, 2000],
    [2000001, 4000000, 18000, 2000],
    [4000001, 5000000, 20000, 2000],
  ],
  mtn: [
    [500, 2500, 330, 100],
    [2501, 5000, 440, 100],
    [5001, 15000, 700, 500],
    [15001, 30000, 880, 500],
    [30001, 45000, 1210, 500],
    [45001, 60000, 1500, 500],
    [60001, 125000, 1925, 1000],
    [125001, 250000, 3575, 1000],
    [250001, 500000, 7000, 1000],
    [500001, 1000000, 12500, 1500],
    [1000001, 2000000, 15000, 2000],
    [2000001, 4000000, 18000, 2000],
    [4000001, 5000000, 20000, 2000],
  ],
};

const NETWORK_LABELS = {
  airtel: "Airtel Money",
  mtn: "MTN MoMo",
};

const PROVIDER_INFO = {
  airtel: {
    name: "Airtel Money",
    source: "https://www.airtel.co.ug/airtelmoney/transaction_fees",
  },
  mtn: {
    name: "MTN MoMo",
    source: "https://www.mtn.co.ug/tariffs/mobile-money-tariffs/",
  },
};

const parseAmount = (value) =>
  Number(String(value).replace(/[^0-9]/g, "")) || 0;
const formatAmount = (value) => Math.round(value).toLocaleString("en-UG");
const formatCurrency = (value) => `UGX ${formatAmount(value)}`;

const findBand = (amount, network) =>
  MOBILE_MONEY_TARIFFS[network].find(
    ([min, max]) => amount >= min && amount <= max,
  );

export default function MobileMoneyCalculator({ onClose }) {
  const [network, setNetwork] = useState("airtel");
  const [cashInput, setCashInput] = useState("780,000");
  const [includeSenderFee, setIncludeSenderFee] = useState(true);
  const [copyState, setCopyState] = useState("idle");
  const provider = PROVIDER_INFO[network];

  const calculation = useMemo(() => {
    const cash = parseAmount(cashInput);
    const band = findBand(cash, network);
    const withdrawalFee = band ? band[2] : 0;
    const tax = Math.round(cash * 0.005);
    const walletNeeded = cash + withdrawalFee + tax;
    const senderBand = findBand(walletNeeded, network);
    const senderFee = senderBand ? senderBand[3] : 0;
    const senderTotal = walletNeeded + (includeSenderFee ? senderFee : 0);
    let warning = "";

    if (cash && !band) {
      warning =
        cash < 500
          ? "Minimum supported transaction is UGX 500."
          : "Maximum supported transaction is UGX 5,000,000.";
    }

    return {
      cash,
      withdrawalFee,
      tax,
      walletNeeded,
      senderFee,
      senderTotal,
      warning,
    };
  }, [cashInput, includeSenderFee, network]);

  const handleCashInput = (event) => {
    const amount = parseAmount(event.target.value);
    setCashInput(amount ? formatAmount(amount) : "");
  };

  const copyResult = async () => {
    const text = `${NETWORK_LABELS[network]}: To withdraw ${formatCurrency(calculation.cash)}, the wallet should receive ${formatCurrency(calculation.walletNeeded)}. Sender total including transfer fee: ${formatCurrency(calculation.senderTotal)}.`;

    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1200);
    } catch {
      window.prompt("Copy mobile money result", text);
    }
  };

  return (
    <section
      id="mobile-money-calculator"
      className="mobile-money-panel"
      data-network={network}
      aria-labelledby="mobile-money-heading"
    >
      <div className="mobile-money-header">
        <div>
          <p className="mobile-money-kicker">Uganda Mobile Money</p>
          <h2 id="mobile-money-heading">Withdrawal Charges Calculator</h2>
          <p>
            Calculate how much should reach your wallet to withdraw an exact
            cash amount.
          </p>
        </div>
        <button
          className="mobile-money-close"
          type="button"
          onClick={onClose}
          aria-label="Close mobile money calculator"
        >
          Close
        </button>
      </div>

      <div className="mobile-money-grid">
        <div className="mobile-money-card mobile-money-inputs">
          <label className="mobile-money-label">Network</label>
          <div
            className="mobile-money-network-options"
            role="group"
            aria-label="Mobile money network"
          >
            {Object.entries(NETWORK_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`mobile-money-network ${network === key ? "active" : ""}`}
                data-network={key}
                onClick={() => setNetwork(key)}
              >
                <span className="mobile-money-brand-dot" />
                <span>{label}</span>
                <small>Uganda</small>
              </button>
            ))}
          </div>

          <label className="mobile-money-label" htmlFor="mobile-money-cash">
            Cash you want to receive
          </label>
          <input
            id="mobile-money-cash"
            className="mobile-money-cash-input"
            inputMode="numeric"
            autoComplete="off"
            value={cashInput}
            onChange={handleCashInput}
            aria-describedby="mobile-money-cash-hint"
          />
          <p id="mobile-money-cash-hint" className="mobile-money-hint">
            Enter the amount you want the agent to hand you.
          </p>

          <label className="mobile-money-toggle">
            <input
              type="checkbox"
              checked={includeSenderFee}
              onChange={(event) => setIncludeSenderFee(event.target.checked)}
            />
            Include sender transfer fee in total outflow
          </label>

          {calculation.warning && (
            <div className="mobile-money-warning" role="alert">
              {calculation.warning}
            </div>
          )}

          <div className="mobile-money-source-note">
            <strong>{provider.name} tariff</strong>
            <span>
              Independent {provider.name} fee table. Verified 10 July 2026.
            </span>
            <a href={provider.source} target="_blank" rel="noopener noreferrer">
              Open official tariff page
            </a>
          </div>
        </div>

        <div className="mobile-money-card mobile-money-results">
          <div className="mobile-money-primary-result">
            <span>Amount that should reach your wallet</span>
            <strong>{formatCurrency(calculation.walletNeeded)}</strong>
          </div>

          <div className="mobile-money-rows">
            <div className="mobile-money-row">
              <span>Cash withdrawn</span>
              <strong>{formatCurrency(calculation.cash)}</strong>
            </div>
            <div className="mobile-money-row">
              <span>Agent withdrawal fee</span>
              <strong>{formatCurrency(calculation.withdrawalFee)}</strong>
            </div>
            <div className="mobile-money-row">
              <span>Government withdrawal tax (0.5%)</span>
              <strong>{formatCurrency(calculation.tax)}</strong>
            </div>
            <div className="mobile-money-row">
              <span>Sender transfer fee</span>
              <strong>
                {includeSenderFee
                  ? formatCurrency(calculation.senderFee)
                  : "Not included"}
              </strong>
            </div>
            <div className="mobile-money-row">
              <span>Sender total wallet deduction</span>
              <strong>{formatCurrency(calculation.senderTotal)}</strong>
            </div>
          </div>

          <button
            className="mobile-money-copy"
            type="button"
            onClick={copyResult}
          >
            {copyState === "copied" ? "Copied" : "Copy Result"}
          </button>
        </div>
      </div>

      <details className="mobile-money-card mobile-money-tariffs">
        <summary>Compare provider tariff bands used</summary>
        <div className="mobile-money-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Airtel fee</th>
                <th>MTN fee</th>
              </tr>
            </thead>
            <tbody>
              {MOBILE_MONEY_TARIFFS.airtel.map(
                ([min, max, airtelFee], index) => (
                  <tr key={`${min}-${max}`}>
                    <td>
                      {formatAmount(min)} - {formatAmount(max)}
                    </td>
                    <td>{formatAmount(airtelFee)}</td>
                    <td>{formatAmount(MOBILE_MONEY_TARIFFS.mtn[index][2])}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </details>

      <p className="mobile-money-footnote">
        Airtel and MTN are stored as separate tariff datasets. Their published
        agent-withdrawal charges currently match, but this calculator does not
        assume they will remain identical. The statutory withdrawal tax is 0.5%
        of the cash withdrawn and is separate from the operator fee.
        Promotional, ATM, bank, merchant, and agent-specific arrangements are
        not included.
      </p>
    </section>
  );
}
