import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

/**
 * Arguments for enabling required Google Cloud APIs for the Firebase project.
 */
export interface ProjectsServiceEnableArgs {
    /**
     * The Google Cloud project ID.
     */
    projectId: pulumi.Input<string>;
}

/**
 * A ComponentResource that enables required Google Cloud APIs (Firebase and App Hosting) for the project.
 */
export class ProjectsServiceEnable extends pulumi.ComponentResource {
    /**
     * The enabled Firebase Management API service.
     */
    public readonly firebaseService: gcp.projects.Service;

    /**
     * The enabled Firebase App Hosting API service.
     */
    public readonly firebaseapphostingService: gcp.projects.Service;

    /**
     * Creates a new instance of ProjectsServiceEnable.
     *
     * @param name The logical name of the resource.
     * @param args The arguments to configure the resource.
     * @param opts A bag of options that controls this resource's behavior.
     */
    constructor(name: string, args: ProjectsServiceEnableArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:ProjectsServiceEnable", name, args, opts);

        const stack = pulumi.getStack();
        const project = pulumi.getProject();

        this.firebaseService = new gcp.projects.Service(`${name}-firebase-api`, {
            project: args.projectId,
            service: "firebase.googleapis.com",
            disableOnDestroy: false,
        }, { 
            parent: this,
            aliases: [
                `urn:pulumi:${stack}::${project}::custom:components:ProjectsServiceEnable$gcp:projects/service:Service::sriyav-services-firebase-api`,
            ],
        });

        this.firebaseapphostingService = new gcp.projects.Service(`${name}-firebaseapphosting-api`, {
            project: args.projectId,
            service: "firebaseapphosting.googleapis.com",
            disableOnDestroy: false,
        }, { 
            parent: this,
            aliases: [
                `urn:pulumi:${stack}::${project}::custom:components:ProjectsServiceEnable$gcp:projects/service:Service::sriyav-services-firebaseapphosting-api`,
            ],
        });

        this.registerOutputs({
            firebaseService: this.firebaseService,
            firebaseapphostingService: this.firebaseapphostingService,
        });
    }
}
