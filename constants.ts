// Component Resource Types
export const ENABLE_SERVICE_COMPONENT_TYPE = "custom:components:EnableService";
export const FIREBASE_PROJECT_COMPONENT_TYPE = "custom:components:FirebaseProject";
export const WEB_APP_COMPONENT_TYPE = "custom:components:WebApp";
export const IDENTITY_COMPONENT_TYPE = "custom:components:IdentityComponent";
export const APPHOST_COMPONENT_TYPE = "custom:components:Apphost";
export const APPHOST_BACKEND_COMPONENT_TYPE = "custom:components:ApphostBackend";
export const APPHOST_BUILD_COMPONENT_TYPE = "custom:components:ApphostBuild";
export const APPHOST_TRAFFIC_COMPONENT_TYPE = "custom:components:ApphostTraffic";
export const APPHOST_DOMAIN_COMPONENT_TYPE = "custom:components:ApphostDomain";
export const PRODUCT_MANAGER_AGENT_HOST_COMPONENT_TYPE = "custom:components:ProductManagerAgentHost";
export const PRODUCT_MANAGER_IDENTITY_TYPE = "custom:components:ProductManagerIdentity";
export const AGENT_BUILDER_IDENTITY_TYPE = "custom:components:AgentBuilderIdentity";

// Stack Resource Names
export const ENABLE_SERVICE_COMPONENT_RESOURCE_NAME = "enable-service-component";
export const FIREBASE_PROJECT_COMPONENT_RESOURCE_NAME = "firebase-project-component";
export const WEB_APP_COMPONENT_RESOURCE_NAME = "web-app-component";
export const IDENTITY_COMPONENT_RESOURCE_NAME = "identity-component";
export const APPHOST_COMPONENT_RESOURCE_NAME = "apphost-component";
export const PRODUCT_MANAGER_AGENT_HOST_RESOURCE_NAME = "product-manager-agent-host";

// Child Resource Suffixes
export const FIREBASE_PROJECT_RESOURCE_SUFFIX = "firebase-project";
export const WEB_APP_RESOURCE_SUFFIX = "firebase-webapp";
export const PRODUCT_MANAGER_AGENT_HOST_RESOURCE_SUFFIX = "pm-agent-host";
export const PRODUCT_MANAGER_IDENTITY_RESOURCE_SUFFIX = "pm-agent-sa";
export const PRODUCT_MANAGER_OWNER_ROLE_RESOURCE_SUFFIX = "pm-agent-owner-role";
export const AGENT_BUILDER_SA_RESOURCE_SUFFIX = "agent-builder-sa";
export const AGENT_BUILDER_OWNER_ROLE_RESOURCE_SUFFIX = "agent-builder-owner-role";
export const AGENT_BUILDER_IMPERSONATOR_RESOURCE_SUFFIX = "agent-builder-impersonator";

export const FIREBASE_SA_RESOURCE_SUFFIX = "firebase-sa";
export const FIREBASE_SA_IMPERSONATOR_RESOURCE_SUFFIX = "firebase-sa-impersonator";
export const FIREBASE_SA_OWNER_ROLE_MEMBER_RESOURCE_SUFFIX = "firebase-sa-owner-role-member";

export const APPHOST_BACKEND_RESOURCE_SUFFIX = "appHostingBackend";
export const APPHOST_BUILD_RESOURCE_SUFFIX = "appHostingBuild";
export const APPHOST_TRAFFIC_RESOURCE_SUFFIX = "appHostingTraffic";
export const APPHOST_DOMAIN_RESOURCE_SUFFIX = "appHostingDomain";
export const APPHOST_SUBDOMAIN_RESOURCE_SUFFIX = "appHostingSubDomain";

export const APPHOST_BACKEND_CHILD_SUFFIX = "backend-component";
export const APPHOST_BUILD_CHILD_SUFFIX = "build-component";
export const APPHOST_TRAFFIC_CHILD_SUFFIX = "traffic-component";
export const APPHOST_DOMAIN_CHILD_SUFFIX = "domain-component";

// GCP Service Names
export const FIREBASE_API_SERVICE_NAME = "firebase.googleapis.com";
export const FIREBASE_APPHOSTING_API_SERVICE_NAME = "firebaseapphosting.googleapis.com";
export const SECRET_MANAGER_API_SERVICE_NAME = "secretmanager.googleapis.com";

// IAM Roles & Service Account Constants
export const TOKEN_CREATOR_ROLE = "roles/iam.serviceAccountTokenCreator";
export const OWNER_ROLE = "roles/owner";
export const FIREBASE_SA_ID = "sriyav-firebasehost-sa";
export const FIREBASE_SA_DISPLAY_NAME = "Firebase App Hosting compute service account";

// Build & Traffic Constants
export const BUILD_ID_PREFIX = "build-";
export const BUILD_ID_VERSION_SUFFIX = "-v3";
export const DEFAULT_TRAFFIC_PERCENT = 100;
export const WWW_SUBDOMAIN_PREFIX = "www.";
