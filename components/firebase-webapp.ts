import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export interface FirebaseWebAppArgs {
    projectId: pulumi.Input<string>;
    displayName: pulumi.Input<string>;
    firebaseService: gcp.projects.Service;
}

export class FirebaseWebApp extends pulumi.ComponentResource {
    public readonly firebaseProject: gcp.firebase.Project;
    public readonly firebaseWebApp: gcp.firebase.WebApp;

    constructor(name: string, args: FirebaseWebAppArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:FirebaseWebApp", name, args, opts);

        this.firebaseProject = new gcp.firebase.Project(`${name}-firebase-project`, {
            project: args.projectId,
        }, { parent: this, dependsOn: [args.firebaseService] });

        this.firebaseWebApp = new gcp.firebase.WebApp(`${name}-firebase-webapp`, {
            project: args.projectId,
            displayName: args.displayName,
        }, { parent: this, dependsOn: [this.firebaseProject] });

        this.registerOutputs({
            firebaseProject: this.firebaseProject,
            firebaseWebApp: this.firebaseWebApp,
        });
    }
}
