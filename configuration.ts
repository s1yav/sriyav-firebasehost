import * as pulumi from "@pulumi/pulumi";

export const gcpConfig = new pulumi.Config("gcp");
export const stackName = pulumi.getStack();
export const stackPrefix = "sriyav-firebase";

export const gitopsConfig = new pulumi.Config("gitops");
export const gitopsProjectId = gitopsConfig.requireSecret("projectId");
export const dockerRegistryName = gitopsConfig.requireSecret("dockerRegistryName");

export const appConfig = new pulumi.Config();
export const domainId = appConfig.require("domainId");
export const preferredCommit = appConfig.require("preferredCommit");
export const imageTagFile = appConfig.require("imageTagFile");
export const websiteServerRepoName = appConfig.require("websiteServerRepoName");
