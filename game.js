// =============================================
// הסוחר - THE MERCHANT (1989) - Web Recreation
// Israeli Ports Edition
// =============================================
const game = {
  // ---- State ----
  money: 1000, bankDeposit: 0,
  totalHours: 0,       // total hours elapsed
  maxHours: 168,       // 7 days * 24 hours
  lastPriceDay: 1,     // last day prices were updated
  location: 'jaffa',
  shipHealth: 100, crew: 5, maxCrew: 10, cargoCapacity: 100,
  cargo: { wheat: 0, olives: 0, copper: 0 },
  repairCostPerPoint: 5, crewHireCost: 50,
  stats: { tradesMade: 0, eventsEncountered: 0, portsVisited: ['haifa'] },

  // ---- Names & Icons ----
  goodNames:      { wheat: 'חיטה 🌾', olives: 'זיתים 🫒', copper: 'נחושת 🔶' },
  goodNamesShort: { wheat: 'חיטה',    olives: 'זיתים',    copper: 'נחושת'    },
  locationNames:  { haifa: 'חיפה',    jaffa: 'יפו',       eilat: 'אילת'      },
  locationIcons:  { haifa: '⚓',       jaffa: '🏛️',        eilat: '🌴'        },
  locationColors: { haifa: '#0ff',    jaffa: '#0f0',      eilat: '#ff0'      },

  // ---- Travel times in hours ----
  travelHours: {
    haifa: { jaffa: 4,  eilat: 8 },
    jaffa: { haifa: 4,  eilat: 4 },
    eilat: { haifa: 8, jaffa: 4 }
  },

  // ---- Map positions (right, top) ----
  // Desktop landscape (960×580) and mobile portrait (9:16 aspect)
  mapPositions: {
    landscape: {
      haifa: { right: '12.5%', top: '13.8%' },
      jaffa: { right: '10.4%', top: '44.8%' },
      eilat: { right: '31.3%', top: '75.9%' }
    },
    portrait: {
      haifa: { right: '35%', top: '8%' },
      jaffa: { right: '38%', top: '42%' },
      eilat: { right: '30%', top: '76%' }
    }
  },
  _mapMode: 'landscape', // current map mode

  // ---- Base prices ----
  basePrices: {
    haifa: { wheat: 15, olives: 25, copper: 40 },
    jaffa: { wheat: 12, olives: 22, copper: 38 },
    eilat: { wheat: 20, olives: 30, copper: 35 }
  },
  currentPrices: {},

  // =====================
  // INIT
  // =====================
  init() {
    this.money = 1000; this.bankDeposit = 0;
    this.totalHours = 0; this.lastPriceDay = 1; this.location = 'jaffa';
    this.shipHealth = 100; this.crew = 5;
    this.cargo = { wheat: 0, olives: 0, copper: 0 };
    this.stats = { tradesMade: 0, eventsEncountered: 0, portsVisited: ['jaffa'] };
    this._mobileLogUnread = 0;
    this.closeMobileLog();
    this.generateAllPrices();
    this.showScreen('screen-main');
    this.updateUI();
    this.clearLog();
    this.addMessage('ברוך הבא לסוחר! אתה סוחר ים בחוף ישראל.', 'system');
    this.addMessage('אתה מתחיל ביפו 🏛️ - עיר הנמל העתיקה.', 'system');
    this.addMessage('יש לך 1000 ₪, ספינה, וצוות של 5 אנשים.', 'info');
    this.addMessage('קנה סחורות בזול ומכור ביוקר. יש לך 168 שעות (7 ימים)!', 'info');
    this.addMessage('📱 במובייל: לחץ על כפתור "📜 יומן" לצפייה ביומן האירועים.', 'info');
    this.bindKeyboard();
  },

  // =====================
  // PRICES
  // =====================
  generateAllPrices() {
    ['haifa','jaffa','eilat'].forEach(loc => {
      this.currentPrices[loc] = {};
      ['wheat','olives','copper'].forEach(good => {
        const base = this.basePrices[loc][good];
        this.currentPrices[loc][good] = Math.max(5, Math.round(base * (0.7 + Math.random() * 0.6)));
      });
    });
  },

  generateLocationPrices(loc) {
    ['wheat','olives','copper'].forEach(good => {
      const base = this.basePrices[loc][good];
      this.currentPrices[loc][good] = Math.max(5, Math.round(base * (0.7 + Math.random() * 0.6)));
    });
  },

  // Called after any time advance — refreshes prices on new day
  checkDailyPriceUpdate() {
    const day = this.getCurrentDay();
    if (day > this.lastPriceDay) {
      this.lastPriceDay = day;
      this.generateAllPrices();
      this.addMessage(`📅 יום ${day} - מחירי השוק התעדכנו בכל הנמלים!`, 'event');
    }
  },

  getSellPrice(loc, good) {
    return Math.round(this.currentPrices[loc][good] * 0.85);
  },

  getTotalCargo() {
    return this.cargo.wheat + this.cargo.olives + this.cargo.copper;
  },

  // =====================
  // TIME HELPERS
  // =====================
  getCurrentDay() {
    return Math.floor(this.totalHours / 24) + 1;
  },

  formatTime() {
    const day = this.getCurrentDay();
    const hour = this.totalHours % 24;
    return { day, hour, total: this.totalHours };
  },

  hoursRemaining() {
    return this.maxHours - this.totalHours;
  },

  // =====================
  // UI UPDATE
  // =====================
  updateUI() {
    const { day, hour } = this.formatTime();
    document.getElementById('current-day').textContent = day;
    document.getElementById('current-hour').textContent = this.totalHours;
    document.getElementById('player-money').textContent = this.money.toLocaleString();
    document.getElementById('current-location').textContent =
      this.locationIcons[this.location] + ' ' + this.locationNames[this.location];
    document.getElementById('bank-display').textContent = this.bankDeposit.toLocaleString();
    this.renderMarketPrices();
    this.renderCargo();
    // Update travel distances banner from travelHours
    const distEl = document.getElementById('travel-distances');
    if (distEl) {
      const th = this.travelHours;
      const n = this.locationNames;
      distEl.textContent =
        `${n.haifa}↔${n.jaffa}: ${th.haifa.jaffa}ש' \u00a0 ` +
        `${n.haifa}↔${n.eilat}: ${th.haifa.eilat}ש' \u00a0 ` +
        `${n.jaffa}↔${n.eilat}: ${th.jaffa.eilat}ש'`;
    }
    const hp = this.shipHealth;
    document.getElementById('ship-health').textContent = hp;
    const hbar = document.getElementById('health-bar');
    hbar.style.width = hp + '%';
    hbar.className = 'status-bar-fill ' + (hp > 60 ? 'bar-green' : hp > 30 ? 'bar-yellow' : 'bar-red');
    const crewPct = (this.crew / this.maxCrew) * 100;
    document.getElementById('crew-count').textContent = this.crew;
    const cbar = document.getElementById('crew-bar');
    cbar.style.width = crewPct + '%';
    // Update action button states
    const btnBuy = document.getElementById('btn-buy');
    const btnSell = document.getElementById('btn-sell');
    const btnRepair = document.getElementById('btn-repair');
    const btnCrew = document.getElementById('btn-crew');

    if (btnBuy) btnBuy.disabled = (this.money === 0);
    if (btnSell) btnSell.disabled = (this.getTotalCargo() === 0);
    if (btnRepair) btnRepair.disabled = (this.shipHealth >= 100);
    if (btnCrew) btnCrew.disabled = (this.crew >= this.maxCrew);
    cbar.className = 'status-bar-fill ' + (crewPct > 60 ? 'bar-green' : crewPct > 30 ? 'bar-yellow' : 'bar-red');
  },

  renderMarketPrices() {
    const tbody = document.getElementById('market-prices');
    const thead = document.getElementById('market-header');
    tbody.innerHTML = '';

    const otherLocs = ['haifa','jaffa','eilat'].filter(l => l !== this.location);
    const loc1 = otherLocs[0], loc2 = otherLocs[1];
    const h1 = this.travelHours[this.location][loc1];
    const h2 = this.travelHours[this.location][loc2];

    if (thead) {
      thead.innerHTML = `<tr>
        <th>מוצר</th>
        <th>קנייה</th>
        <th>מכירה</th>
        <th style="color:${this.locationColors[loc1]}">${this.locationIcons[loc1]}<br><span style="font-size:11px;color:#888;">${h1}ש'</span></th>
        <th style="color:${this.locationColors[loc2]}">${this.locationIcons[loc2]}<br><span style="font-size:11px;color:#888;">${h2}ש'</span></th>
      </tr>`;
    }

    ['wheat','olives','copper'].forEach(good => {
      const buyP = this.currentPrices[this.location][good];
      const sellP = this.getSellPrice(this.location, good);
      const base = this.basePrices[this.location][good];
      const cls = buyP > base * 1.1 ? 'price-up' : buyP < base * 0.9 ? 'price-down' : 'price-normal';
      const sell1 = this.getSellPrice(loc1, good);
      const sell2 = this.getSellPrice(loc2, good);
      const cls1 = sell1 > buyP ? 'price-up' : sell1 < buyP ? 'price-down' : 'price-normal';
      const cls2 = sell2 > buyP ? 'price-up' : sell2 < buyP ? 'price-down' : 'price-normal';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${this.goodNamesShort[good]}</td>
        <td class="${cls}">${buyP}</td>
        <td class="${cls}">${sellP}</td>
        <td class="${cls1}">${sell1}</td>
        <td class="${cls2}">${sell2}</td>
      `;
      tbody.appendChild(tr);
    });
  },

  renderCargo() {
    const div = document.getElementById('cargo-display');
    div.innerHTML = '';
    let total = 0;
    ['wheat','olives','copper'].forEach(good => {
      const amt = this.cargo[good];
      if (amt > 0) {
        total += amt;
        const val = amt * this.getSellPrice(this.location, good);
        const item = document.createElement('div');
        item.className = 'cargo-item';
        item.innerHTML = `<span class="cname">${this.goodNamesShort[good]}:</span><span class="camount">${amt}</span><span class="cvalue">${val}₪</span>`;
        div.appendChild(item);
      }
    });
    if (total === 0) div.innerHTML = '<div style="color:#444;text-align:center;font-size:15px;padding:5px;">ריק</div>';
    document.getElementById('cargo-weight').textContent = total;
    document.getElementById('cargo-cap').textContent = this.cargoCapacity;
    const pct = (total / this.cargoCapacity) * 100;
    const cbar = document.getElementById('cargo-bar');
    cbar.style.width = pct + '%';
    cbar.className = 'status-bar-fill ' + (pct < 80 ? 'bar-green' : pct < 95 ? 'bar-yellow' : 'bar-red');
  },

  scrollLogToBottom() {
    const log = document.getElementById('message-log');
    if (log) log.scrollTop = log.scrollHeight;
  },

  toggleLogExpand() {
    const log = document.getElementById('message-log');
    if (log) log.classList.toggle('expanded');
    const btn = document.getElementById('log-expand-btn');
    if (btn) btn.textContent = log && log.classList.contains('expanded') ? '⤡' : '⤢';
  },

  clearLog() {
    document.getElementById('message-log').innerHTML = '';
    const mobileContent = document.getElementById('mobile-log-drawer-content');
    if (mobileContent) mobileContent.innerHTML = '';
    this._mobileLogUnread = 0;
    this._updateMobileLogBadge();
  },

  addMessage(text, type = 'info') {
    // Desktop log
    const log = document.getElementById('message-log');
    const div = document.createElement('div');
    div.className = 'msg msg-' + type;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;

    // Mobile drawer log (mirror)
    const mobileContent = document.getElementById('mobile-log-drawer-content');
    if (mobileContent) {
      const mdiv = document.createElement('div');
      mdiv.className = 'msg msg-' + type;
      mdiv.textContent = text;
      mobileContent.appendChild(mdiv);
      mobileContent.scrollTop = mobileContent.scrollHeight;
    }

    // Badge: count unread messages when drawer is closed
    const drawer = document.getElementById('mobile-log-drawer');
    if (drawer && !drawer.classList.contains('open')) {
      this._mobileLogUnread = (this._mobileLogUnread || 0) + 1;
      this._updateMobileLogBadge();
    }
  },

  _updateMobileLogBadge() {
    const badge = document.getElementById('mobile-log-badge');
    if (!badge) return;
    const count = this._mobileLogUnread || 0;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  },

  openMobileLog() {
    const drawer = document.getElementById('mobile-log-drawer');
    const overlay = document.getElementById('mobile-log-overlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    // Reset unread count
    this._mobileLogUnread = 0;
    this._updateMobileLogBadge();
    // Scroll to bottom
    setTimeout(() => this.scrollMobileLogToBottom(), 50);
  },

  closeMobileLog() {
    const drawer = document.getElementById('mobile-log-drawer');
    const overlay = document.getElementById('mobile-log-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  },

  scrollMobileLogToBottom() {
    const c = document.getElementById('mobile-log-drawer-content');
    if (c) c.scrollTop = c.scrollHeight;
  },

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },

  showModal(title, bodyHTML, buttons) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    const btnDiv = document.getElementById('modal-buttons');
    btnDiv.innerHTML = '';
    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'modal-btn ' + (b.cls || '');
      btn.textContent = b.text;
      btn.onclick = b.fn;
      btnDiv.appendChild(btn);
    });
    document.getElementById('modal-overlay').classList.add('active');
  },

  hideModal() { document.getElementById('modal-overlay').classList.remove('active'); },

  bindKeyboard() {
    if (this._keyBound) return;
    this._keyBound = true;
    document.addEventListener('keydown', (e) => {
      const active = document.querySelector('.screen.active');
      if (!active) return;
      const sid = active.id;
      if (e.key === 'Escape') {
        if (document.getElementById('modal-overlay').classList.contains('active')) { this.hideModal(); return; }
        const mobileDrawer = document.getElementById('mobile-log-drawer');
        if (mobileDrawer && mobileDrawer.classList.contains('open')) { this.closeMobileLog(); return; }
        if (sid === 'screen-map') { this.showScreen('screen-main'); return; }
      }
      if (e.target.tagName === 'INPUT') return;
      if (sid === 'screen-main' && !document.getElementById('modal-overlay').classList.contains('active')) {
        switch(e.key.toLowerCase()) {
          case 'q': this.showBuyMenu(); break;
          case 'w': this.showSellMenu(); break;
          case 'e': this.showBankMenu(); break;
          case 'r': this.showRepairMenu(); break;
          case 't': this.showCrewMenu(); break;
          case 'm': this.showMap(); break;
          case 'h': this.showHelp(); break;
        }
      }
    });
  }
};

// ---- TRADING ----
Object.assign(game, {
  showBuyMenu() {
    const prices = this.currentPrices[this.location];
    const freeSpace = this.cargoCapacity - this.getTotalCargo();
    let html = `<p>כסף: <span class="highlight">${this.money}₪</span> &nbsp; מקום פנוי: <span class="highlight">${freeSpace}</span></p><div style="margin-top:8px;">`;
    ['wheat','olives','copper'].forEach(good => {
      const price = prices[good];
      const maxBuy = Math.min(Math.floor(this.money / price), freeSpace);
      const base = this.basePrices[this.location][good];
      const cls = price > base * 1.1 ? 'bad' : price < base * 0.9 ? 'good' : '';
      html += `<div class="good-select-item" onclick="game.buyGoodDialog('${good}')">
        <span class="highlight">${this.goodNames[good]}</span> &nbsp;
        מחיר: <span class="${cls}">${price}₪</span> &nbsp;
        <span style="color:#555;">(מקס: ${maxBuy})</span></div>`;
    });
    html += '</div>';
    this.showModal('קנה סחורה', html, [{ text: 'ביטול', fn: () => this.hideModal() }]);
  },

  buyGoodDialog(good) {
    const price = this.currentPrices[this.location][good];
    const freeSpace = this.cargoCapacity - this.getTotalCargo();
    const maxBuy = Math.min(Math.floor(this.money / price), freeSpace);
    if (maxBuy <= 0) { this.addMessage('אין מספיק כסף או מקום!', 'bad'); this.hideModal(); return; }
    const html = `
      <p>מוצר: <span class="highlight">${this.goodNames[good]}</span></p>
      <p>מחיר ליחידה: <span class="good">${price}₪</span></p>
      <p>מקסימום: <span class="highlight">${maxBuy}</span></p>
      <div class="modal-input-row">
        <label>כמות לקנייה:</label>
        <input type="number" id="buy-qty" class="modal-input" min="1" max="${maxBuy}" value="${Math.min(10,maxBuy)}">
      </div>
      <p id="buy-total" style="color:#ff0;text-align:center;margin-top:6px;"></p>`;
    this.showModal('קנה ' + this.goodNamesShort[good], html, [
      { text: 'קנה ✓', cls: 'primary', fn: () => {
        const qty = parseInt(document.getElementById('buy-qty').value) || 0;
        if (qty < 1 || qty > maxBuy) { this.addMessage('כמות לא תקינה!', 'bad'); return; }
        this.money -= qty * price;
        this.cargo[good] += qty;
        this.stats.tradesMade++;
        this.addMessage(`קנית ${qty} ${this.goodNamesShort[good]} ב-${qty*price}₪`, 'good');
        this.updateUI(); this.hideModal();
      }},
      { text: 'חזור', fn: () => this.showBuyMenu() }
    ]);
    setTimeout(() => {
      const inp = document.getElementById('buy-qty');
      if (!inp) return; inp.focus(); inp.select();
      inp.addEventListener('input', () => {
        const q = parseInt(inp.value)||0;
        const t = document.getElementById('buy-total');
        if (t) t.textContent = q > 0 ? `סה"כ: ${q*price}₪` : '';
      });
    }, 80);
  },

  showSellMenu() {
    if (this.getTotalCargo() === 0) { this.addMessage('אין לך סחורות למכירה!', 'bad'); return; }
    let html = '<div style="margin-top:4px;">';
    let has = false;
    ['wheat','olives','copper'].forEach(good => {
      if (this.cargo[good] > 0) {
        has = true;
        const sp = this.getSellPrice(this.location, good);
        html += `<div class="good-select-item" onclick="game.sellGoodDialog('${good}')">
          <span class="highlight">${this.goodNames[good]}</span> &nbsp;
          מחיר: <span class="good">${sp}₪</span> &nbsp;
          יש לך: <span style="color:#fff;">${this.cargo[good]}</span> &nbsp;
          <span style="color:#0f0;">(${this.cargo[good]*sp}₪)</span></div>`;
      }
    });
    if (!has) html += '<p class="bad">אין סחורות!</p>';
    html += '</div>';
    this.showModal('מכור סחורה', html, [{ text: 'ביטול', fn: () => this.hideModal() }]);
  },

  sellGoodDialog(good) {
    const qty = this.cargo[good];
    if (qty === 0) return;
    const sp = this.getSellPrice(this.location, good);
    const html = `
      <p>מוצר: <span class="highlight">${this.goodNames[good]}</span></p>
      <p>מחיר מכירה: <span class="good">${sp}₪</span> ליחידה</p>
      <p>יש לך: <span class="highlight">${qty}</span> יחידות</p>
      <div class="modal-input-row">
        <label>כמות למכירה:</label>
        <input type="number" id="sell-qty" class="modal-input" min="1" max="${qty}" value="${qty}">
      </div>
      <p id="sell-total" style="color:#ff0;text-align:center;margin-top:6px;"></p>`;
    this.showModal('מכור ' + this.goodNamesShort[good], html, [
      { text: 'מכור ✓', cls: 'primary', fn: () => {
        const sq = parseInt(document.getElementById('sell-qty').value) || 0;
        if (sq < 1 || sq > qty) { this.addMessage('כמות לא תקינה!', 'bad'); return; }
        const rev = sq * sp;
        this.money += rev; this.cargo[good] -= sq; this.stats.tradesMade++;
        this.addMessage(`מכרת ${sq} ${this.goodNamesShort[good]} ב-${rev}₪`, 'good');
        this.updateUI(); this.hideModal();
      }},
      { text: 'חזור', fn: () => this.showSellMenu() }
    ]);
    setTimeout(() => {
      const inp = document.getElementById('sell-qty');
      if (!inp) return; inp.focus(); inp.select();
      inp.addEventListener('input', () => {
        const q = parseInt(inp.value)||0;
        const t = document.getElementById('sell-total');
        if (t) t.textContent = q > 0 ? `תקבל: ${q*sp}₪` : '';
      });
    }, 80);
  }
});

