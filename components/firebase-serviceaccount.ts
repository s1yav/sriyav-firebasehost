import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

/**
 * Arguments for creating Firebase service accounts and configuring cross-project IAM permissions.
 */
export interface FirebaseServiceAccountArgs {
    /**
     * The Google Cloud project ID.
     */
    projectId: pulumi.Input<string>;

    /**
     * The email of the cross-project GitOps Cloud Build service account.
     */
    gitopsCloudbuildSa: pulumi.Input<string>;
}

/**
 * A ComponentResource that provisions the App Hosting Compute service account, configures compute runner IAM bindings,
 * and grants cross-project permissions (Editor and project IAM Admin) to the GitOps Cloud Build service account.
 */
export class FirebaseServiceAccount extends pulumi.ComponentResource {
    /**
     * The custom Firebase App Hosting compute service account.
     */
    public readonly appHostingServiceAccountCompute: gcp.serviceaccount.Account;

    /**
     * The IAM binding granting the App Hosting runner role to the compute service account.
     */
    public readonly appHostingIamMemberRunner: gcp.projects.IAMMember;

    /**
     * The cross-project Editor IAM binding for the GitOps Cloud Build service account.
     */
    public readonly crossProjectIamMemberEditor: gcp.projects.IAMMember;

    /**
     * The cross-project Project IAM Admin binding for the GitOps Cloud Build service account.
     */
    public readonly crossProjectIamMemberIamAdmin: gcp.projects.IAMMember;

    /**
     * Creates a new instance of FirebaseServiceAccount.
     *
     * @param name The logical name of the resource.
     * @param args The arguments to configure the resource.
     * @param opts A bag of options that controls this resource's behavior.
     */
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
