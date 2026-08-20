import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { Account as ServiceAccount } from "gcp-constructs/serviceaccount/account";
import {
    PRODUCT_MANAGER_IDENTITY_TYPE,
    PRODUCT_MANAGER_IDENTITY_RESOURCE_SUFFIX,
    PRODUCT_MANAGER_OWNER_ROLE_RESOURCE_SUFFIX,
    OWNER_ROLE,
} from "../constants";

export interface ProductManagerIdentityArgs {
    /**
     * The Google Cloud project ID.
     */
    projectId: pulumi.Input<string>;

    /**
     * The service account ID username.
     */
    accountId: pulumi.Input<string>;

    /**
     * The display name of the service account.
     */
    displayName: pulumi.Input<string>;

    /**
     * The GCP IAM role to bind to the project.
     */
    role?: pulumi.Input<string>;
}

interface ProductManagerIdentityOutputs {
    serviceAccount: ServiceAccount;
    serviceAccountEmail: pulumi.Output<string>;
    iamMember: gcp.projects.IAMMember;
}

/**
 * ProductManagerIdentity
 * ComponentResource for creating the Product Manager Agent service account with permissions to run the container image.
 */
export class ProductManagerIdentity extends pulumi.ComponentResource {
    public readonly serviceAccount: ServiceAccount;
    public readonly serviceAccountEmail: pulumi.Output<string>;
    public readonly iamMember: gcp.projects.IAMMember;
    private readonly parentName: string;
    private readonly parentArgs: ProductManagerIdentityArgs;

    constructor(name: string, args: ProductManagerIdentityArgs, opts?: pulumi.ComponentResourceOptions) {
        super(PRODUCT_MANAGER_IDENTITY_TYPE, name, args, opts);
        this.parentName = name;
        this.parentArgs = args;

        this.serviceAccount = this.constructServiceAccount();
        this.serviceAccountEmail = this.serviceAccount.account.email;
        this.iamMember = this.constructIamMember();

        const parentOutputs = this.constructParentOutputs();
        this.registerOutputs(parentOutputs);
    }

    private constructServiceAccount(): ServiceAccount {
        const saResourceName = this.constructServiceAccountResourceName();
        return new ServiceAccount(
            saResourceName,
            {
                accountId: this.parentArgs.accountId,
                displayName: this.parentArgs.displayName,
                project: this.parentArgs.projectId,
            },
            { parent: this }
        );
    }

    private constructIamMember(): gcp.projects.IAMMember {
        const iamResourceName = this.constructIamMemberResourceName();
        return new gcp.projects.IAMMember(
            iamResourceName,
            {
                project: this.parentArgs.projectId,
                role: this.parentArgs.role ?? OWNER_ROLE,
                member: this.constructServiceAccountOwnerRoleMemberIdentity(),
            },
            { parent: this }
        );
    }

    private constructParentOutputs(): ProductManagerIdentityOutputs {
        return {
            serviceAccount: this.serviceAccount,
            serviceAccountEmail: this.serviceAccountEmail,
            iamMember: this.iamMember,
        };
    }

    private constructServiceAccountResourceName(): string {
        return this.constructChildResourceName(PRODUCT_MANAGER_IDENTITY_RESOURCE_SUFFIX);
    }

    private constructIamMemberResourceName(): string {
        return this.constructChildResourceName(PRODUCT_MANAGER_OWNER_ROLE_RESOURCE_SUFFIX);
    }

    private constructServiceAccountOwnerRoleMemberIdentity(): pulumi.Input<string> {
        return this.constructServiceAccountMemberIdentity(this.serviceAccountEmail);
    }

    private constructChildResourceName(resourceName: string): string {
        return `${this.parentName}-${resourceName}`;
    }

    private constructServiceAccountMemberIdentity(serviceAccountEmail: pulumi.Input<string>): pulumi.Input<string> {
        return pulumi.interpolate`serviceAccount:${serviceAccountEmail}`;
    }
}