// ---- BANK ----
Object.assign(game, {
  showBankMenu() {
    const html = `
      <p>💰 כסף בכיס: <span class="highlight">${this.money}₪</span></p>
      <p>🏦 יתרה בבנק: <span class="highlight">${this.bankDeposit}₪</span></p>
      <p style="font-size:14px;color:#555;margin-top:8px;">הכסף בבנק מוגן מפני גנבים ופיראטים</p>
      <div style="margin-top:12px;display:flex;flex-direction:column;gap:7px;">
        <button class="modal-btn primary" onclick="game.depositDialog()" style="width:100%;">הפקד כסף ⬇️</button>
        <button class="modal-btn" onclick="game.withdrawDialog()" style="width:100%;">משוך כסף ⬆️</button>
      </div>`;
    this.showModal('🏦 בנק', html, [{ text: 'סגור', fn: () => this.hideModal() }]);
  },

  depositDialog() {
    if (this.money === 0) { this.addMessage('אין לך כסף להפקיד!', 'bad'); return; }
    const html = `<p>כסף זמין: <span class="highlight">${this.money}₪</span></p>
      <div class="modal-input-row"><label>סכום להפקדה:</label>
      <input type="number" id="dep-amt" class="modal-input" min="1" max="${this.money}" value="${this.money}"></div>`;
    this.showModal('הפקד כסף', html, [
      { text: 'הפקד ✓', cls: 'primary', fn: () => {
        const amt = parseInt(document.getElementById('dep-amt').value)||0;
        if (amt < 1 || amt > this.money) { this.addMessage('סכום לא תקין!','bad'); return; }
        this.money -= amt; this.bankDeposit += amt;
        this.addMessage(`הפקדת ${amt}₪ בבנק`, 'good');
        this.updateUI(); this.showBankMenu();
      }},
      { text: 'חזור', fn: () => this.showBankMenu() }
    ]);
    setTimeout(() => { const i=document.getElementById('dep-amt'); if(i){i.focus();i.select();} }, 80);
  },

  withdrawDialog() {
    if (this.bankDeposit === 0) { this.addMessage('אין כסף בבנק!', 'bad'); return; }
    const html = `<p>יתרה בבנק: <span class="highlight">${this.bankDeposit}₪</span></p>
      <div class="modal-input-row"><label>סכום למשיכה:</label>
      <input type="number" id="with-amt" class="modal-input" min="1" max="${this.bankDeposit}" value="${this.bankDeposit}"></div>`;
    this.showModal('משוך כסף', html, [
      { text: 'משוך ✓', cls: 'primary', fn: () => {
        const amt = parseInt(document.getElementById('with-amt').value)||0;
        if (amt < 1 || amt > this.bankDeposit) { this.addMessage('סכום לא תקין!','bad'); return; }
        this.money += amt; this.bankDeposit -= amt;
        this.addMessage(`משכת ${amt}₪ מהבנק`, 'good');
        this.updateUI(); this.showBankMenu();
      }},
      { text: 'חזור', fn: () => this.showBankMenu() }
    ]);
    setTimeout(() => { const i=document.getElementById('with-amt'); if(i){i.focus();i.select();} }, 80);
  }
});

