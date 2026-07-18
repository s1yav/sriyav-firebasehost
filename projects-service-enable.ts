import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export interface ProjectsServiceEnableArgs {
    projectId: pulumi.Input<string>;
}

export class ProjectsServiceEnable extends pulumi.ComponentResource {
    public readonly firebaseEnable: gcp.projects.Service;
    public readonly firebaseapphostingEnable: gcp.projects.Service;

    constructor(name: string, args: ProjectsServiceEnableArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:ProjectsServiceEnable", name, args, opts);

        this.firebaseEnable = new gcp.projects.Service(`${name}-firebase`, {
            project: args.projectId,
            service: "firebase.googleapis.com",
            disableOnDestroy: false,
        }, { parent: this });

        this.firebaseapphostingEnable = new gcp.projects.Service(`${name}-apphosting`, {
            project: args.projectId,
            service: "firebaseapphosting.googleapis.com",
            disableOnDestroy: false,
        }, { parent: this });

        this.registerOutputs({
            firebaseEnable: this.firebaseEnable,
            firebaseapphostingEnable: this.firebaseapphostingEnable,
        });
    }
}
