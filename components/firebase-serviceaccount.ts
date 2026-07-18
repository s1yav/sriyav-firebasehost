import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export interface FirebaseServiceAccountArgs {
    projectId: pulumi.Input<string>;
    gitopsCloudbuildSa: pulumi.Input<string>;
}

export class FirebaseServiceAccount extends pulumi.ComponentResource {
    public readonly appHostingServiceAccountCompute: gcp.serviceaccount.Account;
    public readonly appHostingIamMemberRunner: gcp.projects.IAMMember;
    public readonly crossProjectIamMemberEditor: gcp.projects.IAMMember;
    public readonly crossProjectIamMemberIamAdmin: gcp.projects.IAMMember;

    constructor(name: string, args: FirebaseServiceAccountArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:FirebaseServiceAccount", name, args, opts);

        this.appHostingServiceAccountCompute = new gcp.serviceaccount.Account(`${name}-compute-sa`, {
            project: args.projectId,
            accountId: "firebase-app-hosting-compute",
            displayName: "Firebase App Hosting compute service account",
        }, { parent: this });

        this.appHostingIamMemberRunner = new gcp.projects.IAMMember(`${name}-sa-runner`, {
            project: args.projectId,
            role: "roles/firebaseapphosting.computeRunner",
            member: pulumi.interpolate`serviceAccount:${this.appHostingServiceAccountCompute.email}`,
        }, { parent: this });

        this.crossProjectIamMemberEditor = new gcp.projects.IAMMember(`${name}-cross-project-editor`, {
            project: args.projectId,
            role: "roles/editor",
            member: pulumi.interpolate`serviceAccount:${args.gitopsCloudbuildSa}`,
        }, { parent: this });

        this.crossProjectIamMemberIamAdmin = new gcp.projects.IAMMember(`${name}-cross-project-iam-admin`, {
            project: args.projectId,
            role: "roles/resourcemanager.projectIamAdmin",
            member: pulumi.interpolate`serviceAccount:${args.gitopsCloudbuildSa}`,
        }, { parent: this });

        this.registerOutputs({
            appHostingServiceAccountCompute: this.appHostingServiceAccountCompute,
            appHostingIamMemberRunner: this.appHostingIamMemberRunner,
            crossProjectIamMemberEditor: this.crossProjectIamMemberEditor,
            crossProjectIamMemberIamAdmin: this.crossProjectIamMemberIamAdmin,
        });
    }
}
