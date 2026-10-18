# Decision Record & Architecture Guide: Student Complaint Box

## 1. Overview & Purpose
**Student Complaint Box** is a secure, role-based complaint and grievance redressal system tailored for academic institutions. It provides students with an anonymous and safe channel to report issues (academic, harassment, infrastructure, administrative) while providing teachers, department heads, and the college principal with transparent tracking, escalation, and resolution workflows.

---

## 2. System Architecture & Components

### 2.1 Backend Architecture
- **Runtime**: Node.js & Express.
- **Dual Deployment Architecture**:
  - **Standalone Server**: Runs locally via `server.js` listening on `PORT` (default `5000`) with MongoDB connected via Mongoose.
  - **Serverless Cloud Function**: Configured to export `exports.api = functions.https.onRequest(app)` for Firebase Cloud Functions deployment.
- **Database**: MongoDB using Mongoose schemas for structured relational-like documents.
- **Security & Middleware**:
  - `middleware/auth.js`: JSON Web Token (JWT) verification and role-based authorization guards (Student, Teacher/Admin, Principal).
  - `middleware/rateLimit.js`: Request rate-limiting to prevent spam submissions or brute-force logins.
  - File Uploads: Multer handling multipart form data with storage inside `/uploads` and static serving.

### 2.2 Data Models (`models/`)
- **[Student.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Student-Complaint-Box/models/Student.js)**: Holds student credentials, department, student ID, and active status.
- **[Admin.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Student-Complaint-Box/models/Admin.js)**: Stores staff, HOD, and Principal accounts with assigned administrative privileges.
- **[Complaint.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Student-Complaint-Box/models/Complaint.js)**: Represents grievance tickets with fields for category, description, anonymity status, attached evidence files, priority, resolution status (`Pending`, `In Progress`, `Resolved`, `Rejected`), activity logs, and two-way comments.
- **[Blacklist.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Student-Complaint-Box/models/Blacklist.js)**: Stores blacklisted accounts and abuse records to block serial offenders while preserving anonymity for good-faith whistleblowers.

### 2.3 API Routes (`routes/`)
- **[auth.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Student-Complaint-Box/routes/auth.js)**: Handles student/admin login, registration, JWT generation, and credential validation.
- **[complaints.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Student-Complaint-Box/routes/complaints.js)**: Manages complaint creation (with Multer file upload), status updates, comment threads, and user-specific complaint listings.
- **[admin.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Student-Complaint-Box/routes/admin.js)**: Powers teacher and principal dashboards, departmental analytics, complaint status transitions, and blacklisting operations.

### 2.4 Frontend Clients (`public/`)
- **`index.html`**: Institutional landing portal with quick navigation for students and staff.
- **`login.html` & `register.html`**: Student authentication screens.
- **`dashboard.html` & `complaint.html`**: Student complaint creation form (with file attachment) and real-time status tracker.
- **`admin-login.html` & `admin-dashboard.html`**: Staff & HOD portal to triage departmental grievances.
- **`principal-login.html` & `principal-dashboard.html`**: Executive dashboard with high-level analytics, overdue complaint alerts, and oversight.
- **`staff-monitor.html`**: Tracking resolution speed and responsiveness of staff members.

---

## 3. Key Architectural Decisions & Change History

| Commit / Phase | Decision / Change | Rationale & Impact |
| :--- | :--- | :--- |
| `a56a32e` | Initial project setup with Express & MongoDB | Set up core models (`Student`, `Complaint`, `Admin`) and established basic REST APIs. |
| `f05b8e8` | Added Firebase configuration (`firebase.json`, `.firebaserc`) | Laid groundwork for zero-maintenance cloud hosting. |
| `4bc4db1` | Migrated server to Firebase Cloud Functions & relative API endpoints | Eliminated hardcoded localhost URLs to allow seamless switching between local dev and cloud serverless execution. Removed legacy Railway config. |
| `b960547` & `c12f779` | Multi-role authentication refinements & bug fixes | Hardened JWT token validation across principal and student endpoints. |
| `548707f` | UI responsiveness & complaint lifecycle enhancements | Refined status badge workflows, evidence file previewing, and anonymous display logic. |

---

## 4. Usage & Running Instructions

### Local Development
1. Install dependencies:
   ```bash
   cd "Student-Complaint-Box"
   npm install
   ```
2. Configure `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/complaintbox
   JWT_SECRET=your-secret-key-here
   ```
3. Start the application:
   ```bash
   npm start
   ```
4. Access via browser: `http://localhost:5000`.

---

## 5. Maintenance & Future Update Protocol
Whenever modifications or new features are introduced to `Student-Complaint-Box`:
1. Document the change in the **Key Architectural Decisions & Change History** table above.
2. If new endpoints, models, or views are introduced, update **Section 2 (System Architecture & Components)**.
3. Verify that changes maintain backward compatibility with both local Express execution and Firebase Cloud Functions.
