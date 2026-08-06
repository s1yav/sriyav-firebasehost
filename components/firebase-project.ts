import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

/**
 * Arguments for creating a Firebase Project.
 */
export interface FirebaseProjectArgs {
    /**
     * The Google Cloud project ID.
     */
    projectId: pulumi.Input<string>;

    /**
     * The enabled projects service resource that this Firebase Project depends on.
     */
    firebaseService?: gcp.projects.Service;
}

/**
 * A ComponentResource that provisions a Firebase Project for a Google Cloud project.
 */
export class FirebaseProject extends pulumi.ComponentResource {
    /**
     * The Firebase Project instance associated with the GCP project.
     */
    public readonly firebaseProject: gcp.firebase.Project;

    private readonly name: string;
    private readonly args: FirebaseProjectArgs;

    /**
     * Creates a new instance of FirebaseProject.
     *
     * @param name The logical name of the resource.
     * @param args The arguments to configure the resource.
     * @param opts A bag of options that controls this resource's behavior.
     */
    constructor(name: string, args: FirebaseProjectArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:FirebaseProject", name, args, opts);

        this.name = name;
        this.args = args;

        this.firebaseProject = this.createFirebaseProject();

        this.registerOutputs({
            firebaseProject: this.firebaseProject,
        });
    }

    /**
     * Creates the Firebase Project resource.
     */
    private createFirebaseProject(): gcp.firebase.Project {
        return new gcp.firebase.Project(`${this.name}-firebase-project`, {
            project: this.args.projectId,
        }, {
            parent: this,
            dependsOn: this.args.firebaseService ? [this.args.firebaseService] : undefined,
        });
    }
}
