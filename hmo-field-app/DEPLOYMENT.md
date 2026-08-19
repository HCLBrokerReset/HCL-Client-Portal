# HMO Field App — Deployment Guide

No coding knowledge needed. Follow these steps in order.

## Before you start

You need:
- The Google Sheet called **"HMO — Client Records"** with a worksheet (tab) inside it named exactly **"Client Records"**, with columns in this order starting at column A:

  `First Name, Last Name, Phone, Email, Address, Postcode, How They Found Us, Date of Appointment, Time, Service, Ear(s) Treated, Wax Found (Y/N), Deposit Paid (Y/N), Deposit Amount, Balance Paid (Y/N), Balance Amount, Total Paid, Payment Method, Appointment Notes, Before Image Taken (Y/N), After Image Taken (Y/N), Client Satisfaction (1-5), Google Review Left (Y/N), Recall Date (12 months), Recall Contacted (Y/N), Recall Outcome, Follow Up Notes, Thank You Trigger, Recall Trigger`

- Signed in to the Google account that owns that Sheet (`hmoearcare@gmail.com`).

## Step 1 — Open the Apps Script editor

1. Open the **"HMO — Client Records"** Google Sheet.
2. Click **Extensions** in the top menu, then **Apps Script**. A new tab opens with the script editor.
3. If there's already a file called `Code.gs` with some placeholder text in it (like `function myFunction() {}`), select all the text in it and delete it.

## Step 2 — Paste in the backend code

1. In the Apps Script editor, make sure the file called `Code.gs` is open (it's listed on the left under "Files").
2. Open the `Code.gs` file from this project on your computer, select all its contents, and copy it.
3. Paste it into the empty `Code.gs` file in the Apps Script editor.
4. Click the disk/save icon (or press Ctrl+S / Cmd+S).

## Step 3 — Add the frontend file

1. In the Apps Script editor, click the **+** next to "Files" on the left, then choose **HTML**.
2. Name the new file exactly **`Index`** (it will automatically get a `.html` extension — do not type `.html` yourself).
3. Delete any placeholder content in the new file.
4. Open the `Index.html` file from this project, select all its contents, and copy it.
5. Paste it into the `Index` file in the Apps Script editor.
6. Save (Ctrl+S / Cmd+S).

## Step 4 — Check the settings in the code

Still in `Code.gs`, near the top you'll see:

```
var SHEET_NAME = 'Client Records';
var ALLOWED_USERS = ['hmoearcare@gmail.com'];
```

- `SHEET_NAME` must exactly match the name of the tab at the bottom of your spreadsheet (not the spreadsheet's title — the tab name).
- `ALLOWED_USERS` is the list of Google account emails allowed to open the app. Add more emails here (comma-separated, each in quotes) if anyone else needs access later, e.g.:
  `var ALLOWED_USERS = ['hmoearcare@gmail.com', 'someoneelse@gmail.com'];`

## Step 5 — Deploy as a web app

1. Click the blue **Deploy** button (top right), then **New deployment**.
2. Click the gear/cog icon next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description**: `HMO Field App v1`
   - **Execute as**: `Me (hmoearcare@gmail.com)`
   - **Who has access**: `Only myself` — or, if Sarah signs in with a *different* Google account than the one that owns the Sheet, choose **Anyone with a Google account** instead (the app's own login check in `ALLOWED_USERS` will still block anyone not on the list).
4. Click **Deploy**.
5. The first time you deploy, Google will ask you to **authorize** the script:
   - Click **Authorize access**.
   - Choose the `hmoearcare@gmail.com` account.
   - You'll likely see a screen saying "Google hasn't verified this app" — this is normal for a private script you wrote yourself. Click **Advanced**, then **Go to HMO Field App (unsafe)**, then **Allow**.
6. You'll be given a **Web app URL** that looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`
   Copy this URL and save it somewhere safe (e.g. a note on Sarah's phone). This is the permanent link to the app.

## Step 6 — Test it on a computer first

1. Open the Web app URL in a browser, signed in as `hmoearcare@gmail.com`.
2. You should see the dark teal header, "Hear Me Out · Ear Care", and the Today screen.
3. Check that today's appointments (if any are in the sheet) show up correctly.
4. Try the Search tab and search for an existing client.
5. Open a client and try toggling "Wax Found" or "Balance Paid" — check the Google Sheet to confirm the cell updated.

If you see an unauthorized message instead, double-check the email in `ALLOWED_USERS` matches exactly the Google account you're signed in with.

## Step 7 — Add it to Sarah's iPhone home screen

1. On the iPhone, open **Safari** (must be Safari, not Chrome — Add to Home Screen only works fully in Safari).
2. Go to the Web app URL from Step 5.
3. Sign in with the `hmoearcare@gmail.com` Google account if prompted.
4. Once the app loads, tap the **Share** icon (square with an arrow pointing up) in Safari's toolbar.
5. Scroll down and tap **Add to Home Screen**.
6. Confirm the name (e.g. "HMO Field App") and tap **Add**.
7. A new icon appears on the home screen. Tapping it opens the app full-screen, without Safari's address bar, like a regular app.

> **Note on "PWA install":** Because this app is hosted on Google's Apps Script platform (not on your own web server), it can't ship a traditional installable-with-offline-support PWA (that requires a background "service worker," which Apps Script's hosting doesn't reliably support). What you get instead — Safari's "Add to Home Screen" — gives Sarah the same result she actually needs: a home-screen icon that opens the app full-screen with no browser chrome. The only difference is it requires an internet connection each time (there's no offline caching), which fits how this app is used anyway, since it's always reading and writing live data from the Google Sheet.

## Step 8 — Updating the app later

If you ever need to change the code:

1. Edit `Code.gs` and/or `Index` in the Apps Script editor.
2. Save.
3. Click **Deploy > Manage deployments**.
4. Click the pencil/edit icon on the existing deployment.
5. Under "Version", choose **New version**.
6. Click **Deploy**.

The existing Web app URL and the home-screen icon keep working — you don't need to redo Step 7.

## Troubleshooting

- **"Not authorized" screen**: the signed-in Google account isn't in `ALLOWED_USERS` in `Code.gs`.
- **Blank screen or "Worksheet not found" error**: the tab name in the sheet doesn't match `SHEET_NAME` in `Code.gs` (check for extra spaces).
- **Changes to the code don't show up**: you edited the files but didn't create a **new version** in Deploy > Manage deployments (Step 8).
- **Card shows the wrong date/time**: check that the "Date of Appointment" and "Time" columns in the sheet are formatted as Date/Time in Google Sheets (Format > Number).
