🏢 AssetFlow — Enterprise Asset & Resource Management System
> Built for the **Odoo Hackathon** · A full-stack ERP platform to digitize and streamline how organizations track, allocate, and maintain their physical assets and shared resources.
![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?style=flat-square&logo=nodedotjs)
![Express.js](https://img.shields.io/badge/Express.js-Backend-000000?style=flat-square&logo=express)
![React](https://img.shields.io/badge/React.js-Frontend-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?style=flat-square&logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=flat-square&logo=sqlite)
![JWT](https://img.shields.io/badge/JWT-Auth-black?style=flat-square&logo=jsonwebtokens)
---
📑 Table of Contents
🌟 About the Project
✨ Features
🏗️ Project Architecture
🧰 Tech Stack
🛠️ Prerequisites
🚀 Getting Started
📡 API Routes Overview
👥 Team
---
🌟 About the Project
AssetFlow is a centralized ERP platform designed to simplify and digitize how organizations track, allocate, and maintain their physical assets and shared resources — built from the ground up in a hackathon environment.
> Any organization with equipment, furniture, vehicles, or shared spaces — offices, schools, hospitals, factories — can use AssetFlow to eliminate manual spreadsheet-based tracking and gain real-time visibility into asset status, ownership, and condition.
🎯 Core Goals
Replace inefficient paper/spreadsheet-based asset tracking with a structured digital lifecycle.
Enable role-based workflows for Admins, Managers, and standard users.
Provide real-time visibility into who holds what, where it is, and its current condition.
Deliver clean architecture with scalable, modular route design.
---
✨ Features
Module	Description
🔐 Authentication	Secure JWT-based login & signup with custom auth middleware
🏷️ Asset Management	Register, track, and manage full asset lifecycle
📦 Allocations	Allocate assets to employees/departments with conflict prevention
📅 Bookings	Book shared resources with scheduling and availability checks
🔧 Maintenance	Log and track maintenance requests and repair statuses
🔍 Audits	Audit trail for all asset movements and status changes
🏢 Organization	Manage departments, teams, and organizational structure
📊 Dashboard	Real-time summary metrics and quick-access navigation
📝 Logging	Server-side event and request tracking via custom logger utility
---
🏗️ Project Architecture
```
AssetFlow/
│
├── frontend/                        # React.js Client Application
│   ├── public/
│   └── src/
│       ├── components/              # Reusable UI components
│       ├── context/                 # React Context API (Auth & Global State)
│       ├── pages/                   # Route-level page components
│       ├── assets/                  # Static assets (icons, images)
│       └── main.jsx                 # Vite entry point
│
├── backend/                         # Node.js + Express.js Server
│   ├── config/
│   │   └── db.js                   # SQLite database connection config
│   ├── middleware/
│   │   └── auth.js                 # JWT authentication middleware
│   ├── models/
│   │   └── index.js                # Database models & schema definitions
│   ├── routes/
│   │   ├── auth.js                 # Login / Signup endpoints
│   │   ├── assets.js               # Asset CRUD operations
│   │   ├── allocations.js          # Asset allocation endpoints
│   │   ├── bookings.js             # Resource booking endpoints
│   │   ├── maintenance.js          # Maintenance request endpoints
│   │   ├── audits.js               # Audit log endpoints
│   │   ├── dashboard.js            # Dashboard summary endpoints
│   │   └── org.js                  # Organization & department endpoints
│   ├── utils/
│   │   └── logger.js               # Custom server-side logger
│   ├── database.sqlite             # Local SQLite database file
│   ├── seed.js                     # Database seeder for initial data
│   ├── server.js                   # Express app entry point
│   └── package.json
│
└── README.md
```
---
🧰 Tech Stack
🖥️ Frontend
Technology	Role
React.js	Core UI library
Vite	Fast build tool & bundler
Tailwind CSS	Utility-first CSS styling framework
React Context API	Global state management (auth, user session)
⚙️ Backend
Technology	Role
Node.js	Runtime environment
Express.js	Web framework for routing & middleware
JWT	Stateless authentication tokens
Custom Auth Middleware	Route-level access control (`middleware/auth.js`)
💾 Database & Utilities
Technology	Role
SQLite	Lightweight, file-based relational database
`config/db.js`	Database connection & driver configuration
`utils/logger.js`	Custom server-side event & request logger
---
🛠️ Prerequisites
Make sure the following are installed before getting started:
Node.js `v18+` → Download
npm `v9+` (bundled with Node.js)
Git → Download
---
🚀 Getting Started
1️⃣ Clone the Repository
```bash
git clone https://github.com/monesh-kumar-007/AssetFlow-Enterprise-Asset-Resource-Management-System---Odoo-Hackathon.git
cd AssetFlow-Enterprise-Asset-Resource-Management-System---Odoo-Hackathon
```
---
2️⃣ Setup the Backend
```bash
cd backend
npm install
npm install morgan
npm install --save-dev nodemon
npm run dev
```
Seed the database with initial data:
```bash
node seed.js
```
Start the backend server:
```bash
node server.js
```
> ✅ Backend runs at **`http://localhost:5000`** by default.
---
3️⃣ Setup the Frontend
Open a new terminal, then:
```bash
cd frontend
npm install
npm run dev
```
> ✅ Frontend runs at **`http://localhost:5173`** by default (Vite).
---
📡 API Routes Overview
Method	Description	Auth Required
`POST`	Register a new user	❌
`POST`	Login & receive JWT token	❌
`GET`	List all assets	✅
`POST`	Register a new asset	✅
`GET`	View all allocations	✅
`POST`	Allocate an asset	✅
`GET`	View all bookings	✅
`POST`	Create a booking	✅
`GET`	View maintenance logs	✅
`POST`	Log a maintenance request	✅
`GET`	View audit trail	✅
`GET`	Get dashboard metrics	✅
`GET`	Get organization/dept data	✅
> ✅ = Requires `Authorization: Bearer <token>` header
---
👥 Team
Built with ❤️ during the Odoo Hackathon by:
<table>
  <tr>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/monesh-kumar-007" width="80px" style="border-radius:50%"/><br/>
      <b>Monesh Kumar</b><br/>
      <a href="https://github.com/monesh-kumar-007">
        <img src="https://img.shields.io/badge/GitHub-monesh--kumar--007-181717?style=flat-square&logo=github"/>
      </a>
    </td>
    <td align="center">
      <img src="https://ui-avatars.com/api/?name=Mohammed+Arshath&background=6366f1&color=fff&size=80" width="80px" style="border-radius:50%"/><br/>
      <b>Mohammed Arshath K H</b><br/>
      <img src="https://img.shields.io/badge/Team%20Member-Odoo%20Hackathon-orange?style=flat-square"/>
    </td>
    <td align="center">
      <img src="https://ui-avatars.com/api/?name=Nigilan+P&background=10b981&color=fff&size=80" width="80px" style="border-radius:50%"/><br/>
      <b>Nigilan P</b><br/>
      <img src="https://img.shields.io/badge/Team%20Member-Odoo%20Hackathon-orange?style=flat-square"/>
    </td>
    <td align="center">
      <img src="https://ui-avatars.com/api/?name=Navin+Kumar&background=f59e0b&color=fff&size=80" width="80px" style="border-radius:50%"/><br/>
      <b>Navin Kumar S</b><br/>
      <img src="https://img.shields.io/badge/Team%20Member-Odoo%20Hackathon-orange?style=flat-square"/>
    </td>
  </tr>
</table>
---
<div align="center">
⭐ Star this repo if you found it useful!
Built for Odoo Hackathon · Powered by React + Express + SQLite
</div>