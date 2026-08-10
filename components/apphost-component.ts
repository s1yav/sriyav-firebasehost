import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { ApphostBackendComponent, ApphostBackendComponentArgs } from "./apphost/apphost-backend-component";
import { ApphostBuildComponent, ApphostBuildComponentArgs } from "./apphost/apphost-build-component";
import { ApphostTrafficComponent, ApphostTrafficComponentArgs } from "./apphost/apphost-traffic-component";
import { ApphostDomainComponent, ApphostDomainComponentArgs } from "./apphost/apphost-domain-component";
import {
    APPHOST_COMPONENT_TYPE,
    APPHOST_BACKEND_CHILD_SUFFIX,
    APPHOST_BUILD_CHILD_SUFFIX,
    APPHOST_TRAFFIC_CHILD_SUFFIX,
    APPHOST_DOMAIN_CHILD_SUFFIX,
} from "../constants";

/**
 * Arguments for configuring and deploying the Firebase App Hosting resources via child components.
 */
export interface ApphostComponentArgs {
    /**
     * The Google Cloud project ID.
     */
    projectId: pulumi.Input<string>;

    /**
     * The Google Cloud region.
     */
    region: pulumi.Input<string>;

    /**
     * Arguments for the ApphostBackendComponent.
     */
    backendComponentArgs: ApphostBackendComponentArgs;

    /**
     * Arguments for the ApphostBuildComponent.
     */
    buildComponentArgs: Omit<ApphostBuildComponentArgs, "backendComponent">;

    /**
     * Arguments for the ApphostTrafficComponent.
     */
    trafficComponentArgs?: Omit<ApphostTrafficComponentArgs, "backendComponent" | "buildComponent">;

    /**
     * Arguments for the ApphostDomainComponent.
     */
    domainComponentArgs: Omit<ApphostDomainComponentArgs, "backendComponent">;
}

interface ApphostComponentOutputs {
    appHostingBackend: gcp.firebase.AppHostingBackend;
    appHostingBuild: gcp.firebase.AppHostingBuild;
    appHostingTraffic: gcp.firebase.AppHostingTraffic;
    appHostingDomain: gcp.firebase.AppHostingDomain;
    appHostingSubDomain: gcp.firebase.AppHostingDomain;
}

/**
 * A ComponentResource that composes Firebase App Hosting child components (Backend, Build, Traffic, and Domain).
 */
export class ApphostComponent extends pulumi.ComponentResource {
    public readonly backendComponent: ApphostBackendComponent;
    public readonly buildComponent: ApphostBuildComponent;
    public readonly trafficComponent: ApphostTrafficComponent;
    public readonly domainComponent: ApphostDomainComponent;

    public readonly appHostingBackend: gcp.firebase.AppHostingBackend;
    public readonly appHostingBuild: gcp.firebase.AppHostingBuild;
    public readonly appHostingTraffic: gcp.firebase.AppHostingTraffic;
    public readonly appHostingDomain: gcp.firebase.AppHostingDomain;
    public readonly appHostingSubDomain: gcp.firebase.AppHostingDomain;

    private readonly parentComponentName: string;
    private readonly parentComponentArgs: ApphostComponentArgs;
    private readonly parentComponentOutputs: ApphostComponentOutputs;

    constructor(name: string, args: ApphostComponentArgs, opts?: pulumi.ComponentResourceOptions) {
        super(APPHOST_COMPONENT_TYPE, name, args, opts);
        this.parentComponentName = name;
        this.parentComponentArgs = args;

        this.backendComponent = this.createBackendComponent();
        this.appHostingBackend = this.backendComponent.appHostingBackend;

        this.buildComponent = this.createBuildComponent();
        this.appHostingBuild = this.buildComponent.appHostingBuild;

        this.trafficComponent = this.createTrafficComponent();
        this.appHostingTraffic = this.trafficComponent.appHostingTraffic;

        this.domainComponent = this.createDomainComponent();
        this.appHostingDomain = this.domainComponent.appHostingDomain;
        this.appHostingSubDomain = this.domainComponent.appHostingSubDomain;

        this.parentComponentOutputs = this.constructParentComponentOutputs();
        this.registerOutputs(this.parentComponentOutputs);
    }

