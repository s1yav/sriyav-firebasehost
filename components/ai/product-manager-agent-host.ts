import * as pulumi from "@pulumi/pulumi";
import { Service as CloudRunv2Service, ServiceArgs } from "../../constructs/cloudrunv2/service";
import { PRODUCT_MANAGER_AGENT_HOST_COMPONENT_TYPE } from "../../constants";

const DEFAULT_MAX_INSTANCE_COUNT = 2;
const SERVICE_NAME_SUFFIX = "-service";

export interface ProductManagerAgentHostArgs {
    /**
     * GCP project ID where the Cloud Run service will be deployed.
     */
    projectId: pulumi.Input<string>;

    /**
     * GCP location/region for the Cloud Run service (e.g., "us-central1").
     */
    location: pulumi.Input<string>;

    /**
     * Container image URL for the Product Manager Agent.
     */
    image: pulumi.Input<string>;

    /**
     * Service account email to execute the Cloud Run container.
     */
    serviceAccountEmail?: pulumi.Input<string>;

    /**
     * Maximum number of container scaling instances. Defaults to 2.
     */
    maxInstanceCount?: pulumi.Input<number>;

    /**
     * Environment variables to inject into the container.
     */
    envVars?: Record<string, pulumi.Input<string>>;
}

/**
 * ProductManagerAgentHost Component Resource
 * Provisions a dedicated Google Cloud Run v2 host for the Product Manager Agent.
 */
export class ProductManagerAgentHost extends pulumi.ComponentResource {
    public readonly cloudRunService: CloudRunv2Service;
    public readonly serviceUri: pulumi.Output<string>;

    constructor(name: string, args: ProductManagerAgentHostArgs, opts?: pulumi.ComponentResourceOptions) {
        super(PRODUCT_MANAGER_AGENT_HOST_COMPONENT_TYPE, name, args, opts);

        this.cloudRunService = this.createCloudRunService(name, args);
        this.serviceUri = this.cloudRunService.uri;

        this.registerComponentOutputs();
    }

    private createCloudRunService(name: string, args: ProductManagerAgentHostArgs): CloudRunv2Service {
        const serviceArgs = this.buildServiceArgs(name, args);
        return new CloudRunv2Service(name, serviceArgs, { parent: this });
    }

    private buildServiceArgs(name: string, args: ProductManagerAgentHostArgs): ServiceArgs {
        return {
            serviceName: this.formatServiceName(name),
            location: args.location,
            image: args.image,
            serviceAccount: args.serviceAccountEmail,
            maxInstanceCount: args.maxInstanceCount ?? DEFAULT_MAX_INSTANCE_COUNT,
            envs: this.buildEnvironmentVariables(args.envVars),
        };
    }

    private formatServiceName(name: string): string {
        return `${name}${SERVICE_NAME_SUFFIX}`;
    }

    private buildEnvironmentVariables(envVars?: Record<string, pulumi.Input<string>>) {
        return Object.entries(envVars ?? {}).map(([name, value]) => ({
            name,
            value,
        }));
    }

    private registerComponentOutputs(): void {
        this.registerOutputs({
            cloudRunService: this.cloudRunService,
            serviceUri: this.serviceUri,
        });
    }
}

