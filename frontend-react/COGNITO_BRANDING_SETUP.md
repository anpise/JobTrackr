# Cognito Hosted UI Branding Setup

## Step 1: Access Cognito Console

1. Go to AWS Console → Cognito
2. Select your User Pool
3. Navigate to **App integration** tab
4. Scroll down to **Domain** section
5. If you don't have a domain, create one (e.g., `jobtrackr-auth.auth.us-east-1.amazoncognito.com`)

## Step 2: Customize the Hosted UI

1. In the same **App integration** tab
2. Scroll to **App clients** → Select your app client
3. Click **Edit** on the Hosted UI settings
4. Or go directly to **Branding** section in the left sidebar

## Step 3: Add Custom CSS

In the **Custom CSS** section, paste this code:

```css
/* JobTrackr Branding */
:root {
  --primary-color: #0066cc;
  --primary-hover: #0052a3;
  --background: #f5f7fa;
  --card-background: #ffffff;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
  --success-color: #10b981;
  --error-color: #ef4444;
}

/* Background */
body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
}

/* Main container */
.modal-content {
  border-radius: 16px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
  border: none !important;
  padding: 40px !important;
}

/* Logo area */
.logo-customizable {
  max-width: 200px !important;
  margin-bottom: 32px !important;
}

/* Banner/Header */
.banner-customizable {
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
}

/* Add branding header */
.modal-content::before {
  content: 'JobTrackr';
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: var(--primary-color);
  text-align: center;
  margin-bottom: 8px;
}

.modal-content::after {
  content: 'Track your job applications effortlessly';
  display: block;
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 32px;
}

/* Form labels */
.label-customizable {
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  font-size: 14px !important;
  margin-bottom: 8px !important;
}

/* Input fields */
.input-customizable,
.input-customizable:focus {
  border: 2px solid var(--border-color) !important;
  border-radius: 8px !important;
  padding: 12px 16px !important;
  font-size: 14px !important;
  transition: all 0.2s ease !important;
}

.input-customizable:focus {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1) !important;
  outline: none !important;
}

/* Submit button */
.submitButton-customizable,
.submitButton-customizable:hover {
  background: var(--primary-color) !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 12px 24px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  transition: all 0.2s ease !important;
  width: 100% !important;
  margin-top: 16px !important;
}

.submitButton-customizable:hover {
  background: var(--primary-hover) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3) !important;
}

/* Links */
.redirect-customizable,
.link-customizable {
  color: var(--primary-color) !important;
  text-decoration: none !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;
}

.redirect-customizable:hover,
.link-customizable:hover {
  color: var(--primary-hover) !important;
  text-decoration: underline !important;
}

/* Error messages */
.error-customizable {
  background-color: #fee2e2 !important;
  border: 1px solid var(--error-color) !important;
  color: #991b1b !important;
  border-radius: 8px !important;
  padding: 12px 16px !important;
  font-size: 14px !important;
  margin-bottom: 16px !important;
}

/* Social buttons (if using social login) */
.social-button {
  border: 2px solid var(--border-color) !important;
  border-radius: 8px !important;
  padding: 12px !important;
  margin-bottom: 12px !important;
  transition: all 0.2s ease !important;
}

.social-button:hover {
  border-color: var(--primary-color) !important;
  background-color: rgba(0, 102, 204, 0.05) !important;
}

/* Divider */
.hr-customizable {
  border-top: 1px solid var(--border-color) !important;
  margin: 24px 0 !important;
}

/* Text customization */
.textDescription-customizable {
  color: var(--text-secondary) !important;
  font-size: 14px !important;
  text-align: center !important;
  margin-top: 16px !important;
}

/* Footer */
.legalText-customizable {
  color: var(--text-secondary) !important;
  font-size: 12px !important;
  text-align: center !important;
  margin-top: 24px !important;
}
```

## Step 4: Upload Logo (Optional)

1. Create a logo image (recommended size: 200x60px or 400x120px)
2. In the Branding section, click **Choose file** under Logo
3. Upload your JobTrackr logo
4. The logo will appear at the top of the login page

## Step 5: Add Custom Image (Optional)

You can add a background image or hero image in the same Branding section.

## Step 6: Save Changes

Click **Save changes** at the bottom of the page.

## Step 7: Test Your Changes

Visit your Cognito hosted UI to see the changes:
```
https://your-domain.auth.us-east-1.amazoncognito.com/login?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:5173/callback
```

Or just run your app and it will redirect to the branded login page.

---

## Additional Customization Tips

### Add a Favicon
You can't directly add a favicon through Cognito, but you can use a custom domain with CloudFront to serve a favicon.

### Custom Domain
For a more professional look, set up a custom domain like `auth.jobtrackr.com`:
1. Go to **App integration** → **Domain**
2. Click **Create custom domain**
3. Follow the instructions to set up your custom domain
4. Update your `.env` file with the new domain

### Email Templates
Customize verification and password reset emails:
1. Go to **Messaging** → **Email**
2. Customize the templates with your branding
3. Add your logo and colors

---

## Preview

With this CSS, your login page will have:
- ✅ JobTrackr branding with title and tagline
- ✅ Modern gradient background (purple/blue)
- ✅ Clean white card with rounded corners
- ✅ Smooth hover effects
- ✅ Professional color scheme
- ✅ Better spacing and typography
- ✅ Accessible focus states

The page will look modern, professional, and match your dashboard design!