    private constructParentComponentOutputs(): ApphostComponentOutputs {
        return {
            appHostingBackend: this.appHostingBackend,
            appHostingBuild: this.appHostingBuild,
            appHostingTraffic: this.appHostingTraffic,
            appHostingDomain: this.appHostingDomain,
            appHostingSubDomain: this.appHostingSubDomain,
        };
    }

    private createBackendComponent(): ApphostBackendComponent {
        const resourceName = this.constructChildResourceName(APPHOST_BACKEND_CHILD_SUFFIX);
        const backendArgs = this.constructBackendComponentArgs();
        const options = this.constructChildComponentResourceOptions();
        return new ApphostBackendComponent(resourceName, backendArgs, options);
    }

    private constructBackendComponentArgs(): ApphostBackendComponentArgs {
        return {
            ...this.constructCommonBackendComponentArgs(),
            ...this.parentComponentArgs.backendComponentArgs,
        };
    }

    private constructCommonBackendComponentArgs() {
        return {
            projectId: this.parentComponentArgs.projectId,
            region: this.parentComponentArgs.region,
        };
    }

    private createBuildComponent(): ApphostBuildComponent {
        const resourceName = this.constructChildResourceName(APPHOST_BUILD_CHILD_SUFFIX);
        const buildArgs = this.constructBuildComponentArgs();
        const options = this.constructChildComponentResourceOptions();
        return new ApphostBuildComponent(resourceName, buildArgs, options);
    }

    private constructBuildComponentArgs(): ApphostBuildComponentArgs {
        return {
            ...this.constructCommonBuildComponentArgs(),
            ...this.parentComponentArgs.buildComponentArgs,
        };
    }

    private constructCommonBuildComponentArgs() {
        return {
            projectId: this.parentComponentArgs.projectId,
            region: this.parentComponentArgs.region,
            backendComponent: this.backendComponent,
        };
    }

    private createTrafficComponent(): ApphostTrafficComponent {
        const resourceName = this.constructChildResourceName(APPHOST_TRAFFIC_CHILD_SUFFIX);
        const trafficArgs = this.constructTrafficComponentArgs();
        const options = this.constructChildComponentResourceOptions();
        return new ApphostTrafficComponent(resourceName, trafficArgs, options);
    }

    private constructTrafficComponentArgs(): ApphostTrafficComponentArgs {
        return {
            ...this.constructCommonTrafficComponentArgs(),
            ...this.parentComponentArgs.trafficComponentArgs,
        };
    }

    private constructCommonTrafficComponentArgs() {
        return {
            projectId: this.parentComponentArgs.projectId,
            region: this.parentComponentArgs.region,
            backendComponent: this.backendComponent,
            buildComponent: this.buildComponent,
        };
    }

    private createDomainComponent(): ApphostDomainComponent {
        const resourceName = this.constructChildResourceName(APPHOST_DOMAIN_CHILD_SUFFIX);
        const domainArgs = this.constructDomainComponentArgs();
        const options = this.constructChildComponentResourceOptions();
        return new ApphostDomainComponent(resourceName, domainArgs, options);
    }

    private constructDomainComponentArgs(): ApphostDomainComponentArgs {
        return {
            ...this.constructCommonDomainComponentArgs(),
            ...this.parentComponentArgs.domainComponentArgs,
        };
    }

    private constructCommonDomainComponentArgs() {
        return {
            projectId: this.parentComponentArgs.projectId,
            region: this.parentComponentArgs.region,
            backendComponent: this.backendComponent,
        };
    }

    private constructChildComponentResourceOptions(): pulumi.ComponentResourceOptions {
        return {
            parent: this,
        };
    }

    private constructChildResourceName(resourceSuffix: string): string {
        return `${this.parentComponentName}-${resourceSuffix}`;
    }
}
