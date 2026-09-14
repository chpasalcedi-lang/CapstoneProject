import React, { useEffect, useState } from 'react';
import '../Modalscss/edit_guest_modal.css';

const CORKAGE_OPTIONS = {
  Food: { rate: 500, unit: 'group' },
  Beer: { rate: 300, unit: 'case' },
  Whiskey: { rate: 300, unit: 'bottle' },
};
const CORKAGE_KEYS = Object.keys(CORKAGE_OPTIONS);
const PRICE_PER_CHILD = 150;
const PRICE_PER_ADULT = 175;

const defaultCorkageState = Object.fromEntries(
  CORKAGE_KEYS.map((option) => [option, { enabled: false, price: '' }])
);

const formatAmount = (value) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0';
  return Number.isInteger(numeric)
    ? numeric.toLocaleString('en-PH')
    : numeric.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const getCorkagePrice = (option, config) => {
  if (!config?.enabled) return 0;
  const rawValue = config.price;
  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    return Number(CORKAGE_OPTIONS[option]?.rate) || 0;
  }
  return Math.max(0, Number(rawValue) || 0);
};

const parseCorkageState = (value) => {
  const parsed = { ...defaultCorkageState };
  if (!value || /no corkage/i.test(value)) return parsed;

  CORKAGE_KEYS.forEach((option) => {
    const optionText = String(value);
    const exactMatch = optionText.match(new RegExp(`${option}\\s*-\\s*(?:₱\\s*)?([\\d,]+(?:\\.\\d+)?)`, 'i'));
    const directMatch = optionText.match(new RegExp(`${option}\\s*[:=]\\s*(?:₱\\s*)?([\\d,]+(?:\\.\\d+)?)`, 'i'));
    const bareOptionMatch = new RegExp(`\\b${option}\\b`, 'i').test(optionText);

    if (exactMatch || directMatch) {
      const rawPrice = (exactMatch?.[1] || directMatch?.[1] || '').replace(/,/g, '');
      parsed[option] = {
        enabled: true,
        price: rawPrice || String(CORKAGE_OPTIONS[option].rate),
      };
      return;
    }

    if (bareOptionMatch) {
      parsed[option] = {
        enabled: true,
        price: String(CORKAGE_OPTIONS[option].rate),
      };
    }
  });

  return parsed;
};

function getLegacyBreakdown(guest, corkage) {
  const children = Number(guest.number_of_children) || 0;
  const adults = Number(guest.number_of_adults) || 0;
  if (children > 0 || adults > 0 || !Number(guest.number_of_guests)) return { children, adults };

  const corkageTotal = corkage.reduce((sum, option) => sum + (CORKAGE_OPTIONS[option]?.rate || 0), 0);
  const guestCharge = Number(guest.total_price || 0) - corkageTotal;
  const totalGuests = Number(guest.number_of_guests);
  const inferredAdults = (guestCharge - (PRICE_PER_CHILD * totalGuests)) / (PRICE_PER_ADULT - PRICE_PER_CHILD);
  return Number.isInteger(inferredAdults) && inferredAdults >= 0 && inferredAdults <= totalGuests
    ? { children: totalGuests - inferredAdults, adults: inferredAdults }
    : { children: 0, adults: totalGuests };
}

