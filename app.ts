import { ProjectsServiceEnable } from "./components/projects-service-enable";
import * as pulumi from "@pulumi/pulumi";
import { FirebaseWebApp } from "./components/firebase-webapp";
import { FirebaseServiceAccount } from "./components/firebase-serviceaccount";
import { FirebaseApphost } from "./components/firebase-apphost";

// Initialize GCP Config and stack configurations
import {
    gcpConfig,
    stackName,
    websiteServerRepoName,
    gitopsCloudbuildSa,
    gitopsProjectId,
    dockerRegistryName,
    domainId,
    preferredCommit,
    imageTagFile,
    servingLocality
} from "./configuration";

const projectId = gcpConfig.require("project");
const region = gcpConfig.require("region");

// 1. Enable Required GCP APIs
const sriyavProjectsServiceEnable = new ProjectsServiceEnable("sriyav-services", {
    projectId: projectId,
});

// 2. Initialize Firebase and Web App
const sriyavFirebaseWebApp = new FirebaseWebApp("sriyav-portfolio", {
    projectId,
    displayName: websiteServerRepoName,
    firebaseService: sriyavProjectsServiceEnable.firebaseService,
});

// 3. Configure IAM Roles and Cross-Project permissions
const sriyavFirebaseServiceAccount = new FirebaseServiceAccount("sriyav-iam", {
    projectId,
    gitopsCloudbuildSa,
});

// 4. Deploy Firebase App Hosting Backend, Build, Traffic Splits, and Domain Mapping
const sriyavFirebaseApphost = new FirebaseApphost("sriyav-portfolio", {
    projectId,
    region,
    appId: sriyavFirebaseWebApp.firebaseWebApp.appId,
    computeServiceAccountEmail: sriyavFirebaseServiceAccount.appHostingServiceAccountCompute.email,
    appHostingService: sriyavProjectsServiceEnable.firebaseapphostingService,
    appHostingIamMemberRunner: sriyavFirebaseServiceAccount.appHostingIamMemberRunner,
    gitopsProjectId,
    dockerRegistryName,
    domainId,
    preferredCommit,
    imageTagFile,
    websiteServerRepoName,
    servingLocality,
});

// Export the App Hosting URI and backend details
export const backendUri = sriyavFirebaseApphost.appHostingDomain.domainId.apply((domain: string) => `https://${domain}`);
export const backendName = sriyavFirebaseApphost.appHostingBackend.backendId;
export const appName = sriyavFirebaseWebApp.firebaseWebApp.displayName;
export const domainStatus = sriyavFirebaseApphost.appHostingDomain.customDomainStatuses;