// ---- REPAIR & CREW ----
Object.assign(game, {
  showRepairMenu() {
    if (this.shipHealth >= 100) { this.addMessage('הספינה במצב מושלם!', 'good'); return; }
    const dmg = 100 - this.shipHealth;
    const maxRepair = Math.min(dmg, Math.floor(this.money / this.repairCostPerPoint));
    const html = `
      <p>🚢 תקינות: <span class="${this.shipHealth>50?'good':'bad'}">${this.shipHealth}%</span></p>
      <p>נזק: <span class="highlight">${dmg}%</span></p>
      <p>עלות: <span class="highlight">${this.repairCostPerPoint}₪</span> לאחוז</p>
      ${maxRepair===0 ? '<p class="bad">אין מספיק כסף לתיקון!</p>' : `
      <div class="modal-input-row">
        <label>אחוזים לתיקון:</label>
        <input type="number" id="repair-pts" class="modal-input" min="1" max="${maxRepair}" value="${Math.min(dmg,maxRepair)}">
      </div>
      <p id="repair-cost-disp" style="color:#ff0;text-align:center;"></p>`}`;
    const btns = [{ text: 'ביטול', fn: () => this.hideModal() }];
    if (maxRepair > 0) btns.unshift({ text: 'תקן ✓', cls: 'primary', fn: () => {
      const pts = parseInt(document.getElementById('repair-pts').value)||0;
      if (pts < 1 || pts > maxRepair) { this.addMessage('כמות לא תקינה!','bad'); return; }
      const cost = pts * this.repairCostPerPoint;
      this.money -= cost; this.shipHealth = Math.min(100, this.shipHealth + pts);
      this.addMessage(`תיקנת ${pts}% ב-${cost}₪. תקינות: ${this.shipHealth}%`, 'good');
      this.updateUI(); this.hideModal();
    }});
    this.showModal('🔧 תיקון ספינה', html, btns);
    setTimeout(() => {
      const inp = document.getElementById('repair-pts');
      if (!inp) return; inp.focus(); inp.select();
      inp.addEventListener('input', () => {
        const p=parseInt(inp.value)||0;
        const cd=document.getElementById('repair-cost-disp');
        if(cd) cd.textContent = p>0 ? `עלות: ${p*this.repairCostPerPoint}₪` : '';
      });
    }, 80);
  },

  showCrewMenu() {
    const canHire = this.maxCrew - this.crew;
    const maxAfford = Math.floor(this.money / this.crewHireCost);
    const maxHire = Math.min(canHire, maxAfford);
    const html = `
      <p>👥 צוות: <span class="highlight">${this.crew}/${this.maxCrew}</span></p>
      <p>עלות גיוס: <span class="highlight">${this.crewHireCost}₪</span> לאיש</p>
      <p style="font-size:14px;color:#888;margin-top:4px;">צוות גדול מגן מפני פיראטים</p>
      ${canHire===0 ? '<p class="good" style="margin-top:8px;">הצוות מלא!</p>' :
        maxHire===0 ? '<p class="bad" style="margin-top:8px;">אין מספיק כסף לגיוס!</p>' : `
      <div class="modal-input-row" style="margin-top:10px;">
        <label>כמות לגיוס:</label>
        <input type="number" id="crew-qty" class="modal-input" min="1" max="${maxHire}" value="1">
      </div>
      <p id="crew-cost-disp" style="color:#ff0;text-align:center;"></p>`}`;
    const btns = [{ text: 'ביטול', fn: () => this.hideModal() }];
    if (canHire > 0 && maxHire > 0) btns.unshift({ text: 'גייס ✓', cls: 'primary', fn: () => {
      const qty = parseInt(document.getElementById('crew-qty').value)||0;
      if (qty < 1 || qty > maxHire) { this.addMessage('כמות לא תקינה!','bad'); return; }
      const cost = qty * this.crewHireCost;
      this.money -= cost; this.crew += qty;
      this.addMessage(`גייסת ${qty} אנשי צוות ב-${cost}₪`, 'good');
      this.updateUI(); this.hideModal();
    }});
    this.showModal('👥 גיוס צוות', html, btns);
    setTimeout(() => {
      const inp = document.getElementById('crew-qty');
      if (!inp) return; inp.focus(); inp.select();
      inp.addEventListener('input', () => {
        const q=parseInt(inp.value)||0;
        const cd=document.getElementById('crew-cost-disp');
        if(cd) cd.textContent = q>0 ? `עלות: ${q*this.crewHireCost}₪` : '';
      });
    }, 80);
  }
});

