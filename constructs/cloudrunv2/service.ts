import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export interface ServiceArgs {
    /**
     * The name of the Cloud Run v2 service.
     */
    serviceName: pulumi.Input<string>;

    /**
     * The GCP location/region for the service (e.g., "us-central1").
     */
    location: pulumi.Input<string>;

    /**
     * Whether deletion protection is enabled on this Cloud Run service.
     * Defaults to false if omitted.
     */
    deletionProtection?: pulumi.Input<boolean>;

    /**
     * Ingress setting for traffic. Options: INGRESS_TRAFFIC_ALL, INGRESS_TRAFFIC_INTERNAL_ONLY, INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER.
     * Defaults to "INGRESS_TRAFFIC_ALL".
     */
    ingress?: pulumi.Input<string>;

    /**
     * Maximum number of container instances allowed to scale.
     * Defaults to 2.
     */
    maxInstanceCount?: pulumi.Input<number>;

    /**
     * Container image location (e.g. "us-docker.pkg.dev/cloudrun/container/hello").
     */
    image: pulumi.Input<string>;

    /**
     * CPU limit for the container (e.g. "1", "2"). Defaults to "2".
     */
    cpuLimit?: pulumi.Input<string>;

    /**
     * Memory limit for the container (e.g. "512Mi", "1024Mi"). Defaults to "1024Mi".
     */
    memoryLimit?: pulumi.Input<string>;

    /**
     * Environment variables to inject into the container.
     */
    envs?: pulumi.Input<pulumi.Input<gcp.types.input.cloudrunv2.ServiceTemplateContainerEnv>[]>;

    /**
     * Service account email to execute the container.
     */
    serviceAccount?: pulumi.Input<string>;
}

/**
 * Service Component Resource
 * Provisions a Google Cloud Run v2 Service styled consistently with gitops component constructs.
 */
export class Service extends pulumi.ComponentResource {
    public readonly service: gcp.cloudrunv2.Service;
    public readonly uri: pulumi.Output<string>;

    constructor(name: string, args: ServiceArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:CloudRunv2Service", name, args, opts);

        this.service = new gcp.cloudrunv2.Service(name, {
            name: args.serviceName,
            location: args.location,
            deletionProtection: args.deletionProtection ?? false,
            ingress: args.ingress ?? "INGRESS_TRAFFIC_ALL",
            scaling: {
                maxInstanceCount: args.maxInstanceCount ?? 2,
            },
            template: {
                serviceAccount: args.serviceAccount,
                containers: [{
                    image: args.image,
                    resources: {
                        limits: {
                            cpu: args.cpuLimit ?? "2",
                            memory: args.memoryLimit ?? "1024Mi",
                        },
                    },
                    envs: args.envs,
                }],
            },
        }, { parent: this });

        this.uri = this.service.uri;

        this.registerOutputs({
            service: this.service,
            uri: this.uri,
        });
    }
}