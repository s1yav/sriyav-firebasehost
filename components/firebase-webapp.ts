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

    private readonly name: string;
    private readonly args: FirebaseWebAppArgs;

    /**
     * Creates a new instance of FirebaseWebApp.
     *
     * @param name The logical name of the resource.
     * @param args The arguments to configure the resource.
     * @param opts A bag of options that controls this resource's behavior.
     */
    constructor(name: string, args: FirebaseWebAppArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:FirebaseWebApp", name, args, opts);

        this.name = name;
        this.args = args;

        this.firebaseProject = this.createFirebaseProject();
        this.firebaseWebApp = this.createAndRegisterFirebaseWebApp();

        this.registerOutputs({
            firebaseProject: this.firebaseProject,
            firebaseWebApp: this.firebaseWebApp,
        });
    }

    /**
     * Creates the Firebase Project resource.
     */
    private createFirebaseProject(): gcp.firebase.Project {
        return new gcp.firebase.Project(`${this.name}-firebase-project`, {
            project: this.args.projectId,
        }, { parent: this });
    }

    /**
     * Creates and registers the Firebase Web App resource.
     */
    private createAndRegisterFirebaseWebApp(): gcp.firebase.WebApp {
        return new gcp.firebase.WebApp(`${this.name}-firebase-webapp`, {
            project: this.args.projectId,
            displayName: this.args.displayName,
        }, { parent: this });
    }
}
