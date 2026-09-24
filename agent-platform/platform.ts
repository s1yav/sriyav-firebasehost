import * as pulumi from "@pulumi/pulumi";
import { CloudRunV2Service, CloudRunV2ServiceArgs } from "gcp-constructs";
import {
    PLATFORM_COMPONENT_TYPE,
    PLATFORM_CLOUDRUN_RESOURCE_SUFFIX,
} from "../constants";

export interface PlatformArgs {
    /**
     * Configuration arguments for the underlying Cloud Run v2 service.
     */
    cloudRunArgs: CloudRunV2ServiceArgs;
}

interface PlatformOutputs {
    readonly cloudRunService: CloudRunV2Service;
}

/**
 * Platform Component Resource
 * Provisions a Cloud Run v2 service using gcp-constructs inside an isolated platform component boundary.
 */
export class Platform extends pulumi.ComponentResource {
    public readonly cloudRunService: CloudRunV2Service;

    private readonly parentComponentName: string;
    private readonly parentComponentArgs: PlatformArgs;
    private readonly parentComponentOutputs: PlatformOutputs;

    constructor(name: string, args: PlatformArgs, opts?: pulumi.ComponentResourceOptions) {
        super(PLATFORM_COMPONENT_TYPE, name, args, opts);
        this.parentComponentName = name;
        this.parentComponentArgs = args;

        this.cloudRunService = this.createCloudRunService();

        this.parentComponentOutputs = this.constructParentComponentOutputs();
        this.registerOutputs(this.parentComponentOutputs);
    }

    private constructParentComponentOutputs(): PlatformOutputs {
        return {
            cloudRunService: this.cloudRunService,
        };
    }

    private createCloudRunService(): CloudRunV2Service {
        const resourceName = `${this.parentComponentName}-${PLATFORM_CLOUDRUN_RESOURCE_SUFFIX}`;
        return new CloudRunV2Service(resourceName, this.parentComponentArgs.cloudRunArgs, { parent: this });
    }
}
