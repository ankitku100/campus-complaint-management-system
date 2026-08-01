const nodemailer = require('nodemailer');
const { BRAND_NAME, BRAND_TAGLINE, BRAND_SUPPORT_EMAIL } = require('../config/brand');

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const getPublicLogoUrl = () => {
  return 'https://files.catbox.moe/5smyr3.png';
};

const getBrandHeaderHtml = ({ compact = false } = {}) => {
  const titleSize = compact ? 18 : 22;
  return `
    <div style="text-align:center; padding:28px 24px 18px; border-bottom:1px solid #1f2a3d; background:linear-gradient(180deg, rgba(16,24,38,0.98) 0%, rgba(11,15,25,0.98) 100%);">
      <div style="display:inline-block; margin-bottom:14px; filter:drop-shadow(0 0 14px rgba(182,255,92,0.18));">
        <img src="${getPublicLogoUrl()}" width="64" height="64" alt="CampusCare" style="display:block; width:64px; height:64px; margin:0 auto; border:0; outline:none; text-decoration:none; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:18px; font-weight:bold; color:#B6FF5C; line-height:64px; text-align:center;" />
      </div>
      <div style="color:#B6FF5C; font-size:11px; font-weight:800; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:8px;">${BRAND_NAME}</div>
      <div style="color:#ffffff; font-size:${titleSize}px; font-weight:800; line-height:1.25; margin:0;">${compact ? 'Secure Support & Resolution' : 'Enterprise Support & Resolution'}</div>
      <div style="color:#94a3b8; font-size:11px; font-weight:600; letter-spacing:0.06em; margin-top:8px;">${BRAND_TAGLINE}</div>
    </div>
  `;
};

