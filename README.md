<div align="center">
  <h1>💙 VitalSync</h1>
  <p><strong>The Family Link for a Healthier Home</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Frontend-Next.js-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/Backend-Spring_Boot-6DB33F?style=for-the-badge&logo=spring" alt="Spring Boot" />
    <img src="https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Auth-Supabase-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  </p>
  
  <p><em>A comprehensive digital health companion connecting elderly patients with their designated caregivers, ensuring proactive health monitoring via AI and real-time tracking.</em></p>
</div>

---

## 🌟 What the App Does

VitalSync acts as a digital health companion for families. Its primary workflows include:

1. **Caregiver-Patient Linking:** Patients and caregivers can link their accounts using secure invite codes, allowing caregivers to monitor their loved one's health in real-time.
2. **AI Medical Report Analysis:** Users can upload physical health reports. A sophisticated 3-step AI pipeline (Gemini OCR → HuggingFace Analysis → Gemini Synthesis) extracts data (e.g., hemoglobin levels), provides a friendly coach summary, and flags critical metrics.
3. **Vital & Medication Tracking:** Patients can log daily vitals (blood pressure, heart rate) and medications. Caregivers can verify that important medications have been taken.
4. **Emergency SOS System:** Patients can trigger SOS alerts that instantly broadcast their GPS location and alert status to caregivers.
5. **Daily Habits & Reminders:** The app features AI-suggested daily habits and appointment reminders with push notifications.

---

## 🚀 Key Features

- **Secure Authentication:** Integrated with Supabase Auth for robust login and signup flows, backed by Spring Security.
- **Data Privacy:** Strict data isolation using PostgreSQL Row Level Security (RLS) and JWT token validation.
- **AI-Powered Health Reports:** Automated extraction and analysis of medical documents.
- **Family Link System:** Secure binding between patient and caregiver accounts via invite codes.
- **Advanced Medication Management:** Track prescriptions, dosages, time frequencies, and caregiver verification logs.
- **SOS Emergency Alerts:** One-tap geolocation-based emergency triggers with resolution tracking.
- **Visits & Appointments:** Manage doctors' appointments and reminders with a beautiful, glassmorphism-inspired UI and staggered animations.
- **Habit Tracker:** Monitor daily user routines with AI-driven habit suggestions.
- **Comprehensive Profiles:** Detailed medical profiles capturing blood type, allergies, conditions, and raw emergency contacts.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js (React 19)
- **Styling:** Tailwind CSS V4
- **Animations:** Framer Motion
- **Data Visualization:** Recharts
- **Backend-as-a-Service:** Supabase (Auth, SSR, Database)
- **Language:** TypeScript

### Backend
- **Framework:** Spring Boot 4.0.1 (Java 21)
- **Security:** Spring Security & JWT (JSON Web Tokens)
- **Database:** PostgreSQL with Spring Data JPA
- **Build Tool:** Maven

---

## 🗄 Database Schema

The vital records and app operations are stored across a strongly normalized PostgreSQL DB schema:

### `users`
- `id` (UUID) - Primary Key
- `email` (String) - User email
- `passwordHash` (String) - Encrypted password
- `role` (Enum) - User role (e.g., PATIENT, CAREGIVER)
- `createdAt` (LocalDateTime) - Account creation timestamp

### `profiles`
- `id` (UUID) - Primary Key
- `user_id` (UUID) - Foreign Key to `users`
- `fullName` (String)
- `dateOfBirth` (LocalDate)
- `bloodType` (String)
- `allergies` (String)
- `medicalConditions` (String)
- `avatarUrl` (String)
- `phoneNumber` (String)
- `language` (String)
- `emergencyContactsRaw` (String) - JSON/String format of contacts

### `family_links`
- `id` (UUID) - Primary Key
- `patient_id` (UUID) - Foreign Key to `users` (Patient)
- `caregiver_id` (UUID) - Foreign Key to `users` (Caregiver)
- `inviteCode` (String) - 10-char unqiue code
- `status` (Enum) - PENDING, ACTIVE, REVOKED
- `createdAt` (LocalDateTime)

