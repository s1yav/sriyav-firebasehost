import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import {
    WEB_APP_COMPONENT_TYPE,
    WEB_APP_RESOURCE_SUFFIX,
} from "../constants";

export interface WebAppComponentArgs {
    /**
     * The Google Cloud project ID.
     */
    projectId: pulumi.Input<string>;

    /**
     * The display name of the Firebase Web App.
     */
    displayName: pulumi.Input<string>;
}

interface WebAppComponentOutputs {
    firebaseWebApp: gcp.firebase.WebApp;
}

export class WebAppComponent extends pulumi.ComponentResource {
    public readonly firebaseWebApp: gcp.firebase.WebApp;
    private readonly parentComponentName: string;
    private readonly parentComponentArgs: WebAppComponentArgs;
    private readonly parentComponentOutputs: WebAppComponentOutputs;

    constructor(name: string, args: WebAppComponentArgs, opts?: pulumi.ComponentResourceOptions) {
        super(WEB_APP_COMPONENT_TYPE, name, args, opts);
        this.parentComponentName = name;
        this.parentComponentArgs = args;
        this.firebaseWebApp = this.createAndRegisterFirebaseWebApp();

        this.parentComponentOutputs = this.constructParentComponentOutputs();
        this.registerOutputs(this.parentComponentOutputs);
    }

    private constructParentComponentOutputs(): WebAppComponentOutputs {
        return {
            firebaseWebApp: this.firebaseWebApp,
        };
    }

    private createAndRegisterFirebaseWebApp(): gcp.firebase.WebApp {
        const webAppResourceName = this.constructWebAppResourceName();
        const webAppArgs = this.constructWebAppArgs();
        return new gcp.firebase.WebApp(webAppResourceName, webAppArgs, { parent: this });
    }

    private constructWebAppResourceName(): string {
        return this.constructChildResourceName(WEB_APP_RESOURCE_SUFFIX);
    }

    private constructChildResourceName(resourceName: string): string {
        return `${this.parentComponentName}-${resourceName}`;
    }

    private constructWebAppArgs(): gcp.firebase.WebAppArgs {
        return {
            project: this.parentComponentArgs.projectId,
            displayName: this.parentComponentArgs.displayName,
        };
    }
}
