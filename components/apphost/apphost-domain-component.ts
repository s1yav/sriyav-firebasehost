import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { ApphostBackendComponent } from "./apphost-backend-component";
import {
    APPHOST_DOMAIN_COMPONENT_TYPE,
    APPHOST_DOMAIN_RESOURCE_SUFFIX,
    APPHOST_SUBDOMAIN_RESOURCE_SUFFIX,
    WWW_SUBDOMAIN_PREFIX,
} from "../../constants";

/**
 * Arguments for creating Firebase App Hosting custom domain mappings (apex domain and subdomain).
 */
export interface ApphostDomainComponentArgs {
    /**
     * The Google Cloud project ID.
     */
    projectId: pulumi.Input<string>;

    /**
     * The Google Cloud region.
     */
    region: pulumi.Input<string>;

    /**
     * The domain name to map to the App Hosting backend (e.g. sriyav.com).
     */
    domainId: pulumi.Input<string>;

    /**
     * The parent ApphostBackendComponent dependency.
     */
    backendComponent: ApphostBackendComponent;
}

interface ApphostDomainComponentOutputs {
    appHostingDomain: gcp.firebase.AppHostingDomain;
    appHostingSubDomain: gcp.firebase.AppHostingDomain;
}

/**
 * A ComponentResource that provisions custom domain mappings (apex domain and www subdomain) for Firebase App Hosting.
 */
export class ApphostDomainComponent extends pulumi.ComponentResource {
    public readonly appHostingDomain: gcp.firebase.AppHostingDomain;
    public readonly appHostingSubDomain: gcp.firebase.AppHostingDomain;

    private readonly projectId: pulumi.Input<string>;
    private readonly region: pulumi.Input<string>;

    private readonly parentComponentName: string;
    private readonly parentComponentArgs: ApphostDomainComponentArgs;
    private readonly parentComponentOutputs: ApphostDomainComponentOutputs;

    constructor(name: string, args: ApphostDomainComponentArgs, opts?: pulumi.ComponentResourceOptions) {
        super(APPHOST_DOMAIN_COMPONENT_TYPE, name, args, opts);
        this.parentComponentName = name;
        this.parentComponentArgs = args;

        this.projectId = args.projectId;
        this.region = args.region;

        this.appHostingDomain = this.createApexDomain();
        this.appHostingSubDomain = this.createSubDomain();

        this.parentComponentOutputs = this.constructParentComponentOutputs();
        this.registerOutputs(this.parentComponentOutputs);
    }

    private constructParentComponentOutputs(): ApphostDomainComponentOutputs {
        return {
            appHostingDomain: this.appHostingDomain,
            appHostingSubDomain: this.appHostingSubDomain,
        };
    }

    private createApexDomain(): gcp.firebase.AppHostingDomain {
        const resourceName = this.constructChildResourceName(APPHOST_DOMAIN_RESOURCE_SUFFIX);
        const domainArgs = this.constructDomainArgs(this.parentComponentArgs.domainId);
        const options = this.constructDomainResourceOptions();
        return new gcp.firebase.AppHostingDomain(resourceName, domainArgs, options);
    }

    private createSubDomain(): gcp.firebase.AppHostingDomain {
        const resourceName = this.constructChildResourceName(APPHOST_SUBDOMAIN_RESOURCE_SUFFIX);
        const subDomainId = this.constructSubDomainId();
        const domainArgs = this.constructDomainArgs(subDomainId);
        const options = this.constructDomainResourceOptions();
        return new gcp.firebase.AppHostingDomain(resourceName, domainArgs, options);
    }

    private constructSubDomainId(): pulumi.Output<string> {
        return pulumi.interpolate`${WWW_SUBDOMAIN_PREFIX}${this.parentComponentArgs.domainId}`;
    }

    private constructDomainResourceOptions(): pulumi.ComponentResourceOptions {
        const dependsOn = this.resolveDomainDependencies();
        return { parent: this, dependsOn };
    }

    private resolveDomainDependencies(): pulumi.Resource[] {
        return [this.parentComponentArgs.backendComponent];
    }

    private constructDomainArgs(targetDomainId: pulumi.Input<string>): gcp.firebase.AppHostingDomainArgs {
        return {
            project: this.projectId,
            location: this.region,
            backend: this.resolveBackendId(),
            domainId: targetDomainId,
        };
    }

    private resolveBackendId(): pulumi.Input<string> {
        return this.parentComponentArgs.backendComponent.appHostingBackend.backendId;
    }

    private constructChildResourceName(resourceSuffix: string): string {
        return `${this.parentComponentName}-${resourceSuffix}`;
    }
}
