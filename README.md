# Amity WorkGraph

### Internal Campus Opportunity Infrastructure

Amity WorkGraph is a closed-network collaboration and opportunity platform designed for students and faculty within a university environment.

The platform explores how trusted institutional systems can support freelance work, collaborative projects, research opportunities, and campus coordination through role-based infrastructure and structured workflows.

---

# Overview

Amity WorkGraph started as an attempt to solve a recurring campus problem:

opportunities existed, but access to them was fragmented, informal, and inconsistent.

Students often discovered freelance work, research opportunities, or collaborative projects through disconnected WhatsApp groups, personal networks, or scattered announcements. Faculty faced similar friction while trying to identify reliable collaborators or distribute opportunities efficiently.

The platform was designed as a structured internal system where verified students and faculty could:
- post opportunities
- submit applications
- review candidates
- manage workflows
- coordinate collaborations

within a trusted institutional environment.

Instead of functioning like a public marketplace, Amity WorkGraph focuses on closed-network infrastructure built around verified campus identity systems.

---

# Core Idea

Most opportunity systems inside universities operate through fragmented communication channels.

This creates:
- poor discoverability
- inconsistent trust
- duplicate coordination effort
- weak institutional memory
- scattered collaboration pipelines

Amity WorkGraph attempts to centralize these systems through:
- verified identity infrastructure
- role-based workflows
- structured applications
- persistent dashboards
- centralized opportunity discovery

---

# Key Features

## Role-Based Identity System

Separate workflows for:
- students
- faculty

Enrollment-based identity logic ensures all activity remains tied to verified institutional users.

---

## Opportunity Posting System

Faculty and students can:
- publish opportunities
- define compensation
- specify requirements
- manage application pipelines

---

## Structured Application Workflows

Applicants can:
- submit proposals
- place bids
- track application status
- manage participation history

Posters can:
- review candidates
- accept/reject applications
- manage workflow progression

---

## Dynamic Opportunity Feed

Multi-dimensional filtering system supporting:
- role-based discovery
- opportunity browsing
- application tracking
- dashboard persistence

---

## Iterative Authentication Architecture

The authentication system evolved across multiple implementation stages:

### V1
Static client-side authentication prototype.

### V2
Enrollment-based identity resolution using backend user creation logic.

### V3
bcrypt-secured password authentication with durable identity persistence and cryptographic verification.

---

# System Architecture

```text
Frontend Client
    ↓
Authentication Layer
    ↓
REST API Gateway
    ↓
Application Logic
    ↓
SQLite Database
    ↓
Role-Based Workflow System
