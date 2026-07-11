interface SendSmsParams {
  to: string;
  message: string;
}

export async function sendSms({ to, message }: SendSmsParams) {
  console.log(`[SMS SENDING] to: ${to}`);
  console.log(`[SMS CONTENT]: ${message}`);
  
  // Since there is no real SMS gateway credentials configured, we output to console/logs.
  // This behaves as a successful mock delivery in dev.
  return { success: true, id: `mock-sms-id-${Math.random().toString(36).substr(2, 9)}` };
}
