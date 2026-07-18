import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

/**
 * Arguments for creating a Firebase Web Application.
 */
export interface FirebaseWebAppArgs {
    /**
     * The Google Cloud project ID.
     */
    projectId: pulumi.Input<string>;

    /**
     * The display name of the Firebase Web App.
     */
    displayName: pulumi.Input<string>;

    /**
     * The enabled projects service resource that this Web App depends on.
     */
    firebaseService: gcp.projects.Service;
}

/**
 * A ComponentResource that registers a Google Cloud project with Firebase and provisions a Web App.
 */
export class FirebaseWebApp extends pulumi.ComponentResource {
    /**
     * The Firebase Project instance associated with the GCP project.
     */
    public readonly firebaseProject: gcp.firebase.Project;

    /**
     * The Firebase Web App registered under the project.
     */
    public readonly firebaseWebApp: gcp.firebase.WebApp;

    /**
     * Creates a new instance of FirebaseWebApp.
     *
     * @param name The logical name of the resource.
     * @param args The arguments to configure the resource.
     * @param opts A bag of options that controls this resource's behavior.
     */
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
