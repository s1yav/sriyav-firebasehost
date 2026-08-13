import * as pulumi from "@pulumi/pulumi";
import { Service as CloudRunv2Service, ServiceArgs as CloudRunv2ServiceArgs } from "../../constructs/cloudrunv2/service";
import {
    PRODUCT_MANAGER_AGENT_HOST_COMPONENT_TYPE,
    PRODUCT_MANAGER_AGENT_HOST_RESOURCE_SUFFIX,
} from "../../constants";

export interface ProductManagerAgentHostComponentArgs {
    /**
     * The Google Cloud project ID.
     */
    projectId: pulumi.Input<string>;

    /**
     * The GCP location/region for the service (e.g. "us-central1").
     */
    location: pulumi.Input<string>;

    /**
     * The container image location.
     */
    image: pulumi.Input<string>;

    /**
     * The service account email to execute the container.
     */
    serviceAccountEmail?: pulumi.Input<string>;

    /**
     * Maximum instance scaling count.
     */
    maxInstanceCount?: pulumi.Input<number>;

    /**
     * Environment variables for the agent container.
     */
    envVars?: Record<string, pulumi.Input<string>>;
}

interface ProductManagerAgentHostComponentOutputs {
    cloudRunService: CloudRunv2Service;
    serviceUri: pulumi.Output<string>;
}

export class ProductManagerAgentHostComponent extends pulumi.ComponentResource {
    public readonly cloudRunService: CloudRunv2Service;
    public readonly serviceUri: pulumi.Output<string>;
    private readonly parentComponentName: string;
    private readonly parentComponentArgs: ProductManagerAgentHostComponentArgs;
    private readonly parentComponentOutputs: ProductManagerAgentHostComponentOutputs;

    constructor(name: string, args: ProductManagerAgentHostComponentArgs, opts?: pulumi.ComponentResourceOptions) {
        super(PRODUCT_MANAGER_AGENT_HOST_COMPONENT_TYPE, name, args, opts);
        this.parentComponentName = name;
        this.parentComponentArgs = args;

        this.cloudRunService = this.createAndRegisterCloudRunService();
        this.serviceUri = this.cloudRunService.uri;

        this.parentComponentOutputs = this.constructParentComponentOutputs();
        this.registerOutputs(this.parentComponentOutputs);
    }

    private constructParentComponentOutputs(): ProductManagerAgentHostComponentOutputs {
        return {
            cloudRunService: this.cloudRunService,
            serviceUri: this.serviceUri,
        };
    }

    private createAndRegisterCloudRunService(): CloudRunv2Service {
        const serviceResourceName = this.constructCloudRunServiceResourceName();
        const serviceArgs = this.constructCloudRunServiceArgs();
        return new CloudRunv2Service(serviceResourceName, serviceArgs, { parent: this });
    }

    private constructCloudRunServiceResourceName(): string {
        return this.constructChildResourceName(PRODUCT_MANAGER_AGENT_HOST_RESOURCE_SUFFIX);
    }

    private constructChildResourceName(resourceName: string): string {
        return `${this.parentComponentName}-${resourceName}`;
    }

    private constructCloudRunServiceArgs(): CloudRunv2ServiceArgs {
        return {
            serviceName: this.constructCloudRunServiceResourceName(),
            location: this.parentComponentArgs.location,
            image: this.parentComponentArgs.image,
            serviceAccount: this.parentComponentArgs.serviceAccountEmail,
            maxInstanceCount: this.parentComponentArgs.maxInstanceCount,
            envs: this.constructEnvironmentVariables(),
        };
    }

    private constructEnvironmentVariables() {
        const envVars = this.parentComponentArgs.envVars ?? {};
        return Object.entries(envVars).map(([name, value]) => ({
            name,
            value,
        }));
    }
}
