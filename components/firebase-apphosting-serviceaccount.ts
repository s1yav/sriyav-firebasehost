import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

/**
 * Arguments for creating Firebase service accounts and configuring cross-project IAM permissions.
 */
export interface FirebaseAppHostingServiceAccountArgs {
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
export class FirebaseAppHostingServiceAccount extends pulumi.ComponentResource {
    /**
     * The custom Firebase App Hosting compute service account.
     */
    public readonly firebaseAppHostingServiceAccount: gcp.serviceaccount.Account;

    /**
     * The IAM binding granting the App Hosting runner role to the compute service account.
     */
    public readonly firebaseAppHostingIamMemberRunner: gcp.projects.IAMMember;

    /**
     * The cross-project Editor IAM binding for the GitOps Cloud Build service account.
     */
    public readonly crossProjectIamMemberEditor: gcp.projects.IAMMember;

    /**
     * The cross-project Project IAM Admin binding for the GitOps Cloud Build service account.
     */
    public readonly crossProjectIamMemberIamAdmin: gcp.projects.IAMMember;

    /**
     * Creates a new instance of FirebaseAppHostingServiceAccount.
     *
     * @param name The logical name of the resource.
     * @param args The arguments to configure the resource.
     * @param opts A bag of options that controls this resource's behavior.
     */
    constructor(name: string, args: FirebaseAppHostingServiceAccountArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:FirebaseServiceAccount", name, args, opts);

        this.firebaseAppHostingServiceAccount = new gcp.serviceaccount.Account(`${name}-sa`, {
            project: args.projectId,
            accountId: "sriyav-firebasehost-sa",
            displayName: "Firebase App Hosting compute service account",
        }, { parent: this });

        this.firebaseAppHostingIamMemberRunner = new gcp.projects.IAMMember(`${name}-iammember-runner`, {
            project: args.projectId,
            role: "roles/firebaseapphosting.computeRunner",
            member: pulumi.interpolate`serviceAccount:${this.firebaseAppHostingServiceAccount.email}`,
        }, { parent: this });

        this.crossProjectIamMemberEditor = new gcp.projects.IAMMember(`${name}-cross-project-iammember-editor`, {
            project: args.projectId,
            role: "roles/editor",
            member: pulumi.interpolate`serviceAccount:${args.gitopsCloudbuildSa}`,
        }, { parent: this });

        this.crossProjectIamMemberIamAdmin = new gcp.projects.IAMMember(`${name}-cross-project-iammember-iamadmin`, {
            project: args.projectId,
            role: "roles/resourcemanager.projectIamAdmin",
            member: pulumi.interpolate`serviceAccount:${args.gitopsCloudbuildSa}`,
        }, { parent: this });

        this.registerOutputs({
            firebaseAppHostingServiceAccount: this.firebaseAppHostingServiceAccount,
            firebaseAppHostingIamMemberRunner: this.firebaseAppHostingIamMemberRunner,
            crossProjectIamMemberEditor: this.crossProjectIamMemberEditor,
            crossProjectIamMemberIamAdmin: this.crossProjectIamMemberIamAdmin,
        });
    }
}
