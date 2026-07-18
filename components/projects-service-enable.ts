import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { stackPrefix } from "../configuration";

export interface ProjectsServiceEnableArgs {
    projectId: pulumi.Input<string>;
}

export class ProjectsServiceEnable extends pulumi.ComponentResource {
    public readonly firebaseService: gcp.projects.Service;
    public readonly firebaseapphostingService: gcp.projects.Service;

    constructor(name: string, args: ProjectsServiceEnableArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:ProjectsServiceEnable", name, args, opts);

        this.firebaseService = new gcp.projects.Service(`${name}-firebase-api`, {
            project: args.projectId,
            service: "firebase.googleapis.com",
            disableOnDestroy: false,
        }, { parent: this });

        this.firebaseapphostingService = new gcp.projects.Service(`${name}-firebaseapphosting-api`, {
            project: args.projectId,
            service: "firebaseapphosting.googleapis.com",
            disableOnDestroy: false,
        }, { parent: this });

        this.registerOutputs({
            firebaseService: this.firebaseService,
            firebaseapphostingService: this.firebaseapphostingService,
        });
    }
}
