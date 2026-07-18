import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export interface ProjectServicesArgs {
    projectId: pulumi.Input<string>;
}

export class ProjectServices extends pulumi.ComponentResource {
    public readonly firebaseService: gcp.projects.Service;
    public readonly apphostingService: gcp.projects.Service;

    constructor(name: string, args: ProjectServicesArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:ProjectServices", name, args, opts);

        this.firebaseService = new gcp.projects.Service(`${name}-firebase`, {
            project: args.projectId,
            service: "firebase.googleapis.com",
            disableOnDestroy: false,
        }, { parent: this });

        this.apphostingService = new gcp.projects.Service(`${name}-apphosting`, {
            project: args.projectId,
            service: "firebaseapphosting.googleapis.com",
            disableOnDestroy: false,
        }, { parent: this });

        this.registerOutputs({
            firebaseService: this.firebaseService,
            apphostingService: this.apphostingService,
        });
    }
}
