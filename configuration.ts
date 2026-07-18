import * as pulumi from "@pulumi/pulumi";

export const gcpConfig = new pulumi.Config("gcp");
export const stackName = pulumi.getStack();
