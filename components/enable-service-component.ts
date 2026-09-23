import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import {
    ENABLE_SERVICE_COMPONENT_TYPE,
    FIREBASE_API_SERVICE_NAME,
    FIREBASE_APPHOSTING_API_SERVICE_NAME,
    SECRET_MANAGER_API_SERVICE_NAME,
} from "../constants";

export interface EnableServiceComponentArgs {
    /**
     * The Google Cloud project ID.
     */
    projectId: pulumi.Input<string>;
}

interface EnableServiceComponentOutputs {
    firebaseServiceEnabled: gcp.projects.Service;
    firebaseapphostingServiceEnabled: gcp.projects.Service;
    secretManagerServiceEnabled: gcp.projects.Service;
}

export class EnableServiceComponent extends pulumi.ComponentResource {
    public readonly firebaseServiceEnabled: gcp.projects.Service;
    public readonly firebaseapphostingServiceEnabled: gcp.projects.Service;
    public readonly secretManagerServiceEnabled: gcp.projects.Service;
    private readonly parentComponentName: string;
    private readonly parentComponentArgs: EnableServiceComponentArgs;
    private readonly parentComponentOutputs: EnableServiceComponentOutputs;

    constructor(name: string, args: EnableServiceComponentArgs, opts?: pulumi.ComponentResourceOptions) {
        super(ENABLE_SERVICE_COMPONENT_TYPE, name, args, opts);
        this.parentComponentName = name;
        this.parentComponentArgs = args;
        this.firebaseServiceEnabled = this.enableFirebaseService();
        this.firebaseapphostingServiceEnabled = this.enableFirebaseAppHostingService();
        this.secretManagerServiceEnabled = this.enableSecretManagerService();

        this.parentComponentOutputs = this.constructParentComponentOutputs();
        this.registerOutputs(this.parentComponentOutputs);
    }

    private constructParentComponentOutputs(): EnableServiceComponentOutputs {
        return {
            firebaseServiceEnabled: this.firebaseServiceEnabled,
            firebaseapphostingServiceEnabled: this.firebaseapphostingServiceEnabled,
            secretManagerServiceEnabled: this.secretManagerServiceEnabled,
        };
    }

    private enableFirebaseService(): gcp.projects.Service {
        return this.enableService(FIREBASE_API_SERVICE_NAME);
    }

    private enableFirebaseAppHostingService(): gcp.projects.Service {
        return this.enableService(FIREBASE_APPHOSTING_API_SERVICE_NAME);
    }

    private enableSecretManagerService(): gcp.projects.Service {
        return this.enableService(SECRET_MANAGER_API_SERVICE_NAME);
    }

    private enableService(service: string): gcp.projects.Service {
        const serviceResourceName = `${this.parentComponentName}-${this.getServicePrefix(service)}`;
        const serviceArgs = this.constructEnableServiceArgs(service);
        return new gcp.projects.Service(serviceResourceName, serviceArgs, { parent: this });
    }

    private getServicePrefix(service: string): string {
        return service.split(".")[0];
    }

    private constructEnableServiceArgs(service: string): gcp.projects.ServiceArgs {
        return {
            project: this.parentComponentArgs.projectId,
            disableOnDestroy: false,
            service,
        };
    }
}
