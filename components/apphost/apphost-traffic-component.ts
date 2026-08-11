import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { ApphostBackendComponent } from "./apphost-backend-component";
import { ApphostBuildComponent } from "./apphost-build-component";
import {
    APPHOST_TRAFFIC_COMPONENT_TYPE,
    APPHOST_TRAFFIC_RESOURCE_SUFFIX,
    DEFAULT_TRAFFIC_PERCENT,
} from "../../constants";

/**
 * Arguments for creating the Firebase App Hosting Traffic split resource.
 */
export interface ApphostTrafficComponentArgs {
    /**
     * The Google Cloud project ID.
     */
    projectId: pulumi.Input<string>;

    /**
     * The Google Cloud region.
     */
    region: pulumi.Input<string>;

    /**
     * The parent ApphostBackendComponent dependency.
     */
    backendComponent: ApphostBackendComponent;

    /**
     * The parent ApphostBuildComponent dependency.
     */
    buildComponent: ApphostBuildComponent;
}

interface ApphostTrafficComponentOutputs {
    appHostingTraffic: gcp.firebase.AppHostingTraffic;
}

/**
 * A ComponentResource that provisions the Firebase App Hosting Traffic split configuration.
 */
export class ApphostTrafficComponent extends pulumi.ComponentResource {
    public readonly appHostingTraffic: gcp.firebase.AppHostingTraffic;

    private readonly projectId: pulumi.Input<string>;
    private readonly region: pulumi.Input<string>;

    private readonly parentComponentName: string;
    private readonly parentComponentArgs: ApphostTrafficComponentArgs;
    private readonly parentComponentOutputs: ApphostTrafficComponentOutputs;

    constructor(name: string, args: ApphostTrafficComponentArgs, opts?: pulumi.ComponentResourceOptions) {
        super(APPHOST_TRAFFIC_COMPONENT_TYPE, name, args, opts);
        this.parentComponentName = name;
        this.parentComponentArgs = args;

        this.projectId = args.projectId;
        this.region = args.region;

        this.appHostingTraffic = this.createAppHostingTraffic();
        this.parentComponentOutputs = this.constructParentComponentOutputs();
        this.registerOutputs(this.parentComponentOutputs);
    }

    private constructParentComponentOutputs(): ApphostTrafficComponentOutputs {
        return {
            appHostingTraffic: this.appHostingTraffic,
        };
    }

    private createAppHostingTraffic(): gcp.firebase.AppHostingTraffic {
        const resourceName = this.constructChildResourceName(APPHOST_TRAFFIC_RESOURCE_SUFFIX);
        const trafficArgs = this.constructTrafficArgs();
        const options = this.constructTrafficResourceOptions();
        return new gcp.firebase.AppHostingTraffic(resourceName, trafficArgs, options);
    }

    private constructTrafficResourceOptions(): pulumi.ComponentResourceOptions {
        const dependsOn = this.resolveTrafficDependencies();
        return { parent: this, dependsOn };
    }

    private resolveTrafficDependencies(): pulumi.Resource[] {
        return [this.parentComponentArgs.buildComponent];
    }

    private constructTrafficArgs(): gcp.firebase.AppHostingTrafficArgs {
        const backendId = this.resolveBackendId();
        const buildName = this.resolveBuildName();
        return {
            project: this.projectId,
            location: this.region,
            backend: backendId,
            target: this.constructTrafficTarget(buildName),
        };
    }

    private resolveBackendId(): pulumi.Input<string> {
        return this.parentComponentArgs.backendComponent.appHostingBackend.backendId;
    }

    private resolveBuildName(): pulumi.Input<string> {
        return this.parentComponentArgs.buildComponent.appHostingBuild.name;
    }

    private constructTrafficTarget(buildName: pulumi.Input<string>) {
        return {
            splits: [{
                build: buildName,
                percent: DEFAULT_TRAFFIC_PERCENT,
            }],
        };
    }

    private constructChildResourceName(resourceSuffix: string): string {
        return `${this.parentComponentName}-${resourceSuffix}`;
    }
}
