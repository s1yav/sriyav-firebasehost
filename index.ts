import * as pulumi from "@pulumi/pulumi";
import { ProjectServices } from "./constructs/services";
import { FirebaseApp } from "./constructs/firebase-app";
import { PlatformIam } from "./constructs/iam";
import { AppHostingDeployment } from "./constructs/app-hosting";

// Initialize GCP Config
const gcpConfig = new pulumi.Config("gcp");
const projectId = gcpConfig.require("project");
const region = gcpConfig.require("region");

// 1. Enable Required GCP APIs
const services = new ProjectServices("sriyav-services", {
    projectId: projectId,
});

// 2. Initialize Firebase and Web App
const firebaseApp = new FirebaseApp("sriyav-portfolio", {
    projectId: projectId,
    displayName: "sriyav-portfolio",
    firebaseService: services.firebaseService,
});

// 3. Configure IAM Roles and Cross-Project permissions
// Gitops uses the custom service account s1yav-cloudbuild-sa
const gitopsCloudbuildSa = "s1yav-cloudbuild-sa@sriyav0599-gitops.iam.gserviceaccount.com";

const iam = new PlatformIam("sriyav-iam", {
    projectId: projectId,
    gitopsCloudbuildSa: gitopsCloudbuildSa,
});

// 4. Deploy Firebase App Hosting Backend, Build, Traffic Splits, and Domain Mapping
const appHosting = new AppHostingDeployment("sriyav-portfolio", {
    projectId: projectId,
    region: region,
    appId: firebaseApp.webApp.appId,
    computeServiceAccountEmail: iam.appHostingComputeSa.email,
    apphostingService: services.apphostingService,
    appHostingSaRunner: iam.appHostingSaRunner,
});

// Export the App Hosting URI and backend details
export const backendUri = appHosting.appHostingBackend.uri;
export const backendName = appHosting.appHostingBackend.name;
export const buildName = appHosting.appHostingBuild.name;
export const domainStatus = appHosting.appHostingDomain.customDomainStatuses;
