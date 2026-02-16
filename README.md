# 🎓 Student Hub - Campus Marketplace & Community

**Student Hub** is a specialized platform designed for college campuses to facilitate secure buying, selling, and community interaction. It solves the problem of scattered communication by providing a verified, student-only environment for transactions and academic collaboration.

### 🚀 **Live Demo**
* **Frontend (User Interface):** [https://student-hub-frontend-gw6b.onrender.com](https://student-hub-frontend-gw6b.onrender.com)
* **Backend (API):** [https://student-hub-quqc.onrender.com](https://student-hub-quqc.onrender.com)

---

## ✨ Key Features

* **🔒 Verified Student Access:** Sign-up is restricted to valid college email to ensure a trusted community.
* **🛒 Marketplace:**
    * Buy and sell textbooks, electronics, and supplies.
    * Filter products by category, price, and condition.
    * **"Deal Confirmed" System:** Tracks transaction status securely.
* **💬 Real-time Chat:** Integrated messaging system allowing buyers and sellers to negotiate and finalize meetups directly.
* **👤 User Profiles:** View seller reputation, academic details (Branch, Semester), and track your own purchase history.
* **🛡️ Secure Authentication:** OTP-based email verification and JWT (JSON Web Token) session management.

---

## 🛠️ Tech Stack

### **Frontend**
* **React.js:** For building a dynamic and responsive user interface.
* **CSS / Styled Components:** Custom styling for a modern, clean aesthetic.
* **React Router:** Seamless navigation between marketplace, profile, and chat sections.
* **Axios:** Handling API requests and data fetching.

### **Backend**
* **Django & Django REST Framework (DRF):** Robust API development.
* **Python:** Core logic and data processing.
* **SQLite / PostgreSQL:** Database management for users, products, and transactions.
* **SimpleJWT:** Secure authentication handling.


---
## 🔧 Installation & Setup

To run **Student Hub** locally, follow these steps to set up the backend API and the frontend interface.

### Prerequisites
* **Python 3.10+**
* **Node.js & npm**
* **Git**

<details>
<summary><strong>Backend Setup (Django API)</strong> - <em>Click to expand</em></summary>

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/m-priyambica/student-hub.git](https://github.com/m-priyambica/student-hub.git)
    cd student-hub/backend
    ```

2.  **Create a Virtual Environment**
    It is recommended to use a virtual environment to manage dependencies.
    * **Windows:**
        ```bash
        python -m venv venv
        venv\Scripts\activate
        ```
    * **macOS/Linux:**
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

3.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Environment Variables**
    Create a `.env` file in the `backend/` directory and add the following configurations (adjust as necessary):
    ```env
    DEBUG=True
    SECRET_KEY=your-secret-key-here
    # If using local SQLite, DATABASE_URL is not required
    ```

5.  **Apply Database Migrations**
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

6.  **Create a Superuser (Admin)**
    ```bash
    python manage.py createsuperuser
    ```

7.  **Run the Server**
    ```bash
    python manage.py runserver
    ```
    The API will be available at `http://127.0.0.1:8000/`.

</details>


<details>
<summary><strong>Frontend Setup (React Client)</strong> - <em>Click to expand</em></summary>

1.  **Navigate to Frontend Directory**
    Open a new terminal window (keep the backend running in the first one).
    ```bash
    cd student-hub/frontend
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure API Endpoint**
    Ensure the frontend knows where the backend is running. Create a `.env` file in the `frontend/` folder:
    ```env
    REACT_APP_API_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)
    ```

4.  **Start the Application**
    ```bash
    npm start
    ```
    The application will open in your browser at `http://localhost:3000`.

</details>

---

## 🛡️ Security & Integrity

Student Hub is built with a "security-first" approach to ensure a safe marketplace environment for students.

* **Domain-Restricted Access:** * Registration is strictly enforced for Stanley college email addresses. 
    * External users cannot create accounts, ensuring the community remains exclusive to verified students and staff.
* **JWT Authentication:** * We use **JSON Web Tokens (SimpleJWT)** for secure, stateless authentication. 
    * Access tokens are short-lived, and refresh tokens are handled securely to maintain user sessions.
* **Data Protection:**
    * **Password Hashing:** All user passwords are hashed using standard Django cryptographic signing before storage.
    * **Role-Based Access:** Specific endpoints (like specific seller tools) are protected and only accessible to authenticated users with the correct permissions.
* **Transaction Integrity:**
    * The "Deal Confirmed" logic uses atomic transactions to ensure a product cannot be sold to two people simultaneously. 
    * Status updates (`PENDING` -> `SOLD`) are handled server-side to prevent manipulation.
