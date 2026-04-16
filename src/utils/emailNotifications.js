// ============================================================
// HCL Client Portal — Email Notification System (Placeholder)
// ============================================================
// Currently logs to console. To wire up real email delivery:
//   1. Sign up for SendGrid (sendgrid.com) or Resend (resend.com)
//   2. Replace the sendEmail() function below with an API call
//   3. Set your API key in environment variables
//   4. For server-side sending, build a small Express API endpoint
//      (e.g. POST /api/send-email) and call it from here
// ============================================================

const FROM_ADDRESS = 'barry@herronconsultantslimited.co.uk'
const FROM_NAME = 'Barry Herron — HCL'

/**
 * Core send function — replace body with real API call.
 */
async function sendEmail({ to, subject, body }) {
  // *** PLACEHOLDER — replace with SendGrid / Resend call ***
  // Example SendGrid call:
  // await fetch('https://api.sendgrid.com/v3/mail/send', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${import.meta.env.VITE_SENDGRID_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     personalizations: [{ to: [{ email: to }] }],
  //     from: { email: FROM_ADDRESS, name: FROM_NAME },
  //     subject,
  //     content: [{ type: 'text/plain', value: body }],
  //   }),
  // })

  console.group('📧 HCL Email Notification (Placeholder)')
  console.log('From:', FROM_ADDRESS)
  console.log('To:', to)
  console.log('Subject:', subject)
  console.log('Body:', body)
  console.groupEnd()

  return { success: true, placeholder: true }
}

/**
 * Notify Barry when a client check-in raises governance alerts.
 */
export async function notifyAdminOfFlags({ clientName, clientId, month, flags }) {
  const flagList = flags.map((f, i) => `  ${i + 1}. ${f}`).join('\n')

  await sendEmail({
    to: FROM_ADDRESS,
    subject: `Governance Alert — ${clientName} — ${month} Check-In`,
    body: `
HCL Governance Alert
====================

Client: ${clientName}
Month: ${month}
Check-in submitted and the following flags have been raised:

${flagList}

Please log in to the HCL Client Portal to review this check-in and take appropriate action.

${window.location.origin}/admin/clients/${clientId}

— HCL Client Portal (Automated)
    `.trim(),
  })
}

/**
 * Notify a client that their check-in has been received.
 */
export async function notifyClientCheckInReceived({ clientEmail, clientName, month, hasFlags }) {
  await sendEmail({
    to: clientEmail,
    subject: `Check-In Received — ${month}`,
    body: `
Dear ${clientName},

Your monthly governance check-in for ${month} has been received by Herron Consultants Limited.

${
  hasFlags
    ? 'We have noted some material changes in your submission and will be in touch shortly to discuss next steps.'
    : 'No material changes have been flagged this month. Your governance file remains current.'
}

You can view your portal at any time: ${window.location.origin}

If you have any questions, please contact Barry Herron directly.

Kind regards,
Barry Herron
Herron Consultants Limited

—
HCL provides non-advised governance services only. All insurance decisions remain with the client and their FCA-regulated broker.
    `.trim(),
  })
}

/**
 * Notify a broker of a governance action required.
 */
export async function notifyBroker({ brokerEmail, brokerName, clientName, message }) {
  await sendEmail({
    to: brokerEmail,
    subject: `Governance Action — ${clientName}`,
    body: `
Dear ${brokerName},

Herron Consultants Limited is writing regarding your client ${clientName}.

${message}

Please respond to this notification within 5 working days.

Kind regards,
Barry Herron
Herron Consultants Limited

—
HCL provides non-advised governance services only. This communication does not constitute insurance advice.
    `.trim(),
  })
}
