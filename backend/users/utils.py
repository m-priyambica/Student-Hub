import random

def generate_otp():
    """
    Generates a random 6-digit number as a string.
    """
    otp = ""
    for i in range(6):
        otp += str(random.randint(0, 9))
    return otp

def get_chat_notification_html(seller_name, buyer_name, product_name, message_preview):
    """
    Returns a formatted HTML email for chat notifications with a reminder to delete sold items.
    """
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>New Message - Student Hub</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <div style="background-color: #ea580c; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Student Hub 🎓</h1>
            </div>

            <div style="padding: 30px;">
                <h2 style="color: #1f2937; margin-top: 0;">Hey {seller_name}! 👋</h2>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Good news! <strong>{buyer_name}</strong> is interested in your <strong>{product_name}</strong>.
                </p>

                <div style="background-color: #f3f4f6; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0; font-style: italic; color: #555;">
                    "{message_preview}..."
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://student-hub-quqc.onrender.com/chat" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                        Check Account & Reply
                    </a>
                </div>
                
                <div style="margin-top: 30px; background-color: #fff7ed; padding: 15px; border-radius: 8px; border: 1px solid #ffedd5; text-align: center;">
                    <p style="color: #9a3412; font-size: 13px; margin: 0;">
                        <strong>✅ Is the deal done?</strong><br>
                        Don't forget to delete the product from your store to stop receiving new inquiries!
                    </p>
                </div>

            </div>
        </div>
    </body>
    </html>
    """