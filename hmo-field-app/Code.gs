/**
 * HMO Field App — backend (Google Apps Script)
 * Hear Me Out Ear Care — mobile microsuction business
 *
 * Bound to the "HMO — Client Records" Google Sheet.
 * Deploy via Extensions > Apps Script inside that Sheet, then
 * Deploy > New deployment > Web app (see DEPLOYMENT.md).
 */

// ====================== CONFIG ======================

// Tab name inside the "HMO — Client Records" spreadsheet.
var SHEET_NAME = 'Client Records';

// Only these Google accounts may open the app. Add more emails as needed.
var ALLOWED_USERS = ['hmoearcare@gmail.com'];

// 1-based column numbers, matching the sheet's header row exactly.
var COL = {
  FIRST_NAME: 1,
  LAST_NAME: 2,
  PHONE: 3,
  EMAIL: 4,
  ADDRESS: 5,
  POSTCODE: 6,
  HOW_FOUND: 7,
  DATE: 8,
  TIME: 9,
  SERVICE: 10,
  EARS_TREATED: 11,
  WAX_FOUND: 12,
  DEPOSIT_PAID: 13,
  DEPOSIT_AMOUNT: 14,
  BALANCE_PAID: 15,
  BALANCE_AMOUNT: 16,
  TOTAL_PAID: 17,
  PAYMENT_METHOD: 18,
  APPOINTMENT_NOTES: 19,
  BEFORE_IMAGE: 20,
  AFTER_IMAGE: 21,
  SATISFACTION: 22,
  REVIEW_LEFT: 23,
  RECALL_DATE: 24,
  RECALL_CONTACTED: 25,
  RECALL_OUTCOME: 26,
  FOLLOW_UP_NOTES: 27,
  THANK_YOU_TRIGGER: 28,
  RECALL_TRIGGER: 29
};

var TOTAL_COLUMNS = 29;

// Fields the app is allowed to write back to, and which column each maps to.
var EDITABLE_FIELDS = {
  balancePaid: COL.BALANCE_PAID,
  waxFound: COL.WAX_FOUND,
  paymentMethod: COL.PAYMENT_METHOD
};

// ====================== WEB APP ENTRY POINT ======================

function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  var email = Session.getActiveUser().getEmail();
  var authorized = !!email && ALLOWED_USERS.indexOf(email) !== -1;

  template.authorized = authorized;
  template.userEmail = email || '';

  return template.evaluate()
    .setTitle('HMO Field App')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ====================== AUTH ======================

function checkAuthorized_() {
  var email = Session.getActiveUser().getEmail();
  if (!email || ALLOWED_USERS.indexOf(email) === -1) {
    throw new Error('Not authorized for this app.');
  }
  return email;
}

// ====================== SHEET HELPERS ======================

function getSheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Worksheet "' + SHEET_NAME + '" was not found in this spreadsheet.');
  }
  return sheet;
}

function pad2_(n) {
  return (n < 10 ? '0' : '') + n;
}

function todayIso_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function addDaysIso_(isoDate, days) {
  var parts = isoDate.split('-');
  var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  d.setDate(d.getDate() + days);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function normalizeDate_(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  if (typeof val === 'string' && val.trim() !== '') {
    var s = val.trim();
    var isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return isoMatch[0];
    var parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }
    return s;
  }
  return '';
}

function normalizeTime_(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'HH:mm');
  }
  if (typeof val === 'number') {
    var totalMinutes = Math.round(val * 24 * 60);
    var h = Math.floor(totalMinutes / 60);
    var m = totalMinutes % 60;
    return pad2_(h) + ':' + pad2_(m);
  }
  var s = String(val || '').trim();
  if (!s) return '';
  var ampm = s.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (ampm) {
    var hh = parseInt(ampm[1], 10);
    var mm = ampm[2];
    var suffix = ampm[3].toUpperCase();
    if (suffix === 'PM' && hh !== 12) hh += 12;
    if (suffix === 'AM' && hh === 12) hh = 0;
    return pad2_(hh) + ':' + mm;
  }
  var hm = s.match(/^(\d{1,2}):(\d{2})$/);
  if (hm) {
    return pad2_(parseInt(hm[1], 10)) + ':' + hm[2];
  }
  return s;
}