// ---- MAP & TRAVEL ----
Object.assign(game, {
  showMap() {
    this.showScreen('screen-map');
    this._detectMapMode();
    this.updateMapUI();
  },

  _detectMapMode() {
    // Detect if mobile (screen width <= 700px) and switch to portrait mode
    const isMobile = window.innerWidth <= 700;
    this._mapMode = isMobile ? 'portrait' : 'landscape';
    
    const mapWrap = document.getElementById('map-wrap');
    const coastlineSvg = document.getElementById('map-coastline');
    
    if (isMobile) {
      mapWrap.classList.add('map-portrait');
      // Portrait SVG: vertical coastline (viewBox adjusted for 9:16 aspect)
      if (coastlineSvg) {
        coastlineSvg.setAttribute('viewBox', '0 0 420 747'); // 9:16 aspect
        coastlineSvg.innerHTML = `
          <!-- Vertical coastline for portrait -->
          <polyline points="320,40 310,100 305,180 300,280 295,380 290,480 285,580 280,680 275,720"
            fill="none" stroke="#1a3a1a" stroke-width="35" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
          <!-- Southern tip -->
          <polyline points="200,680 220,700 240,720 260,740"
            fill="none" stroke="#1a3a1a" stroke-width="25" stroke-linecap="round" opacity="0.5"/>
        `;
      }
    } else {
      mapWrap.classList.remove('map-portrait');
      // Landscape SVG: original horizontal coastline
      if (coastlineSvg) {
        coastlineSvg.setAttribute('viewBox', '0 0 960 580');
        coastlineSvg.innerHTML = `
          <!-- Mediterranean coast -->
          <polyline points="870,60 850,120 840,200 830,280 820,360 810,440 800,500 780,540"
            fill="none" stroke="#1a3a1a" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
          <!-- Red Sea / Gulf of Aqaba -->
          <polyline points="680,480 700,510 720,540 740,570"
            fill="none" stroke="#1a3a1a" stroke-width="30" stroke-linecap="round" opacity="0.5"/>
        `;
      }
    }
  },

  updateMapUI() {
    const ship = document.getElementById('map-ship');
    const positions = this.mapPositions[this._mapMode];
    const pos = positions[this.location];
    ship.style.right = pos.right;
    ship.style.top = pos.top;

    document.querySelectorAll('.map-location').forEach(el => {
      el.classList.toggle('current', el.dataset.loc === this.location);
    });

    const remaining = this.hoursRemaining();
    ['haifa','jaffa','eilat'].forEach(loc => {
      const distEl = document.getElementById('dist-' + loc);
      const priceEl = document.getElementById('price-' + loc);

      if (loc === this.location) {
        if (distEl) { distEl.textContent = '📍 כאן'; distEl.style.color = '#0ff'; }
        if (priceEl) priceEl.textContent = '';
      } else {
        const hrs = this.travelHours[this.location][loc];
        const canTravel = hrs <= remaining;
        if (distEl) {
          distEl.innerHTML = `⏱ ${hrs} שעות`;
          distEl.style.color = canTravel ? '#ff0' : '#f44';
        }
        if (priceEl) {
          const p = this.currentPrices[loc];
          const sp = { wheat: this.getSellPrice(loc,'wheat'), olives: this.getSellPrice(loc,'olives'), copper: this.getSellPrice(loc,'copper') };
          priceEl.innerHTML = `🌾${sp.wheat} 🫒${sp.olives} 🔶${sp.copper}`;
        }
      }
    });
    this.drawMapRoutes();
  },

  drawMapRoutes() {
    const svg = document.getElementById('map-routes');
    if (!svg) return;
    
    // Calculate centers based on current map mode
    let centers;
    if (this._mapMode === 'portrait') {
      // Portrait mode: 420×747 (9:16 aspect)
      const W = 420, H = 747;
      const positions = this.mapPositions.portrait;
      centers = {
        haifa: {
          x: W - (parseFloat(positions.haifa.right) / 100 * W) - 60,
          y: (parseFloat(positions.haifa.top) / 100 * H) + 50
        },
        jaffa: {
          x: W - (parseFloat(positions.jaffa.right) / 100 * W) - 60,
          y: (parseFloat(positions.jaffa.top) / 100 * H) + 50
        },
        eilat: {
          x: W - (parseFloat(positions.eilat.right) / 100 * W) - 60,
          y: (parseFloat(positions.eilat.top) / 100 * H) + 50
        }
      };
    } else {
      // Landscape mode: 960×580
      const W = 960;
      centers = {
        haifa: { x: W - 140 - 60, y: 90 + 50 },
        jaffa: { x: W - 120 - 60, y: 270 + 50 },
        eilat: { x: W - 320 - 60, y: 460 + 50 }
      };
    }
    
    svg.innerHTML = '';
    [['haifa','jaffa'],['haifa','eilat'],['jaffa','eilat']].forEach(([a,b]) => {
      const hrs = this.travelHours[a][b];
      const remaining = this.hoursRemaining();
      const color = hrs <= remaining ? '#003366' : '#330000';
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1', centers[a].x); line.setAttribute('y1', centers[a].y);
      line.setAttribute('x2', centers[b].x); line.setAttribute('y2', centers[b].y);
      line.setAttribute('stroke', color); line.setAttribute('stroke-width','2');
      line.setAttribute('stroke-dasharray','10,7');
      svg.appendChild(line);

      // Label in middle
      const mx = (centers[a].x + centers[b].x) / 2;
      const my = (centers[a].y + centers[b].y) / 2;
      const text = document.createElementNS('http://www.w3.org/2000/svg','text');
      text.setAttribute('x', mx); text.setAttribute('y', my - 6);
      text.setAttribute('text-anchor','middle');
      text.setAttribute('fill', '#555'); text.setAttribute('font-size','13');
      text.setAttribute('font-family','VT323, monospace');
      text.textContent = `${hrs}ש'`;
      svg.appendChild(text);
    });
  },

  travelTo(dest) {
    if (dest === this.location) { this.addMessage('אתה כבר נמצא כאן!','info'); return; }
    if (this.shipHealth < 15) {
      this.showEventModal('⚠️ הספינה פגועה מדי!',
        'הספינה ניזוקה מדי לנסיעה. תקן אותה לפני שתמשיך.', 'bad',
        () => this.showScreen('screen-main'));
      return;
    }
    if (this.crew < 1) {
      this.showEventModal('⚠️ אין צוות!',
        'אין לך מספיק אנשי צוות לנסיעה. גייס צוות קודם.', 'bad',
        () => this.showScreen('screen-main'));
      return;
    }

    const hrs = this.travelHours[this.location][dest];
    const remaining = this.hoursRemaining();

    if (hrs > remaining) {
      this.addMessage(`אין מספיק זמן! נדרשות ${hrs} שעות, נותרו ${remaining}.`, 'bad');
      return;
    }

    // Animate ship
    const ship = document.getElementById('map-ship');
    const positions = this.mapPositions[this._mapMode];
    const pos = positions[dest];
    ship.style.right = pos.right;
    ship.style.top = pos.top;

    setTimeout(() => {
      this.totalHours += hrs;
      this.location = dest;
      if (!this.stats.portsVisited.includes(dest)) this.stats.portsVisited.push(dest);
      // Prices only change when a new day begins (midnight crossing during travel)
      this.checkDailyPriceUpdate();
      this.showScreen('screen-main');
      this.updateUI();

      const day = this.getCurrentDay();
      const hourOfDay = this.totalHours % 24;
      this.addMessage(`⚓ הגעת ל${this.locationNames[dest]}! (יום ${day}, שעה ${hourOfDay}:00, ${hrs} שעות נסיעה)`, 'system');

      if (this.totalHours >= this.maxHours) { setTimeout(() => this.endGame(), 600); return; }
      setTimeout(() => this.triggerRandomEvent(), 400);
    }, 1200);
  }
});

