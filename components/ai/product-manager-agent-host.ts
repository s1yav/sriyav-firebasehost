import * as pulumi from "@pulumi/pulumi";
import { Service as CloudRunv2Service } from "../../constructs/cloudrunv2/service";
import { PRODUCT_MANAGER_AGENT_HOST_COMPONENT_TYPE } from "../../constants";

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
 * Provisions a dedicated Google Cloud Run v2 host for the Product Manager Agent using the CloudRunv2 Service construct.
 */
export class ProductManagerAgentHost extends pulumi.ComponentResource {
    public readonly cloudRunService: CloudRunv2Service;
    public readonly serviceUri: pulumi.Output<string>;

    constructor(name: string, args: ProductManagerAgentHostArgs, opts?: pulumi.ComponentResourceOptions) {
        super(PRODUCT_MANAGER_AGENT_HOST_COMPONENT_TYPE, name, args, opts);

        const envs = Object.entries(args.envVars ?? {}).map(([envName, envValue]) => ({
            name: envName,
            value: envValue,
        }));

        this.cloudRunService = new CloudRunv2Service(name, {
            serviceName: `${name}-service`,
            location: args.location,
            image: args.image,
            serviceAccount: args.serviceAccountEmail,
            maxInstanceCount: args.maxInstanceCount ?? 2,
            envs,
        }, { parent: this });

        this.serviceUri = this.cloudRunService.uri;

        this.registerOutputs({
            cloudRunService: this.cloudRunService,
            serviceUri: this.serviceUri,
        });
    }
}