function EditGuestModal({ show, onClose, guest, onUpdate }) {
  const [form, setForm] = useState({ group_name: '', number_of_children: 0, number_of_adults: 0, corkage: defaultCorkageState });
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [lastPrice, setLastPrice] = useState('');

  useEffect(() => {
    if (!guest) return;
    const rawCorkage = guest.corkage && guest.corkage !== 'No Corkage' ? guest.corkage : 'No Corkage';
    const parsedCorkage = parseCorkageState(rawCorkage);
    const breakdown = getLegacyBreakdown(guest, rawCorkage === 'No Corkage' ? [] : rawCorkage.split(',').map((item) => item.trim()));
    const baseCorkageTotal = Object.entries(parsedCorkage).reduce(
      (sum, [option, config]) => sum + getCorkagePrice(option, config),
      0
    );
    const baseGuestTotal = (Number(breakdown.children || 0) * PRICE_PER_CHILD)
      + (Number(breakdown.adults || 0) * PRICE_PER_ADULT)
      + baseCorkageTotal;
    const savedTotal = Number(guest.total_price || 0);
    const savedDiscount = Number(guest.discount || 0);
    const shouldRestoreDiscount = savedDiscount > 0 || (savedTotal > 0 && savedTotal < baseGuestTotal);

    setForm({
      group_name: guest.group_name || '',
      number_of_children: breakdown.children,
      number_of_adults: breakdown.adults,
      corkage: parsedCorkage,
    });
    setDiscountEnabled(shouldRestoreDiscount);
    setLastPrice(shouldRestoreDiscount && savedTotal > 0 ? String(savedTotal) : '');
  }, [guest]);

  if (!show || !guest) return null;

  const corkageTotal = Object.entries(form.corkage).reduce((sum, [option, config]) => sum + getCorkagePrice(option, config), 0);
  const baseTotalPrice = (Number(form.number_of_children || 0) * PRICE_PER_CHILD) + (Number(form.number_of_adults || 0) * PRICE_PER_ADULT) + corkageTotal;
  const lastPriceValue = Number(lastPrice || 0);
  const hasDiscountValue = discountEnabled && lastPriceValue > 0;
  const discountSaved = hasDiscountValue ? Math.max(0, baseTotalPrice - Math.min(baseTotalPrice, lastPriceValue)) : 0;
  const finalPrice = hasDiscountValue ? Math.max(0, Math.min(baseTotalPrice, lastPriceValue)) : baseTotalPrice;
  const discountPercent = hasDiscountValue && baseTotalPrice > 0 ? (discountSaved / baseTotalPrice) * 100 : 0;
  const selectedCorkageList = Object.entries(form.corkage)
    .filter(([, config]) => config?.enabled)
    .map(([option]) => option);

  const toggleCorkage = (option) => setForm((current) => ({
    ...current,
    corkage: {
      ...current.corkage,
      [option]: {
        enabled: !current.corkage[option]?.enabled,
        price: current.corkage[option]?.enabled ? '' : current.corkage[option]?.price || '',
      },
    },
  }));

  const updateCorkagePrice = (option, nextValue) => setForm((current) => ({
    ...current,
    corkage: {
      ...current.corkage,
      [option]: {
        ...current.corkage[option],
        price: nextValue,
      },
    },
  }));

  const submit = (event) => {
    event.preventDefault();
    onUpdate(guest.id, {
      ...form,
      total_price: finalPrice,
      discount: discountEnabled && baseTotalPrice > 0 ? Number(discountPercent.toFixed(2)) : 0,
      corkage: selectedCorkageList.length ? selectedCorkageList.join(', ') : 'No Corkage',
    });
  };

  return (
    <div className="edit-guest-modal-overlay" onClick={onClose}>
      <div className="edit-guest-panel" onClick={(event) => event.stopPropagation()}>
        <div className="edit-guest-header">
          <h2 className="edit-guest-title">EDIT GUEST ARRIVAL</h2>
          <button type="button" className="edit-guest-close" onClick={onClose} aria-label="Close edit form">&times;</button>
        </div>

        <div className="edit-guest-form-body">
          <form id="edit-guest-form" onSubmit={submit}>
            <label>Group name<input value={form.group_name} onChange={(event) => setForm({ ...form, group_name: event.target.value })} /></label>
            <div className="edit-guest-count-row">
              <label className="edit-guest-count-field">
                <span className="edit-guest-count-label">Children / senior / PWD</span>
                <input type="number" min="0" value={form.number_of_children} onChange={(event) => setForm({ ...form, number_of_children: event.target.value })} />
              </label>
              <label className="edit-guest-count-field">
                <span className="edit-guest-count-label">Adults</span>
                <input type="number" min="0" value={form.number_of_adults} onChange={(event) => setForm({ ...form, number_of_adults: event.target.value })} />
              </label>
            </div>
            <div className="edit-guest-corkage-fieldset">
              <div className="edit-guest-corkage-header">Corkage</div>
              <details className="edit-guest-corkage-dropdown" open>
                <summary>
                  {selectedCorkageList.length > 0 ? selectedCorkageList.join(', ') : 'Choose corkage'}
                </summary>
                <div className="edit-guest-corkage-list">
                  {CORKAGE_KEYS.map((option) => (
                    <div className="edit-guest-corkage-option" key={option}>
                      <label className="edit-guest-corkage-option-label">
                        <input
                          type="checkbox"
                          checked={!!form.corkage[option]?.enabled}
                          onChange={() => toggleCorkage(option)}
                        />
                        <span>{option}</span>
                      </label>
                      <div className="edit-guest-corkage-price-wrap">
                        <small>{CORKAGE_OPTIONS[option].unit}</small>
                        <input
                          type="number"
                          min="0"
                          value={form.corkage[option]?.enabled ? form.corkage[option]?.price ?? '' : ''}
                          onChange={(event) => updateCorkagePrice(option, event.target.value)}
                          placeholder={String(CORKAGE_OPTIONS[option].rate)}
                          disabled={!form.corkage[option]?.enabled}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </details>
              </div>

               <div className="edit-guest-discount-box">
              <div className="edit-guest-discount-header">
                <div>
                  <h3>Discount</h3>
                  <p>Apply a fixed amount and see the percentage.</p>
                </div>
                <label className="edit-guest-discount-toggle">
                  <input
                    type="checkbox"
                    checked={discountEnabled}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setDiscountEnabled(checked);
                      if (!checked) setLastPrice('');
                    }}
                  />
                  <span>Enable</span>
                </label>
              </div>

              {discountEnabled && (
                <>
                  <div className="edit-guest-form-group edit-guest-discount-input-group">
                    <label htmlFor="edit-guest-last-price">Last Price</label>
                    <input
                      id="edit-guest-last-price"
                      type="number"
                      name="last_price"
                      value={lastPrice}
                      onChange={(event) => setLastPrice(event.target.value.replace(/[^\d.]/g, ''))}
                      placeholder="e.g. 2500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="edit-guest-discount-result-box">
                    <span className="edit-guest-discount-result-label">Discount saved</span>
                    <strong>
                      {lastPrice && Number(lastPrice) > 0
                        ? `₱${formatAmount(discountSaved)}`
                        : '₱0'}
                    </strong>
                  </div>
                  <div className="edit-guest-discount-result-box">
                    <span className="edit-guest-discount-result-label">Discount</span>
                    <strong>
                      {lastPrice && Number(lastPrice) > 0
                        ? `${Number.isInteger(discountPercent) ? discountPercent.toString() : discountPercent.toFixed(2)}%`
                        : '0%'}
                    </strong>
                  </div>
                  <div className="edit-guest-discount-result-box">
                    <span className="edit-guest-discount-result-label">Final Price</span>
                    <strong>
                      {lastPrice && Number(lastPrice) > 0
                        ? `₱${formatAmount(finalPrice)}`
                        : `₱${formatAmount(baseTotalPrice)}`}
                    </strong>
                  </div>
                </>
              )}
            </div>
            
          </form>
        </div>

        <div className="edit-guest-actions">
          <div className="edit-guest-total">Total price: ₱{finalPrice.toLocaleString('en-PH')}</div>
          <button type="submit" form="edit-guest-form" className="edit-guest-save">Save changes</button>
        </div>
      </div>
    </div>
  );
}

export default EditGuestModal;