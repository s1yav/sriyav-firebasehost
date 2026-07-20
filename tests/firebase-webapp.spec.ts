import { expect } from "chai";
import * as gcp from "@pulumi/gcp";
import { setupMocks, promiseOf } from "./setup";
import { FirebaseWebApp } from "../components/firebase-webapp";

describe("FirebaseWebApp component", () => {
    before(() => {
        setupMocks();
    });

    it("should register a Firebase project and Web App", async () => {
        const dummyService = new gcp.projects.Service("dummy-service", {
            project: "test-project-id",
            service: "firebase.googleapis.com",
        });

        const component = new FirebaseWebApp("test-webapp", {
            projectId: "test-project-id",
            displayName: "my-test-web-app",
            firebaseService: dummyService,
        });

        const projectProj = await promiseOf(component.firebaseProject.project);
        expect(projectProj).to.equal("test-project-id");

        const webAppProj = await promiseOf(component.firebaseWebApp.project);
        const webAppDisplayName = await promiseOf(component.firebaseWebApp.displayName);

        expect(webAppProj).to.equal("test-project-id");
        expect(webAppDisplayName).to.equal("my-test-web-app");
    });
});
