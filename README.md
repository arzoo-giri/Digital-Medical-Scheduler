🙏 Acknowledgment

This project was originally inspired by a YouTube tutorial by GreatStack.
I used the base structure and extended it with custom features, major improvements, and machine learning–driven enhancements.

🏥 Digital Medical Scheduler (MERN + ML Recommendation)

A modern Doctor Appointment System built using the MERN stack, designed to simplify healthcare scheduling for Patients, Doctors, and Admins.
The system supports real-time doctor availability, secure authentication, and intelligent decision-making using:

Naive Bayes for doctor recommendation

Greedy Scheduling Algorithm for optimal time-slot allocation

Priority Queue for emergency appointment handling

This project ensures a smooth, automated, and efficient appointment flow for healthcare environments.

🚀 Features

🔐 Role-based login (Admin, Doctor, Patient)

🩺 Doctor recommendation using Naive Bayes

📅 Smart appointment scheduling using Greedy Algorithm

🚨 Urgent-case handling via Priority Queue

🧑‍⚕️ Manage doctor profiles & schedules

👤 Patient dashboard & appointment history

🛠️ Admin panel for system and doctor management

☁️ Cloudinary-based image upload

🎨 Responsive UI using TailwindCSS

🔐 Note: Environment Variables

In the .env file inside backend folder add:

MONGODB_URI="<YOUR_MONGODB_CONNECTION_STRING>"

CLOUDINARY_NAME="<YOUR_CLOUDINARY_CLOUD_NAME>"

CLOUDINARY_API_KEY="<YOUR_CLOUDINARY_API_KEY>"

CLOUDINARY_SECRET_KEY="<YOUR_CLOUDINARY_API_SECRET>"

ADMIN_EMAIL="<DEFAULT_ADMIN_EMAIL>"

ADMIN_PASSWORD="<DEFAULT_ADMIN_PASSWORD>"

JWT_SECRET="<YOUR_RANDOM_JWT_SECRET>"
