const nodemailer = require("nodemailer");

async function connectToEmailService() {
    console.log("email: " + process.env.EMAIL);
    try {
        const transporter = await nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_CONNECTION_PASSWORD,
            },
        });
        try {
            // Verify the connection
            await transporter.verify();
            console.log("Email transporter connection successful.");

        } catch (error) {
            console.error("Failed to connect to Email Transporter:", error);
            process.exit(1);
        }
        return transporter;

    } catch (error) {
        console.error("Error with creating transport:", error);
        process.exit(1);
    }

}



module.exports = connectToEmailService;