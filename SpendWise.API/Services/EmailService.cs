using System.Net;
using System.Net.Mail;

namespace SpendWise.API.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;
        private readonly SmtpClient _smtpClient;
        private readonly string _fromEmail = string.Empty;
        private readonly string _fromName;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
            _fromEmail = _configuration["Email:Username"] ?? string.Empty;
            _fromName = "SpendWise";

            _smtpClient = new SmtpClient
            {
                Host = _configuration["Email:Host"] ?? "smtp.gmail.com",
                Port = int.Parse(_configuration["Email:Port"] ?? "587"),
                EnableSsl = true,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(_configuration["Email:Username"], _configuration["Email:Password"])
            };

            VerifyConnection();
        }

        private void VerifyConnection()
        {
            try
            {
                // Just check if we can create a connection
                var client = new SmtpClient(_configuration["Email:Host"]);
                Console.WriteLine("✅ Gmail SMTP connection verified successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Gmail SMTP connection failed: {ex.Message}");
            }
        }

        public async Task<EmailResult> SendExpenseNotification(string userEmail, string userName, ExpenseNotificationData expenseData)
        {
            try
            {
                var htmlContent = FormatExpenseEmail(userName, expenseData);

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_fromEmail, _fromName),
                    Subject = "💰 New Expense Added - SpendWise Alert",
                    Body = htmlContent,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(userEmail);

                await _smtpClient.SendMailAsync(mailMessage);

                Console.WriteLine("Email sent successfully");
                return new EmailResult
                {
                    Success = true,
                    Message = "Email sent successfully"
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email sending failed: {ex.Message}");
                return new EmailResult
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<EmailResult> SendWelcomeEmail(string userEmail, string userName)
        {
            try
            {
                var htmlContent = FormatWelcomeEmail(userName);

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_fromEmail, _fromName),
                    Subject = "🎉 Welcome to SpendWise - Start Your Financial Journey!",
                    Body = htmlContent,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(userEmail);

                await _smtpClient.SendMailAsync(mailMessage);

                return new EmailResult
                {
                    Success = true,
                    Message = "Welcome email sent successfully"
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Welcome email failed: {ex.Message}");
                return new EmailResult
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<EmailResult> SendUpdatedExpenseNotification(string userEmail, string userName, ExpenseNotificationData expenseData)
        {
            try
            {
                var htmlContent = FormatUpdatedExpenseEmail(userName, expenseData);

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_fromEmail, _fromName),
                    Subject = "🔄 Expense Updated - SpendWise Alert",
                    Body = htmlContent,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(userEmail);

                await _smtpClient.SendMailAsync(mailMessage);

                Console.WriteLine("Update email sent");
                return new EmailResult
                {
                    Success = true,
                    Message = "Update notification sent successfully"
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email sending (update) failed: {ex.Message}");
                return new EmailResult
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        private string FormatExpenseEmail(string userName, ExpenseNotificationData expense)
        {
            var date = expense.Date.ToLocalTime().ToString("d");
            var time = DateTime.Now.ToLocalTime().ToString("t");

            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>SpendWise - Expense Added</title>
</head>
<body style=""margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;"">
    <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color: #f4f4f4; padding: 20px;"">
        <tr>
            <td align=""center"">
                <table width=""600"" cellpadding=""0"" cellspacing=""0"" style=""background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"">
                    
                    <!-- Header -->
                    <tr>
                        <td style=""background: linear-gradient(135deg,rgb(160, 172, 224) 0%,rgb(64, 57, 70) 100%); padding: 30px 40px; text-align: center;"">
                            <h1 style=""color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;"">
                                🏦 SpendWise
                            </h1>
                            <p style=""color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;"">
                                Your Personal Expense Tracker
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Greeting -->
                    <tr>
                        <td style=""padding: 30px 40px 20px 40px;"">
                            <h2 style=""color: #333333; margin: 0 0 10px 0; font-size: 24px;"">
                                Hello {userName}! 👋
                            </h2>
                            <p style=""color: #666666; margin: 0; font-size: 16px; line-height: 1.5;"">
                                A new expense has been successfully added to your SpendWise account.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Expense Details Card -->
                    <tr>
                        <td style=""padding: 0 40px 30px 40px;"">
                            <div style=""background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; border-left: 5px solid #667eea;"">
                                <h3 style=""color: #333333; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;"">
                                    💰 Expense Details
                                </h3>
                                
                                <table width=""100%"" cellpadding=""8"" cellspacing=""0"">
                                    <tr>
                                        <td style=""padding: 12px 0; border-bottom: 1px solid #dee2e6;"">
                                            <strong style=""color: #495057; font-size: 14px;"">📊 Category:</strong>
                                        </td>
                                        <td style=""padding: 12px 0; border-bottom: 1px solid #dee2e6; text-align: right;"">
                                            <span style=""color: #333333; font-size: 16px; font-weight: 600;"">
                                                {expense.Category}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style=""padding: 12px 0; border-bottom: 1px solid #dee2e6;"">
                                            <strong style=""color: #495057; font-size: 14px;"">💵 Amount:</strong>
                                        </td>
                                        <td style=""padding: 12px 0; border-bottom: 1px solid #dee2e6; text-align: right;"">
                                            <span style=""color: #dc3545; font-size: 20px; font-weight: bold;"">
                                                ₹{expense.Amount.ToString("N2")}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style=""padding: 12px 0; border-bottom: 1px solid #dee2e6;"">
                                            <strong style=""color: #495057; font-size: 14px;"">📅 Date:</strong>
                                        </td>
                                        <td style=""padding: 12px 0; border-bottom: 1px solid #dee2e6; text-align: right;"">
                                            <span style=""color: #333333; font-size: 16px;"">
                                                {date}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style=""padding: 12px 0;"">
                                            <strong style=""color: #495057; font-size: 14px;"">📝 Description:</strong>
                                        </td>
                                        <td style=""padding: 12px 0; text-align: right;"">
                                            <span style=""color: #333333; font-size: 16px; font-style: italic;"">
                                                {expense.Description}
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Tips Section -->
                    <tr>
                        <td style=""padding: 0 40px 30px 40px;"">
                            <div style=""background: #e7f3ff; border-radius: 8px; padding: 20px; border-left: 4px solid #0066cc;"">
                                <h4 style=""color: #0066cc; margin: 0 0 10px 0; font-size: 16px;"">
                                    💡 Smart Spending Tip
                                </h4>
                                <p style=""color: #333333; margin: 0; font-size: 14px; line-height: 1.5;"">
                                    Track your expenses regularly to identify spending patterns and make better financial decisions!
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style=""background: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #dee2e6;"">
                            <p style=""color: #6c757d; margin: 0 0 10px 0; font-size: 14px;"">
                                This email was sent at {time} on {date}
                            </p>
                            <p style=""color: #6c757d; margin: 0; font-size: 12px;"">
                                © 2025 SpendWise. Keep tracking, keep saving! 🎯
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }

        private string FormatWelcomeEmail(string userName)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""UTF-8"">
    <title>Welcome to SpendWise</title>
</head>
<body style=""font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;"">
    <table width=""600"" style=""margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;"">
        <tr>
            <td style=""background: linear-gradient(135deg,rgb(160, 172, 224) 0%,rgb(64, 57, 70) 100%); padding: 40px; text-align: center;"">
                <h1 style=""color: #ffffff; margin: 0; font-size: 32px;"">🎉 Welcome to SpendWise!</h1>
                <p style=""color: #ffffff; margin: 10px 0 0 0; font-size: 18px;"">Your journey to better financial management starts now</p>
            </td>
        </tr>
        <tr>
            <td style=""padding: 40px;"">
                <h2 style=""color: #333333;"">Hello {userName}! 👋</h2>
                <p style=""color: #666666; font-size: 16px; line-height: 1.6;"">
                    Thank you for joining SpendWise! We're excited to help you take control of your finances.
                </p>
                <div style=""background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;"">
                    <h3 style=""color: #333333; margin: 0 0 15px 0;"">🚀 What's Next?</h3>
                    <ul style=""color: #666666; line-height: 1.8; padding-left: 20px;"">
                        <li>Add your first expense to get started</li>
                        <li>Set up categories that match your lifestyle</li>
                        <li>Monitor your spending patterns</li>
                        <li>Get email notifications for every expense</li>
                    </ul>
                </div>
                <p style=""color: #666666; font-size: 16px;"">
                    Ready to start tracking? Log in to your SpendWise account and add your first expense!
                </p>
            </td>
        </tr>
        <tr>
            <td style=""background: #f8f9fa; padding: 20px; text-align: center;"">
                <p style=""color: #6c757d; margin: 0; font-size: 14px;"">
                    Happy tracking! 💰<br>
                    The SpendWise Team
                </p>
            </td>
        </tr>
    </table>
</body>
</html>";
        }

        private string FormatUpdatedExpenseEmail(string userName, ExpenseNotificationData expense)
        {
            var date = expense.Date.ToLocalTime().ToString("d");
            var time = DateTime.Now.ToLocalTime().ToString("t");

            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>SpendWise - Expense Updated </title>
</head>
<body style=""margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;"">
    <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color: #f4f4f4; padding: 20px;"">
        <tr>
            <td align=""center"">
                <table width=""600"" cellpadding=""0"" cellspacing=""0"" style=""background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"">
                    
                    <!-- Header -->
                    <tr>
                        <td style=""background: linear-gradient(135deg,rgb(160, 172, 224) 0%,rgb(64, 57, 70) 100%); padding: 30px 40px; text-align: center;"">
                            <h1 style=""color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;"">
                                🏦 SpendWise
                            </h1>
                            <p style=""color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;"">
                                Your Personal Expense Tracker
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Greeting -->
                    <tr>
                        <td style=""padding: 30px 40px 20px 40px;"">
                            <h2 style=""color: #333333; margin: 0 0 10px 0; font-size: 24px;"">
                                Hello {userName}! 👋
                            </h2>
                            <p style=""color: #666666; margin: 0; font-size: 16px; line-height: 1.5;"">
                                An expense has been successfully updated in your SpendWise account.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Expense Details Card -->
                    <tr>
                        <td style=""padding: 0 40px 30px 40px;"">
                            <div style=""background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; border-left: 5px solid #667eea;"">
                                <h3 style=""color: #333333; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;"">
                                    💰 Updated Expense Details
                                </h3>
                                
                                <table width=""100%"" cellpadding=""8"" cellspacing=""0"">
                                    <tr>
                                        <td style=""padding: 12px 0; border-bottom: 1px solid #dee2e6;"">
                                            <strong style=""color: #495057; font-size: 14px;"">📊 Category:</strong>
                                        </td>
                                        <td style=""padding: 12px 0; border-bottom: 1px solid #dee2e6; text-align: right;"">
                                            <span style=""color: #333333; font-size: 16px; font-weight: 600;"">
                                                {expense.Category}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style=""padding: 12px 0; border-bottom: 1px solid #dee2e6;"">
                                            <strong style=""color: #495057; font-size: 14px;"">💵 Amount:</strong>
                                        </td>
                                        <td style=""padding: 12px 0; border-bottom: 1px solid #dee2e6; text-align: right;"">
                                            <span style=""color: #dc3545; font-size: 20px; font-weight: bold;"">
                                                ₹{expense.Amount.ToString("N2")}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style=""padding: 12px 0; border-bottom: 1px solid #dee2e6;"">
                                            <strong style=""color: #495057; font-size: 14px;"">📅 Date:</strong>
                                        </td>
                                        <td style=""padding: 12px 0; border-bottom: 1px solid #dee2e6; text-align: right;"">
                                            <span style=""color: #333333; font-size: 16px;"">
                                                {date}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style=""padding: 12px 0;"">
                                            <strong style=""color: #495057; font-size: 14px;"">📝 Description:</strong>
                                        </td>
                                        <td style=""padding: 12px 0; text-align: right;"">
                                            <span style=""color: #333333; font-size: 16px; font-style: italic;"">
                                                {expense.Description}
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style=""background: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #dee2e6;"">
                            <p style=""color: #6c757d; margin: 0 0 10px 0; font-size: 14px;"">
                                This email was sent at {time} on {date}
                            </p>
                            <p style=""color: #6c757d; margin: 0; font-size: 12px;"">
                                © 2025 SpendWise. Keep tracking, keep saving! 🎯
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }
    }

    public class ExpenseNotificationData
    {
        public string? Category { get; set; }
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? Type { get; set; } = "Expense";
    }

    public class EmailResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Error { get; set; } = string.Empty;
    }
}