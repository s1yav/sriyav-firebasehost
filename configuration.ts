import * as pulumi from "@pulumi/pulumi";

export const gcpConfig = new pulumi.Config("gcp");
export const stackName = pulumi.getStack();
export const stackPrefix = "sriyav-firebase";

export const gitopsConfig = new pulumi.Config("gitops");
export const gitopsProjectId = gitopsConfig.requireSecret("projectId");
export const dockerRegistryName = gitopsConfig.requireSecret("dockerRegistryName");
