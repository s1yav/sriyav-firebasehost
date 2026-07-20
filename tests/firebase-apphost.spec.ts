import { expect } from "chai";
import * as gcp from "@pulumi/gcp";
import { setupMocks, promiseOf } from "./setup";
import { FirebaseApphost } from "../components/firebase-apphost";

describe("FirebaseApphost component", () => {
    before(() => {
        setupMocks();
    });

    it("should deploy App Hosting Backend, Build, Traffic, and custom domains with valid docker image", async () => {
        const dummyService = new gcp.projects.Service("dummy-service-apphost", {
            project: "test-project-id",
            service: "firebaseapphosting.googleapis.com",
        });

        const dummyIamMember = new gcp.projects.IAMMember("dummy-iam-apphost", {
            project: "test-project-id",
            role: "roles/owner",
            member: "serviceAccount:test-sa@test-project-id.iam.gserviceaccount.com",
        });

        const component = new FirebaseApphost("test-apphost", {
            projectId: "test-project-id",
            region: "us-central1",
            appId: "test-app-id",
            appHostingServiceAccountEmail: "test-sa@test-project-id.iam.gserviceaccount.com",
            appHostingService: dummyService,
            appHostingServiceAccountIamMember: dummyIamMember,
            gitopsProjectId: "gitops-project-id",
            dockerRegistryName: "my-docker-repo",
            domainId: "sriyav.com",
            preferredCommit: "latest",
            imageTagFile: "portfolio-image-tag.json",
            websiteServerRepoName: "sriyav-portfolio",
            servingLocality: "GLOBAL_ACCESS",
        });

        // 1. Verify App Hosting Backend inputs
        const backendProject = await promiseOf(component.appHostingBackend.project);
        const backendLocation = await promiseOf(component.appHostingBackend.location);
        const backendAppId = await promiseOf(component.appHostingBackend.appId);
        const backendSa = await promiseOf(component.appHostingBackend.serviceAccount);
        const backendLocality = await promiseOf(component.appHostingBackend.servingLocality);
        const backendId = await promiseOf(component.appHostingBackend.backendId);

        expect(backendProject).to.equal("test-project-id");
        expect(backendLocation).to.equal("us-central1");
        expect(backendAppId).to.equal("test-app-id");
        expect(backendSa).to.equal("test-sa@test-project-id.iam.gserviceaccount.com");
        expect(backendLocality).to.equal("GLOBAL_ACCESS");
        expect(backendId).to.equal("sriyav-portfolio");

        // 2. Verify App Hosting Build inputs (using portfolio-image-tag.json commitSha)
        // From portfolio-image-tag.json, commitSha is 2615f240158bc058a98a187a303b9e3d6751f4a5.
        // buildId is build-2615f24-v3 (sliced to 30 chars).
        const buildId = await promiseOf(component.appHostingBuild.buildId);
        const buildSourceContainerImage = await promiseOf(component.appHostingBuild.source.apply(s => s?.container?.image));

        expect(buildId).to.equal("build-2615f24-v3");
        expect(buildSourceContainerImage).to.equal(
            "us-central1-docker.pkg.dev/gitops-project-id/my-docker-repo/sriyav-portfolio:2615f240158bc058a98a187a303b9e3d6751f4a5"
        );

        // 3. Verify App Hosting Traffic
        const trafficBackend = await promiseOf(component.appHostingTraffic.backend);
        const trafficSplits = await promiseOf(component.appHostingTraffic.target.apply(t => t?.splits));
        expect(trafficBackend).to.equal("sriyav-portfolio");
        expect(trafficSplits).to.have.lengthOf(1);
        expect(trafficSplits![0].percent).to.equal(100);

        // 4. Verify domains
        const domainIdApex = await promiseOf(component.appHostingDomain.domainId);
        const domainIdSub = await promiseOf(component.appHostingSubDomain.domainId);
        expect(domainIdApex).to.equal("sriyav.com");
        expect(domainIdSub).to.equal("www.sriyav.com");
    });

    it("should fallback to preferredCommit if imageTagFile is not found", async () => {
        const dummyService = new gcp.projects.Service("dummy-service-apphost-fb", {
            project: "test-project-id",
            service: "firebaseapphosting.googleapis.com",
        });

        const dummyIamMember = new gcp.projects.IAMMember("dummy-iam-apphost-fb", {
            project: "test-project-id",
            role: "roles/owner",
            member: "test-sa@test-project-id.iam.gserviceaccount.com",
        });

        const component = new FirebaseApphost("test-apphost-fallback", {
            projectId: "test-project-id",
            region: "us-central1",
            appId: "test-app-id",
            appHostingServiceAccountEmail: "test-sa@test-project-id.iam.gserviceaccount.com",
            appHostingService: dummyService,
            appHostingServiceAccountIamMember: dummyIamMember,
            gitopsProjectId: "gitops-project-id",
            dockerRegistryName: "my-docker-repo",
            domainId: "sriyav.com",
            preferredCommit: "fallbacksha12345",
            imageTagFile: "non-existent-image-tag.json",
            websiteServerRepoName: "sriyav-portfolio",
            servingLocality: "GLOBAL_ACCESS",
        });

        // buildIdSuffix should be fallbacksha12345's first 7 chars: fallbac
        const buildId = await promiseOf(component.appHostingBuild.buildId);
        const buildSourceContainerImage = await promiseOf(component.appHostingBuild.source.apply(s => s?.container?.image));

        expect(buildId).to.equal("build-fallbac-v3");
        expect(buildSourceContainerImage).to.equal(
            "us-central1-docker.pkg.dev/gitops-project-id/my-docker-repo/sriyav-portfolio:fallbacksha12345"
        );
    });
});