### `health_reports`
- `id` (UUID) - Primary Key
- `user_id` (UUID) - Foreign Key to `users`
- `fileUrl` (String) - Supabase storage link
- `fileType` (String) - e.g. "image/jpeg", "application/pdf"
- `rawExtractedText` (Text) - Gemini Vision OCR output
- `hfAnalysis` (Text) - HuggingFace model analysis
- `geminiSummary` (Text) - Friendly AI Coach text
- `extractedMetrics` (Text) - Structured JSON of key-value vitals
- `criticalFlagged` (Boolean) - Exceeds SOS thresholds
- `uploadedAt` (LocalDateTime)

### `vital_readings`
- `id` (UUID) - Primary Key
- `user_id` (UUID) - Foreign Key to `users`
- `type` (Enum) - Type of vital (e.g., Blood Pressure, Heart Rate)
- `value` (Double) - Primary metric
- `secondaryValue` (Double) - Secondary metric (if applicable)
- `unit` (String) - e.g., "mmHg", "mg/dL", "bpm"
- `measuredAt` (LocalDateTime)
- `notes` (String)
- `criticalFlag` (Boolean)
- `createdAt` (LocalDateTime)

### `medications`
- `id` (UUID) - Primary Key
- `user_id` (UUID) - Foreign Key to `users`
- `name` (String)
- `dosage` (String) - e.g., "500mg"
- `frequency` (String) - e.g., "Twice daily"
- `startDate` (LocalDate)
- `endDate` (LocalDate)
- `instructions` (String)
- `status` (Enum) - ACTIVE, INACTIVE
- `createdAt` (LocalDateTime)

### `medication_logs`
- `id` (UUID) - Primary Key
- `medication_id` (UUID) - Foreign Key to `medications`
- `takenAt` (LocalDateTime)
- `verifiedByCaregiver` (Boolean) - Caregiver cross-check flag
- `verifiedAt` (LocalDateTime)

### `sos_alerts`
- `id` (UUID) - Primary Key
- `user_id` (UUID) - Foreign Key to `users`
- `triggerReason` (String)
- `triggerType` (Enum)
- `latitude` (Double)
- `longitude` (Double)
- `resolved` (Boolean)
- `resolvedAt` (LocalDateTime)
- `triggeredAt` (LocalDateTime)

### `appointments`
- `id` (UUID) - Primary Key
- `user_id` (UUID) - Foreign Key to `users`
- `title` (String)
- `doctorName` (String)
- `appointmentDateTime` (LocalDateTime)
- `location` (String)
- `notes` (String)
- `reminderSent` (Boolean)
- `status` (Enum) - UPCOMING, COMPLETED, CANCELLED
- `createdAt` (LocalDateTime)

### `habits`
- `id` (UUID) - Primary Key
- `user_id` (UUID) - Foreign Key to `users`
- `title` (String)
- `timeOfDay` (String)
- `completed` (Boolean)
- `aiGenerated` (Boolean)

---

## 🏃 Getting Started

Follow these instructions to get a local copy of VitalSync up and running.

### 📋 Prerequisites
Ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v20 or higher)
- [Java 21](https://jdk.java.net/21/) and [Maven](https://maven.apache.org/)
- [PostgreSQL](https://www.postgresql.org/)
- A [Supabase](https://supabase.com/) Project (for Authentication & Storage)

---

### 💻 Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the Environment**
   Create a `.env.local` file in the `frontend` root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   > [!TIP]
   > Open [http://localhost:3000](http://localhost:3000) in your browser to see the application running.

---

### ⚙️ Backend Setup

1. **Navigate to the backend directory**
   ```bash
   cd backend/vitalsync
   ```

2. **Configure Database Settings**
   Update your PostgreSQL database configuration inside `src/main/resources/application.properties` (or `application.yml`):
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/vitalsync
   spring.datasource.username=your_db_username
   spring.datasource.password=your_db_password
   ```

3. **Build and Run**
   Execute the application using Maven wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
   > [!NOTE]
   > The API server will be available at [http://localhost:8080](http://localhost:8080) by default.
