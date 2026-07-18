import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export interface FirebaseWebAppArgs {
    projectId: pulumi.Input<string>;
    displayName: pulumi.Input<string>;
    firebaseService: gcp.projects.Service;
}

export class FirebaseWebApp extends pulumi.ComponentResource {
    public readonly firebaseProject: gcp.firebase.Project;
    public readonly webApp: gcp.firebase.WebApp;

    constructor(name: string, args: FirebaseWebAppArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:FirebaseWebApp", name, args, {
            ...opts,
            aliases: [{ type: "custom:components:FirebaseApp" }],
        });

        this.firebaseProject = new gcp.firebase.Project(`${name}-project`, {
            project: args.projectId,
        }, { parent: this, dependsOn: [args.firebaseService] });

        this.webApp = new gcp.firebase.WebApp(`${name}-web-app`, {
            project: args.projectId,
            displayName: args.displayName,
        }, { parent: this, dependsOn: [this.firebaseProject] });

        this.registerOutputs({
            firebaseProject: this.firebaseProject,
            webApp: this.webApp,
        });
    }
}