// ---- RANDOM EVENTS ----
Object.assign(game, {
  triggerRandomEvent() {
    const roll = Math.random();
    if      (roll < 0.12) this.eventPirates();
    else if (roll < 0.22) this.eventStorm();
    else if (roll < 0.30) this.eventThieves();
    else if (roll < 0.36) this.eventGuards();
    else if (roll < 0.40) this.eventStrike();
    else if (roll < 0.44) this.eventGoodWeather();
    else if (roll < 0.47) this.eventFishing();
    else if (roll < 0.49) this.eventFog();
  },

  showEventModal(title, desc, type, onClose) {
    this.stats.eventsEncountered++;
    const colors = { bad:'#f44', good:'#0f0', event:'#ff0', info:'#0ff' };
    const html = `
      <div style="font-size:52px;text-align:center;margin:10px 0;">${
        type==='bad'?'⚠️':type==='good'?'✨':'📢'}</div>
      <div style="font-size:19px;text-align:center;color:${colors[type]||'#ff0'};margin:10px 0;">${desc}</div>`;
    this.showModal(title, html, [{
      text: 'המשך', cls: type==='bad'?'danger':'primary',
      fn: () => { this.hideModal(); if (onClose) onClose(); }
    }]);
  },

  eventPirates() {
    const defended = (this.crew / this.maxCrew) > 0.5 || Math.random() < 0.35;
    if (defended) {
      const dmg = Math.floor(Math.random() * 8) + 3;
      this.shipHealth = Math.max(1, this.shipHealth - dmg);
      this.addMessage(`☠️ פיראטים תקפו! הצוות הדף אותם. נזק: ${dmg}%`, 'event');
      this.showEventModal('☠️ פיראטים!',
        `פיראטים תקפו! הצוות הגיבור הדף אותם, אך הספינה ספגה ${dmg}% נזק.`,
        'event', () => this.updateUI());
    } else {
      let lostDesc = '';
      const goods = ['wheat','olives','copper'].filter(g => this.cargo[g] > 0);
      if (goods.length > 0) {
        const g = goods[Math.floor(Math.random() * goods.length)];
        const lost = Math.ceil(this.cargo[g] * (0.2 + Math.random() * 0.4));
        this.cargo[g] = Math.max(0, this.cargo[g] - lost);
        lostDesc += ` ${lost} ${this.goodNamesShort[g]}`;
      }
      const lostMoney = Math.floor(this.money * (0.1 + Math.random() * 0.2));
      this.money = Math.max(0, this.money - lostMoney);
      if (lostMoney > 0) lostDesc += ` ו-${lostMoney}₪`;
      this.addMessage(`☠️ פיראטים שדדו:${lostDesc}`, 'bad');
      this.showEventModal('☠️ פיראטים שדדו אותך!',
        `פיראטים תקפו ושדדו:${lostDesc}. הצוות הקטן לא הצליח להתגונן!`,
        'bad', () => this.updateUI());
    }
  },

  eventStorm() {
    const dmg = Math.floor(Math.random() * 25) + 10;
    this.shipHealth = Math.max(1, this.shipHealth - dmg);
    let extra = '';
    if (Math.random() < 0.3) {
      const goods = ['wheat','olives','copper'].filter(g => this.cargo[g] > 0);
      if (goods.length > 0) {
        const g = goods[Math.floor(Math.random() * goods.length)];
        const lost = Math.ceil(this.cargo[g] * 0.15);
        this.cargo[g] = Math.max(0, this.cargo[g] - lost);
        extra = ` ${lost} ${this.goodNamesShort[g]} נפלו לים.`;
      }
    }
    this.addMessage(`⛈️ סערה! נזק: ${dmg}%.${extra}`, 'bad');
    this.showEventModal('⛈️ סערה!', `סערה קשה פגעה בספינה! נזק: ${dmg}%.${extra}`,
      'bad', () => {
        this.updateUI();
        if (this.shipHealth <= 10) setTimeout(() => this.eventSinking(), 800);
      });
  },

  eventThieves() {
    if (this.money === 0) return;
    const stolen = Math.floor(this.money * (0.05 + Math.random() * 0.15));
    this.money = Math.max(0, this.money - stolen);
    this.addMessage(`🦹 גנבים גנבו ${stolen}₪ בנמל!`, 'bad');
    this.showEventModal('🦹 גנבים בנמל!',
      `גנבים פרצו לספינה בלילה וגנבו ${stolen}₪!`, 'bad', () => this.updateUI());
  },

  eventGuards() {
    const fine = Math.floor(50 + Math.random() * 100);
    if (this.money < fine) return;
    this.money -= fine;
    this.addMessage(`👮 שומרי הנמל גבו קנס של ${fine}₪`, 'bad');
    this.showEventModal('👮 שומרי הנמל',
      `שומרי הנמל בדקו את הספינה ומצאו בעיה. קנס: ${fine}₪.`,
      'event', () => this.updateUI());
  },

  eventStrike() {
    this.addMessage('🪧 שביתה בנמל! לא ניתן לסחור היום.', 'event');
    this.showEventModal('🪧 שביתה בנמל!',
      'פועלי הנמל שובתים! לא ניתן לסחור היום. נסה מחר.', 'event', null);
  },

  eventGoodWeather() {
    if (this.shipHealth < 100) {
      const bonus = Math.floor(Math.random() * 5) + 2;
      this.shipHealth = Math.min(100, this.shipHealth + bonus);
      this.addMessage(`☀️ מזג אויר נפלא! הצוות תיקן ${bonus}%`, 'good');
      this.showEventModal('☀️ מזג אויר נפלא!',
        `הים שקט. הצוות ניצל את ההזדמנות לתקן ${bonus}% מהספינה!`,
        'good', () => this.updateUI());
    } else {
      const bonus = Math.floor(Math.random() * 30) + 20;
      this.money += bonus;
      this.addMessage(`☀️ מזג אויר נפלא! מצאת ${bonus}₪`, 'good');
      this.showEventModal('☀️ מזג אויר נפלא!',
        `הים שקט ומזג האויר מצוין. הצוות מצא ${bonus}₪ שנשכחו בתא המטען!`,
        'good', () => this.updateUI());
    }
  },

  eventFishing() {
    const earned = Math.floor(Math.random() * 60) + 30;
    this.money += earned;
    this.addMessage(`🐟 הצוות דג דגים ומכר ב-${earned}₪!`, 'good');
    this.showEventModal('🐟 דייג מוצלח!',
      `הצוות ניצל את הנסיעה לדוג דגים ומכר אותם ב-${earned}₪!`,
      'good', () => this.updateUI());
  },

  eventFog() {
    const extraHours = Math.floor(Math.random() * 3) + 2; // 2-4 extra hours
    const remaining = this.hoursRemaining();
    if (remaining > extraHours) {
      this.totalHours += extraHours;
      this.checkDailyPriceUpdate();
      this.addMessage(`🌫️ ערפל כבד! איבדת ${extraHours} שעות. שעה ${this.totalHours}/${this.maxHours}`, 'bad');
      this.showEventModal('🌫️ ערפל כבד!',
        `ערפל כבד כיסה את הים. הנסיעה לקחה ${extraHours} שעות נוספות! (שעה ${this.totalHours} מתוך ${this.maxHours})`,
        'event', () => {
          this.updateUI();
          if (this.totalHours >= this.maxHours) setTimeout(() => this.endGame(), 600);
        });
    }
  },

  eventSinking() {
    this.showEventModal('💀 הספינה טובעת!',
      'הספינה ניזוקה קשות ומתחילה לטבוע! אתה מאבד את כל הסחורה!',
      'bad', () => {
        this.cargo = { wheat: 0, olives: 0, copper: 0 };
        this.shipHealth = 20;
        this.updateUI();
        this.addMessage('💀 הספינה כמעט טבעה! איבדת את כל הסחורה.', 'bad');
      });
  }
});

