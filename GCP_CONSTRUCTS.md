# GCP Pulumi Constructs in sriyav-firebasehost

This document outlines the definitions and roles of each Google Cloud Platform (GCP) Pulumi construct used within the Firebase Web App and Firebase App Hosting components of this repository.

---

## 1. Firebase Web App Components (`components/firebase-webapp.ts`)

### **`gcp.firebase.Project`**
* **Definition**: A resource that registers an existing Google Cloud project with Firebase, enabling Firebase-specific developer services and APIs (like Auth, Firestore, Hosting, etc.) on top of the GCP project.
* **Role in this stack**: Serves as the parent resource required before any specific Firebase assets (like Web Apps or App Hosting backends) can be created.

### **`gcp.firebase.WebApp`**
* **Definition**: A resource representing a registered web application client within a Firebase Project. It registers the app profile and creates the unique `appId`.
* **Role in this stack**: Establishes the identity wrapper for your front-end code (such as your React app in `sriyav-portfolio`) and links it to the Firebase infrastructure.

---

## 2. Service Account and IAM Components (`components/firebase-apphosting-serviceaccount.ts`)

### **`gcp.serviceaccount.Account`**
* **Definition**: Represents a GCP Service Account—a special type of identity used by applications or VMs (not users) to make authorized API calls.
* **Role in this stack**: Creates a dedicated compute identity (`sriyav-firebasehost-sa`) that the App Hosting backend will run under, isolating its execution privileges.

### **`gcp.projects.IAMMember`** (Project-level IAM Binding)
* **Definition**: Grants a specific role (permissions) to a member (e.g., a user, group, or service account) at the project level.
* **Role in this stack**: Grants the `roles/owner` role to the newly created compute service account (`sriyav-firebasehost-sa`), allowing it full access to read and orchestrate project resources during runtime.

### **`gcp.serviceaccount.IAMMember`** (Service Account-level IAM Binding)
* **Definition**: Grants permissions *directly on* an individual service account resource itself (rather than project-wide).
* **Role in this stack**: Grants the `roles/iam.serviceAccountTokenCreator` role to the cross-project GitOps Cloud Build service account. This allows Cloud Build to impersonate the App Hosting runner service account (`sriyav-firebasehost-sa`) and generate tokens to deploy code on its behalf.

---

## 3. Firebase App Hosting Components (`components/firebase-apphost.ts`)

### **`gcp.firebase.AppHostingBackend`**
* **Definition**: Represents a Firebase App Hosting backend, which is the serverless execution environment designed to build and run modern server-rendered (SSR) web applications (like Next.js, Angular, or Vite-based hosts).
* **Role in this stack**: Deploys the hosting configuration, pointing to your website repository and assigning it the registered Web `appId` and runner service account.

### **`gcp.firebase.AppHostingBuild`**
* **Definition**: Represents a single deployment build (version) of the website, pointing to the Docker container image containing your application assets.
* **Role in this stack**: Ingests the built Docker image from your Artifact Registry repository, defining a deployable version for App Hosting.

### **`gcp.firebase.AppHostingTraffic`**
* **Definition**: Controls the routing policy and traffic splits between different builds of an App Hosting backend.
* **Role in this stack**: Configures a 100% traffic allocation split to direct all incoming user traffic to the newly created build.

### **`gcp.firebase.AppHostingDomain`**
* **Definition**: Maps custom domains to the Firebase App Hosting backend.
* **Role in this stack**: Provisions and configures the domain routing (e.g., mapping your custom domain `sriyav.com` to point to the App Hosting endpoint), initiating the SSL/TLS certificate generation automatically.