function rowToRecord_(rowArray, rowNumber) {
  return {
    row: rowNumber,
    firstName: rowArray[COL.FIRST_NAME - 1] || '',
    lastName: rowArray[COL.LAST_NAME - 1] || '',
    phone: String(rowArray[COL.PHONE - 1] || ''),
    email: rowArray[COL.EMAIL - 1] || '',
    address: rowArray[COL.ADDRESS - 1] || '',
    postcode: String(rowArray[COL.POSTCODE - 1] || ''),
    howFound: rowArray[COL.HOW_FOUND - 1] || '',
    date: normalizeDate_(rowArray[COL.DATE - 1]),
    time: normalizeTime_(rowArray[COL.TIME - 1]),
    service: rowArray[COL.SERVICE - 1] || '',
    earsTreated: rowArray[COL.EARS_TREATED - 1] || '',
    waxFound: rowArray[COL.WAX_FOUND - 1] || '',
    depositPaid: rowArray[COL.DEPOSIT_PAID - 1] || '',
    depositAmount: rowArray[COL.DEPOSIT_AMOUNT - 1] || '',
    balancePaid: rowArray[COL.BALANCE_PAID - 1] || '',
    balanceAmount: rowArray[COL.BALANCE_AMOUNT - 1] || '',
    totalPaid: rowArray[COL.TOTAL_PAID - 1] || '',
    paymentMethod: rowArray[COL.PAYMENT_METHOD - 1] || '',
    appointmentNotes: rowArray[COL.APPOINTMENT_NOTES - 1] || '',
    beforeImage: rowArray[COL.BEFORE_IMAGE - 1] || '',
    afterImage: rowArray[COL.AFTER_IMAGE - 1] || '',
    satisfaction: rowArray[COL.SATISFACTION - 1] || '',
    reviewLeft: rowArray[COL.REVIEW_LEFT - 1] || '',
    recallDate: normalizeDate_(rowArray[COL.RECALL_DATE - 1]),
    recallContacted: rowArray[COL.RECALL_CONTACTED - 1] || '',
    recallOutcome: rowArray[COL.RECALL_OUTCOME - 1] || '',
    followUpNotes: rowArray[COL.FOLLOW_UP_NOTES - 1] || '',
    thankYouTrigger: rowArray[COL.THANK_YOU_TRIGGER - 1] || '',
    recallTrigger: rowArray[COL.RECALL_TRIGGER - 1] || ''
  };
}

function getAllRecords_() {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, TOTAL_COLUMNS).getValues();
  var records = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var isBlankRow = row.every(function (cell) {
      return cell === '' || cell === null || cell === undefined;
    });
    if (isBlankRow) continue; // skip genuinely empty trailing rows
    records.push(rowToRecord_(row, i + 2));
  }
  return records;
}

function sortByDateTimeAsc_(records) {
  records.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.time !== b.time) return a.time < b.time ? -1 : 1;
    return 0;
  });
  return records;
}

// ====================== PUBLIC API (called from the client) ======================

function getTodayAppointments() {
  checkAuthorized_();
  var today = todayIso_();
  var records = getAllRecords_().filter(function (r) { return r.date === today; });
  return sortByDateTimeAsc_(records);
}

function getUpcomingAppointments() {
  checkAuthorized_();
  var today = todayIso_();
  var end = addDaysIso_(today, 7);
  var records = getAllRecords_().filter(function (r) {
    return r.date > today && r.date <= end;
  });
  return sortByDateTimeAsc_(records);
}

function getRecalls() {
  checkAuthorized_();
  var today = todayIso_();
  var end = addDaysIso_(today, 60);
  var records = getAllRecords_().filter(function (r) {
    return r.recallDate && r.recallDate >= today && r.recallDate <= end;
  });
  records.sort(function (a, b) {
    if (a.recallDate !== b.recallDate) return a.recallDate < b.recallDate ? -1 : 1;
    return 0;
  });
  return records;
}

function searchClients(query) {
  checkAuthorized_();
  var q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  var qDigits = q.replace(/\D/g, '');

  var results = getAllRecords_().filter(function (r) {
    var haystack = (r.firstName + ' ' + r.lastName + ' ' + r.phone + ' ' + r.postcode + ' ' + r.address).toLowerCase();
    if (haystack.indexOf(q) !== -1) return true;
    if (qDigits) {
      var phoneDigits = String(r.phone).replace(/\D/g, '');
      if (phoneDigits && phoneDigits.indexOf(qDigits) !== -1) return true;
    }
    return false;
  });

  results.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1; // most recent/upcoming first
    return 0;
  });
  return results.slice(0, 50);
}

function getClientByRow(row) {
  checkAuthorized_();
  row = Number(row);
  var sheet = getSheet_();
  if (!row || row < 2 || row > sheet.getLastRow()) {
    throw new Error('Client record not found.');
  }
  var values = sheet.getRange(row, 1, 1, TOTAL_COLUMNS).getValues()[0];
  return rowToRecord_(values, row);
}

function updateField(row, fieldKey, value) {
  checkAuthorized_();
  row = Number(row);
  if (!EDITABLE_FIELDS.hasOwnProperty(fieldKey)) {
    throw new Error('Field "' + fieldKey + '" is not editable.');
  }
  var sheet = getSheet_();
  if (!row || row < 2 || row > sheet.getLastRow()) {
    throw new Error('Client record not found.');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet.getRange(row, EDITABLE_FIELDS[fieldKey]).setValue(value);
  } finally {
    lock.releaseLock();
  }
  return getClientByRow(row);
}

function saveAmounts(row, depositAmount, balanceAmount) {
  checkAuthorized_();
  row = Number(row);
  var sheet = getSheet_();
  if (!row || row < 2 || row > sheet.getLastRow()) {
    throw new Error('Client record not found.');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet.getRange(row, COL.DEPOSIT_AMOUNT).setValue(depositAmount);
    sheet.getRange(row, COL.BALANCE_AMOUNT).setValue(balanceAmount);
  } finally {
    lock.releaseLock();
  }
  return true;
}

function saveAppointmentNotes(row, notes) {
  checkAuthorized_();
  row = Number(row);
  var sheet = getSheet_();
  if (!row || row < 2 || row > sheet.getLastRow()) {
    throw new Error('Client record not found.');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet.getRange(row, COL.APPOINTMENT_NOTES).setValue(String(notes || ''));
  } finally {
    lock.releaseLock();
  }
  return true;
}