// ---- HELP ----
Object.assign(game, {
  showHelp() {
    const th = this.travelHours;
    const n = this.locationNames;
    const ic = this.locationIcons;
    const locs = ['haifa','jaffa','eilat'];
    const pairs = [
      ['haifa','jaffa'], ['haifa','eilat'], ['jaffa','eilat']
    ];
    const travelLines = pairs.map(([a,b]) =>
      `${ic[a]}${n[a]}↔${ic[b]}${n[b]}: <span class="highlight">${th[a][b]}ש'</span>`
    ).join(' &nbsp; ');
    const portList = locs.map(l => `${n[l]} ${ic[l]}`).join(', ');
    const html = `<div style="font-size:16px;line-height:2;direction:rtl;">
      <p><span class="highlight">מטרת המשחק:</span> להרוויח כמה שיותר כסף ב-${this.maxHours} שעות (${Math.round(this.maxHours/24)} ימים)</p>
      <p><span class="highlight">מוצרים:</span> ${Object.values(this.goodNames).join(', ')}</p>
      <p><span class="highlight">נמלים:</span> ${portList}</p>
      <hr style="border-color:#333;margin:8px 0;">
      <p><span class="highlight">זמני נסיעה:</span> ${travelLines}</p>
      <hr style="border-color:#333;margin:8px 0;">
      <p><span class="good">Q</span> = קנה סחורה &nbsp; <span class="good">W</span> = מכור סחורה</p>
      <p><span class="good">E</span> = בנק &nbsp; <span class="good">R</span> = תיקון ספינה</p>
      <p><span class="good">T</span> = גיוס צוות &nbsp; <span class="good">M</span> = מפה/נסיעה</p>
      <hr style="border-color:#333;margin:8px 0;">
      <p><span class="highlight">טיפ:</span> קנה בזול, מכור ביוקר!</p>
      <p><span class="highlight">טיפ:</span> שמור כסף בבנק - מוגן מגנבים!</p>
      <p><span class="highlight">טיפ:</span> צוות גדול מגן מפני פיראטים!</p>
    </div>`;
    this.showModal('❓ עזרה', html, [{ text: 'סגור', fn: () => this.hideModal() }]);
  }
});