const createEmailContainer = (title, bodyHtml) => {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 640px; margin: auto; border: 1px solid #1f2a3d; border-radius: 20px; background-color: #0b0f19; color: #ffffff; text-align: left; overflow: hidden;">
      ${getBrandHeaderHtml({ compact: true })}
      <div style="padding: 26px 28px 28px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
        <div style="font-size:20px; font-weight:800; color:#ffffff; margin:0 0 18px;">${title}</div>
        ${bodyHtml}
      </div>
      <div style="margin-top: 0; border-top: 1px solid #1e293b; padding: 18px 20px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.5; background: rgba(15,23,38,0.7);">
        This is an automated notification from ${BRAND_NAME}. Please do not reply directly to this email.<br/>
        &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
      </div>
    </div>
  `;
};

const sendEmail = async (to, title, bodyHtml, options = {}) => {
  const user = process.env.EMAIL_USER || '231fa04e29@gmail.com';
  const pass = process.env.EMAIL_PASS;
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '465', 10);
  const secure = process.env.EMAIL_SECURE ? (process.env.EMAIL_SECURE === 'true') : (port === 465);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  const mailOptions = {
    from: `"${BRAND_NAME} Support" <${user}>`,
    to,
    subject: title,
    text: bodyHtml.replace(/<[^>]*>/g, ''), // Strip tags for plain text fallback
    html: options.rawHtml ? bodyHtml : createEmailContainer(title, bodyHtml)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Success] Notification "${title}" sent to ${to}. MsgID: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`[Email Failed] Failed to send "${title}" to ${to}. Error: ${err.message}`);
    // If SMTP fails, log the fallback contents for testing
    console.log(`--- SMTP FALLBACK LOG (${to}) ---`);
    console.log(`Subject: ${title}`);
    console.log(`Body Snippet: ${bodyHtml.substring(0, 300)}...`);
    console.log(`---------------------------------`);
    return false;
  }
};

const sendComplaintCreatedEmail = async (userEmail, userName, complaint) => {
  const title = "Complaint Registered Successfully";
  const bodyHtml = `
    <p style="margin-top: 0;">Hello <strong>${userName}</strong>,</p>
    <p>Your complaint has been successfully registered in the system. Our team will review the issue and route it to the appropriate maintenance staff shortly.</p>
    
    <div style="background-color: #111827; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h4 style="color: #B6FF5C; font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 12px 0;">Complaint Details</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 35%; color: #94a3b8;">Complaint ID:</td>
          <td style="padding: 6px 0; color: #B6FF5C; font-family: monospace; font-weight: bold;">${complaint.id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Title:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${complaint.title}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Category:</td>
          <td style="padding: 6px 0;">${complaint.category}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Priority:</td>
          <td style="padding: 6px 0;">${complaint.priority}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Location:</td>
          <td style="padding: 6px 0;">${complaint.location}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Status:</td>
          <td style="padding: 6px 0;"><span style="background-color: #eab308; color: #000000; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">${complaint.status}</span></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Date & Time:</td>
          <td style="padding: 6px 0;">${new Date(complaint.createdAt).toLocaleString()}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin-bottom: 0;">You can track the progress of your ticket on the student dashboard.</p>
  `;
  await sendEmail(userEmail, title, bodyHtml);
};

const sendStaffAssignedEmail = async (staffEmail, staffName, ownerEmail, ownerName, complaint) => {
  const dateStr = new Date().toLocaleString();
  
  // Email to staff
  const staffTitle = "New Job Dispatched";
  const staffBody = `
    <p style="margin-top: 0;">Hello <strong>${staffName}</strong>,</p>
    <p>You have been assigned to address a new maintenance complaint. Please review the details below and proceed with the repair work.</p>
    
    <div style="background-color: #111827; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h4 style="color: #B6FF5C; font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 12px 0;">Job Details</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 35%; color: #94a3b8;">Complaint ID:</td>
          <td style="padding: 6px 0; color: #B6FF5C; font-family: monospace; font-weight: bold;">${complaint.id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Title:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${complaint.title}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Description:</td>
          <td style="padding: 6px 0;">${complaint.description}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Location:</td>
          <td style="padding: 6px 0; color: #ffffff;">${complaint.location}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Assignment Date:</td>
          <td style="padding: 6px 0;">${dateStr}</td>
        </tr>
      </table>
    </div>
  `;
  await sendEmail(staffEmail, staffTitle, staffBody);

  // Email to complaint owner
  const ownerTitle = "Staff Assigned to Complaint";
  const ownerBody = `
    <p style="margin-top: 0;">Hello <strong>${ownerName}</strong>,</p>
    <p>A maintenance technician has been assigned to address your registered complaint.</p>
    
    <div style="background-color: #111827; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h4 style="color: #B6FF5C; font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 12px 0;">Assignment Info</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 35%; color: #94a3b8;">Complaint ID:</td>
          <td style="padding: 6px 0; color: #B6FF5C; font-family: monospace; font-weight: bold;">${complaint.id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Complaint Title:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${complaint.title}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Assigned Staff:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${staffName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Assignment Date:</td>
          <td style="padding: 6px 0;">${dateStr}</td>
        </tr>
      </table>
    </div>
  `;
  await sendEmail(ownerEmail, ownerTitle, ownerBody);
};

const sendWorkCompletedEmail = async (ownerEmail, ownerName, staffName, complaint) => {
  const dateStr = new Date().toLocaleString();
  
  // Format images links
  let imagesHtml = '';
  const images = complaint.resolutionProofImages || complaint.completionImages || [];
  if (images && images.length > 0) {
    imagesHtml = `
      <tr>
        <td style="padding: 6px 0; font-weight: bold; color: #94a3b8; vertical-align: top;">Proof of Work:</td>
        <td style="padding: 6px 0;">
          <div style="margin-top: 4px;">
            ${images.map((img, idx) => `<a href="${img}" target="_blank" style="color: #B6FF5C; text-decoration: underline; font-weight: bold; margin-right: 15px;">Photo ${idx + 1}</a>`).join('')}
          </div>
        </td>
      </tr>
    `;
  }

  const title = "Work Completed on Complaint";
  const bodyHtml = `
    <p style="margin-top: 0;">Hello <strong>${ownerName}</strong>,</p>
    <p>The assigned staff member has marked your complaint as completed. Please review the details and confirm the resolution on the portal dashboard.</p>
    
    <div style="background-color: #111827; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h4 style="color: #B6FF5C; font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 12px 0;">Completion Summary</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 35%; color: #94a3b8;">Complaint ID:</td>
          <td style="padding: 6px 0; color: #B6FF5C; font-family: monospace; font-weight: bold;">${complaint.id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Staff Name:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${staffName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8; vertical-align: top;">Completion Notes:</td>
          <td style="padding: 6px 0; color: #ffffff; line-height: 1.4;">${complaint.completionNotes || complaint.resolutionRemarks || 'Work completed successfully.'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Completion Date:</td>
          <td style="padding: 6px 0;">${dateStr}</td>
        </tr>
        ${imagesHtml}
      </table>
    </div>
  `;
  await sendEmail(ownerEmail, title, bodyHtml);
};

const sendComplaintClosedEmail = async (ownerEmail, ownerName, staffEmail, staffName, complaint) => {
  const dateStr = new Date().toLocaleString();
  
  const title = "Complaint Resolution Verified & Closed";
  const bodyHtml = `
    <p style="margin-top: 0;">Hello,</p>
    <p>This email is to notify you that the complaint has been officially verified by the administrator and is now closed.</p>
    
    <div style="background-color: #111827; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h4 style="color: #B6FF5C; font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 12px 0;">Ticket Resolution Status</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 35%; color: #94a3b8;">Complaint ID:</td>
          <td style="padding: 6px 0; color: #B6FF5C; font-family: monospace; font-weight: bold;">${complaint.id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Complaint Title:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${complaint.title}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Verification Date:</td>
          <td style="padding: 6px 0;">${dateStr}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Final Status:</td>
          <td style="padding: 6px 0;"><span style="background-color: #22c55e; color: #000000; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">Closed</span></td>
        </tr>
      </table>
    </div>
  `;
  
  await sendEmail(ownerEmail, title, bodyHtml);
  if (staffEmail) {
    await sendEmail(staffEmail, title, bodyHtml);
  }
};

const sendPasswordResetOTPEmail = async (toEmail, userName, otp, expiresInMinutes = 10) => {
  const title = `${BRAND_NAME} - Password Reset Verification`;
  const safeName = escapeHtml(userName || 'there');
  const currentYear = new Date().getFullYear();
  const expiryText = `${expiresInMinutes} minutes`;

  const bodyHtml = `
    <div style="background:#0b0f19; padding:0; margin:0; width:100%; min-width:100%; font-family: Arial, Helvetica, sans-serif;">
      <div style="max-width:640px; margin:0 auto; padding:24px 16px;">
        <div style="background: linear-gradient(180deg, #101826 0%, #0b0f19 100%); border:1px solid #1f2a3d; border-radius:20px; overflow:hidden; box-shadow:0 18px 60px rgba(0,0,0,.35);">
          ${getBrandHeaderHtml()}

          <div style="padding:28px;">
            <div style="display:block; text-align:left; color:#d7e0ee; font-size:15px; line-height:1.7;">
              <p style="margin:0 0 16px;">Hello ${safeName},</p>
              <p style="margin:0 0 16px;">We received a request to reset the password for your ${BRAND_NAME} account.</p>
              <p style="margin:0 0 18px;">To continue, please use the verification code below:</p>
            </div>

            <div style="text-align:center; margin:22px 0 18px;">
              <div style="display:inline-block; background:#111827; border:1px solid #2a3750; border-radius:18px; padding:18px 22px; min-width:280px;">
                <div style="color:#94a3b8; font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; margin-bottom:14px;">Verification Code</div>
                <div style="font-size:34px; line-height:1; font-weight:900; color:#B6FF5C; letter-spacing:.28em; font-family:'Courier New', Courier, monospace; text-indent:.28em;">${otp}</div>
              </div>
            </div>

            <div style="text-align:center; margin:0 0 22px;">
              <span style="display:inline-flex; align-items:center; gap:8px; padding:8px 14px; border-radius:999px; background:rgba(182,255,92,.12); color:#B6FF5C; border:1px solid rgba(182,255,92,.22); font-size:12px; font-weight:700;">
                <span style="display:inline-block; width:8px; height:8px; border-radius:999px; background:#B6FF5C;"></span>
                Expires in ${expiryText}
              </span>
            </div>

            <div style="border:1px solid #1f2a3d; border-radius:16px; overflow:hidden; background:#0f1726;">
              <div style="padding:18px 18px 14px; border-bottom:1px solid #1f2a3d;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse;">
                  <tr>
                    <td style="vertical-align:top; width:33.33%; padding-right:10px; text-align:center;">
                      <div style="width:44px; height:44px; margin:0 auto 10px; border-radius:14px; background:rgba(182,255,92,.12); border:1px solid rgba(182,255,92,.2); color:#B6FF5C; font-size:22px; line-height:44px;">&#128100;</div>
                      <div style="color:#e5edf8; font-size:12px; font-weight:700;">Your Account</div>
                    </td>
                    <td style="vertical-align:top; width:33.33%; padding:0 10px; text-align:center;">
                      <div style="width:44px; height:44px; margin:0 auto 10px; border-radius:14px; background:rgba(182,255,92,.12); border:1px solid rgba(182,255,92,.2); color:#B6FF5C; font-size:22px; line-height:44px;">&#128737;</div>
                      <div style="color:#e5edf8; font-size:12px; font-weight:700;">Secure Reset</div>
                    </td>
                    <td style="vertical-align:top; width:33.33%; padding-left:10px; text-align:center;">
                      <div style="width:44px; height:44px; margin:0 auto 10px; border-radius:14px; background:rgba(182,255,92,.12); border:1px solid rgba(182,255,92,.2); color:#B6FF5C; font-size:22px; line-height:44px;">&#128273;</div>
                      <div style="color:#e5edf8; font-size:12px; font-weight:700;">OTP Verified</div>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="padding:18px 18px 10px; color:#d7e0ee; font-size:14px; line-height:1.7;">
                <p style="margin:0 0 10px;">This code is valid for 10 minutes.</p>
                <p style="margin:0 0 10px;">If you did not request a password reset, please ignore this email. Your account remains secure and no changes will be made.</p>
                <div style="margin-top:14px; padding:14px 16px; border-radius:14px; background:rgba(182,255,92,.08); border:1px solid rgba(182,255,92,.18); color:#cfe7b2; font-size:13px; line-height:1.6;">
                  <strong style="color:#B6FF5C;">For security reasons:</strong>
                  <ul style="margin:10px 0 0 18px; padding:0;">
                    <li style="margin:0 0 6px;">Never share this code with anyone.</li>
                    <li style="margin:0 0 6px;">Our team will never ask for your OTP.</li>
                    <li style="margin:0;">The code will expire automatically after ${expiryText}.</li>
                  </ul>
                </div>
                <p style="margin:16px 0 0;">Thank you,<br/>${BRAND_NAME} Team</p>
              </div>
            </div>

            <div style="padding:22px 0 0; text-align:center; color:#94a3b8; font-size:12px; line-height:1.7;">
              <div style="margin-bottom:10px; color:#e5edf8; font-weight:700;">Need help?</div>
              <div style="margin-bottom:18px;">Contact System Administrator</div>
              <div style="font-weight:700; color:#cbd5e1;">${BRAND_NAME}</div>
              <div>&copy; ${currentYear} All Rights Reserved</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  await sendEmail(toEmail, title, bodyHtml, { rawHtml: true });
};

const sendStaffApprovalEmail = async (staffEmail, staffName) => {
  const title = `${BRAND_NAME} - Staff Account Approved`;
  const bodyHtml = `
    <p style="margin-top: 0;">Hello <strong>${staffName}</strong>,</p>
    <p>Congratulations! Your staff registration request has been approved by the administrator.</p>
    <p>You can now log into the ${BRAND_NAME} staff dashboard and start receiving repair assignments.</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="background-color: #B6FF5C; color: #0b0f19; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 8px; font-size: 14px; display: inline-block;">Log In Now</a>
    </div>
  `;
  await sendEmail(staffEmail, title, bodyHtml);
};

const sendStaffRejectionEmail = async (staffEmail, staffName) => {
  const title = "Staff Account Registration Status";
  const bodyHtml = `
    <p style="margin-top: 0;">Hello <strong>${staffName}</strong>,</p>
    <p>We regret to inform you that your staff registration request has been rejected by the administrator.</p>
    <p>If you believe this was an error, please contact the system administrator or submit a new registration with correct credentials.</p>
  `;
  await sendEmail(staffEmail, title, bodyHtml);
};

const sendWelcomeEmail = async (userEmail, userName, role) => {
  const title = `Welcome to ${BRAND_NAME}!`;
  const roleName = role === 'STAFF' ? 'Maintenance Staff Member' : 'Student/User';
  
  const additionalText = role === 'STAFF' 
    ? '<p>Please note that your staff account is currently awaiting admin verification and approval. You will receive another email as soon as your account is approved.</p>'
    : '<p>You can now log in and raise complaints, track details, and chat with resolving technicians directly.</p>';

  const bodyHtml = `
    <p style="margin-top: 0;">Hello <strong>${userName}</strong>,</p>
    <p>Thank you for registering on the <strong>${BRAND_NAME}</strong>. Your account has been created successfully as a <strong>${roleName}</strong>.</p>
    ${additionalText}
    <div style="text-align: center; margin: 25px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="background-color: #B6FF5C; color: #0b0f19; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 8px; font-size: 14px; display: inline-block;">Access Dashboard</a>
    </div>
  `;
  await sendEmail(userEmail, title, bodyHtml);
};

const sendEscalationAdminEmail = async (adminEmail, complaint) => {
  const title = "⚠️ Urgent: Complaint Escalated to Admin";
  const ageInHours = Math.round((Date.now() - new Date(complaint.createdAt)) / (1000 * 60 * 60));
  const ageDays = (ageInHours / 24).toFixed(1);
  const ageStr = `${ageInHours} hours (~${ageDays} days)`;

  const bodyHtml = `
    <p style="margin-top: 0;">Hello Admin,</p>
    <p>An unresolved complaint has crossed the SLA response threshold and has been <strong>escalated</strong> to the administration for review and intervention.</p>
    
    <div style="background-color: #111827; border: 1px solid #ef4444; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h4 style="color: #ef4444; font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 12px 0;">Escalation Details</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 35%; color: #94a3b8;">Complaint ID:</td>
          <td style="padding: 6px 0; color: #ef4444; font-family: monospace; font-weight: bold;">${complaint.id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Title:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${complaint.title}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Category:</td>
          <td style="padding: 6px 0;">${complaint.category}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Priority:</td>
          <td style="padding: 6px 0;">${complaint.priority}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Location:</td>
          <td style="padding: 6px 0;">${complaint.location}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Current Status:</td>
          <td style="padding: 6px 0;"><span style="background-color: #ef4444; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">${complaint.status}</span></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Unresolved For:</td>
          <td style="padding: 6px 0; color: #ef4444; font-weight: bold;">${ageStr}</td>
        </tr>
      </table>
    </div>
    
    <p>Please log in to the admin portal to reassign or resolve this issue immediately.</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/complaints" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 8px; font-size: 14px; display: inline-block;">View Complaints</a>
    </div>
  `;
  await sendEmail(adminEmail, title, bodyHtml);
};

const sendAutoAssignmentStudentEmail = async (studentEmail, studentName, complaint) => {
  const title = "Your complaint has been automatically assigned";
  const staffName = complaint.assignedStaff?.name || 'Awaiting assignment';
  const bodyHtml = `
    <p style="margin-top: 0;">Hello <strong>${studentName}</strong>,</p>
    <p>Good news! Your complaint has been automatically assigned to a resolver technician.</p>
    
    <div style="background-color: #111827; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h4 style="color: #B6FF5C; font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 12px 0;">Assignment Details</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 35%; color: #94a3b8;">Complaint ID:</td>
          <td style="padding: 6px 0; color: #B6FF5C; font-family: monospace; font-weight: bold;">${complaint.id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Assigned Staff:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${staffName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Category:</td>
          <td style="padding: 6px 0;">${complaint.category}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Assignment Method:</td>
          <td style="padding: 6px 0;"><span style="background-color: #22c55e; color: #000000; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">AUTO</span></td>
        </tr>
      </table>
    </div>
    
    <p style="margin-bottom: 0;">You can follow updates on this complaint from your student dashboard.</p>
  `;
  await sendEmail(studentEmail, title, bodyHtml);
};

const sendAutoAssignmentStaffEmail = async (staffEmail, staffName, complaint) => {
  const title = "New complaint assigned automatically";
  const bodyHtml = `
    <p style="margin-top: 0;">Hello <strong>${staffName}</strong>,</p>
    <p>A new maintenance complaint has been automatically assigned to you based on your workload availability.</p>
    
    <div style="background-color: #111827; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h4 style="color: #B6FF5C; font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 12px 0;">Complaint Details</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 35%; color: #94a3b8;">Complaint Title:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${complaint.title}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Priority:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${complaint.priority}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Category:</td>
          <td style="padding: 6px 0;">${complaint.category}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Location:</td>
          <td style="padding: 6px 0; color: #ffffff;">${complaint.location}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin-bottom: 0;">Please log into the staff dashboard to start work on this assignment.</p>
  `;
  await sendEmail(staffEmail, title, bodyHtml);
};

const sendNoStaffAvailableAdminEmail = async (adminEmail, complaint) => {
  const title = "⚠️ Alert: No Verified Staff Available for Complaint";
  const bodyHtml = `
    <p style="margin-top: 0;">Hello Admin,</p>
    <p>A new complaint was submitted, but <strong>no verified active staff members</strong> were found in the category <strong>"${complaint.category}"</strong>.</p>
    <p>The ticket is currently in <strong>"Waiting For Staff"</strong> status. Please verify staff accounts in this category or manually override this assignment.</p>
    
    <div style="background-color: #111827; border: 1px solid #eab308; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h4 style="color: #eab308; font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 12px 0;">Complaint Details</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 35%; color: #94a3b8;">Complaint ID:</td>
          <td style="padding: 6px 0; color: #eab308; font-family: monospace; font-weight: bold;">${complaint.id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Title:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${complaint.title}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Category:</td>
          <td style="padding: 6px 0;">${complaint.category}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Priority:</td>
          <td style="padding: 6px 0;">${complaint.priority}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Location:</td>
          <td style="padding: 6px 0;">${complaint.location}</td>
        </tr>
      </table>
    </div>
  `;
  await sendEmail(adminEmail, title, bodyHtml);
};

const sendStudentEscalationAdminEmail = async (adminEmail, complaint) => {
  const title = "Complaint Escalated by Student";
  const bodyHtml = `
    <p style="margin-top: 0;">Hello Admin,</p>
    <p>Student is not satisfied with the resolution and has escalated the complaint.</p>
    
    <div style="background-color: #111827; border: 1px solid #ef4444; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h4 style="color: #ef4444; font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 12px 0;">Escalation details</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 35%; color: #94a3b8;">Complaint ID:</td>
          <td style="padding: 6px 0; color: #ef4444; font-family: monospace; font-weight: bold;">${complaint.id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Title:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${complaint.title}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Category:</td>
          <td style="padding: 6px 0;">${complaint.category}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Priority:</td>
          <td style="padding: 6px 0;">${complaint.priority}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Escalation Reason:</td>
          <td style="padding: 6px 0; color: #ffffff;">${complaint.escalationReason || 'Student is not satisfied with the resolution.'}</td>
        </tr>
      </table>
    </div>
  `;
  await sendEmail(adminEmail, title, bodyHtml);
};

const sendStudentEscalationStaffEmail = async (staffEmail, staffName, complaint) => {
  const title = "Complaint Reopened by Student";
  const bodyHtml = `
    <p style="margin-top: 0;">Hello <strong>${staffName}</strong>,</p>
    <p>The student is not satisfied with your resolution of complaint <strong>${complaint.id}</strong>. The complaint has been escalated and reopened for administrative review.</p>
    
    <div style="background-color: #111827; border: 1px solid #eab308; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h4 style="color: #eab308; font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 12px 0;">Complaint Details</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 35%; color: #94a3b8;">Complaint ID:</td>
          <td style="padding: 6px 0; color: #B6FF5C; font-family: monospace; font-weight: bold;">${complaint.id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Title:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${complaint.title}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #94a3b8;">Escalation Reason:</td>
          <td style="padding: 6px 0; color: #ffffff;">${complaint.escalationReason || 'Student is not satisfied with the resolution.'}</td>
        </tr>
      </table>
    </div>
  `;
  await sendEmail(staffEmail, title, bodyHtml);
};

const sendAccountVerificationEmail = async (userEmail, userName, otp) => {
  const title = "Verify Your CampusCare Account";
  const bodyHtml = `
    <p style="margin-top: 0;">Hello <strong>${userName}</strong>,</p>
    <p>Welcome to CampusCare.</p>
    <p>Use the verification code below to activate your account:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <span style="display: inline-block; background-color: #111827; border: 1.5px solid #B6FF5C; border-radius: 12px; padding: 12px 30px; font-size: 32px; font-weight: 800; color: #B6FF5C; letter-spacing: 10px; font-family: monospace;">${otp}</span>
    </div>
    
    <p>This OTP expires in <strong>10 minutes</strong>.</p>
    <p style="font-size: 13px; color: #64748b; margin-top: 25px; border-top: 1px solid #1e293b; padding-top: 15px;">If you did not create this account, please ignore this email.</p>
    <p>CampusCare Support</p>
  `;
  await sendEmail(userEmail, title, bodyHtml);
};

module.exports = {
  sendAccountVerificationEmail,
  sendComplaintCreatedEmail,
  sendStaffAssignedEmail,
  sendWorkCompletedEmail,
  sendComplaintClosedEmail,
  sendStaffApprovalEmail,
  sendStaffRejectionEmail,
  sendWelcomeEmail,
  sendPasswordResetOTPEmail,
  sendEscalationAdminEmail,
  sendAutoAssignmentStudentEmail,
  sendAutoAssignmentStaffEmail,
  sendNoStaffAvailableAdminEmail,
  sendStudentEscalationAdminEmail,
  sendStudentEscalationStaffEmail
};
