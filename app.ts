import { ProjectsServiceEnable } from "./components/projects-service-enable";
import * as pulumi from "@pulumi/pulumi";
import { FirebaseWebApp } from "./components/firebase-webapp";
import { FirebaseAppHostingServiceAccount } from "./components/firebase-apphosting-serviceaccount";
import { FirebaseApphost } from "./components/firebase-apphost";

// Initialize GCP Config and stack configurations
import {
    portfolioProjectId,
    region,
    stackName,
    websiteServerRepoName,
    gitopsCloudbuildSa,
    gitopsProjectId,
    dockerRegistryName,
    domainId,
    preferredCommit,
    imageTagFile,
    servingLocality,
    stackPrefix
} from "./configuration";

// 1. Enable Required GCP APIs
const sriyavProjectsServiceEnable = new ProjectsServiceEnable(`${stackPrefix}-projects-service-enable`, {
    projectId: portfolioProjectId,
});

// 2. Initialize Firebase and Web App
const sriyavFirebaseWebApp = new FirebaseWebApp(`${stackPrefix}-firebase-web-app`, {
    projectId: portfolioProjectId,
    displayName: websiteServerRepoName,
    firebaseService: sriyavProjectsServiceEnable.firebaseService,
});

// 3. Configure IAM Roles and Cross-Project permissions
const sriyavFirebaseAppHostingServiceAccount = new FirebaseAppHostingServiceAccount(`${stackPrefix}-firebase-apphosting-serviceaccount`, {
    projectId: portfolioProjectId,
    gitopsCloudbuildSa,
});

// 4. Deploy Firebase App Hosting Backend, Build, Traffic Splits, and Domain Mapping
const sriyavFirebaseApphost = new FirebaseApphost(`${stackPrefix}-firebase-apphost`, {
    projectId: portfolioProjectId,
    region,
    appId: sriyavFirebaseWebApp.firebaseWebApp.appId,
    appHostingServiceAccountEmail: sriyavFirebaseAppHostingServiceAccount.firebaseAppHostingServiceAccount.email,
    appHostingService: sriyavProjectsServiceEnable.firebaseapphostingService,
    appHostingServiceAccountIamMember: sriyavFirebaseAppHostingServiceAccount.firebaseAppHostingServiceAccountIamMember,
    gitopsProjectId,
    dockerRegistryName,
    domainId,
    preferredCommit,
    imageTagFile,
    websiteServerRepoName,
    servingLocality,
});

// Export the App Hosting URI and backend details
export const apex = sriyavFirebaseApphost.appHostingDomain.domainId.apply((domain: string) => `https://${domain}`);
export const subdomain = sriyavFirebaseApphost.appHostingSubDomain.domainId.apply((domain: string) => `https://${domain}`);
export const backendName = sriyavFirebaseApphost.appHostingBackend.backendId;
export const appName = sriyavFirebaseWebApp.firebaseWebApp.displayName;
export const domainStatus = sriyavFirebaseApphost.appHostingDomain.customDomainStatuses;
