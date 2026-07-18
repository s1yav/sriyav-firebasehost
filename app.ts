import { EnableService } from "./enable-service";
import * as pulumi from "@pulumi/pulumi";
import { FirebaseWebApp } from "./components/firebase-webapp";
import { ServiceAccount } from "./components/service-account";
import { AppHostingDeployment } from "./components/app-hosting";

// Initialize GCP Config
import { gcpConfig, stackName } from "./configuration";
const projectId = gcpConfig.require("project");
const region = gcpConfig.require("region");

// 1. Enable Required GCP APIs
const services = new EnableService("sriyav-services", {
    projectId: projectId,
});

// 2. Initialize Firebase and Web App
const firebaseWebApp = new FirebaseWebApp("sriyav-portfolio", {
    projectId: projectId,
    displayName: "sriyav-portfolio",
    firebaseService: services.firebaseService,
});

// 3. Configure IAM Roles and Cross-Project permissions
// Gitops uses the custom service account s1yav-cloudbuild-sa
const gitopsCloudbuildSa = "s1yav-cloudbuild-sa@sriyav0599-gitops.iam.gserviceaccount.com";

const serviceAccount = new ServiceAccount("sriyav-iam", {
    projectId: projectId,
    gitopsCloudbuildSa: gitopsCloudbuildSa,
});

// 4. Deploy Firebase App Hosting Backend, Build, Traffic Splits, and Domain Mapping
const appHosting = new AppHostingDeployment("sriyav-portfolio", {
    projectId: projectId,
    region: region,
    appId: firebaseWebApp.webApp.appId,
    computeServiceAccountEmail: serviceAccount.appHostingComputeSa.email,
    apphostingService: services.apphostingService,
    appHostingSaRunner: serviceAccount.appHostingSaRunner,
});

// Export the App Hosting URI and backend details
export const backendUri = appHosting.appHostingBackend.uri;
export const backendName = appHosting.appHostingBackend.name;
export const buildName = appHosting.appHostingBuild.name;
export const domainStatus = appHosting.appHostingDomain.customDomainStatuses;
