import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import {
    IDENTITY_COMPONENT_TYPE,
    FIREBASE_SA_RESOURCE_SUFFIX,
    FIREBASE_SA_IMPERSONATOR_RESOURCE_SUFFIX,
    FIREBASE_SA_OWNER_ROLE_MEMBER_RESOURCE_SUFFIX,
    TOKEN_CREATOR_ROLE,
    OWNER_ROLE,
    FIREBASE_SA_ID,
    FIREBASE_SA_DISPLAY_NAME,
} from "../constants";

export interface IdentityComponentArgs {
    /**
     * The Google Cloud project ID.
     */
    projectId: pulumi.Input<string>;
    /**
     * The email of the cross-project GitOps Cloud Build service account.
     */
    gitopsCloudbuildSa: pulumi.Input<string>;
}

interface IdentityComponentOutputs {
    readonly firebaseServiceAccount: gcp.serviceaccount.Account;
    readonly firebaseServiceAccountOwnerRoleMember: gcp.projects.IAMMember;
    readonly firebaseServiceAccountImpersonator: gcp.serviceaccount.IAMMember;
}

export class IdentityComponent extends pulumi.ComponentResource {
    public readonly firebaseServiceAccount: gcp.serviceaccount.Account;
    public readonly firebaseServiceAccountOwnerRoleMember: gcp.projects.IAMMember;
    public readonly firebaseServiceAccountImpersonator: gcp.serviceaccount.IAMMember;
    private readonly parentComponentName: string;
    private readonly parentComponentArgs: IdentityComponentArgs;
    private readonly parentComponentOutputs: IdentityComponentOutputs;

    constructor(name: string, args: IdentityComponentArgs, opts?: pulumi.ComponentResourceOptions) {
        super(IDENTITY_COMPONENT_TYPE, name, args, opts);
        this.parentComponentName = name;
        this.parentComponentArgs = args;
        this.firebaseServiceAccount = this.constructFirebaseSa();
        this.firebaseServiceAccountOwnerRoleMember = this.constructFirebaseSaOwnerRoleMember();
        this.firebaseServiceAccountImpersonator = this.constructFirebaseSaImpersonator();

        this.parentComponentOutputs = this.constructParentComponentOutputs();
        this.registerOutputs(this.parentComponentOutputs);
    }

    private constructParentComponentOutputs(): IdentityComponentOutputs {
        return {
            firebaseServiceAccount: this.firebaseServiceAccount,
            firebaseServiceAccountOwnerRoleMember: this.firebaseServiceAccountOwnerRoleMember,
            firebaseServiceAccountImpersonator: this.firebaseServiceAccountImpersonator,
        };
    }

    private constructFirebaseSa(): gcp.serviceaccount.Account {
        const firebaseSaResourceName = this.constructFirebaseSaResourceName();
        const firebaseSaArgs = this.constructFirebaseSaArgs();
        return new gcp.serviceaccount.Account(firebaseSaResourceName, firebaseSaArgs, { parent: this });
    }

    private constructFirebaseSaResourceName(): string {
        return this.constructChildResourceName(FIREBASE_SA_RESOURCE_SUFFIX);
    }

    private constructFirebaseSaArgs(): gcp.serviceaccount.AccountArgs {
        return {
            project: this.parentComponentArgs.projectId,
            accountId: FIREBASE_SA_ID,
            displayName: FIREBASE_SA_DISPLAY_NAME,
        };
    }

    private constructFirebaseSaImpersonator(): gcp.serviceaccount.IAMMember {
        const firebaseSaImpersonatorResourceName = this.constructFirebaseSaImpersonatorResourceName();
        const firebaseSaImpersonatorArgs = this.constructFirebaseSaImpersonatorArgs();
        return new gcp.serviceaccount.IAMMember(firebaseSaImpersonatorResourceName, firebaseSaImpersonatorArgs, { parent: this });
    }

    private constructFirebaseSaImpersonatorResourceName(): string {
        return this.constructChildResourceName(FIREBASE_SA_IMPERSONATOR_RESOURCE_SUFFIX);
    }

    private constructFirebaseSaImpersonatorArgs(): gcp.serviceaccount.IAMMemberArgs {
        return {
            serviceAccountId: this.firebaseServiceAccount.name,
            role: TOKEN_CREATOR_ROLE,
            member: this.constructFirebaseSaImpersonatorIdentity(),
        };
    }

    private constructFirebaseSaImpersonatorIdentity(): pulumi.Input<string> {
        return this.constructServiceAccountMemberIdentity(this.parentComponentArgs.gitopsCloudbuildSa);
    }

    private constructFirebaseSaOwnerRoleMember(): gcp.projects.IAMMember {
        const firebaseSaOwnerRoleMemberResourceName = this.constructFirebaseSaOwnerRoleMemberResourceName();
        const firebaseSaOwnerRoleMemberArgs = this.constructFirebaseSaOwnerRoleMemberArgs();
        return new gcp.projects.IAMMember(firebaseSaOwnerRoleMemberResourceName, firebaseSaOwnerRoleMemberArgs, { parent: this });
    }

    private constructFirebaseSaOwnerRoleMemberResourceName(): string {
        return this.constructChildResourceName(FIREBASE_SA_OWNER_ROLE_MEMBER_RESOURCE_SUFFIX);
    }

    private constructFirebaseSaOwnerRoleMemberArgs(): gcp.projects.IAMMemberArgs {
        return {
            project: this.parentComponentArgs.projectId,
            role: OWNER_ROLE,
            member: this.constructFirebaseSaOwnerRoleMemberIdentity(),
        };
    }

    private constructFirebaseSaOwnerRoleMemberIdentity(): pulumi.Input<string> {
        return this.constructServiceAccountMemberIdentity(this.firebaseServiceAccount.email);
    }

    private constructChildResourceName(resourceName: string): string {
        return `${this.parentComponentName}-${resourceName}`;
    }

    private constructServiceAccountMemberIdentity(serviceAccountEmail: pulumi.Input<string>): pulumi.Input<string> {
        return pulumi.interpolate`serviceAccount:${serviceAccountEmail}`;
    }
}
