const key = 'uyc-ganesh-receipts-v1';
let receipts = JSON.parse(localStorage.getItem(key) || '[]');
let currentReceipt = null;
let editingId = null;
let activeFilter = 'all';

const $ = (s) => document.querySelector(s);
const money = (amount) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount);
const dateISO = () => new Date().toISOString().slice(0, 10);
const prettyDate = (date) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${date}T12:00:00`));

function nextNumber() {
  const maxNum = receipts.reduce((max, r) => {
    const num = Number((r.receiptNumber || '').replace(/\D/g, ''));
    return Math.max(max, isNaN(num) ? 0 : num);
  }, 0);
  return `UYC-${String(maxNum + 1).padStart(4, '0')}`;
}

function save() {
  localStorage.setItem(key, JSON.stringify(receipts));
  updateStats();
}

function setPage(id) {
  document.querySelectorAll('.page').forEach(x => x.classList.toggle('active', x.id === id));
  document.querySelectorAll('nav button').forEach(x => x.classList.toggle('active', x.dataset.page === id));
  $('#mainNav').classList.remove('open');
  if (id === 'create' && !editingId) resetForm();
  if (id === 'history') renderHistory();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.page === 'create' && editingId) resetForm();
  setPage(b.dataset.page);
}));

$('#menuButton').addEventListener('click', () => $('#mainNav').classList.toggle('open'));

function updateStats() {
  const today = dateISO();
  const total = receipts.reduce((s, r) => s + Number(r.amount), 0);
  const todays = receipts.filter(r => r.date === today);
  $('#statReceipts').textContent = receipts.length;
  $('#statAmount').textContent = `₹${money(total)}`;
  $('#statToday').textContent = todays.length;
  $('#statTodayAmount').textContent = `₹${money(todays.reduce((s, r) => s + Number(r.amount), 0))} collected today`;
}

function resetForm() {
  editingId = null;
  $('#receiptForm').reset();
  $('#donationDate').value = dateISO();
  $('#formEyebrow').textContent = 'New contribution';
  $('#formHeading').textContent = 'Create donation receipt';
  $('#formSubtext').textContent = 'Enter the donor details below. Your receipt number is assigned automatically.';
  $('#numberLabel').textContent = 'Next receipt number';
  $('#nextNumber').textContent = nextNumber();
  $('#submitBtn').innerHTML = 'Generate receipt <span>→</span>';
  $('#cancelEditBtn').style.display = 'none';
  document.querySelectorAll('.error').forEach(e => e.textContent = '');
}

function startEdit(id) {
  const target = receipts.find(r => r.id === id);
  if (!target) return;
  editingId = target.id;
  $('#donorName').value = target.donorName;
  $('#flatNumber').value = target.flatNumber;
  $('#amount').value = target.amount;
  $('#donationDate').value = target.date || dateISO();

  $('#formEyebrow').textContent = 'Edit record';
  $('#formHeading').textContent = `Edit receipt ${target.receiptNumber}`;
  $('#formSubtext').textContent = 'Update donor details or donation amount below.';
  $('#numberLabel').textContent = 'Receipt number';
  $('#nextNumber').textContent = target.receiptNumber;
  $('#submitBtn').innerHTML = 'Update receipt <span>✓</span>';
  $('#cancelEditBtn').style.display = 'block';

  setPage('create');
}

function numberWords(n) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const below100 = x => x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? ' ' + ones[x % 10] : ''}`;
  const below1000 = x => x >= 100 ? `${ones[Math.floor(x / 100)]} Hundred${x % 100 ? ' ' + below100(x % 100) : ''}` : below100(x);
  if (n === 0) return 'Zero';
  const parts = [];
  if (n >= 10000000) { parts.push(`${below1000(Math.floor(n / 10000000))} Crore`); n %= 10000000; }
  if (n >= 100000) { parts.push(`${below1000(Math.floor(n / 100000))} Lakh`); n %= 100000; }
  if (n >= 1000) { parts.push(`${below1000(Math.floor(n / 1000))} Thousand`); n %= 1000; }
  if (n) parts.push(below1000(n));
  return parts.join(' ');
}

