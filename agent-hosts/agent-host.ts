import * as pulumi from "@pulumi/pulumi";
import { CloudRunV2Service, CloudRunV2ServiceArgs } from "gcp-constructs";
import {
    AGENT_HOST_COMPONENT_TYPE,
    AGENT_HOST_CLOUDRUN_RESOURCE_SUFFIX,
} from "../constants";

export interface AgentHostArgs {
    /**
     * Container image location for the agent.
     */
    agentImage?: pulumi.Input<string>;

    /**
     * The GCP location/region for the service (e.g. "us-central1").
     */
    location?: pulumi.Input<string>;

    /**
     * Optional custom Cloud Run service name.
     */
    serviceName?: pulumi.Input<string>;

    /**
     * Optional direct Cloud Run v2 configuration arguments.
     */
    cloudRunArgs?: CloudRunV2ServiceArgs;
}

interface AgentHostOutputs {
    readonly agentHost: pulumi.Output<string>;
    readonly serviceUrl: pulumi.Output<string>;
}

/**
 * AgentHost Component Resource
 * Provisions a Cloud Run v2 service using gcp-constructs inside an isolated AgentHost component boundary.
 */
export class AgentHost extends pulumi.ComponentResource {
    public readonly agentHost: CloudRunV2Service;
    public readonly cloudRunService: CloudRunV2Service;
    public readonly serviceUrl: pulumi.Output<string>;

    private readonly parentComponentName: string;
    private readonly parentComponentArgs: AgentHostArgs;
    private readonly parentComponentOutputs: AgentHostOutputs;

    constructor(name: string, args: AgentHostArgs, opts?: pulumi.ComponentResourceOptions) {
        super(AGENT_HOST_COMPONENT_TYPE, name, args, opts);
        this.parentComponentName = name;
        this.parentComponentArgs = args;

        this.agentHost = this.createCloudRunService();
        this.cloudRunService = this.agentHost;
        this.serviceUrl = this.agentHost.uri;

        this.parentComponentOutputs = this.constructParentComponentOutputs();
        this.registerOutputs(this.parentComponentOutputs);
    }

    private constructParentComponentOutputs(): AgentHostOutputs {
        return {
            agentHost: this.serviceUrl,
            serviceUrl: this.serviceUrl,
        };
    }

    private createCloudRunService(): CloudRunV2Service {
        const resourceName = `${this.parentComponentName}-${AGENT_HOST_CLOUDRUN_RESOURCE_SUFFIX}`;
        const cloudRunArgs = this.constructCloudRunArgs(resourceName);
        return new CloudRunV2Service(resourceName, cloudRunArgs, { parent: this });
    }

    private constructCloudRunArgs(resourceName: string): CloudRunV2ServiceArgs {
        const directArgs = this.parentComponentArgs.cloudRunArgs;
        if (directArgs) {
            return {
                ...directArgs,
                serviceName: directArgs.serviceName ?? this.parentComponentArgs.serviceName ?? resourceName,
                location: directArgs.location ?? this.parentComponentArgs.location ?? "us-central1",
                image: this.parentComponentArgs.agentImage ?? directArgs.image,
            };
        }

        return {
            serviceName: this.parentComponentArgs.serviceName ?? resourceName,
            location: this.parentComponentArgs.location ?? "us-central1",
            image: this.parentComponentArgs.agentImage!,
        };
    }
}
