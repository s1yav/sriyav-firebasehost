import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import {
    APPHOST_BACKEND_COMPONENT_TYPE,
    APPHOST_BACKEND_RESOURCE_SUFFIX,
} from "../../constants";

/**
 * Arguments for creating the Firebase App Hosting Backend resource.
 */
export interface ApphostBackendComponentArgs {
    /**
     * The Google Cloud project ID. Optional if inherited from parent component.
     */
    projectId?: pulumi.Input<string>;

    /**
     * The Google Cloud region. Optional if inherited from parent component.
     */
    region?: pulumi.Input<string>;

    /**
     * The name of the website source repository (e.g. sriyav-portfolio).
     */
    websiteServerRepoName: pulumi.Input<string>;

    /**
     * The associated Firebase Web App ID.
     */
    appId: pulumi.Input<string>;

    /**
     * The serving locality configuration (e.g. GLOBAL_ACCESS).
     */
    servingLocality: pulumi.Input<string>;

    /**
     * The email of the compute service account used by App Hosting.
     */
    appHostingServiceAccountEmail: pulumi.Input<string>;

    /**
     * The enabled projects service resource dependency.
     */
    appHostingService: gcp.projects.Service;

    /**
     * The service account IAM member resource dependency.
     */
    appHostingServiceAccountIamMember: gcp.projects.IAMMember;
}

interface ApphostBackendComponentOutputs {
    appHostingBackend: gcp.firebase.AppHostingBackend;
}

/**
 * A ComponentResource that provisions the Firebase App Hosting Backend.
 */
export class ApphostBackendComponent extends pulumi.ComponentResource {
    public readonly appHostingBackend: gcp.firebase.AppHostingBackend;

    private readonly projectId: pulumi.Input<string>;
    private readonly region: pulumi.Input<string>;

    private readonly parentComponentName: string;
    private readonly parentComponentArgs: ApphostBackendComponentArgs;
    private readonly parentComponentOutputs: ApphostBackendComponentOutputs;

    constructor(name: string, args: ApphostBackendComponentArgs, opts?: pulumi.ComponentResourceOptions) {
        super(APPHOST_BACKEND_COMPONENT_TYPE, name, args, opts);
        this.parentComponentName = name;
        this.parentComponentArgs = args;

        this.projectId = this.extractProjectId(args.projectId);
        this.region = this.extractRegion(args.region);

        this.appHostingBackend = this.createAppHostingBackend();
        this.parentComponentOutputs = this.constructParentComponentOutputs();
        this.registerOutputs(this.parentComponentOutputs);
    }

    private extractProjectId(projectId?: pulumi.Input<string>): pulumi.Input<string> {
        if (!projectId) {
            throw new Error("ApphostBackendComponent requires projectId argument.");
        }
        return projectId;
    }

    private extractRegion(region?: pulumi.Input<string>): pulumi.Input<string> {
        if (!region) {
            throw new Error("ApphostBackendComponent requires region argument.");
        }
        return region;
    }

    private constructParentComponentOutputs(): ApphostBackendComponentOutputs {
        return {
            appHostingBackend: this.appHostingBackend,
        };
    }

    private createAppHostingBackend(): gcp.firebase.AppHostingBackend {
        const resourceName = this.constructChildResourceName(APPHOST_BACKEND_RESOURCE_SUFFIX);
        const backendArgs = this.constructBackendArgs();
        const options = this.constructBackendResourceOptions();
        return new gcp.firebase.AppHostingBackend(resourceName, backendArgs, options);
    }

    private constructBackendResourceOptions(): pulumi.ComponentResourceOptions {
        return {
            parent: this,
            dependsOn: this.constructBackendDependencies(),
        };
    }

    private constructBackendDependencies(): pulumi.Resource[] {
        return [
            this.parentComponentArgs.appHostingService,
            this.parentComponentArgs.appHostingServiceAccountIamMember,
        ];
    }

    private constructBackendArgs(): gcp.firebase.AppHostingBackendArgs {
        return {
            project: this.projectId,
            location: this.region,
            backendId: this.parentComponentArgs.websiteServerRepoName,
            appId: this.parentComponentArgs.appId,
            servingLocality: this.parentComponentArgs.servingLocality,
            serviceAccount: this.parentComponentArgs.appHostingServiceAccountEmail,
        };
    }

    private constructChildResourceName(resourceSuffix: string): string {
        return `${this.parentComponentName}-${resourceSuffix}`;
    }
}
