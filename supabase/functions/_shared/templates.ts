export const getWelcomeEmail = (name: string) => `
  <h1>Welcome to Canada Telugu Classifieds, ${name}!</h1>
  <p>Your account has been successfully created. We're excited to have you join our community.</p>
  <p><strong>Getting Started:</strong></p>
  <ul>
    <li>Post your first ad for free.</li>
    <li>Connect with the local Telugu community in Canada.</li>
    <li>Browse listings in Housing, Jobs, Events, and more.</li>
  </ul>
  <p><a href="https://canadateluguclassifieds.com/dashboard">Go to your Dashboard</a></p>
`;

export const getAccountBlockedEmail = (name: string, isBlocked: boolean, features: Record<string, boolean>) => {
  if (isBlocked) {
    return `
      <h1>Account Blocked</h1>
      <p>Hello ${name},</p>
      <p>Your account on Canada Telugu Classifieds has been blocked by an administrator.</p>
      <p><strong>Reason:</strong> Violation of our terms of service or posting guidelines.</p>
      <p>During this time, you will not be able to access your account or manage your listings.</p>
      <p>If you believe this is a mistake, please contact our support team.</p>
    `;
  } else {
    // Restricted features
    const restrictedList = Object.keys(features)
      .filter(key => features[key] === false)
      .map(key => `<li>${key.replace(/_/g, ' ')}</li>`)
      .join('');

    return `
      <h1>Account Restriction Notice</h1>
      <p>Hello ${name},</p>
      <p>Some features on your account have been restricted by an administrator.</p>
      <p><strong>Restricted Features:</strong></p>
      <ul>
        ${restrictedList || '<li>General restrictions applied</li>'}
      </ul>
      <p>You can still access other parts of the platform, but the above features are currently disabled for your account.</p>
      <p>Please contact support for more information.</p>
    `;
  }
};

export const getAccountUnblockedEmail = (name: string) => `
  <h1>Account Access Restored</h1>
  <p>Hello ${name},</p>
  <p>Great news! Your account access on Canada Telugu Classifieds has been fully restored.</p>
  <p>You can now log in and use all features of the platform as usual.</p>
  <p><a href="https://canadateluguclassifieds.com/login">Login to your Account</a></p>
`;

export const getAdApprovedEmail = (title: string, id: string) => `
  <h1>Your Ad is Live!</h1>
  <p>Good news! Your ad "<strong>${title}</strong>" has been approved and is now live on Canada Telugu Classifieds.</p>
  <p><a href="https://canadateluguclassifieds.com/product/${id}">View your Ad</a></p>
`;

export const getAdBlockedEmail = (title: string, reason: string) => `
  <h1>Action Required: Your Ad has been Blocked</h1>
  <p>Your ad "<strong>${title}</strong>" has been blocked by an administrator.</p>
  <p><strong>Reason:</strong> ${reason}</p>
  <p>Please review our posting guidelines and update your ad to comply.</p>
  <p><a href="https://canadateluguclassifieds.com/dashboard">Manage your Listings</a></p>
`;

export const getAdExpirationReminderEmail = (title: string, daysRemaining: number) => `
  <h1>Premium Boost Expiring Soon</h1>
  <p>Your premium boost for "<strong>${title}</strong>" will expire in <strong>${daysRemaining} day${daysRemaining === 1 ? '' : 's'}</strong>.</p>
  <p>To maintain your premium placement and reach more users, you can renew your boost from your dashboard.</p>
  <p><a href="https://canadateluguclassifieds.com/dashboard">Renew Premium Boost</a></p>
`;

export const getAdExpiredEmail = (title: string, _id: string) => `
  <h1>Premium Boost Expired</h1>
  <p>Your premium boost for "<strong>${title}</strong>" has expired.</p>
  <p>Your ad is still active, but it will no longer have premium placement. You can boost it again anytime to increase visibility.</p>
  <p><a href="https://canadateluguclassifieds.com/dashboard">Boost Ad Now</a></p>
`;

