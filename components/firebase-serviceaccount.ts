import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export interface FirebaseServiceAccountArgs {
    projectId: pulumi.Input<string>;
    gitopsCloudbuildSa: pulumi.Input<string>;
}

export class FirebaseServiceAccount extends pulumi.ComponentResource {
    public readonly appHostingComputeSa: gcp.serviceaccount.Account;
    public readonly appHostingSaRunner: gcp.projects.IAMMember;
    public readonly crossProjectBuildEditor: gcp.projects.IAMMember;
    public readonly crossProjectBuildIamAdmin: gcp.projects.IAMMember;

    constructor(name: string, args: FirebaseServiceAccountArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:FirebaseServiceAccount", name, args, {
            ...opts,
            aliases: [
                { type: "custom:components:PlatformIam" },
                { type: "custom:components:ServiceAccount" },
            ],
        });

        this.appHostingComputeSa = new gcp.serviceaccount.Account(`${name}-compute-sa`, {
            project: args.projectId,
            accountId: "firebase-app-hosting-compute",
            displayName: "Firebase App Hosting compute service account",
        }, { parent: this });

        this.appHostingSaRunner = new gcp.projects.IAMMember(`${name}-sa-runner`, {
            project: args.projectId,
            role: "roles/firebaseapphosting.computeRunner",
            member: pulumi.interpolate`serviceAccount:${this.appHostingComputeSa.email}`,
        }, { parent: this });

        this.crossProjectBuildEditor = new gcp.projects.IAMMember(`${name}-cross-project-editor`, {
            project: args.projectId,
            role: "roles/editor",
            member: pulumi.interpolate`serviceAccount:${args.gitopsCloudbuildSa}`,
        }, { parent: this });

        this.crossProjectBuildIamAdmin = new gcp.projects.IAMMember(`${name}-cross-project-iam-admin`, {
            project: args.projectId,
            role: "roles/resourcemanager.projectIamAdmin",
            member: pulumi.interpolate`serviceAccount:${args.gitopsCloudbuildSa}`,
        }, { parent: this });

        this.registerOutputs({
            appHostingComputeSa: this.appHostingComputeSa,
            appHostingSaRunner: this.appHostingSaRunner,
            crossProjectBuildEditor: this.crossProjectBuildEditor,
            crossProjectBuildIamAdmin: this.crossProjectBuildIamAdmin,
        });
    }
}
