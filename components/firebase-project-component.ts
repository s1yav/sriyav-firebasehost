import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import {
    FIREBASE_PROJECT_COMPONENT_TYPE,
    FIREBASE_PROJECT_RESOURCE_SUFFIX,
} from "../constants";

export interface FirebaseProjectComponentArgs {
    /**
     * The Google Cloud project ID.
     */
    projectId: pulumi.Input<string>;
}

interface FirebaseProjectComponentOutputs {
    firebaseProject: gcp.firebase.Project;
}

export class FirebaseProjectComponent extends pulumi.ComponentResource {
    public readonly firebaseProject: gcp.firebase.Project;
    private readonly parentComponentName: string;
    private readonly parentComponentArgs: FirebaseProjectComponentArgs;
    private readonly parentComponentOutputs: FirebaseProjectComponentOutputs;

    constructor(name: string, args: FirebaseProjectComponentArgs, opts?: pulumi.ComponentResourceOptions) {
        super(FIREBASE_PROJECT_COMPONENT_TYPE, name, args, opts);
        this.parentComponentName = name;
        this.parentComponentArgs = args;
        this.firebaseProject = this.createFirebaseProject();

        this.parentComponentOutputs = this.constructParentComponentOutputs();
        this.registerOutputs(this.parentComponentOutputs);
    }

    private constructParentComponentOutputs(): FirebaseProjectComponentOutputs {
        return {
            firebaseProject: this.firebaseProject,
        };
    }

    private createFirebaseProject(): gcp.firebase.Project {
        const firebaseProjectResourceName = this.constructFirebaseProjectResourceName();
        const firebaseProjectArgs = this.constructFirebaseProjectArgs();
        return new gcp.firebase.Project(firebaseProjectResourceName, firebaseProjectArgs, {
            parent: this,
        });
    }

    private constructFirebaseProjectResourceName(): string {
        return this.constructChildResourceName(FIREBASE_PROJECT_RESOURCE_SUFFIX);
    }

    private constructChildResourceName(resourceName: string): string {
        return `${this.parentComponentName}-${resourceName}`;
    }

    private constructFirebaseProjectArgs(): gcp.firebase.ProjectArgs {
        return {
            project: this.parentComponentArgs.projectId,
        };
    }
}
