"""
email_service.py
Sends transactional emails via the Resend API.
"""
import logging
import resend
from app.config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    """
    Send a password-reset link to the given email address.
    Returns True on success, False on failure (so the caller never crashes).
    """
    if not settings.RESEND_API_KEY:
        logger.error(
            "RESEND_API_KEY is not set. Cannot send password-reset email."
        )
        return False

    resend.api_key = settings.RESEND_API_KEY

    html_body = f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Elektra Password</title>
</head>
<body style="margin:0;padding:0;background:#0d0024;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0024;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="440" cellpadding="0" cellspacing="0"
               style="background:linear-gradient(135deg,#1a0040,#2a0060);border-radius:24px;
                      border:1px solid rgba(233,196,0,0.2);overflow:hidden;max-width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:36px 40px 20px;text-align:center;
                       background:linear-gradient(135deg,rgba(233,196,0,0.1),rgba(233,196,0,0.05));">
              <div style="font-size:48px;margin-bottom:8px;">&#9889;</div>
              <h1 style="margin:0;font-size:28px;font-weight:900;color:#e9c400;
                         letter-spacing:-1px;text-transform:uppercase;">ELEKTRA</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.5);font-size:12px;
                        letter-spacing:3px;text-transform:uppercase;">Password Reset</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;color:rgba(255,255,255,0.85);font-size:16px;line-height:1.6;">
                We received a request to reset your Elektra account password.
                Click the button below within <strong style="color:#e9c400;">15 minutes</strong> to set a new password.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="{reset_url}"
                       style="display:inline-block;padding:16px 40px;
                              background:linear-gradient(135deg,#e9c400,#ffd700);
                              color:#0d0024;font-weight:900;font-size:15px;
                              text-decoration:none;border-radius:16px;
                              letter-spacing:0.5px;text-transform:uppercase;">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:rgba(255,255,255,0.5);font-size:13px;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0;word-break:break-all;">
                <a href="{reset_url}"
                   style="color:#e9c400;font-size:12px;text-decoration:underline;">{reset_url}</a>
              </p>

              <div style="margin:28px 0 0;padding:20px;background:rgba(255,255,255,0.04);
                          border-radius:12px;border-left:3px solid rgba(233,196,0,0.4);">
                <p style="margin:0;color:rgba(255,255,255,0.45);font-size:12px;line-height:1.6;">
                  If you did not request a password reset, you can safely ignore this email.
                  Your password will not change.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;text-align:center;
                       border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;color:rgba(255,255,255,0.25);font-size:11px;
                        letter-spacing:1px;text-transform:uppercase;">
                &copy; 2026 Elektra &middot; Powered by Valiger Technologies
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    try:
        params: resend.Emails.SendParams = {
            "from": "Elektra <onboarding@resend.dev>",
            "to": [to_email],
            "subject": "Reset Your Elektra Password",
            "html": html_body,
        }
        resend.Emails.send(params)
        logger.info(f"Password reset email sent to {to_email}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send password reset email: {exc}")
        return False
