import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export interface ProjectsServiceEnableArgs {
    projectId: pulumi.Input<string>;
}

export class ProjectsServiceEnable extends pulumi.ComponentResource {
    public readonly firebaseService: gcp.projects.Service;
    public readonly appHostingService: gcp.projects.Service;

    constructor(name: string, args: ProjectsServiceEnableArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:ProjectsServiceEnable", name, args, opts);

        this.firebaseService = new gcp.projects.Service(`${name}-firebase`, {
            project: args.projectId,
            service: "firebase.googleapis.com",
            disableOnDestroy: false,
        }, { parent: this });

        this.appHostingService = new gcp.projects.Service(`${name}-apphosting`, {
            project: args.projectId,
            service: "firebaseapphosting.googleapis.com",
            disableOnDestroy: false,
        }, { parent: this });

        this.registerOutputs({
            firebaseService: this.firebaseService,
            appHostingService: this.appHostingService,
        });
    }
}
