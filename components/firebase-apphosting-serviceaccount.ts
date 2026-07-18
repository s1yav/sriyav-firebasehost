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
     * The IAM member binding allowing the Cloud Build service account to impersonate this service account.
     */
    public readonly impersonationIamMember: gcp.serviceaccount.IAMMember;

    /**
     * The project IAM member that allows owner access to the firebase app hosting service on the project level
     */
    public readonly firebaseAppHostingServiceAccountIamMember: gcp.projects.IAMMember;

    /**
     * Creates a new instance of FirebaseAppHostingServiceAccount.
     *
     * @param name The logical name of the resource.
     * @param args The arguments to configure the resource.
     * @param opts A bag of options that controls this resource's behavior.
     */
    constructor(name: string, args: FirebaseAppHostingServiceAccountArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:FirebaseAppHostingServiceAccount", name, args, opts);

        this.firebaseAppHostingServiceAccount = new gcp.serviceaccount.Account(`${name}-sa`, {
            project: args.projectId,
            accountId: "sriyav-firebasehost-sa",
            displayName: "Firebase App Hosting compute service account",
        }, { parent: this });

        this.firebaseAppHostingServiceAccountIamMember = new gcp.projects.IAMMember(`${name}-iam-member`, {
            project: args.projectId,
            role: "roles/owner",
            member: pulumi.interpolate`serviceAccount:${this.firebaseAppHostingServiceAccount.email}`,
        }, { parent: this });

        this.impersonationIamMember = new gcp.serviceaccount.IAMMember(`${name}-impersonation-iam-memeber`, {
            serviceAccountId: this.firebaseAppHostingServiceAccount.name,
            role: "roles/iam.serviceAccountTokenCreator",
            member: pulumi.interpolate`serviceAccount:${args.gitopsCloudbuildSa}`,
        }, { parent: this });

        this.registerOutputs({
            firebaseAppHostingServiceAccount: this.firebaseAppHostingServiceAccount,
            firebaseAppHostingServiceAccountIamMember: this.firebaseAppHostingServiceAccountIamMember,
            impersonationIamMember: this.impersonationIamMember,
        });
    }
}
