# Spendwise - Personal Expense Tracker

## Overview
Spendwise is a modern, user-friendly expense tracking application designed to help you manage your finances effortlessly. Built with Angular for the frontend and Node.js/Express for the backend, Spendwise offers a sleek, futuristic UI with glassmorphic design, neon accents, and smooth animations. Track your expenses, categorize them, and download reports in PDF or Excel formats—all in one place!

## Features
- **Expense Management:** Add, edit, and delete expenses with ease.
- **Category Filtering:** Filter expenses by category to analyze your spending.
- **Dashboard Overview:** View total expenses and the number of expenses at a glance.
- **Download Reports:** Export your expense history as PDF or Excel files.
- **Responsive Design:** Optimized for desktops, tablets, and mobile devices.
- **Futuristic UI:** Glassmorphic cards, neon gradients, and micro-animations for a premium experience.
- **User Authentication:** Secure sign-in and sign-up functionality (to be implemented).
- **Database Integration:** Uses MongoDB Atlas for persistent storage of expenses.
- **Email Notifications:** Receive email alerts on successful sign-up and whenever a new expense is added or updated.
- **Pagination Support:** Efficiently handles large lists of expenses with seamless pagination for better performance and UX.

## **Deployment:**
- **Frontend (Vercel):** [https://spilt-wise-fe3.vercel.app](https://spilt-wise-fe3.vercel.app/)


## Tech Stack
- **Frontend:** Angular 18, TypeScript, HTML, CSS  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB Atlas  
- **Styling:** Custom CSS with glassmorphism, neon gradients, and animations  
- **Fonts:** Google Fonts (Inter)

## Prerequisites
Before setting up the project, ensure you have the following installed:
- Node.js (v16.x or higher)
- npm (v8.x or higher)
- Angular CLI (v18.x):  
  ```bash
  npm install -g @angular/cli
  ```
- MongoDB Atlas Account

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/spendwise.git
cd spendwise
```

### 2. Set Up MongoDB Atlas
- Create a MongoDB Atlas account and cluster (free tier available).
- Set up a database user and whitelist your IP address.
- Get your connection string, e.g.:
  ```
  mongodb+srv://<username>:<password>@cluster0.mongodb.net/spendwise?retryWrites=true&w=majority
  ```
- Create a `.env` file in the backend directory:
  ```bash
  cd backend
  touch .env
  ```
- Add your MongoDB URI to `.env`:
  ```
  MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/spendwise?retryWrites=true&w=majority
  ```

### 3. Set Up the Backend
```bash
npm install
node server.js
```
The backend server will start on [http://localhost:3000](http://localhost:3000).

### 4. Set Up the Frontend
```bash
cd ../frontend
npm install
ng serve
```
The frontend will be available at [http://localhost:4200](http://localhost:4200).

## Usage

- **Add an Expense:**  
  Use the sidebar form on the dashboard to add new expenses.

- **Edit/Delete Expenses:**  
  In the "Expense History" section, click "Edit" or "Delete" to modify or remove expenses.

- **Filter Expenses:**  
  Use the "Filter by Category" dropdown to analyze expenses by category.

- **Download Reports:**  
  Export your expenses as PDF or Excel using the respective buttons.

## Project Structure
```bash
spendwise/
├── backend/                # Node.js/Express backend
│   ├── server.js           # Main backend server file
│   ├── .env                # Environment variables (MongoDB connection)
│   ├── package.json        # Backend dependencies
│   └── ...
├── frontend/               # Angular frontend
│   ├── src/                # Source files
│   │   ├── app/            # Angular components & modules
│   │   │   ├── components/
│   │   │   │   ├── dashboard/
│   │   │   │   └── ...
│   │   │   ├── app.routes.ts
│   │   │   └── app.config.ts
│   │   ├── assets/         # Static assets
│   │   └── styles.css      # Global styles
│   ├── package.json        # Frontend dependencies
│   └── ...
└── README.md               # Project documentation
```

## Future Enhancements
- User Authentication with JWT
- Charts and Visualizations for spending trends
- Group Expenses with family or friends
- Dark/Light Mode theme toggle

## Contributing
Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes and commit (`git commit -m "Add your feature"`)
4. Push to your branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Contact
Your Name: vedant.k1912@gmail.com  
GitHub: vedantkavhar

Happy expense tracking with Spendwise! 💸
