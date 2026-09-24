import * as pulumi from "@pulumi/pulumi";
import { CloudRunV2Service, CloudRunV2ServiceArgs } from "gcp-constructs";
import {
    AGENT_HOST_COMPONENT_TYPE,
    AGENT_HOST_CLOUDRUN_RESOURCE_SUFFIX,
} from "../constants";

export interface AgentHostArgs {
    /**
     * Configuration arguments for the underlying Cloud Run v2 service.
     */
    cloudRunArgs: CloudRunV2ServiceArgs;
}

interface AgentHostOutputs {
    readonly cloudRunService: CloudRunV2Service;
}

/**
 * AgentHost Component Resource
 * Provisions a Cloud Run v2 service using gcp-constructs inside an isolated AgentHost component boundary.
 */
export class AgentHost extends pulumi.ComponentResource {
    public readonly cloudRunService: CloudRunV2Service;

    private readonly parentComponentName: string;
    private readonly parentComponentArgs: AgentHostArgs;
    private readonly parentComponentOutputs: AgentHostOutputs;

    constructor(name: string, args: AgentHostArgs, opts?: pulumi.ComponentResourceOptions) {
        super(AGENT_HOST_COMPONENT_TYPE, name, args, opts);
        this.parentComponentName = name;
        this.parentComponentArgs = args;

        this.cloudRunService = this.createCloudRunService();

        this.parentComponentOutputs = this.constructParentComponentOutputs();
        this.registerOutputs(this.parentComponentOutputs);
    }

    private constructParentComponentOutputs(): AgentHostOutputs {
        return {
            cloudRunService: this.cloudRunService,
        };
    }

    private createCloudRunService(): CloudRunV2Service {
        const resourceName = `${this.parentComponentName}-${AGENT_HOST_CLOUDRUN_RESOURCE_SUFFIX}`;
        return new CloudRunV2Service(resourceName, this.parentComponentArgs.cloudRunArgs, { parent: this });
    }
}
