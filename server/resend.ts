import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  // First, try to use direct RESEND_API_KEY (for Vercel and other platforms)
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your-resend-api-key') {
    // Use a default from email if RESEND_FROM_EMAIL is not set
    // Resend requires a verified domain, so you may need to set this
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev';
    
    if (!process.env.RESEND_FROM_EMAIL) {
      console.warn('⚠️ RESEND_FROM_EMAIL not set. Using default "noreply@resend.dev". For production, set RESEND_FROM_EMAIL to a verified domain.');
    }
    
    return {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: fromEmail
    };
  }

  // Fall back to Replit connectors (for Replit platform)
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    const errorMsg = 'RESEND_API_KEY not set and X_REPLIT_TOKEN not found. Please set RESEND_API_KEY environment variable.';
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    const errorMsg = 'Resend connector not properly configured. Please check your Replit connector settings.';
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }
  
  const apiKey = connectionSettings.settings.api_key;
  const fromEmail = connectionSettings.settings.from_email || 'noreply@resend.dev';
  
  if (!fromEmail || fromEmail === 'noreply@resend.dev') {
    console.warn('⚠️ Using default Resend email address. Consider configuring a verified domain in your Resend connector.');
  }
  
  return {apiKey, fromEmail};
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: credentials.fromEmail
  };
}
