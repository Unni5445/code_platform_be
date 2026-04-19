export const generateFirstLoginEmail = (
    userName: string,
    userEmail: string,
    userPassword: string,
    companyName: string
): string => {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome - First Time Login</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f7;
              margin: 0;
              padding: 0;
          }
          .container {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .header {
              background-color: #4A90E2;
              padding: 20px;
              text-align: center;
              color: #ffffff;
          }
          .header h1 {
              margin: 0;
              font-size: 24px;
          }
          .body {
              padding: 30px;
              color: #333333;
          }
          .body h2 {
              color: #4A90E2;
              font-size: 22px;
              margin-bottom: 10px;
          }
          .body p {
              font-size: 16px;
              line-height: 1.5;
              margin-bottom: 20px;
          }
          .credentials {
              background-color: #f4f9fc;
              padding: 20px;
              border: 1px solid #4A90E2;
              border-radius: 5px;
              color: #333333;
          }
          .credentials p {
              margin: 0;
              font-size: 16px;
              font-weight: bold;
          }
          .credentials span {
              color: #ff5c5c;
          }
          .footer {
              text-align: center;
              padding: 20px;
              background-color: #f4f4f7;
              font-size: 14px;
              color: #999999;
          }
          .footer a {
              color: #4A90E2;
              text-decoration: none;
          }
      </style>
  </head>
  <body>
  
      <div class="container">
          <div class="header">
              <h1>Welcome to </h1>
          </div>
          <div class="body">
              <h2>Hi ${userName},</h2>
              
          </div>
          <div class="footer">
              <p>Thank you.</p>
          </div>
      </div>
  
  </body>
  </html>`;
};
