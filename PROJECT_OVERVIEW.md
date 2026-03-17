# SUPPTIC - Online Entrance Examination Registration Platform

## Overview
A modern, government-grade digital platform for the National Advanced School of Posts, Telecommunications and ICT (SUPPTIC) entrance examination registration.

## Key Features

### 1. Landing Page
- Hero section with official government branding
- Statistics dashboard (10,000+ candidates, 4 programs, 95% success rate)
- Program cards (ITT, IPT, TT, CPT)
- Step-by-step application process timeline
- User guide modal
- Floating chatbot assistant

### 2. Authentication System
- **Login Page**: Email/password authentication with admin detection
- **Registration Page**: Multi-field registration form with validation

### 3. Multi-Step Application Form
- **Step 1**: Personal Information (9 fields)
- **Step 2**: Academic Information (diploma, series, year, school)
- **Step 3**: Program Selection (ITT, IPT, TT, CPT)
- **Step 4**: Document Upload (birth certificate, diploma, photo, ID)
- **Step 5**: Payment Selection (MTN MoMo, Orange Money, Bank Card)
- Progress indicator and validation

### 4. Candidate Dashboard
- Application status cards (approved/pending/rejected)
- Document verification status
- Payment confirmation
- Exam schedule and center assignment
- Application timeline
- Quick actions (download slip, view form, download receipt)
- Important dates section

### 5. Admin Dashboard
- **Statistics Cards**: Total candidates, completed registrations, payments, pending applications
- **Data Visualizations**:
  - Bar Chart: Candidates by region (8 regions)
  - Pie Chart: Candidates by program (ITT, IPT, TT, CPT)
- **Candidate Management Table**:
  - Searchable and filterable
  - Filters: Region, Program, Payment Status, Application Status
  - Export functionality
- Real-time candidate data management

### 6. Result Check System
- Candidate number lookup
- Animated result display
- **Admitted Status**: Score, rank, congratulations animation, confetti effect
- **Not Admitted Status**: Score, guidance for next steps
- Download result certificate functionality

### 7. AI Chatbot Assistant
- Floating button with notification badge
- Animated chat window
- Smart responses for:
  - Registration process
  - Required documents
  - Exam dates and deadlines
  - Program information
  - Payment details
  - Contact information
- Quick question buttons

## Design System

### Color Palette
- **Primary**: #0A2A66 (Deep Academic Blue)
- **Secondary**: #00AEEF (Telecom Blue)
- **Accent**: #FF7A00 (Orange Highlight)
- **Background**: #F7F9FC
- **Text**: #1F2937

### Typography
- **Headings**: Poppins (400, 500, 600, 700)
- **Body Text**: Inter (300, 400, 500, 600, 700)

### UI Components
- Rounded cards with soft shadows
- Minimalist layout with large spacing
- Professional icons (Lucide React)
- Grid-based structure (12-column, 1440px max-width)
- Responsive design for desktop and tablet

## User Flows

### Candidate Flow
1. Visit landing page → Learn about programs
2. Register account → Complete application form
3. Upload documents → Make payment
4. Access dashboard → Check application status
5. Check results → Download certificates

### Admin Flow
1. Login with admin credentials (admin@supptic.cm)
2. View comprehensive statistics
3. Analyze data visualizations
4. Manage candidate applications
5. Filter and search candidates
6. Export data for reports

## Technical Stack
- **Framework**: React 18.3.1
- **Routing**: React Router 7.13.0 (Data mode)
- **Styling**: Tailwind CSS 4.1.12
- **UI Components**: Radix UI + Custom components
- **Charts**: Recharts 2.15.2
- **Icons**: Lucide React 0.487.0
- **Animations**: Motion (Framer Motion) 12.23.24
- **Forms**: React Hook Form 7.55.0
- **Notifications**: Sonner 2.0.3
- **Confetti**: Canvas Confetti 1.9.4

## Demo Credentials
- **Regular User**: Any email address
- **Admin User**: admin@supptic.cm (redirects to admin dashboard)

## Important Dates (Mock Data)
- **Registration Deadline**: March 31, 2026
- **Examination Date**: April 15, 2026
- **Results Publication**: May 30, 2026

## Programs Offered
1. **ITT** - Ingénieurs des Travaux des Télécommunications (3 years)
2. **IPT** - Inspecteurs des Postes et Télécommunications (3 years)
3. **TT** - Techniciens des Télécommunications (2 years)
4. **CPT** - Contrôleurs des Postes et Télécommunications (2 years)

## Features Highlights
✅ Modern, government-grade UI design
✅ Multi-step form with progress tracking
✅ Document upload with drag-and-drop
✅ Real-time data visualizations
✅ Intelligent chatbot assistant
✅ Comprehensive admin dashboard
✅ Mobile-responsive layout
✅ Accessibility-focused design
✅ Professional color scheme
✅ Smooth animations and transitions
✅ Toast notifications
✅ Status badges and indicators
✅ Export and download functionality

## Contact Information (Mock)
- **Email**: info@supptic.cm
- **Support**: support@supptic.cm
- **Phone**: +237 222 XX XX XX
- **Location**: Yaoundé, Cameroon
- **Hours**: Monday-Friday, 8AM-5PM