// ---- END GAME ----
Object.assign(game, {
  endGame() {
    const cargoVal = ['wheat', 'olives', 'copper'].reduce((sum, g) =>
      sum + this.cargo[g] * this.getSellPrice(this.location, g), 0);
    const totalWealth = this.money + this.bankDeposit + cargoVal;
    const profit = totalWealth - 1000;

    let rank, rankColor;
    if      (totalWealth >= 5000) { rank = '👑 מלך הסוחרים!';  rankColor = '#ff0'; }
    else if (totalWealth >= 3000) { rank = '⭐ סוחר מצוין!';    rankColor = '#0f0'; }
    else if (totalWealth >= 2000) { rank = '👍 סוחר טוב';       rankColor = '#0ff'; }
    else if (totalWealth >= 1000) { rank = '😐 סוחר בינוני';    rankColor = '#aaa'; }
    else                          { rank = '💸 פשיטת רגל!';     rankColor = '#f44'; }

    const isWin = totalWealth >= 1500;
    const titleEl = document.getElementById('gameover-title');
    titleEl.textContent = isWin ? '🏆 כל הכבוד!' : '😢 המשחק נגמר';
    titleEl.className = 'gameover-title ' + (isWin ? 'win' : 'lose');

    document.getElementById('score-rank').textContent = rank;
    document.getElementById('score-rank').style.color = rankColor;

    document.getElementById('final-stats').innerHTML = `
      <div><span class="slabel">הון סופי:</span> <span class="svalue">${totalWealth}₪</span></div>
      <div><span class="slabel">רווח:</span> <span class="svalue" style="color:${profit >= 0 ? '#0f0' : '#f44'}">${profit >= 0 ? '+' : ''}${profit}₪</span></div>
      <div><span class="slabel">כסף בכיס:</span> <span class="svalue">${this.money}₪</span></div>
      <div><span class="slabel">כסף בבנק:</span> <span class="svalue">${this.bankDeposit}₪</span></div>
      <div><span class="slabel">ערך מטען:</span> <span class="svalue">${cargoVal}₪</span></div>
      <div><span class="slabel">עסקאות:</span> <span class="svalue">${this.stats.tradesMade}</span></div>
      <div><span class="slabel">נמלים שביקרת:</span> <span class="svalue">${this.stats.portsVisited.length}/3</span></div>
      <div><span class="slabel">אירועים:</span> <span class="svalue">${this.stats.eventsEncountered}</span></div>
    `;
    this.showScreen('screen-gameover');
  },

  restart() {
    this.showScreen('screen-intro');
  }
});

// ---- STARTUP ----
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('keydown', () => {
    if (document.querySelector('#screen-intro.active')) game.init();
  });
  document.getElementById('screen-intro').addEventListener('click', () => {
    if (document.querySelector('#screen-intro.active')) game.init();
  });

  // Mobile log drawer: swipe down to close
  const drawer = document.getElementById('mobile-log-drawer');
  if (drawer) {
    let touchStartY = 0;
    let touchStartScrollTop = 0;
    drawer.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      const content = document.getElementById('mobile-log-drawer-content');
      touchStartScrollTop = content ? content.scrollTop : 0;
    }, { passive: true });
    drawer.addEventListener('touchend', (e) => {
      const dy = e.changedTouches[0].clientY - touchStartY;
      // Only close if swiped down significantly AND content is scrolled to top
      if (dy > 80 && touchStartScrollTop <= 0) {
        game.closeMobileLog();
      }
    }, { passive: true });
  }
});
