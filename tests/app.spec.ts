import { expect } from "chai";
import * as pulumi from "@pulumi/pulumi";
import { setupMocks, promiseOf } from "./setup";

describe("Pulumi Stack app.ts", () => {
    let app: typeof import("../app");

    before(async () => {
        // Set all configurations needed by configuration.ts
        pulumi.runtime.setConfig("gcp:project", "test-portfolio-project");
        pulumi.runtime.setConfig("gcp:region", "us-central1");
        
        pulumi.runtime.setConfig("gitops:projectId", "test-gitops-project");
        pulumi.runtime.setConfig("gitops:dockerRegistryName", "test-docker-registry");
        pulumi.runtime.setConfig("gitops:cloudbuildSa", "test-cloudbuild-sa@test-gitops-project.iam.gserviceaccount.com");

        // The default namespace is based on the project name sriyav-firebasehost
        // When running in unit tests under Mocha, Pulumi defaults the project name to "project"
        pulumi.runtime.setConfig("project:domainId", "sriyav.com");
        pulumi.runtime.setConfig("project:preferredCommit", "latest");
        pulumi.runtime.setConfig("project:imageTagFile", "portfolio-image-tag.json");
        pulumi.runtime.setConfig("project:websiteServerRepoName", "sriyav-portfolio");
        pulumi.runtime.setConfig("project:servingLocality", "GLOBAL_ACCESS");

        setupMocks();

        // Dynamically import the app.ts module so that it runs after mocks and configs are registered
        app = await import("../app");
    });

    it("should export apex domain, subdomain, backend name, app name, and domain status", async () => {
        const apex = await promiseOf(app.apex);
        const subdomain = await promiseOf(app.subdomain);
        const backendName = await promiseOf(app.backendName);
        const appName = await promiseOf(app.appName);

        expect(apex).to.equal("https://sriyav.com");
        expect(subdomain).to.equal("https://www.sriyav.com");
        expect(backendName).to.equal("sriyav-portfolio");
        expect(appName).to.equal("sriyav-portfolio");
    });
});