function renderReceipt(r) {
  $('#receiptPaper').innerHTML = `
    <div class="receipt-inner">
      <p class="receipt-mantra">॥ श्री गणेशाय नमः ॥</p>
      <div class="receipt-head">
        <h2>UNITED YOUTH CLUB</h2>
        <p>Dharam Deep Complex, Nallasopara East</p>
      </div>
      <div class="receipt-title">GANESH UTSAV DONATION RECEIPT</div>
      <div class="receipt-meta">
        <span><b>Receipt No.:</b> ${r.receiptNumber}</span>
        <span><b>Date:</b> ${prettyDate(r.date)}</span>
      </div>
      <div class="receipt-body">
        <p class="receipt-label">Received with thanks from</p>
        <p class="receipt-value">${escapeHtml(r.donorName)}</p>
        <div class="receipt-row">
          <div>
            <p class="receipt-label">Flat no.</p>
            <p class="receipt-value">${escapeHtml(r.flatNumber)}</p>
          </div>
          <div>
            <p class="receipt-label">Purpose</p>
            <p class="receipt-value">Ganesh Utsav</p>
          </div>
        </div>
        <div class="amount-box">
          <span>Donation received</span>
          <strong>₹ ${money(r.amount)}</strong>
        </div>
        <p class="words">Rupees ${numberWords(Math.floor(r.amount))} Only</p>
      </div>
      <div class="receipt-footer">
        <p>Thank you for your generous contribution towards Ganesh Utsav celebrations.<br/><b>Ganpati Bappa Morya!</b></p>
        <div class="signature">
          For United Youth Club
          <small>Authorized Signature</small>
          <span class="signatory">Vivek Singh</span>
        </div>
      </div>
      <p class="receipt-generated">United Youth Club &bull; <a href="https://www.swarajyaconsultancy.in" target="_blank" style="color:inherit;text-decoration:none;">www.swarajyaconsultancy.in</a></p>
    </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

$('#receiptForm').addEventListener('submit', e => {
  e.preventDefault();
  const donor = $('#donorName').value.trim();
  const flat = $('#flatNumber').value.trim();
  const amount = Number($('#amount').value);
  const date = $('#donationDate').value || dateISO();

  $('#donorError').textContent = donor ? '' : 'Please enter donor name.';
  $('#flatError').textContent = flat ? '' : 'Please enter flat number.';
  $('#amountError').textContent = amount > 0 ? '' : 'Please enter a valid donation amount.';

  if (!donor || !flat || !(amount > 0)) return;

  if (editingId) {
    const idx = receipts.findIndex(r => r.id === editingId);
    if (idx !== -1) {
      receipts[idx] = {
        ...receipts[idx],
        donorName: donor,
        flatNumber: flat,
        amount: amount,
        date: date,
        updatedAt: new Date().toISOString()
      };
      currentReceipt = receipts[idx];
    }
    editingId = null;
  } else {
    currentReceipt = {
      id: crypto.randomUUID(),
      receiptNumber: nextNumber(),
      donorName: donor,
      flatNumber: flat,
      amount: amount,
      date: date,
      createdAt: new Date().toISOString()
    };
    receipts.push(currentReceipt);
  }

  save();
  renderReceipt(currentReceipt);
  resetForm();
  setPage('preview');
});

$('#cancelEditBtn').addEventListener('click', resetForm);

function selectedReceipts() {
  const query = $('#searchReceipts').value.toLowerCase().trim();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return receipts.filter(r => {
    const d = new Date(`${r.date}T12:00:00`);
    let ok = activeFilter === 'all' ||
      (activeFilter === 'today' && r.date === dateISO()) ||
      (activeFilter === 'week' && d >= new Date(now - 6 * 864e5)) ||
      (activeFilter === 'month' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear());
    return ok && (!query || `${r.receiptNumber} ${r.donorName} ${r.flatNumber}`.toLowerCase().includes(query));
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function renderHistory() {
  const listed = selectedReceipts();
  const total = listed.reduce((s, r) => s + Number(r.amount), 0);
  $('#historyCount').textContent = listed.length;
  $('#historyTotal').textContent = `₹${money(total)}`;

  $('#historyList').innerHTML = listed.length ? listed.map(r => `
    <article class="receipt-record">
      <span class="record-number">${r.receiptNumber}</span>
      <span class="record-date record-muted">${prettyDate(r.date)}</span>
      <span>${escapeHtml(r.donorName)}</span>
      <span class="record-flat record-muted">${escapeHtml(r.flatNumber)}</span>
      <span class="record-amount">₹${money(r.amount)}</span>
      <span class="record-actions">
        <button data-view="${r.id}">View</button>
        <button data-edit="${r.id}">Edit</button>
        <button data-print="${r.id}">Print</button>
        <button data-image="${r.id}">Image</button>
      </span>
    </article>
  `).join('') : '<div class="empty"><span>ॐ</span>No receipts found yet.</div>';

  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => openReceipt(b.dataset.view));
  document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => startEdit(b.dataset.edit));
  document.querySelectorAll('[data-print]').forEach(b => b.onclick = () => {
    openReceipt(b.dataset.print);
    setTimeout(() => window.print(), 150);
  });
  document.querySelectorAll('[data-image]').forEach(b => b.onclick = () => {
    openReceipt(b.dataset.image);
    setTimeout(() => downloadJpeg(), 150);
  });
}

function openReceipt(id) {
  currentReceipt = receipts.find(r => r.id === id);
  if (currentReceipt) {
    renderReceipt(currentReceipt);
    setPage('preview');
  }
}

function clearReceipts() {
  if (receipts.length === 0) {
    alert('No generated receipts to clear.');
    return;
  }
  if (confirm('Are you sure you want to clear ALL generated receipts? This cannot be undone.')) {
    receipts = [];
    localStorage.removeItem(key);
    save();
    renderHistory();
    resetForm();
    alert('All receipts cleared successfully.');
  }
}

function getReceiptFileName(r, ext = 'jpg') {
  if (!r) return `Receipt.${ext}`;
  const cleanDonor = (r.donorName || '').trim().replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
  const cleanFlat = (r.flatNumber || '').trim().replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
  
  if (cleanDonor && cleanFlat) {
    return `${cleanDonor}_${cleanFlat}.${ext}`;
  } else if (cleanDonor) {
    return `${cleanDonor}.${ext}`;
  } else if (cleanFlat) {
    return `${cleanFlat}.${ext}`;
  }
  return `${r.receiptNumber || 'Receipt'}.${ext}`;
}

function downloadJpeg() {
  if (!currentReceipt) return;
  const paper = document.getElementById('receiptPaper');
  if (!paper) return;

  const originalBtnText = $('#downloadJpegButton').textContent;
  $('#downloadJpegButton').textContent = '⏳ Generating Image...';
  $('#downloadJpegButton').disabled = true;

  html2canvas(paper, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = getReceiptFileName(currentReceipt, 'jpg');
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  }).catch(err => {
    console.error('Error generating image:', err);
    alert('Could not download image. Try print or save as PDF.');
  }).finally(() => {
    $('#downloadJpegButton').textContent = originalBtnText;
    $('#downloadJpegButton').disabled = false;
  });
}

$('#clearHistoryBtn').addEventListener('click', clearReceipts);
$('#editCurrentButton').onclick = () => { if (currentReceipt) startEdit(currentReceipt.id); };
$('#downloadJpegButton').onclick = downloadJpeg;
$('#searchReceipts').addEventListener('input', renderHistory);
document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
  activeFilter = b.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(x => x.classList.toggle('active', x === b));
  renderHistory();
}));

$('#printButton').onclick = () => window.print();
$('#downloadButton').onclick = () => window.print();
$('#newReceiptButton').onclick = () => { resetForm(); setPage('create'); };

resetForm();
updateStats();
