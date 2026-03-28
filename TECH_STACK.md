# 📦 TECH STACK DOCUMENT

*(Vardaan Comet Student Platform)*

## 🧠 1. Architecture Type
Hybrid Local System (File System + Cloud DB)
- **📡 Supabase** → Student data (online sync)
- **💾 Local File System** → Content (HTML files, folders)
- **🖥️ Runs on localhost** (offline-first UI)

## 🏗️ 2. Core Tech Stack

### 🎯 Frontend
- **Framework:** Next.js (React) - App Router
- **Styling:** Tailwind CSS
- **State:** React Context / Component State

### ⚙️ Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **File Handling:** Node `fs/promises` module

### 🗄️ Database
- **Platform:** Supabase (PostgreSQL)
- **Tables Used:**
  - `students` (id, student_code, name, class, board, school_name, created_at)
  - `student_progress`

### 📂 File Storage System
- **Storage Type:** Local File System (NOT cloud)
- **Engine:** Dynamic generation based on `/storage/students/[student_code]`
- **Content Rendering:** Iframe or direct React HTML rendering

## 🔐 3. Authentication (Admin Panel)
- **Phase 1:** Simple Auth (Hardcoded / ENV based - `admin`/`admin123`)

## ⚡ 4. Strict Rules
1. **DO NOT** store content in database.
2. **ONLY** use file system for content.
3. **ALWAYS** read folders dynamically.
4. **DO NOT** hardcode subjects or chapters.
5. **UI** must adapt to folder structure.
6. System must reflect manual file changes instantly.
