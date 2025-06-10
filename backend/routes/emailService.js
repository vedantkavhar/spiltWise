const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        // Verify connection
        this.verifyConnection();
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Gmail SMTP connection verified successfully');
        } catch (error) {
            console.error('❌ Gmail SMTP connection failed:', error.message);
        }
    }

    async sendExpenseNotification(userEmail, userName, expenseData) {
        try {
            const htmlContent = this.formatExpenseEmail(userName, expenseData);

            const mailOptions = {
                from: {
                    name: 'SpendWise',
                    address: process.env.GMAIL_USER
                },
                to: userEmail,
                subject: '💰 New Expense Added - SpendWise Alert',
                html: htmlContent,
                text: this.formatPlainTextEmail(userName, expenseData) // Fallback for plain text
            };

            const result = await this.transporter.sendMail(mailOptions);

            console.log('Email sent successfully:', result.messageId);
            return {
                success: true,
                messageId: result.messageId,
                response: result.response
            };

        } catch (error) {
            console.error('Email sending failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    formatExpenseEmail(userName, expense) {
        const date = new Date(expense.date).toLocaleDateString('en-IN');
        const time = new Date().toLocaleTimeString('en-IN');

        return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SpendWise - Expense Added</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg,rgb(160, 172, 224) 0%,rgb(64, 57, 70) 100%); padding: 30px 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                                    🏦 SpendWise
                                </h1>
                                <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                                    Your Personal Expense Tracker
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Greeting -->
                        <tr>
                            <td style="padding: 30px 40px 20px 40px;">
                                <h2 style="color: #333333; margin: 0 0 10px 0; font-size: 24px;">
                                    Hello ${userName}! 👋
                                </h2>
                                <p style="color: #666666; margin: 0; font-size: 16px; line-height: 1.5;">
                                    A new expense has been successfully added to your SpendWise account.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Expense Details Card -->
                        <tr>
                            <td style="padding: 0 40px 30px 40px;">
                                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; border-left: 5px solid #667eea;">
                                    <h3 style="color: #333333; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;">
                                        💰 Expense Details
                                    </h3>
                                    
                                    <table width="100%" cellpadding="8" cellspacing="0">
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6;">
                                                <strong style="color: #495057; font-size: 14px;">📊 Category:</strong>
                                            </td>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6; text-align: right;">
                                                <span style="color: #333333; font-size: 16px; font-weight: 600;">
                                                    ${expense.category}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6;">
                                                <strong style="color: #495057; font-size: 14px;">💵 Amount:</strong>
                                            </td>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6; text-align: right;">
                                                <span style="color: #dc3545; font-size: 20px; font-weight: bold;">
                                                    ₹${expense.amount.toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6;">
                                                <strong style="color: #495057; font-size: 14px;">📅 Date:</strong>
                                            </td>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6; text-align: right;">
                                                <span style="color: #333333; font-size: 16px;">
                                                    ${date}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0;">
                                                <strong style="color: #495057; font-size: 14px;">📝 Description:</strong>
                                            </td>
                                            <td style="padding: 12px 0; text-align: right;">
                                                <span style="color: #333333; font-size: 16px; font-style: italic;">
                                                    ${expense.description}
                                                </span>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Tips Section -->
                        <tr>
                            <td style="padding: 0 40px 30px 40px;">
                                <div style="background: #e7f3ff; border-radius: 8px; padding: 20px; border-left: 4px solid #0066cc;">
                                    <h4 style="color: #0066cc; margin: 0 0 10px 0; font-size: 16px;">
                                        💡 Smart Spending Tip
                                    </h4>
                                    <p style="color: #333333; margin: 0; font-size: 14px; line-height: 1.5;">
                                        Track your expenses regularly to identify spending patterns and make better financial decisions!
                                    </p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #dee2e6;">
                                <p style="color: #6c757d; margin: 0 0 10px 0; font-size: 14px;">
                                    This email was sent at ${time} on ${date}
                                </p>
                                <p style="color: #6c757d; margin: 0; font-size: 12px;">
                                    © 2025 SpendWise. Keep tracking, keep saving! 🎯
                                </p>
                            </td>
                        </tr>
                        
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
    }

    formatPlainTextEmail(userName, expense) {
        const date = new Date(expense.date).toLocaleDateString('en-IN');
        return `
SpendWise - Expense Added

// Hello ${userName}!
Hello ${expense.userName}!

A new expense has been added to your account:

Category: ${expense.category}
Amount: ₹${expense.amount.toLocaleString('en-IN')}
Date: ${date}
Description: ${expense.description}

Keep tracking your expenses with SpendWise!

© 2025 SpendWise
    `.trim();
    }

    // Send welcome email when user signs up
    async sendWelcomeEmail(userEmail, userName) {
        try {
            const htmlContent = this.formatWelcomeEmail(userName);

            const mailOptions = {
                from: {
                    name: 'SpendWise',
                    address: process.env.GMAIL_USER
                },
                to: userEmail,
                subject: '🎉 Welcome to SpendWise - Start Your Financial Journey!',
                html: htmlContent
            };

            const result = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Welcome email failed:', error);
            return { success: false, error: error.message };
        }
    }

    formatWelcomeEmail(userName) {
        return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Welcome to SpendWise</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
        <table width="600" style="margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
            <tr>
                <td style="background: linear-gradient(135deg,rgb(160, 172, 224) 0%,rgb(64, 57, 70) 100%); padding: 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎉 Welcome to SpendWise!</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 18px;">Your journey to better financial management starts now</p>
                </td>
            </tr>
            <tr>
                <td style="padding: 40px;">
                    <h2 style="color: #333333;">Hello ${userName}! 👋</h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        Thank you for joining SpendWise! We're excited to help you take control of your finances.
                    </p>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #333333; margin: 0 0 15px 0;">🚀 What's Next?</h3>
                        <ul style="color: #666666; line-height: 1.8; padding-left: 20px;">
                            <li>Add your first expense to get started</li>
                            <li>Set up categories that match your lifestyle</li>
                            <li>Monitor your spending patterns</li>
                            <li>Get email notifications for every expense</li>
                        </ul>
                    </div>
                    <p style="color: #666666; font-size: 16px;">
                        Ready to start tracking? Log in to your SpendWise account and add your first expense!
                    </p>
                </td>
            </tr>
            <tr>
                <td style="background: #f8f9fa; padding: 20px; text-align: center;">
                    <p style="color: #6c757d; margin: 0; font-size: 14px;">
                        Happy tracking! 💰<br>
                        The SpendWise Team
                    </p>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
    }

    // for update expanse
    async sendUpdatedExpenseNotification(userEmail, userName, expenseData) {
        try {
            const htmlContent = this.formatUpdatedExpenseEmail(userName, expenseData);

            const mailOptions = {
                from: {
                    name: 'SpendWise',
                    address: process.env.GMAIL_USER
                },
                to: userEmail,
                subject: '🔄 Expense Updated - SpendWise Alert',
                html: htmlContent,
                text: this.formatUpdatedPlainTextEmail(userName, expenseData)
            };

            const result = await this.transporter.sendMail(mailOptions);

            console.log('Update email sent:', result.messageId);
            return {
                success: true,
                messageId: result.messageId
            };

        } catch (error) {
            console.error('Email sending (update) failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    formatUpdatedExpenseEmail(userName, expense) {
        const date = new Date(expense.date).toLocaleDateString('en-IN');
        const time = new Date().toLocaleTimeString('en-IN');

        return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SpendWise - Expense Updated </title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg,rgb(160, 172, 224) 0%,rgb(64, 57, 70) 100%); padding: 30px 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                                    🏦 SpendWise
                                </h1>
                                <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                                    Your Personal Expense Tracker
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Greeting -->
                        <tr>
                            <td style="padding: 30px 40px 20px 40px;">
                                <h2 style="color: #333333; margin: 0 0 10px 0; font-size: 24px;">
                                    Hello ${expense.userName}! 👋
                                </h2>
                                <p style="color: #666666; margin: 0; font-size: 16px; line-height: 1.5;">
                                    A Updated expense has been successfully added to your SpendWise account.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Expense Details Card -->
                        <tr>
                            <td style="padding: 0 40px 30px 40px;">
                                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; border-left: 5px solid #667eea;">
                                    <h3 style="color: #333333; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;">
                                        💰 Updated Expense Details
                                    </h3>
                                    
                                    <table width="100%" cellpadding="8" cellspacing="0">
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6;">
                                                <strong style="color: #495057; font-size: 14px;">📊 Category:</strong>
                                            </td>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6; text-align: right;">
                                                <span style="color: #333333; font-size: 16px; font-weight: 600;">
                                                    ${expense.category}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6;">
                                                <strong style="color: #495057; font-size: 14px;">💵 Amount:</strong>
                                            </td>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6; text-align: right;">
                                                <span style="color: #dc3545; font-size: 20px; font-weight: bold;">
                                                    ₹${expense.amount.toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6;">
                                                <strong style="color: #495057; font-size: 14px;">📅 Date:</strong>
                                            </td>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6; text-align: right;">
                                                <span style="color: #333333; font-size: 16px;">
                                                    ${date}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0;">
                                                <strong style="color: #495057; font-size: 14px;">📝 Description:</strong>
                                            </td>
                                            <td style="padding: 12px 0; text-align: right;">
                                                <span style="color: #333333; font-size: 16px; font-style: italic;">
                                                    ${expense.description}
                                                </span>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Tips Section -->
                        <tr>
                            <td style="padding: 0 40px 30px 40px;">
                                <div style="background: #e7f3ff; border-radius: 8px; padding: 20px; border-left: 4px solid #0066cc;">
                                    <h4 style="color: #0066cc; margin: 0 0 10px 0; font-size: 16px;">
                                        💡 Smart Spending Tip
                                    </h4>
                                    <p style="color: #333333; margin: 0; font-size: 14px; line-height: 1.5;">
                                        Track your expenses regularly to identify spending patterns and make better financial decisions!
                                    </p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #dee2e6;">
                                <p style="color: #6c757d; margin: 0 0 10px 0; font-size: 14px;">
                                    This email was sent at ${time} on ${date}
                                </p>
                                <p style="color: #6c757d; margin: 0; font-size: 12px;">
                                    © 2025 SpendWise. Keep tracking, keep saving! 🎯
                                </p>
                            </td>
                        </tr>
                        
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
    }

    formatUpdatedPlainTextEmail(userName, expense) {
        const date = new Date(expense.date).toLocaleDateString('en-IN');
        return `
SpendWise - Expense Added

// Hello ${userName}!
Hello ${expense.userName}!

A Updated expense has been added to your account:

Category: ${expense.category}
Amount: ₹${expense.amount.toLocaleString('en-IN')}
Date: ${date}
Description: ${expense.description}

Keep tracking your expenses with SpendWise!

© 2025 SpendWise
    `.trim();
    }


}

module.exports = new EmailService();