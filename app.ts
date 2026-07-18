import { ProjectsServiceEnable } from "./components/projects-service-enable";
import * as pulumi from "@pulumi/pulumi";
import { FirebaseWebApp } from "./components/firebase-webapp";
import { FirebaseServiceAccount } from "./components/firebase-serviceaccount";
import { FirebaseApphost } from "./components/firebase-apphost";

// Initialize GCP Config
import { gcpConfig, stackName } from "./configuration";
const projectId = gcpConfig.require("project");
const region = gcpConfig.require("region");

// 1. Enable Required GCP APIs
const sriyavProjectsServiceEnable = new ProjectsServiceEnable("sriyav-services", {
    projectId: projectId,
});

// 2. Initialize Firebase and Web App
const sriyavFirebaseWebApp = new FirebaseWebApp("sriyav-portfolio", {
    projectId: projectId,
    displayName: "sriyav-portfolio",
    firebaseService: sriyavProjectsServiceEnable.firebaseService,
});

// 3. Configure IAM Roles and Cross-Project permissions
// Gitops uses the custom service account s1yav-cloudbuild-sa
const gitopsCloudbuildSa = "s1yav-cloudbuild-sa@sriyav0599-gitops.iam.gserviceaccount.com";

const sriyavFirebaseServiceAccount = new FirebaseServiceAccount("sriyav-iam", {
    projectId: projectId,
    gitopsCloudbuildSa: gitopsCloudbuildSa,
});

// 4. Deploy Firebase App Hosting Backend, Build, Traffic Splits, and Domain Mapping
const sriyavFirebaseApphost = new FirebaseApphost("sriyav-portfolio", {
    projectId: projectId,
    region: region,
    appId: sriyavFirebaseWebApp.firebaseWebApp.appId,
    computeServiceAccountEmail: sriyavFirebaseServiceAccount.appHostingServiceAccountCompute.email,
    appHostingService: sriyavProjectsServiceEnable.firebaseapphostingService,
    appHostingIamMemberRunner: sriyavFirebaseServiceAccount.appHostingIamMemberRunner,
});

// Export the App Hosting URI and backend details
export const backendUri = sriyavFirebaseApphost.appHostingDomain.domainId.apply((domain: string) => `https://${domain}`);
export const backendName = sriyavFirebaseApphost.appHostingBackend.backendId;
export const appName = sriyavFirebaseWebApp.firebaseWebApp.displayName;
export const domainStatus = sriyavFirebaseApphost.appHostingDomain.customDomainStatuses;