export const getInquiryEmail = (listingTitle: string, senderName: string, message: string) => `
  <h1>New Inquiry for "${listingTitle}"</h1>
  <p>You have received a new message from <strong>${senderName}</strong>:</p>
  <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; margin: 20px 0;">
    ${message}
  </blockquote>
  <p><a href="https://canadateluguclassifieds.com/messages">Reply to Inquiry</a></p>
`;

export const getPaymentConfirmationEmail = (orderId: string, amount: string, plan: string, metadata: Record<string, string | undefined> = {}) => {
  const listingFee = parseFloat(metadata.listingFee || '0');
  const websiteFee = parseFloat(metadata.websiteFee || '0');
  const professionalJobFee = parseFloat(metadata.professionalJobFee || '0');
  const hstAmount = parseFloat(metadata.hstAmount || '0');
  const totalAmount = parseFloat(amount.replace(/,/g, '') || '0');
  
  // Adjust for precision issues - totalAmount is inclusive of HST
  const subtotal = totalAmount - hstAmount;
  
  let invoiceRows = '';
  
  // 1. Plan Price (Base price check)
  const basePlanPrice = subtotal - listingFee - websiteFee - professionalJobFee;
  if (basePlanPrice > 0.01) {
    invoiceRows += `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${plan}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">$${basePlanPrice.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;
  }

  // 2. Listing Fee (only if not a professional job)
  if (listingFee > 0 && professionalJobFee === 0) {
    invoiceRows += `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">Standard Listing Fee</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">$${listingFee.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;
  }

  // 3. Website Link Fee
  if (websiteFee > 0) {
    invoiceRows += `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">Website Link Fee</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">$${websiteFee.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;
  }

  // 4. Professional Job Fee (Include listing fee if any)
  if (professionalJobFee > 0) {
    const combinedJobFee = professionalJobFee + listingFee;
    invoiceRows += `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">Professional Job Listing Fee</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">$${combinedJobFee.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;
  }

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; color: #000;">Payment Confirmation</h1>
        <p style="color: #666;">Order ID: ${orderId}</p>
      </div>

      <p>Hello,</p>
      <p>Thank you for your purchase. We've successfully processed your payment and boosted your ad listing.</p>

      <div style="margin: 30px 0;">
        <h3 style="border-bottom: 2px solid #333; padding-bottom: 10px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 10px 0; color: #666;">Description</th>
              <th style="text-align: right; padding: 10px 0; color: #666;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceRows}
            <tr>
              <td style="padding: 20px 0 5px 0; text-align: right;"><strong>Subtotal</strong></td>
              <td style="padding: 20px 0 5px 0; text-align: right;"><strong>$${subtotal.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
            </tr>
            <tr>
              <td style="padding: 5px 0; text-align: right; color: #666;">HST (13%)</td>
              <td style="padding: 5px 0; text-align: right; color: #666;">$${hstAmount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="padding: 15px 0; text-align: right; font-size: 18px;"><strong>Total Paid</strong></td>
              <td style="padding: 15px 0; text-align: right; font-size: 18px; color: #000;"><strong>$${totalAmount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin-top: 30px;">
        <p style="margin-top: 0;"><strong>What's Next?</strong></p>
        <p style="margin-bottom: 0;">Your listing has been boosted and is now featured on the homepage. You can manage your ads and view your orders from your dashboard.</p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://canadateluguclassifieds.com/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold;">Go to Dashboard</a>
      </div>

      <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
        <p>© 2026 Canada Telugu Classifieds. All rights reserved.</p>
      </div>
    </div>
  `;
};

export const getBoostActivatedEmail = (title: string, planLabel: string) => `
  <h1>Premium Boost Activated!</h1>
  <p>Good news! Your ad "<strong>${title}</strong>" has been boosted with the <strong>${planLabel}</strong> plan.</p>
  <p>Your listing will now have increased visibility and premium placement on our platform.</p>
  <p><a href="https://canadateluguclassifieds.com/dashboard">Manage your Listings</a></p>
`;
