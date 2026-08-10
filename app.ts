import * as pulumi from "@pulumi/pulumi";
import { EnableServiceComponent, EnableServiceComponentArgs } from "./components/enable-service-component";
import { FirebaseProjectComponent, FirebaseProjectComponentArgs } from "./components/firebase-project-component";
import { WebAppComponent, WebAppComponentArgs } from "./components/webapp-component";
import { IdentityComponent, IdentityComponentArgs } from "./components/identity-component";
import { ApphostComponent, ApphostComponentArgs } from "./components/apphost-component";
import { ApphostBackendComponentArgs } from "./components/apphost/apphost-backend-component";
import {
    ENABLE_SERVICE_COMPONENT_RESOURCE_NAME,
    FIREBASE_PROJECT_COMPONENT_RESOURCE_NAME,
    WEB_APP_COMPONENT_RESOURCE_NAME,
    IDENTITY_COMPONENT_RESOURCE_NAME,
    APPHOST_COMPONENT_RESOURCE_NAME,
} from "./constants";

// Initialize GCP Config and stack configurations
import {
    projectId,
    region,
    stackName,
    frontendRepoName,
    gitopsCloudbuildSa,
    gitopsProjectId,
    dockerRegistryName,
    domainId,
    preferredCommit,
    imageTagFile,
    servingLocality,
} from "./configuration";

const enableServiceComponentResourceName = constructEnableServiceComponentResourceName();
const enableServiceComponentArgs = constructEnableServiceComponentArgs();
const enableServiceComponent = new EnableServiceComponent(enableServiceComponentResourceName, enableServiceComponentArgs);

const firebaseProjectComponentResourceName = constructFirebaseProjectComponentResourceName();
const firebaseProjectComponentArgs = constructFirebaseProjectComponentArgs();
const firebaseProjectComponentOptions = constructFirebaseProjectComponentOptions();
const firebaseProjectComponent = new FirebaseProjectComponent(firebaseProjectComponentResourceName, firebaseProjectComponentArgs, firebaseProjectComponentOptions);

const webAppComponentResourceName = constructWebAppComponentResourceName();
const webAppComponentArgs = constructWebAppComponentArgs();
const webAppComponentOptions = constructWebAppComponentOptions();
const webAppComponent = new WebAppComponent(webAppComponentResourceName, webAppComponentArgs, webAppComponentOptions);

const identityComponentResourceName = constructIdentityComponentResourceName();
const identityComponentArgs = constructIdentityComponentArgs();
const identityComponent = new IdentityComponent(identityComponentResourceName, identityComponentArgs);

const apphostComponentResourceName = constructApphostComponentResourceName();
const apphostComponentArgs = constructApphostComponentArgs();
const apphostComponent = new ApphostComponent(apphostComponentResourceName, apphostComponentArgs);

// Export the App Hosting URI and backend details
export const apex = apphostComponent.appHostingDomain.domainId.apply((domain: string) => `https://${domain}`);
export const subdomain = apphostComponent.appHostingSubDomain.domainId.apply((domain: string) => `https://${domain}`);
export const backendName = apphostComponent.appHostingBackend.backendId;
export const appName = webAppComponent.firebaseWebApp.displayName;
export const domainStatus = apphostComponent.appHostingDomain.customDomainStatuses;

function constructEnableServiceComponentResourceName(): string {
    return constructComponentResourceName(ENABLE_SERVICE_COMPONENT_RESOURCE_NAME);
}

function constructEnableServiceComponentArgs(): EnableServiceComponentArgs {
    return {
        ...getCommonComponentArgs(),
    };
}

function constructFirebaseProjectComponentResourceName(): string {
    return constructComponentResourceName(FIREBASE_PROJECT_COMPONENT_RESOURCE_NAME);
}

function constructFirebaseProjectComponentArgs(): FirebaseProjectComponentArgs {
    return {
        ...getCommonComponentArgs(),
    };
}

function constructFirebaseProjectComponentOptions(): pulumi.ComponentResourceOptions {
    return {
        dependsOn: enableServiceComponent,
    };
}

function constructWebAppComponentResourceName(): string {
    return constructComponentResourceName(WEB_APP_COMPONENT_RESOURCE_NAME);
}

function constructWebAppComponentArgs(): WebAppComponentArgs {
    return {
        ...getCommonComponentArgs(),
        displayName: frontendRepoName,
    };
}

function constructWebAppComponentOptions(): pulumi.ComponentResourceOptions {
    return {
        dependsOn: firebaseProjectComponent,
    };
}

function constructIdentityComponentResourceName(): string {
    return constructComponentResourceName(IDENTITY_COMPONENT_RESOURCE_NAME);
}

function constructIdentityComponentArgs(): IdentityComponentArgs {
    return {
        ...getCommonComponentArgs(),
        gitopsCloudbuildSa,
    };
}

function constructApphostComponentResourceName(): string {
    return constructComponentResourceName(APPHOST_COMPONENT_RESOURCE_NAME);
}

function constructApphostComponentArgs(): ApphostComponentArgs {
    return {
        ...getCommonComponentArgs(),
        region,
        backendComponentArgs: constructApphostBackendComponentArgs(),
        buildComponentArgs: constructApphostBuildComponentArgs(),
        trafficComponentArgs: constructApphostTrafficComponentArgs(),
        domainComponentArgs: constructApphostDomainComponentArgs(),
    };
}

function constructApphostBackendComponentArgs(): ApphostBackendComponentArgs {
    return {
        websiteServerRepoName: frontendRepoName,
        appId: webAppComponent.firebaseWebApp.appId,
        servingLocality,
        appHostingServiceAccountEmail: identityComponent.firebaseServiceAccount.email,
        appHostingService: enableServiceComponent.firebaseapphostingServiceEnabled,
        appHostingServiceAccountIamMember: identityComponent.firebaseServiceAccountOwnerRoleMember,
    };
}

function constructApphostBuildComponentArgs(): ApphostComponentArgs['buildComponentArgs'] {
    return {
        gitopsProjectId,
        dockerRegistryName,
        websiteServerRepoName: frontendRepoName,
        preferredCommit,
        imageTagFile,
    };
}

function constructApphostTrafficComponentArgs(): ApphostComponentArgs['trafficComponentArgs'] {
    return {};
}

function constructApphostDomainComponentArgs(): ApphostComponentArgs['domainComponentArgs'] {
    return {
        domainId,
    };
}

function constructComponentResourceName(componentName: string): string {
    return `${stackName}-${componentName}`;
}

function getCommonComponentArgs() {
    return {
        projectId,
    };
}
