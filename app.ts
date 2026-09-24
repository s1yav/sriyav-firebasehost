import * as pulumi from "@pulumi/pulumi";
import { EnableServiceComponent, EnableServiceComponentArgs } from "./components/enable-service-component";
import { FirebaseProjectComponent, FirebaseProjectComponentArgs } from "./components/firebase-project-component";
import { WebAppComponent, WebAppComponentArgs } from "./components/webapp-component";
import { IdentityComponent, IdentityComponentArgs } from "./components/identity-component";
import { ApphostComponent, ApphostComponentArgs } from "./components/apphost-component";
import { ApphostBackendComponentArgs } from "./components/apphost/apphost-backend-component";
import { MouseHost, MouseHostArgs } from "./agent-hosts";
import {
    ENABLE_SERVICE_COMPONENT_RESOURCE_NAME,
    FIREBASE_PROJECT_COMPONENT_RESOURCE_NAME,
    WEB_APP_COMPONENT_RESOURCE_NAME,
    IDENTITY_COMPONENT_RESOURCE_NAME,
    APPHOST_COMPONENT_RESOURCE_NAME,
    MOUSE_HOST_RESOURCE_NAME,
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

const enableServiceComponentResourceName = `${stackName}-${ENABLE_SERVICE_COMPONENT_RESOURCE_NAME}`;
const enableServiceComponentArgs = constructEnableServiceComponentArgs();
const enableServiceComponent = new EnableServiceComponent(enableServiceComponentResourceName, enableServiceComponentArgs);

const firebaseProjectComponentResourceName = `${stackName}-${FIREBASE_PROJECT_COMPONENT_RESOURCE_NAME}`;
const firebaseProjectComponentArgs = constructFirebaseProjectComponentArgs();
const firebaseProjectComponent = new FirebaseProjectComponent(firebaseProjectComponentResourceName, firebaseProjectComponentArgs, { dependsOn: enableServiceComponent });

const webAppComponentResourceName = `${stackName}-${WEB_APP_COMPONENT_RESOURCE_NAME}`;
const webAppComponentArgs = constructWebAppComponentArgs();
const webAppComponent = new WebAppComponent(webAppComponentResourceName, webAppComponentArgs, { dependsOn: firebaseProjectComponent });

const identityComponentResourceName = `${stackName}-${IDENTITY_COMPONENT_RESOURCE_NAME}`;
const identityComponentArgs = constructIdentityComponentArgs();
const identityComponent = new IdentityComponent(identityComponentResourceName, identityComponentArgs);

const apphostComponentResourceName = `${stackName}-${APPHOST_COMPONENT_RESOURCE_NAME}`;
const apphostComponentArgs = constructApphostComponentArgs();
const apphostComponent = new ApphostComponent(apphostComponentResourceName, apphostComponentArgs);

const mouseHostResourceName = `${stackName}-${MOUSE_HOST_RESOURCE_NAME}`;
const mouseHostArgs = constructMouseHostArgs();
const mouseHost = new MouseHost(mouseHostResourceName, mouseHostArgs, { dependsOn: [identityComponent, enableServiceComponent] });

// Export the App Hosting URI and backend details
export const apex = apphostComponent.appHostingDomain.domainId.apply((domain: string) => `https://${domain}`);
export const subdomain = apphostComponent.appHostingSubDomain.domainId.apply((domain: string) => `https://${domain}`);
export const backendName = apphostComponent.appHostingBackend.backendId;
export const appName = webAppComponent.firebaseWebApp.displayName;
export const domainStatus = apphostComponent.appHostingDomain.customDomainStatuses;
export const mouseEndpoint = mouseHost.mouseEndpoint;

function constructEnableServiceComponentArgs(): EnableServiceComponentArgs {
    return {
        ...getCommonComponentArgs(),
    };
}

function constructFirebaseProjectComponentArgs(): FirebaseProjectComponentArgs {
    return {
        ...getCommonComponentArgs(),
    };
}

function constructWebAppComponentArgs(): WebAppComponentArgs {
    return {
        ...getCommonComponentArgs(),
        displayName: frontendRepoName,
    };
}

function constructIdentityComponentArgs(): IdentityComponentArgs {
    return {
        ...getCommonComponentArgs(),
        gitopsCloudbuildSa,
    };
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

function constructApphostBackendComponentArgs(): ApphostComponentArgs['backendComponentArgs'] {
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

function constructMouseHostArgs(): MouseHostArgs {
    return {
        location: region,
        gitopsProjectId,
        dockerRegistryName,
        serviceAccount: identityComponent.mouseAgentServiceAccount.email,
    };
}

function getCommonComponentArgs() {
    return {
        projectId,
    };
}
